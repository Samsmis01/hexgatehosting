const express = require("express")
const cors = require("cors")
const fs = require("fs")
const path = require("path")
const os = require("os")
const Pino = require("pino")

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  Browsers
} = require("@whiskeysockets/baileys")

const app = express()
const PORT = process.env.PORT || 3000

// ================== CONFIGURATION ==================
const OWNER_NUMBER = "243816107573@s.whatsapp.net"

// Dossier de sessions
const SESSIONS_DIR = process.env.RENDER
  ? path.join(os.tmpdir(), "baileys-sessions")
  : path.join(__dirname, "sessions")

const COMMANDS_DIR = path.join(__dirname, "commands")
const PUBLIC_DIR = path.join(__dirname, "public")

let botReady = false
let activeSockets = {}
let pairingAttempts = new Map()

// ================== INITIALISATION ==================
function initDirs() {
  [SESSIONS_DIR, COMMANDS_DIR, PUBLIC_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
      console.log(`📁 Créé: ${dir}`)
    }
  })
}
initDirs()

// ================== MIDDLEWARE ==================
app.use(cors({ origin: '*', credentials: true }))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(express.static(PUBLIC_DIR))

// ================== COMMANDES ==================
const commands = new Map()
function loadCommands() {
  commands.clear()
  try {
    if (fs.existsSync(COMMANDS_DIR)) {
      fs.readdirSync(COMMANDS_DIR)
        .filter(f => f.endsWith('.js'))
        .forEach(file => {
          try {
            const cmd = require(path.join(COMMANDS_DIR, file))
            if (cmd.name && cmd.execute) {
              commands.set(cmd.name, cmd)
              console.log(`✅ Commande: ${cmd.name}`)
            }
          } catch (e) {}
        })
    }
  } catch (e) {}
}
loadCommands()

// ================== ROUTES ==================
app.get("/", (req, res) => {
  const indexPath = path.join(PUBLIC_DIR, "index.html")
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath)
  } else {
    res.send("<h1>HEXGATE - Pair Code WhatsApp</h1>")
  }
})

app.get("/api/bot-status", (req, res) => {
  res.json({
    success: true,
    ready: botReady,
    sessions: Object.keys(activeSockets).length,
    timestamp: new Date().toISOString()
  })
})

