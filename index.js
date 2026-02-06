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

// Dossier de sessions
const SESSIONS_DIR = process.env.RENDER
  ? path.join(os.tmpdir(), "whatsapp-sessions")
  : path.join(__dirname, "sessions")

const COMMANDS_DIR = path.join(__dirname, "commands")
const PUBLIC_DIR = path.join(__dirname, "public")

let botReady = false
let activeSockets = {}
let pairingAttempts = new Map()

// ================== INITIALISATION DES DOSSIERS ==================
function initializeDirectories() {
  console.log("📁 Initialisation des dossiers...")
  
  // Créer les dossiers s'ils n'existent pas
  const directories = [SESSIONS_DIR, COMMANDS_DIR, PUBLIC_DIR]
  
  directories.forEach(dir => {
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
        console.log(`✅ Dossier créé: ${dir}`)
      } else {
        console.log(`📁 Dossier existant: ${dir}`)
      }
    } catch (error) {
      console.error(`❌ Erreur création dossier ${dir}:`, error.message)
    }
  })
  
  // Vérifier si index.html existe dans public
  const indexPath = path.join(PUBLIC_DIR, "index.html")
  if (!fs.existsSync(indexPath)) {
    console.log("⚠️ index.html non trouvé dans public/, création d'une page par défaut...")
    
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
        <p>Pour l'interface complète, assurez-vous que index.html est dans le dossier public/</p>
    </div>
</body>
</html>
    `
    
    try {
      fs.writeFileSync(indexPath, defaultHTML)
      console.log("✅ Page HTML par défaut créée")
    } catch (error) {
      console.error("❌ Erreur création page HTML:", error.message)
    }
  }
}

// Exécuter l'initialisation
initializeDirectories()

// ================== MIDDLEWARE ==================
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  credentials: true
}))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Servir les fichiers statiques
app.use(express.static(PUBLIC_DIR))

// ================== COMMANDS LOADER ==================
const commands = new Map()

function loadCommands() {
  console.log("📁 Chargement des commandes...")
  commands.clear()
  
  try {
    if (!fs.existsSync(COMMANDS_DIR)) {
      console.log("⚠️ Dossier commands/ non trouvé")
      return
    }
    
    // Lire le contenu du dossier
    const files = fs.readdirSync(COMMANDS_DIR)
    
    if (!files || files.length === 0) {
      console.log("📁 Aucun fichier trouvé dans commands/")
      return
    }
    
    // Filtrer les fichiers .js
    const jsFiles = files.filter(file => file.endsWith('.js'))
    
    if (jsFiles.length === 0) {
      console.log("📁 Aucun fichier .js trouvé dans commands/")
      return
    }
    
    console.log(`📁 ${jsFiles.length} fichier(s) .js trouvé(s)`)
    
    // Charger chaque commande
    jsFiles.forEach(file => {
      try {
        const cmdPath = path.join(COMMANDS_DIR, file)
        console.log(`📥 Chargement de: ${file}`)
        
        // Supprimer du cache pour rechargement
        if (require.cache[require.resolve(cmdPath)]) {
          delete require.cache[require.resolve(cmdPath)]
        }
        
        const cmd = require(cmdPath)
        
        if (cmd.name && cmd.execute) {
          commands.set(cmd.name, cmd)
          console.log(`✅ Commande chargée: ${cmd.name}`)
        } else {
          console.log(`⚠️ Fichier ${file} invalide (manque 'name' ou 'execute')`)
        }
      } catch (error) {
        console.error(`❌ Erreur chargement ${file}:`, error.message)
      }
    })
    
    console.log(`📊 Total commandes chargées: ${commands.size}`)
    
    // Si aucune commande, en créer une par défaut
    if (commands.size === 0) {
      createDefaultCommands()
    }
    
  } catch (error) {
    console.error("❌ Erreur lors du chargement des commandes:", error.message)
  }
}

function createDefaultCommands() {
  console.log("📝 Création de commandes par défaut...")
  
  const defaultCommands = [
    {
      name: "ping",
      code: `module.exports = {
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
}`
    },
    {
      name: "help",
      code: `module.exports = {
  name: "help",
  description: "Affiche toutes les commandes disponibles",
  
  async execute(sock, msg, args) {
    const jid = msg.key.remoteJid
    
    const helpText = \`🤖 *HEXGATE COMMANDES*\\n\\n\` +
      \`📋 *Commandes disponibles:*\\n\` +
      \`• .ping - Vérifie si le bot est actif\\n\` +
      \`• .help - Affiche ce message\\n\\n\` +
      \`🔧 *Utilisation:*\\n\` +
      \`Envoyez n'importe quelle commande avec un point devant\\n\\n\` +
      \`📞 *Support:* @hextechcar\`
    
    await sock.sendMessage(jid, { text: helpText })
  }
}`
    }
  ]
  
  defaultCommands.forEach(cmd => {
    try {
      const filePath = path.join(COMMANDS_DIR, `${cmd.name}.js`)
      fs.writeFileSync(filePath, cmd.code)
      console.log(`✅ Commande ${cmd.name} créée`)
    } catch (error) {
      console.error(`❌ Erreur création commande ${cmd.name}:`, error.message)
    }
  })
  
  // Recharger les commandes
  loadCommands()
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
    res.send(`
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
              <p>🚀 Bot en ligne et fonctionnel</p>
              <p>📡 Port: ${PORT}</p>
              <p>📊 Sessions actives: ${Object.keys(activeSockets).length}</p>
              <p>🔧 Commandes disponibles: ${commands.size}</p>
          </div>
          <p>Téléchargez l'interface complète: <a href="https://github.com">GitHub</a></p>
      </body>
      </html>
    `)
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
    console.error("❌ Erreur statut:", error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

// ================== GENERATE PAIR CODE API ==================
app.post("/api/generate-pair-code", async (req, res) => {
  console.log("📱 Requête pour générer un code pair:", req.body)
  
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
        error: "Numéro invalide - veuillez n'utiliser que des chiffres" 
      })
    }

    // Validation de la longueur
    if (phone.length < 8) {
      return res.status(400).json({
        success: false,
        error: "Numéro trop court (minimum 8 chiffres)"
      })
    }

    if (phone.length > 15) {
      return res.status(400).json({
        success: false,
        error: "Numéro trop long (maximum 15 chiffres)"
      })
    }

    console.log(`📞 Numéro à traiter: ${phone}`)
    const fullNumber = `${phone}@s.whatsapp.net`

    // Anti-spam - 30 secondes entre les tentatives
    const now = Date.now()
    const lastAttempt = pairingAttempts.get(phone) || 0
    const timeSinceLastAttempt = now - lastAttempt
    
    if (timeSinceLastAttempt < 30000) {
      const waitTime = Math.ceil((30000 - timeSinceLastAttempt) / 1000)
      return res.status(429).json({
        success: false,
        error: `Veuillez attendre ${waitTime} secondes avant une nouvelle tentative`
      })
    }

    pairingAttempts.set(phone, now)

    // Nettoyer après 1 minute
    setTimeout(() => {
      pairingAttempts.delete(phone)
    }, 60000)

    // Nettoyer l'ancienne session si elle existe
    if (activeSockets[phone]) {
      console.log(`⚠️ Nettoyage de l'ancienne session pour ${phone}`)
      try {
        await activeSockets[phone].logout()
      } catch (e) {
        console.log("ℹ️ Erreur lors du logout:", e.message)
      }
      delete activeSockets[phone]
    }

    // Créer le dossier de session
    const sessionPath = path.join(SESSIONS_DIR, phone)
    try {
      if (!fs.existsSync(sessionPath)) {
        fs.mkdirSync(sessionPath, { recursive: true })
      }
    } catch (mkdirErr) {
      console.error("❌ Erreur création dossier session:", mkdirErr.message)
      return res.status(500).json({
        success: false,
        error: "Erreur système lors de la création de session"
      })
    }

    // Charger l'état d'authentification
    console.log("🔐 Chargement de l'état d'authentification...")
    const { state, saveCreds } = await useMultiFileAuthState(sessionPath)

    // Configuration du socket
    const sock = makeWASocket({
      auth: state,
      printQRInTerminal: true,
      logger: Pino({ level: 'fatal' }),
      browser: ["Ubuntu", "Chrome", "120.0.0.0"],
      syncFullHistory: false,
      markOnlineOnConnect: false,
      retryRequestDelayMs: 1000,
      maxRetries: 3,
      connectTimeoutMs: 60000,
      keepAliveIntervalMs: 30000
    })

    // Stocker le socket
    activeSockets[phone] = sock

    // Sauvegarder les credentials
    sock.ev.on("creds.update", saveCreds)

    // Activer les commandes
    sock.ev.on("messages.upsert", async ({ messages }) => {
      try {
        const msg = messages[0]
        if (!msg.message || msg.key.fromMe) return

        const text = msg.message.conversation || 
                     msg.message.extendedTextMessage?.text

        if (text && text.startsWith(".")) {
          const args = text.slice(1).trim().split(/ +/)
          const cmdName = args.shift().toLowerCase()
          const command = commands.get(cmdName)

          if (command) {
            console.log(`📝 Commande exécutée: .${cmdName}`)
            await command.execute(sock, msg, args)
          }
        }
      } catch (error) {
        console.error("❌ Erreur traitement message:", error)
      }
    })

    // Gestion des événements de connexion
    let connectionTimeout
    let isConnected = false

    sock.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect, qr } = update
      
      console.log(`📡 État connexion ${phone}: ${connection}`)

      if (qr) {
        console.log(`📱 QR code généré pour ${phone}`)
      }

      if (connection === "open") {
        console.log(`✅ WhatsApp connecté : ${phone}`)
        isConnected = true
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
          console.log("ℹ️ Notification échouée:", notifyErr.message)
        }
      }

      if (connection === "close") {
        console.log(`❌ Déconnexion pour ${phone}`)
        
        if (connectionTimeout) {
          clearTimeout(connectionTimeout)
        }

        const reason = lastDisconnect?.error?.output?.statusCode
        
        if (reason === DisconnectReason.loggedOut) {
          try {
            fs.rmSync(sessionPath, { recursive: true, force: true })
            console.log(`🗑️ Session supprimée : ${phone}`)
          } catch (cleanErr) {
            console.log("⚠️ Nettoyage échoué:", cleanErr.message)
          }
        }

        delete activeSockets[phone]
        isConnected = false
        botReady = false
      }
    })

    // Timeout de connexion
    connectionTimeout = setTimeout(async () => {
      if (!isConnected) {
        console.log(`⏱️ Timeout de connexion pour ${phone}`)
        
        try {
          await sock.logout()
        } catch (e) {}
        
        delete activeSockets[phone]
        
        res.status(408).json({
          success: false,
          error: "Timeout de connexion. Veuillez réessayer."
        })
      }
    }, 45000)

    // Générer le code de pairing
    try {
      console.log(`🔢 Génération du code pairing pour ${phone}...`)
      
      const code = await sock.requestPairingCode(fullNumber)
      console.log(`✅ Code pairing généré pour ${phone}: ${code}`)
      
      clearTimeout(connectionTimeout)
      
      res.json({
        success: true,
        code: code,
        phone: phone,
        message: "Code généré avec succès",
        expiresIn: 300
      })
      
    } catch (error) {
      console.error("❌ Erreur génération code pairing:", error.message)
      
      clearTimeout(connectionTimeout)
      
      delete activeSockets[phone]
      
      try {
        await sock.logout()
      } catch (e) {}
      
      let errorMessage = "Erreur lors de la génération du code"
      
      if (error.message.includes("Connection Closed")) {
        errorMessage = "Connexion refusée par WhatsApp. Veuillez réessayer plus tard."
      } else if (error.message.includes("timeout")) {
        errorMessage = "Timeout de connexion. Vérifiez votre connexion internet."
      } else if (error.message.includes("rate limit")) {
        errorMessage = "Trop de tentatives. Veuillez patienter quelques minutes."
      }
      
      res.status(500).json({
        success: false,
        error: errorMessage
      })
    }

  } catch (error) {
    console.error("❌ Erreur globale:", error)
    res.status(500).json({
      success: false,
      error: "Erreur interne du serveur"
    })
  }
})

