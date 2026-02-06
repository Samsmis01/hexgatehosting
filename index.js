const express = require("express")
const cors = require("cors")
const fs = require("fs-extra")
const path = require("path")
const Pino = require("pino")

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} = require("@whiskeysockets/baileys")

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())
app.use(express.static("public"))

const MAX_SESSIONS = 10
const activeSessions = new Map()

// ================= PAIRING =================
app.post("/pair", async (req, res) => {
  try {
    const { number } = req.body
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

    if (!sock.authState.creds.registered) {
      const code = await sock.requestPairingCode(number)
      activeSessions.set(number, sock)

      sock.ev.on("creds.update", saveCreds)

      return res.json({ code })
    }

    res.json({ error: "Numéro déjà connecté" })
  } catch (e) {
    console.log(e)
    res.json({ error: "Erreur pairing" })
  }
})

// ================= COMMANDS =================
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

// ================= START =================
app.listen(PORT, () => {
  console.log("✅ MOMO-ZEN MD en ligne sur le port", PORT)
})
