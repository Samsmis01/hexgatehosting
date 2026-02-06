const express = require("express")
const cors = require("cors")
const fs = require("fs-extra")
const path = require("path")
const Pino = require("pino")

const {
  default: makeWASocket,
  useMultiFileAuthState
} = require("@whiskeysockets/baileys")

// ================= APP =================
const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())
app.use(express.static("public"))

// ================= CONFIG =================
const MAX_SESSIONS = 10
const activeSessions = new Map()
const OWNER_NUMBER = "243812345678" // sans +

const BASE_DIR = __dirname
const SESSIONS_DIR = path.join(BASE_DIR, "sessions")
const COMMANDS_DIR = path.join(BASE_DIR, "commands")

// force les dossiers (IMPORTANT Render)
fs.ensureDirSync(SESSIONS_DIR)
fs.ensureDirSync(COMMANDS_DIR)

// ================= COMMANDS =================
const commands = new Map()

function loadCommands() {
  commands.clear()

  const files = fs
    .readdirSync(COMMANDS_DIR)
    .filter(f => f.endsWith(".js"))

  for (const file of files) {
    try {
      const filePath = path.join(COMMANDS_DIR, file)
      delete require.cache[require.resolve(filePath)]

      const cmd = require(filePath)

      if (cmd?.name && typeof cmd.execute === "function") {
        commands.set(cmd.name.toLowerCase(), cmd)
        console.log(`✅ Commande chargée : ${cmd.name}`)
      } else {
        console.log(`⚠️ Commande invalide ignorée : ${file}`)
      }
    } catch (err) {
      console.log(`❌ Erreur chargement ${file}`, err.message)
    }
  }
}

loadCommands()

// ================= ROUTE PAIRING (HTML) =================
app.get("/code", async (req, res) => {
  try {
    let number = req.query.number
    if (!number) return res.json({ error: "Numéro manquant" })

    number = number.replace(/[^0-9]/g, "")

    if (activeSessions.size >= MAX_SESSIONS) {
      return res.json({ error: "Limite de sessions atteinte" })
    }

    const sessionPath = path.join(SESSIONS_DIR, number)
    await fs.ensureDir(sessionPath)

    const { state, saveCreds } = await useMultiFileAuthState(sessionPath)

    const sock = makeWASocket({
      auth: state,
      logger: Pino({ level: "silent" }),
      browser: ["Chrome", "Ubuntu", "22.04"]
    })

    sock.ev.on("creds.update", saveCreds)

    // ======= Pairing =======
    if (!sock.authState.creds.registered) {
      const code = await sock.requestPairingCode(number)
      activeSessions.set(number, sock)

      // ======= ÉCOUTE COMMANDES =======
      sock.ev.on("messages.upsert", async ({ messages }) => {
        for (const msg of messages) {
          try {
            if (!msg.message || msg.key.fromMe) continue

            const text =
              msg.message.conversation ||
              msg.message.extendedTextMessage?.text ||
              ""

            if (!text.startsWith(".")) continue

            const args = text.slice(1).trim().split(/\s+/)
            const cmdName = args.shift().toLowerCase()

            if (commands.has(cmdName)) {
              await commands.get(cmdName).execute(sock, msg, args)
            }
          } catch (err) {
            console.log("❌ Erreur message:", err.message)
          }
        }
      })

      return res.json({ code })
    }

    return res.json({ code: "Already linked" })

  } catch (err) {
    console.error("PAIR ERROR:", err)
    return res.status(500).json({ error: "Erreur de service" })
  }
})

// ================= START =================
app.listen(PORT, () => {
  console.log(`✅ MOMO-ZEN MD en ligne sur le port ${PORT}`)
})
