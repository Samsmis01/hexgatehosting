const express = require("express")
const cors = require("cors")
const fs = require("fs")
const path = require("path")
const os = require("os")
const Pino = require("pino")

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} = require("@whiskeysockets/baileys")

const app = express()
const PORT = process.env.PORT || 3000

// ================== CONFIG ==================
const OWNER_NUMBER = "243816107573@s.whatsapp.net"

// Dossier de sessions adapté selon l'environnement
const SESSIONS_DIR = process.env.RENDER
  ? path.join(os.tmpdir(), "sessions")
  : path.join(__dirname, "sessions")

const COMMANDS_DIR = path.join(__dirname, "commands")

let botReady = false
let activeSockets = {}

// ================== MIDDLEWARE ==================
// Important: CORS doit être configuré correctement
app.use(cors({
  origin: '*', // Permettre toutes les origines (à restreindre en production)
  methods: ['GET', 'POST'],
  credentials: true
}))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Servir les fichiers statiques depuis le dossier 'public'
const PUBLIC_DIR = path.join(__dirname, "public")
if (!fs.existsSync(PUBLIC_DIR)) {
  fs.mkdirSync(PUBLIC_DIR, { recursive: true })
  console.log(`📁 Dossier public créé : ${PUBLIC_DIR}`)
}

app.use(express.static(PUBLIC_DIR))

// Vérifier et créer le dossier de sessions
if (!fs.existsSync(SESSIONS_DIR)) {
  try {
    fs.mkdirSync(SESSIONS_DIR, { recursive: true })
    console.log(`📁 Dossier de sessions créé : ${SESSIONS_DIR}`)
  } catch (err) {
    console.error(`❌ Erreur création dossier sessions: ${err.message}`)
    const fallbackDir = path.join(__dirname, "sessions")
    if (!fs.existsSync(fallbackDir)) {
      fs.mkdirSync(fallbackDir, { recursive: true })
    }
  }
}

// Créer le dossier commands s'il n'existe pas
if (!fs.existsSync(COMMANDS_DIR)) {
  fs.mkdirSync(COMMANDS_DIR, { recursive: true })
  console.log(`📁 Dossier commands créé : ${COMMANDS_DIR}`)
}

// ================== COMMANDS LOADER ==================
const commands = new Map()

function loadCommands() {
  commands.clear()
  
  if (fs.existsSync(COMMANDS_DIR)) {
    const files = fs.readdirSync(COMMANDS_DIR)
      .filter(file => file.endsWith(".js"))
    
    if (files.length === 0) {
      console.log("📁 Aucune commande trouvée dans le dossier 'commands'")
      
      // Créer une commande ping par défaut
      const defaultPing = path.join(COMMANDS_DIR, "ping.js")
      if (!fs.existsSync(defaultPing)) {
        const pingCode = `
module.exports = {
  name: "ping",
  description: "Vérifie si le bot est actif",
  
  async execute(sock, msg, args) {
    const jid = msg.key.remoteJid
    
    await sock.sendMessage(jid, {
      text: "🏓 Pong! HEXGATE est actif et fonctionnel!\\n\\n" +
            "🕒 " + new Date().toLocaleString() + "\\n" +
            "📱 Utilisez .help pour voir toutes les commandes"
    })
  }
}
        `
        fs.writeFileSync(defaultPing, pingCode)
        console.log("✅ Commande ping créée par défaut")
      }
      
      // Recharger après création
      files.push("ping.js")
    }
    
    files.forEach(file => {
      try {
        const cmdPath = path.join(COMMANDS_DIR, file)
        delete require.cache[require.resolve(cmdPath)]
        const cmd = require(cmdPath)
        
        if (cmd.name && cmd.execute) {
          commands.set(cmd.name, cmd)
          console.log(`✅ Commande chargée : ${cmd.name}`)
        } else {
          console.log(`⚠️ Fichier invalide : ${file} (manque 'name' ou 'execute')`)
        }
      } catch (error) {
        console.error(`❌ Erreur chargement ${file}:`, error.message)
      }
    })
    
    console.log(`📊 Total commandes chargées : ${commands.size}`)
  }
}

// Charger les commandes au démarrage
loadCommands()

// ================== ROUTES ==================

