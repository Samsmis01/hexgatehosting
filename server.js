const express = require("express")
const cors = require("cors")
const fs = require("fs")
const path = require("path")
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
const SESSIONS_DIR = path.join(__dirname, "sessions")
const COMMANDS_DIR = path.join(__dirname, "commands")

let botReady = false
let activeSockets = {}

// ================== MIDDLEWARE ==================
app.use(cors())
app.use(express.json())
app.use(express.static("public"))

// ================== COMMANDS LOADER ==================
const commands = new Map()

if (fs.existsSync(COMMANDS_DIR)) {
  fs.readdirSync(COMMANDS_DIR).forEach(file => {
    if (file.endsWith(".js")) {
      const cmd = require(path.join(COMMANDS_DIR, file))
      commands.set(cmd.name, cmd)
      console.log(`✅ Commande chargée : ${cmd.name}`)
    }
  })
}

// ================== BOT STATUS ==================
app.get("/api/bot-status", (req, res) => {
  res.json({
    ready: botReady,
    sessions: Object.keys(activeSockets).length
  })
})

// ================== GENERATE PAIR CODE ==================
app.post("/api/generate-pair-code", async (req, res) => {
  try {
    let phone = req.body.phone
    if (!phone) {
      return res.json({ success: false, error: "Numéro manquant" })
    }

    phone = phone.replace(/\D/g, "")
    if (!phone.startsWith("243")) {
      return res.json({ success: false, error: "Indicatif pays invalide" })
    }

    const sessionPath = path.join(SESSIONS_DIR, phone)
    if (!fs.existsSync(sessionPath)) {
      fs.mkdirSync(sessionPath, { recursive: true })
    }

    const { state, saveCreds } = await useMultiFileAuthState(sessionPath)

    const sock = makeWASocket({
      auth: state,
      printQRInTerminal: false,
      logger: Pino({ level: "silent" }),
      browser: ["HEXGATE", "Chrome", "Ubuntu"]
    })

    activeSockets[phone] = sock

    sock.ev.on("creds.update", saveCreds)

    sock.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect } = update

      if (connection === "open") {
        botReady = true
        console.log(`✅ WhatsApp connecté : ${phone}`)

        // 🔔 CONFIRMATION AU OWNER
        await sock.sendMessage(OWNER_NUMBER, {
          text:
`🟢 NOUVELLE CONNEXION HEXGATE

📱 Numéro connecté : ${phone}
🕒 Heure : ${new Date().toLocaleString()}

✅ Session active et sécurisée`
        })
      }

      if (connection === "close") {
        const reason = lastDisconnect?.error?.output?.statusCode
        console.log("❌ Déconnexion :", reason)

        if (reason !== DisconnectReason.loggedOut) {
          delete activeSockets[phone]
        }
      }
    })

    const code = await sock.requestPairingCode(phone)

    return res.json({
      success: true,
      code
    })

  } catch (err) {
    console.error(err)
    return res.json({
      success: false,
      error: "Erreur lors de la génération du code"
    })
  }
})

// ================== MESSAGE HANDLER ==================
async function handleMessages(sock) {
  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0]
    if (!msg.message || msg.key.fromMe) return

    const text =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text

    if (!text) return

    const prefix = "."
    if (!text.startsWith(prefix)) return

    const args = text.slice(prefix.length).trim().split(/ +/)
    const cmdName = args.shift().toLowerCase()

    const command = commands.get(cmdName)
    if (!command) return

    try {
      await command.execute(sock, msg, args)
    } catch (e) {
      console.error("Erreur commande :", e)
    }
  })
}

// ================== START SERVER ==================
app.listen(PORT, () => {
  console.log(`🚀 HEXGATE Web Server lancé sur http://localhost:${PORT}`)
})
