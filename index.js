const express = require("express")
const cors = require("cors")
const fs = require("fs-extra")
const Pino = require("pino")
const path = require("path")

const {
  default: makeWASocket,
  useMultiFileAuthState
} = require("@whiskeysockets/baileys")

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())
app.use(express.static("public"))

// === CONFIG ===
const MAX_SESSIONS = 10
const activeSessions = new Map()
const OWNER_NUMBER = "+243812345678" // ton numéro WhatsApp owner

// === CHARGEMENT COMMANDES ===
const loadCommands = () => {
  const commands = {}
  const files = fs.readdirSync("./commands")
  for (const file of files) {
    const cmd = require(`./commands/${file}`)
    commands[cmd.name] = cmd
  }
  return commands
}

const commands = loadCommands()

// === ROUTE GET POUR HTML /code?number=... ===
app.get("/code", async (req, res) => {
  try {
    const number = req.query.number
    if (!number) return res.json({ error: "Numéro manquant" })

    if (activeSessions.size >= MAX_SESSIONS) {
      return res.json({ error: "Limite de sessions atteinte" })
    }

    const sessionPath = `sessions/${number}`
    await fs.ensureDir(sessionPath)

    const { state, saveCreds } = await useMultiFileAuthState(sessionPath)

    const sock = makeWASocket({
      logger: Pino({ level: "silent" }),
      auth: state,
      browser: ["Chrome", "Ubuntu", "22.04"]
    })

    // === Pairing si pas encore connecté ===
    if (!sock.authState.creds.registered) {
      const code = await sock.requestPairingCode(number)
      activeSessions.set(number, sock)
      sock.ev.on("creds.update", saveCreds)

      // === Notification au OWNER ===
      await sock.sendMessage(`${OWNER_NUMBER}@s.whatsapp.net`, {
        text: `✅ Numéro ${number} connecté avec succès !`
      })

      // === Écoute messages pour commandes ===
      sock.ev.on("messages.upsert", async ({ messages }) => {
        for (const msg of messages) {
          if (!msg.message || msg.key.fromMe) continue
          const text = msg.message.conversation || ""
          const args = text.split(" ")
          const cmdName = args.shift().toLowerCase()
          if (commands[cmdName]) {
            commands[cmdName].execute(sock, msg)
          }
        }
      })

      return res.json({ code })
    }

    res.json({ code: "Already linked" })
  } catch (e) {
    console.log(e)
    res.status(500).json({ error: "Service error" })
  }
})

// === ROUTE POST /pair OPTIONNELLE (si besoin API interne) ===
app.post("/pair", async (req, res) => {
  try {
    const { number } = req.body
    if (!number) return res.json({ error: "Numéro manquant" })

    // Reuse de la logique GET /code
    req.query.number = number
    app._router.handle(req, res, () => {})
  } catch {
    res.json({ error: "Erreur pairing" })
  }
})

// === START SERVER ===
app.listen(PORT, () => {
  console.log(`✅ MOMO-ZEN MD en ligne sur le port ${PORT}`)
})