// Route racine - servir l'index.html
app.get("/", (req, res) => {
  const indexPath = path.join(PUBLIC_DIR, "index.html")
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath)
  } else {
    // Si index.html n'existe pas, créer un fichier par défaut
    const defaultHTML = `
<!DOCTYPE html>
<html>
<head>
    <title>HEXGATE WhatsApp Bot</title>
    <style>
        body { font-family: Arial; padding: 40px; text-align: center; }
        .status { padding: 20px; background: #f0f0f0; border-radius: 10px; margin: 20px; }
    </style>
</head>
<body>
    <h1>🤖 HEXGATE V2</h1>
    <div class="status">
        <p>Le bot est en ligne</p>
        <p>Session active: ${Object.keys(activeSockets).length}</p>
    </div>
    <p>Téléchargez l'interface complète depuis: <a href="https://github.com/hextech/hexgate">GitHub</a></p>
</body>
</html>
    `
    res.send(defaultHTML)
  }
})

// ================== BOT STATUS API ==================
app.get("/api/bot-status", (req, res) => {
  try {
    res.json({
      success: true,
      ready: botReady,
      sessions: Object.keys(activeSockets).length,
      commands: Array.from(commands.keys()),
      timestamp: new Date().toISOString(),
      version: "HEXGATE V2.0"
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

// ================== GENERATE PAIR CODE API ==================
app.post("/api/generate-pair-code", async (req, res) => {
  console.log("📱 Requête reçue pour générer un code pair:", req.body)
  
  try {
    let phone = req.body.phone
    if (!phone) {
      return res.status(400).json({ 
        success: false, 
        error: "Numéro manquant" 
      })
    }

    // Nettoyer le numéro
    phone = phone.replace(/\D/g, "")
    if (!phone) {
      return res.status(400).json({ 
        success: false, 
        error: "Numéro invalide" 
      })
    }

    // Ajouter l'indicatif pays si manquant
    if (!phone.startsWith("243")) {
      phone = "243" + phone
    }

    console.log(`📞 Traitement du numéro: ${phone}`)

    // Vérifier si une session existe déjà pour ce numéro
    if (activeSockets[phone]) {
      console.log(`⚠️ Session existante pour ${phone}, déconnexion...`)
      try {
        await activeSockets[phone].logout()
      } catch (e) {}
      delete activeSockets[phone]
    }

    // Créer le dossier de session
    const sessionPath = path.join(SESSIONS_DIR, phone)
    if (!fs.existsSync(sessionPath)) {
      try {
        fs.mkdirSync(sessionPath, { recursive: true })
        console.log(`📁 Dossier session créé : ${sessionPath}`)
      } catch (mkdirErr) {
        console.error("❌ Erreur création dossier session:", mkdirErr.message)
        return res.status(500).json({
          success: false,
          error: "Erreur système lors de la création de session"
        })
      }
    }

    // Charger l'état d'authentification
    console.log("🔐 Chargement de l'état d'authentification...")
    const { state, saveCreds } = await useMultiFileAuthState(sessionPath)

    // Configurer le socket
    const sock = makeWASocket({
      auth: state,
      printQRInTerminal: true,
      logger: Pino({ level: "silent" }),
      browser: ["HEXGATE", "Chrome", "4.0.0"],
      syncFullHistory: false,
      markOnlineOnConnect: false,
      emitOwnEvents: true,
      defaultQueryTimeoutMs: 60000
    })

    // Stocker le socket
    activeSockets[phone] = sock

    // Sauvegarder les credentials
    sock.ev.on("creds.update", saveCreds)

    // Activer les commandes
    handleMessages(sock)

    // Variables pour gérer la connexion
    let connectionTimeout
    let qrReceived = false

    sock.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect, qr } = update

      console.log(`📡 État connexion pour ${phone}:`, connection)

      if (qr && !qrReceived) {
        console.log(`📱 QR reçu pour ${phone}`)
        qrReceived = true
      }

      if (connection === "open") {
        console.log(`✅ WhatsApp connecté : ${phone}`)
        botReady = true
        
        if (connectionTimeout) {
          clearTimeout(connectionTimeout)
        }

        // Notifier le propriétaire
        try {
          await sock.sendMessage(OWNER_NUMBER, {
            text: `🟢 NOUVELLE CONNEXION HEXGATE\n\n📱 Numéro : ${phone}\n🕒 ${new Date().toLocaleString()}\n✅ Session active`
          })
        } catch (notifyErr) {
          console.log("ℹ️ Impossible de notifier le propriétaire:", notifyErr.message)
        }
      }

      if (connection === "close") {
        const reason = lastDisconnect?.error?.output?.statusCode
        console.log(`❌ Déconnexion pour ${phone}:`, reason || "Raison inconnue")

        if (reason === DisconnectReason.loggedOut) {
          try {
            fs.rmSync(sessionPath, { recursive: true, force: true })
            console.log(`🗑️ Session supprimée : ${phone}`)
          } catch (cleanErr) {
            console.log("⚠️ Impossible de nettoyer la session:", cleanErr.message)
          }
          delete activeSockets[phone]
        }

        botReady = false
        
        if (connectionTimeout) {
          clearTimeout(connectionTimeout)
        }
      }
    })

    // Timeout pour la génération du code
    connectionTimeout = setTimeout(() => {
      if (!botReady) {
        console.log(`⏱️ Timeout pour la génération du code pour ${phone}`)
        try {
          sock.logout()
        } catch (e) {}
        delete activeSockets[phone]
      }
    }, 30000) // 30 secondes timeout

    // Générer le code de pairing
    try {
      console.log(`🔢 Génération du code pairing pour ${phone}...`)
      const code = await sock.requestPairingCode(`${phone}@s.whatsapp.net`)
      console.log(`✅ Code pairing généré pour ${phone}: ${code}`)
      
      // Arrêter le timeout
      clearTimeout(connectionTimeout)
      
      res.json({
        success: true,
        code: code,
        phone: phone,
        message: "Code généré avec succès",
        expiresIn: 300 // 5 minutes en secondes
      })
      
    } catch (pairErr) {
      console.error("❌ Erreur génération code pairing:", pairErr.message)
      
      // Nettoyer en cas d'erreur
      clearTimeout(connectionTimeout)
      delete activeSockets[phone]
      try {
        sock.logout()
      } catch (e) {}
      
      res.status(500).json({
        success: false,
        error: pairErr.message || "Erreur lors de la génération du code pairing"
      })
    }

  } catch (err) {
    console.error("❌ Erreur globale:", err)
    res.status(500).json({
      success: false,
      error: err.message || "Erreur lors de la génération du code"
    })
  }
})

// ================== MESSAGE HANDLER ==================
function handleMessages(sock) {
  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    try {
      if (type !== "notify") return

      const msg = messages[0]
      if (!msg.message || msg.key.fromMe) return

      // Extraire le texte du message
      const messageTypes = [
        'conversation',
        'extendedTextMessage',
        'imageMessage',
        'videoMessage',
        'audioMessage'
      ]

      let text = ''
      for (const type of messageTypes) {
        if (msg.message[type]) {
          if (type === 'conversation') {
            text = msg.message[type]
          } else if (msg.message[type].text) {
            text = msg.message[type].text
          }
          break
        }
      }

      if (!text || !text.startsWith(".")) return

      const args = text.slice(1).trim().split(/ +/)
      const cmdName = args.shift().toLowerCase()

      const command = commands.get(cmdName)
      if (!command) {
        await sock.sendMessage(msg.key.remoteJid, {
          text: `❌ Commande non trouvée: .${cmdName}\n\n📝 Tapez .help pour voir les commandes disponibles`
        })
        return
      }

      console.log(`📝 Commande exécutée: .${cmdName} par ${msg.key.remoteJid}`)
      await command.execute(sock, msg, args)

    } catch (e) {
      console.error("❌ Erreur traitement message:", e)
    }
  })
}

