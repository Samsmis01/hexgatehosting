const express = require("express")
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

app.use(express.json())
app.use(express.static("public"))

const MAX_SESSIONS = 10
const SESSIONS_DIR = "./sessions"
fs.ensureDirSync(SESSIONS_DIR)

// ================= COMMAND LOADER =================
const commands = new Map()

fs.readdirSync("./commands").forEach(file => {
  if (file.endsWith(".js")) {
    const cmd = require(`./commands/${file}`)
    commands.set(cmd.name, cmd)
  }
})

// ================= CREATE SESSION =================
async function createSession(sessionId) {
  const sessionPath = path.join(SESSIONS_DIR, sessionId)

  const { state, saveCreds } = await useMultiFileAuthState(sessionPath)

  const sock = makeWASocket({
    auth: state,
    logger: Pino({ level: "silent" }),
    printQRInTerminal: false
  })

  sock.ev.on("creds.update", saveCreds)

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const m = messages[0]
    if (!m.message || !m.key.remoteJid.endsWith("@s.whatsapp.net")) return

    const text = m.message.conversation || ""
    const args = text.split(" ")
    const cmdName = args[0].replace(".", "")

    if (commands.has(cmdName)) {
      commands.get(cmdName).execute(sock, m, args)
    }
  })

  return sock
}

// ================= PAIRING API =================
app.post("/pair", async (req, res) => {
  const { number } = req.body

  if (!number) {
    return res.json({ error: "Numéro manquant" })
  }

  const sessions = fs.readdirSync(SESSIONS_DIR)
  if (sessions.length >= MAX_SESSIONS) {
    return res.json({ error: "Limite de sessions atteinte (10)" })
  }

  const sessionId = number.replace(/\D/g, "")
  const sock = await createSession(sessionId)

  const code = await sock.requestPairingCode(sessionId)

  res.json({ code })
})

app.listen(PORT, () => {
  console.log("🌐 Site actif sur le port", PORT)
})