// ================== HEALTH CHECK ==================
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    sessions: Object.keys(activeSockets).length,
    commands: commands.size,
    version: "HEXGATE V2.0"
  })
})

// ================== SERVER INFO ==================
app.get("/api/server-info", (req, res) => {
  res.json({
    success: true,
    port: PORT,
    environment: process.env.RENDER ? 'Render' : 'Local',
    sessionsDirectory: SESSIONS_DIR,
    commandsDirectory: COMMANDS_DIR,
    publicDirectory: PUBLIC_DIR,
    nodeVersion: process.version,
    platform: process.platform
  })
})

// ================== RELOAD COMMANDS ==================
app.post("/api/reload-commands", (req, res) => {
  try {
    loadCommands()
    res.json({
      success: true,
      message: `Commandes rechargées (${commands.size} commandes)`,
      commands: Array.from(commands.keys())
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

// ================== 404 HANDLER ==================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Route non trouvée"
  })
})

// ================== ERROR HANDLER ==================
app.use((err, req, res, next) => {
  console.error("🔥 Erreur serveur:", err)
  res.status(500).json({
    success: false,
    error: "Erreur interne du serveur"
  })
})

// ================== START SERVER ==================
const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`
╔════════════════════════════════════════╗
║         🤖 HEXGATE V2 ONLINE           ║
╠════════════════════════════════════════╣
║ 📡 Port: ${PORT}${" ".repeat(34 - PORT.toString().length)}║
║ 🌍 URL: http://localhost:${PORT}${" ".repeat(27 - PORT.toString().length)}║
║ 🔧 Env: ${process.env.RENDER ? 'Render' : 'Local'}${" ".repeat(31 - (process.env.RENDER ? 6 : 6))}║
╚════════════════════════════════════════╝

📋 Endpoints disponibles:
  GET  /                    → Interface web
  GET  /api/bot-status      → Statut du bot
  POST /api/generate-pair-code → Générer code
  GET  /health              → Santé serveur
  GET  /api/server-info     → Info serveur
  POST /api/reload-commands → Recharger commandes
  `)
})

// ================== GRACEFUL SHUTDOWN ==================
process.on("SIGINT", async () => {
  console.log("\n👋 Arrêt du bot...")
  
  // Fermer toutes les sessions
  const closePromises = Object.entries(activeSockets).map(async ([phone, sock]) => {
    try {
      await sock.logout()
      console.log(`✅ Déconnecté: ${phone}`)
    } catch (error) {
      console.log(`⚠️ Erreur déconnexion ${phone}:`, error.message)
    }
  })
  
  await Promise.allSettled(closePromises)
  
  // Fermer le serveur
  server.close(() => {
    console.log("✅ Serveur arrêté")
    process.exit(0)
  })
})

// ================== ERROR HANDLING ==================
process.on("uncaughtException", (error) => {
  console.error("🔥 Exception non gérée:", error)
})

process.on("unhandledRejection", (reason, promise) => {
  console.error("⚠️ Rejet non géré:", reason)
})
