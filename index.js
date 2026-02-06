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
  ? path.join(os.tmpdir(), "sessions")  // Utilise le dossier temp sur Render
  : path.join(__dirname, "sessions")

const COMMANDS_DIR = path.join(__dirname, "commands")

let botReady = false
let activeSockets = {}

// ================== MIDDLEWARE ==================
app.use(cors())
app.use(express.json())
app.use(express.static("public"))

// Vérifier et créer le dossier de sessions
if (!fs.existsSync(SESSIONS_DIR)) {
  try {
    fs.mkdirSync(SESSIONS_DIR, { recursive: true })
    console.log(`📁 Dossier de sessions créé : ${SESSIONS_DIR}`)
  } catch (err) {
    console.error(`❌ Erreur création dossier sessions: ${err.message}`)
    // Fallback sur le dossier courant si erreur
    const fallbackDir = path.join(__dirname, "sessions")
    if (!fs.existsSync(fallbackDir)) {
      fs.mkdirSync(fallbackDir, { recursive: true })
    }
  }
}

// ================== COMMANDS LOADER ==================
const commands = new Map()

// Charger les commandes
function loadCommands() {
  commands.clear()
  
  if (fs.existsSync(COMMANDS_DIR)) {
    const files = fs.readdirSync(COMMANDS_DIR)
      .filter(file => file.endsWith(".js"))
    
    if (files.length === 0) {
      console.log("📁 Aucune commande trouvée dans le dossier 'commands'")
      return
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
  } else {
    console.log("📁 Dossier 'commands' non trouvé, création...")
    fs.mkdirSync(COMMANDS_DIR, { recursive: true })
  }
}

// Charger les commandes au démarrage
loadCommands()

// ================== BOT STATUS ==================
app.get("/api/bot-status", (req, res) => {
  res.json({
    ready: botReady,
    sessions: Object.keys(activeSockets).length,
    commands: Array.from(commands.keys()),
    sessionsDir: SESSIONS_DIR
  })
})

// ================== GENERATE PAIR CODE ==================
app.post("/api/generate-pair-code", async (req, res) => {
  try {
    let phone = req.body.phone
    if (!phone) {
      return res.status(400).json({ success: false, error: "Numéro manquant" })
    }

    // Nettoyer le numéro
    phone = phone.replace(/\D/g, "")
    if (!phone) {
      return res.status(400).json({ success: false, error: "Numéro invalide" })
    }

    // Ajouter l'indicatif pays si manquant
    if (!phone.startsWith("243") && !phone.startsWith("+")) {
      phone = "243" + phone
    }

    // Convertir en format WhatsApp
    const whatsappNumber = phone.endsWith("@s.whatsapp.net") ? phone : `${phone}@s.whatsapp.net`

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
    const { state, saveCreds } = await useMultiFileAuthState(sessionPath)

    // Configurer le socket
    const sock = makeWASocket({
      auth: state,
      printQRInTerminal: true, // Afficher aussi dans le terminal pour le débogage
      logger: Pino({ level: "silent" }),
      browser: ["HEXGATE", "Chrome", "4.0.0"],
      syncFullHistory: false,
      markOnlineOnConnect: false
    })

    // Stocker le socket
    activeSockets[phone] = sock

    // Sauvegarder les credentials
    sock.ev.on("creds.update", saveCreds)

    // Activer les commandes
    handleMessages(sock)

    // Gérer les événements de connexion
    sock.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect, qr } = update

      if (qr) {
        console.log(`📱 QR reçu pour ${phone}`)
      }

      if (connection === "open") {
        botReady = true
        console.log(`✅ WhatsApp connecté : ${phone}`)

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
          // Nettoyer la session
          try {
            fs.rmSync(sessionPath, { recursive: true, force: true })
            console.log(`🗑️ Session supprimée : ${phone}`)
          } catch (cleanErr) {
            console.log("⚠️ Impossible de nettoyer la session:", cleanErr.message)
          }
          delete activeSockets[phone]
        }

        botReady = false
      }
    })

    // Générer le code de pairing
    try {
      const code = await sock.requestPairingCode(whatsappNumber)
      console.log(`🔢 Code de pairing généré pour ${phone}: ${code}`)
      
      res.json({
        success: true,
        code: code,
        phone: phone,
        message: "Code généré avec succès"
      })
    } catch (pairErr) {
      console.error("❌ Erreur génération code pairing:", pairErr)
      
      // Nettoyer en cas d'erreur
      delete activeSockets[phone]
      sock.logout()
      
      res.status(500).json({
        success: false,
        error: "Erreur lors de la génération du code pairing"
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
        // Répondre si commande inconnue
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

// ================== COMMANDS RELOAD ==================
app.post("/api/reload-commands", (req, res) => {
  try {
    loadCommands()
    res.json({
      success: true,
      message: `Commandes rechargées (${commands.size} commandes)`
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    })
  }
})

// ================== HEALTH CHECK ==================
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    sessions: Object.keys(activeSockets).length,
    botReady: botReady,
    platform: process.platform,
    sessionsDirectory: SESSIONS_DIR
  })
})

