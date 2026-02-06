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

let botReady = false
let activeSockets = {}
let pairingAttempts = new Map() // Suivi des tentatives

// ================== MIDDLEWARE ==================
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  credentials: true
}))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Servir les fichiers statiques
const PUBLIC_DIR = path.join(__dirname, "public")
if (!fs.existsSync(PUBLIC_DIR)) {
  fs.mkdirSync(PUBLIC_DIR, { recursive: true })
  console.log(`📁 Dossier public créé : ${PUBLIC_DIR}`)
}

app.use(express.static(PUBLIC_DIR))

// Créer les dossiers nécessaires
[COMMANDS_DIR, SESSIONS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
    console.log(`📁 Dossier créé : ${dir}`)
  }
})

// ================== COMMANDS LOADER ==================
const commands = new Map()

function loadCommands() {
  commands.clear()
  
  if (fs.existsSync(COMMANDS_DIR)) {
    const files = fs.readdirSync(COMMANDS_DIR)
      .filter(file => file.endsWith(".js"))
    
    files.forEach(file => {
      try {
        const cmdPath = path.join(COMMANDS_DIR, file)
        delete require.cache[require.resolve(cmdPath)]
        const cmd = require(cmdPath)
        
        if (cmd.name && cmd.execute) {
          commands.set(cmd.name, cmd)
          console.log(`✅ Commande chargée : ${cmd.name}`)
        }
      } catch (error) {
        console.error(`❌ Erreur chargement ${file}:`, error.message)
      }
    })
    
    console.log(`📊 Total commandes chargées : ${commands.size}`)
  }
}

loadCommands()

// ================== UTILITY FUNCTIONS ==================
function formatPhoneNumber(phone) {
  // Nettoyer le numéro
  phone = phone.replace(/\D/g, '')
  
  // Supprimer les zéros en début si présents
  phone = phone.replace(/^0+/, '')
  
  // Si le numéro commence déjà par un indicatif, le laisser
  const countryCodes = ['1', '20', '27', '30', '31', '32', '33', '34', '36', '39', 
                       '40', '41', '43', '44', '45', '46', '47', '48', '49', '51',
                       '52', '53', '54', '55', '56', '57', '58', '60', '61', '62',
                       '63', '64', '65', '66', '81', '82', '84', '86', '90', '91',
                       '92', '93', '94', '95', '98', '212', '213', '216', '218',
                       '220', '221', '222', '223', '224', '225', '226', '227', '228',
                       '229', '230', '231', '232', '233', '234', '235', '236', '237',
                       '238', '239', '240', '241', '242', '243', '244', '245', '246',
                       '247', '248', '249', '250', '251', '252', '253', '254', '255',
                       '256', '257', '258', '260', '261', '262', '263', '264', '265',
                       '266', '267', '268', '269', '290', '291', '297', '298', '299',
                       '350', '351', '352', '353', '354', '355', '356', '357', '358',
                       '359', '370', '371', '372', '373', '374', '375', '376', '377',
                       '378', '379', '380', '381', '382', '383', '385', '386', '387',
                       '389', '420', '421', '423', '500', '501', '502', '503', '504',
                       '505', '506', '507', '508', '509', '590', '591', '592', '593',
                       '594', '595', '596', '597', '598', '599', '670', '672', '673',
                       '674', '675', '676', '677', '678', '679', '680', '681', '682',
                       '683', '685', '686', '687', '688', '689', '690', '691', '692',
                       '850', '852', '853', '855', '856', '880', '886', '960', '961',
                       '962', '963', '964', '965', '966', '967', '968', '970', '971',
                       '972', '973', '974', '975', '976', '977', '992', '993', '994',
                       '995', '996', '998']
  
  // Vérifier si le numéro commence par un indicatif connu
  let hasCountryCode = false
  for (const code of countryCodes) {
    if (phone.startsWith(code)) {
      hasCountryCode = true
      break
    }
  }
  
  // Si pas d'indicatif, on considère que c'est un numéro local
  // On laisse l'utilisateur entrer son numéro complet avec l'indicatif
  return phone
}

function validatePhoneNumber(phone) {
  if (!phone || phone.length < 8) {
    return { valid: false, error: "Numéro trop court (minimum 8 chiffres)" }
  }
  
  if (phone.length > 15) {
    return { valid: false, error: "Numéro trop long (maximum 15 chiffres)" }
  }
  
  if (!/^\d+$/.test(phone)) {
    return { valid: false, error: "Le numéro ne doit contenir que des chiffres" }
  }
  
  return { valid: true, phone: phone }
}

// ================== ROUTES ==================
app.get("/", (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, "index.html"))
})

// API pour vérifier le statut
app.get("/api/bot-status", (req, res) => {
  res.json({
    success: true,
    ready: botReady,
    sessions: Object.keys(activeSockets).length,
    timestamp: new Date().toISOString(),
    version: "HEXGATE V2.0"
  })
})