// ================== SOLUTION PAIR CODE - CONFIGURATION OPTIMISÉE ==================
app.post("/api/generate-pair-code", async (req, res) => {
  console.log("🚀 Début génération Pair Code...")
  
  try {
    let phone = req.body.phone
    if (!phone) {
      return res.status(400).json({ 
        success: false, 
        error: "Numéro requis" 
      })
    }

    // Nettoyer et valider
    phone = phone.replace(/\D/g, "")
    if (phone.length < 8 || phone.length > 15) {
      return res.status(400).json({ 
        success: false, 
        error: "Numéro invalide (8-15 chiffres)" 
      })
    }

    console.log(`📱 Traitement: ${phone}`)
    const fullJid = `${phone}@s.whatsapp.net`

    // Anti-spam
    const now = Date.now()
    const lastAttempt = pairingAttempts.get(phone) || 0
    if (now - lastAttempt < 60000) {
      return res.status(429).json({
        success: false,
        error: "Attendez 1 minute entre les tentatives"
      })
    }
    pairingAttempts.set(phone, now)
    setTimeout(() => pairingAttempts.delete(phone), 120000)

    // Nettoyer ancienne session
    if (activeSockets[phone]) {
      try {
        await activeSockets[phone].logout()
        console.log(`🔒 Ancienne session fermée: ${phone}`)
      } catch (e) {}
      delete activeSockets[phone]
      await new Promise(r => setTimeout(r, 2000))
    }

    // Préparer dossier session
    const sessionPath = path.join(SESSIONS_DIR, phone)
    if (fs.existsSync(sessionPath)) {
      fs.rmSync(sessionPath, { recursive: true, force: true })
      console.log(`🗑️ Ancienne session supprimée: ${phone}`)
    }
    fs.mkdirSync(sessionPath, { recursive: true })

    // Obtenir dernière version
    const { version } = await fetchLatestBaileysVersion()
    console.log(`📦 Baileys version: ${version}`)

    // Charger état auth
    const { state, saveCreds } = await useMultiFileAuthState(sessionPath)

    // CONFIGURATION CRITIQUE POUR PAIR CODE
    const sock = makeWASocket({
      auth: state,
      printQRInTerminal: false,
      logger: Pino({ level: 'fatal' }),
      
      // CONFIGURATION ESSENTIELLE POUR PAIR CODE
      browser: Browsers.ubuntu('Chrome'),
      version: version,
      
      // Configuration de connexion
      connectTimeoutMs: 60000,
      defaultQueryTimeoutMs: 60000,
      keepAliveIntervalMs: 20000,
      
      // Options de retry
      retryRequestDelayMs: 1000,
      maxRetries: 2,
      
      // Optimisations
      syncFullHistory: false,
      markOnlineOnConnect: false,
      emitOwnEvents: true,
      fireInitQueries: true,
      mobile: false, // IMPORTANT: false pour Pair Code
      
      // Gestion messages
      getMessage: async () => ({}),
      msgRetryCounterCache: new Map(),
      
      // Options transaction
      transactionOpts: {
        maxRetries: 2,
        delay: 1000
      }
    })

    // Stocker socket
    activeSockets[phone] = sock

    // Sauvegarder credentials
    sock.ev.on("creds.update", saveCreds)

    // Gestion connexion
    let isConnected = false
    let connectionTimeout
    let pairingTimeout

    sock.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect } = update
      
      console.log(`📡 État ${phone}: ${connection}`)

      if (connection === "open") {
        console.log(`✅ CONNECTÉ: ${phone}`)
        isConnected = true
        botReady = true
        
        if (connectionTimeout) clearTimeout(connectionTimeout)
        if (pairingTimeout) clearTimeout(pairingTimeout)

        // Notifier propriétaire
        setTimeout(async () => {
          try {
            await sock.sendMessage(OWNER_NUMBER, {
              text: `🟢 CONNEXION HEXGATE\n📱 ${phone}\n🕒 ${new Date().toLocaleString()}`
            })
          } catch (e) {}
        }, 3000)

        // Activer commandes
        sock.ev.on("messages.upsert", async ({ messages }) => {
          try {
            const msg = messages[0]
            if (!msg.message || msg.key.fromMe) return

            const text = msg.message.conversation || 
                         msg.message.extendedTextMessage?.text

            if (text?.startsWith(".")) {
              const args = text.slice(1).trim().split(/ +/)
              const cmdName = args.shift().toLowerCase()
              const command = commands.get(cmdName)

              if (command) {
                await command.execute(sock, msg, args)
              }
            }
          } catch (e) {}
        })
      }

      if (connection === "close") {
        console.log(`❌ DÉCONNECTÉ: ${phone}`)
        
        if (connectionTimeout) clearTimeout(connectionTimeout)
        if (pairingTimeout) clearTimeout(pairingTimeout)

        const reason = lastDisconnect?.error?.output?.statusCode
        
        if (reason === DisconnectReason.loggedOut || reason === 401) {
          try {
            fs.rmSync(sessionPath, { recursive: true, force: true })
          } catch (e) {}
        }

        delete activeSockets[phone]
        isConnected = false
        botReady = false
      }
    })

    // Timeout connexion
    connectionTimeout = setTimeout(async () => {
      if (!isConnected) {
        console.log(`⏱️ Timeout connexion: ${phone}`)
        try {
          await sock.logout()
        } catch (e) {}
        delete activeSockets[phone]
        
        if (!res.headersSent) {
          res.status(408).json({
            success: false,
            error: "Timeout de connexion"
          })
        }
      }
    }, 45000)

    // ATTENTION: Attendre que le socket soit prêt
    console.log(`⏳ Initialisation socket pour ${phone}...`)
    await new Promise(r => setTimeout(r, 3000))

    // GÉNÉRER LE PAIR CODE
    try {
      console.log(`🔢 Génération Pair Code pour ${phone}...`)
      
      // VÉRIFIER QUE LE SOCKET EST PRÊT
      if (!sock.authState.creds.registered) {
        console.log(`⚠️ Socket non authentifié, tentative d'authentification...`)
        
        // Attendre un peu plus
        await new Promise(r => setTimeout(r, 2000))
        
        // Essayer de forcer l'authentification
        if (!sock.authState.creds.registered) {
          throw new Error("Socket non prêt pour Pair Code")
        }
      }

      // MÉTHODE PRINCIPALE: requestPairingCode
      const pairCode = await sock.requestPairingCode(fullJid)
      console.log(`✅ PAIR CODE GÉNÉRÉ: ${pairCode} pour ${phone}`)
      
      // Vérifier connexion
      if (!isConnected) {
        // Attendre un peu pour la connexion
        await new Promise(r => setTimeout(r, 3000))
        
        if (!isConnected) {
          throw new Error("Pas de connexion après génération du code")
        }
      }

      // Success
      clearTimeout(connectionTimeout)
      
      // Timeout pour expiration du code
      pairingTimeout = setTimeout(async () => {
        console.log(`⌛ Code expiré pour ${phone}`)
        try {
          await sock.logout()
        } catch (e) {}
        delete activeSockets[phone]
      }, 300000) // 5 minutes

      // Réponse au client
      res.json({
        success: true,
        code: pairCode,
        phone: phone,
        message: "Code pair généré avec succès",
        expiresIn: 300,
        instructions: [
          "1. Ouvrez WhatsApp sur votre téléphone",
          "2. Menu → Appareils liés → Associer un appareil",
          "3. Entrez ce code: " + pairCode,
          "4. Validez et attendez la connexion"
        ]
      })

    } catch (error) {
      console.error(`❌ ERREUR Pair Code ${phone}:`, error.message)
      
      clearTimeout(connectionTimeout)
      
      try {
        await sock.logout()
      } catch (e) {}
      
      delete activeSockets[phone]
      
      // Messages d'erreur spécifiques
      let errorMsg = "Erreur génération code"
      
      if (error.message.includes("Connection Closed")) {
        errorMsg = "WhatsApp a refusé la connexion. Vérifiez que le numéro est valide et non bloqué."
      } else if (error.message.includes("timed out")) {
        errorMsg = "Timeout. Réessayez dans 2 minutes."
      } else if (error.message.includes("not logged in")) {
        errorMsg = "Session invalide. Le numéro est peut-être déjà connecté."
      } else if (error.message.includes("rate limit")) {
        errorMsg = "Trop de tentatives. Attendez 5 minutes."
      } else if (error.message.includes("socket")) {
        errorMsg = "Problème de connexion. Réessayez."
      }
      
      res.status(500).json({
        success: false,
        error: errorMsg,
        tip: "Conseil: Déconnectez tous les appareils liés dans WhatsApp avant de réessayer"
      })
    }

  } catch (error) {
    console.error("🔥 Erreur globale:", error)
    res.status(500).json({
      success: false,
      error: "Erreur interne"
    })
  }
})