// ================== INDEX ROUTE ==================
app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>HEXGATE WhatsApp Bot</title>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body {
          font-family: 'Segoe UI', Arial, sans-serif;
          margin: 0;
          padding: 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          min-height: 100vh;
        }
        .container {
          max-width: 800px;
          margin: 0 auto;
          background: rgba(255,255,255,0.1);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          padding: 40px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.1);
        }
        h1 {
          text-align: center;
          margin-bottom: 30px;
          font-size: 2.5em;
        }
        .status {
          background: rgba(255,255,255,0.2);
          padding: 20px;
          border-radius: 10px;
          margin-bottom: 30px;
        }
        .status-item {
          margin: 10px 0;
          font-size: 1.1em;
        }
        .badge {
          display: inline-block;
          padding: 5px 10px;
          border-radius: 5px;
          font-weight: bold;
          margin-left: 10px;
        }
        .ready { background: #10B981; }
        .not-ready { background: #EF4444; }
        .api-link {
          display: block;
          background: rgba(255,255,255,0.2);
          color: white;
          padding: 15px;
          border-radius: 10px;
          text-decoration: none;
          margin: 10px 0;
          transition: background 0.3s;
        }
        .api-link:hover {
          background: rgba(255,255,255,0.3);
        }
        code {
          background: rgba(0,0,0,0.3);
          padding: 2px 5px;
          border-radius: 3px;
          font-family: monospace;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🤖 HEXGATE WhatsApp Bot</h1>
        
        <div class="status">
          <div class="status-item">
            Statut: 
            <span class="badge ${botReady ? 'ready' : 'not-ready'}">
              ${botReady ? 'CONNECTÉ' : 'DÉCONNECTÉ'}
            </span>
          </div>
          <div class="status-item">Sessions actives: ${Object.keys(activeSockets).length}</div>
          <div class="status-item">Commandes disponibles: ${commands.size}</div>
          <div class="status-item">Port: ${PORT}</div>
        </div>
        
        <h2>📡 API Endpoints</h2>
        <a href="/api/bot-status" class="api-link" target="_blank">
          GET /api/bot-status - Vérifier le statut du bot
        </a>
        <a href="/health" class="api-link" target="_blank">
          GET /health - Vérifier la santé du serveur
        </a>
        
        <h2>🔧 Utilisation API</h2>
        <div style="background: rgba(0,0,0,0.3); padding: 15px; border-radius: 10px;">
          <p>Générer un code pairing:</p>
          <code>POST /api/generate-pair-code</code>
          <p style="margin-top: 10px;">Body: <code>{"phone": "243XXXXXXXXX"}</code></p>
        </div>
        
        <div style="text-align: center; margin-top: 30px; opacity: 0.8;">
          <p>🚀 Serveur actif et prêt à recevoir des commandes</p>
        </div>
      </div>
      
      <script>
        // Auto-refresh status
        setInterval(async () => {
          const response = await fetch('/api/bot-status');
          const data = await response.json();
          
          const statusBadge = document.querySelector('.badge');
          const sessionsCount = document.querySelectorAll('.status-item')[1];
          const commandsCount = document.querySelectorAll('.status-item')[2];
          
          if (data.ready) {
            statusBadge.className = 'badge ready';
            statusBadge.textContent = 'CONNECTÉ';
          } else {
            statusBadge.className = 'badge not-ready';
            statusBadge.textContent = 'DÉCONNECTÉ';
          }
          
          sessionsCount.textContent = \`Sessions actives: \${data.sessions}\`;
          commandsCount.textContent = \`Commandes disponibles: \${data.commands?.length || 0}\`;
        }, 5000);
      </script>
    </body>
    </html>
  `)
})

// ================== START SERVER ==================
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 HEXGATE lancé sur le port ${PORT}`)
  console.log(`📁 Dossier sessions: ${SESSIONS_DIR}`)
  console.log(`📁 Dossier commands: ${COMMANDS_DIR}`)
  console.log(`🌍 URL: http://0.0.0.0:${PORT}`)
  console.log(`🔧 Environnement: ${process.env.RENDER ? 'Render' : 'Local'}`)
})

// ================== ERROR HANDLING ==================
process.on("uncaughtException", (error) => {
  console.error("🔥 Exception non gérée:", error)
})

process.on("unhandledRejection", (reason, promise) => {
  console.error("⚠️ Rejet non géré:", reason)
})

// Nettoyage à la fermeture
process.on("SIGINT", () => {
  console.log("👋 Arrêt du bot...")
  Object.values(activeSockets).forEach(sock => sock.logout())
  process.exit(0)
})