// API pour générer le code pair
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

    // Valider et formater le numéro
    const validation = validatePhoneNumber(phone)
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: validation.error
      })
    }

    phone = validation.phone
    const fullNumber = `${phone}@s.whatsapp.net`
    
    console.log(`📞 Numéro à traiter: ${phone} (${fullNumber})`)

    // Vérifier les tentatives récentes (anti-spam)
    const now = Date.now()
    const lastAttempt = pairingAttempts.get(phone) || 0
    const timeSinceLastAttempt = now - lastAttempt
    
    if (timeSinceLastAttempt < 30000) { // 30 secondes entre les tentatives
      const waitTime = Math.ceil((30000 - timeSinceLastAttempt) / 1000)
      return res.status(429).json({
        success: false,
        error: `Veuillez attendre ${waitTime} secondes avant une nouvelle tentative`
      })
    }

    pairingAttempts.set(phone, now)

    // Nettoyer les anciennes tentatives
    setTimeout(() => {
      pairingAttempts.delete(phone)
    }, 60000)

    // Si une session existe déjà, la nettoyer
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
    if (!fs.existsSync(sessionPath)) {
      fs.mkdirSync(sessionPath, { recursive: true })
    }

    // Configuration améliorée du socket
    const { state, saveCreds } = await useMultiFileAuthState(sessionPath)

    const sock = makeWASocket({
      auth: state,
      printQRInTerminal: true,
      logger: Pino({ level: 'fatal' }), // Réduire les logs
      browser: ["Ubuntu", "Chrome", "120.0.0.0"],
      syncFullHistory: false,
      markOnlineOnConnect: false,
      retryRequestDelayMs: 1000,
      maxRetries: 3,
      connectTimeoutMs: 60000,
      keepAliveIntervalMs: 30000,
      emitOwnEvents: false,
      defaultQueryTimeoutMs: 60000,
      transactionOpts: {
        maxRetries: 3,
        delay: 1000
      }
    })

    // Stocker le socket
    activeSockets[phone] = sock

    // Sauvegarder les credentials
    sock.ev.on("creds.update", saveCreds)

    // Gestion améliorée des événements de connexion
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
        const errorMessage = lastDisconnect?.error?.message || "Unknown error"
        
        console.log(`⚠️ Raison déconnexion: ${reason || errorMessage}`)

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
          console.log(`🔒 Déconnexion forcée pour ${phone}`)
        } catch (e) {
          console.log("ℹ️ Déconnexion échouée:", e.message)
        }
        
        delete activeSockets[phone]
        
        res.status(408).json({
          success: false,
          error: "Timeout de connexion. Veuillez réessayer."
        })
      }
    }, 45000) // 45 secondes

    // Générer le code de pairing avec retry
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
        error: errorMessage,
        details: error.message
      })
    }

  } catch (error) {
    console.error("❌ Erreur globale:", error)
    res.status(500).json({
      success: false,
      error: "Erreur interne du serveur",
      details: error.message
    })
  }
})

// ================== MESSAGE HANDLER ==================
function handleMessages(sock) {
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
}

// ================== HEALTH CHECK ==================
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    sessions: Object.keys(activeSockets).length,
    version: "HEXGATE V2.0"
  })
})

// ================== CLEANUP ENDPOINT ==================
app.post("/api/cleanup-session", async (req, res) => {
  try {
    const { phone } = req.body
    if (!phone) {
      return res.status(400).json({ 
        success: false, 
        error: "Numéro manquant" 
      })
    }

    if (activeSockets[phone]) {
      await activeSockets[phone].logout()
      delete activeSockets[phone]
    }

    const sessionPath = path.join(SESSIONS_DIR, phone)
    if (fs.existsSync(sessionPath)) {
      fs.rmSync(sessionPath, { recursive: true, force: true })
    }

    res.json({
      success: true,
      message: "Session nettoyée avec succès"
    })

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
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

📋 Endpoints disponibles:
  GET  /                    → Interface web
  GET  /api/bot-status      → Statut du bot
  POST /api/generate-pair-code → Générer code
  POST /api/cleanup-session → Nettoyer session
  GET  /health              → Santé serveur
  `)
})

// ================== ERROR HANDLING ==================
process.on("uncaughtException", (error) => {
  console.error("🔥 Exception non gérée:", error)
})

process.on("unhandledRejection", (reason, promise) => {
  console.error("⚠️ Rejet non géré:", reason)
})

process.on("SIGINT", async () => {
  console.log("\n👋 Arrêt du bot...")
  
  for (const [phone, sock] of Object.entries(activeSockets)) {
    try {
      await sock.logout()
      console.log(`✅ Déconnecté: ${phone}`)
    } catch (error) {
      console.log(`⚠️ Erreur déconnexion ${phone}:`, error.message)
    }
  }
  
  console.log("✅ Nettoyage terminé")
  process.exit(0)
})