// ================== DÉCONNEXION ==================
app.post("/api/logout", async (req, res) => {
  try {
    const { phone } = req.body
    if (!phone) return res.status(400).json({ error: "Numéro requis" })

    const cleanPhone = phone.replace(/\D/g, "")
    
    if (activeSockets[cleanPhone]) {
      await activeSockets[cleanPhone].logout()
      delete activeSockets[cleanPhone]
      
      const sessionPath = path.join(SESSIONS_DIR, cleanPhone)
      if (fs.existsSync(sessionPath)) {
        fs.rmSync(sessionPath, { recursive: true, force: true })
      }
      
      res.json({ success: true, message: "Déconnecté" })
    } else {
      res.status(404).json({ error: "Session non trouvée" })
    }
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// ================== SANTÉ ==================
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    sessions: Object.keys(activeSockets).length,
    uptime: process.uptime(),
    method: "Pair Code - Baileys"
  })
})

// ================== DÉMARRAGE ==================
app.listen(PORT, "0.0.0.0", () => {
  console.log(`
╔════════════════════════════════════════╗
║         🤖 HEXGATE PAIR CODE           ║
╠════════════════════════════════════════╣
║ 📡 Port: ${PORT}                        ║
║ 🌍 URL: http://localhost:${PORT}         ║
║ 🔧 Méthode: Pair Code Baileys          ║
║ 🖥️  Browser: Chrome/Ubuntu             ║
╚════════════════════════════════════════╝

✅ Prêt pour génération de codes pair
📱 Endpoint: POST /api/generate-pair-code
🔒 Anti-spam: 1 minute entre tentatives
⏱️  Code valide: 5 minutes
  `)
})

// ================== NETTOYAGE ==================
process.on("SIGINT", async () => {
  console.log("\n🔒 Fermeture des sessions...")
  
  for (const [phone, sock] of Object.entries(activeSockets)) {
    try {
      await sock.logout()
      console.log(`✅ ${phone} déconnecté`)
    } catch (e) {}
  }
  
  console.log("👋 Arrêt complet")
  process.exit(0)
})