// ================== HEALTH CHECK ==================
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    sessions: Object.keys(activeSockets).length,
    botReady: botReady,
    platform: process.platform,
    version: "HEXGATE V2.0"
  })
})

// ================== 404 HANDLER ==================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Route non trouvée"
  })
})

// ================== START SERVER ==================
app.listen(PORT, "0.0.0.0", () => {
  console.log(`
╔════════════════════════════════════════╗
║         🤖 HEXGATE V2 ONLINE           ║
╠════════════════════════════════════════╣
║ 📡 Port: ${PORT}${" ".repeat(34 - PORT.toString().length)}║
║ 🌍 URL: http://localhost:${PORT}${" ".repeat(27 - PORT.toString().length)}║
║ 🔧 Env: ${process.env.RENDER ? 'Render' : 'Local'}${" ".repeat(31 - (process.env.RENDER ? 6 : 6))}║
╚════════════════════════════════════════╝

📋 Endpoints:
  GET  /              → Interface web
  GET  /api/bot-status → Statut du bot
  POST /api/generate-pair-code → Générer code
  GET  /health        → Santé serveur
  `)
  
  // Charger les commandes
  loadCommands()
})

// ================== ERROR HANDLING ==================
process.on("uncaughtException", (error) => {
  console.error("🔥 Exception non gérée:", error)
})

process.on("unhandledRejection", (reason, promise) => {
  console.error("⚠️ Rejet non géré:", reason)
})

process.on("SIGINT", () => {
  console.log("\n👋 Arrêt du bot...")
  Object.values(activeSockets).forEach(sock => {
    try {
      sock.logout()
    } catch (e) {}
  })
  console.log("✅ Nettoyage terminé")
  process.exit(0)
})
