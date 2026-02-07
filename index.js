const express = require("express");
const cors = require("cors");
const fs = require("fs-extra");
const path = require("path");
const Pino = require("pino");

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  Browsers
} = require("@whiskeysockets/baileys");

// ================= APP =================
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ================= CONFIG =================
const SESSIONS_DIR = path.join(__dirname, "sessions");
const COMMANDS_DIR = path.join(__dirname, "commands");
const MAX_SESSIONS = 10;

fs.ensureDirSync(SESSIONS_DIR);

// ================= GLOBAL =================
const sockets = new Map();
const commands = new Map();

// ================= LOAD COMMANDS =================
function loadCommands() {
  if (!fs.existsSync(COMMANDS_DIR)) return;
  const files = fs.readdirSync(COMMANDS_DIR).filter(f => f.endsWith(".js"));
  for (const file of files) {
    const cmd = require(path.join(COMMANDS_DIR, file));
    commands.set(cmd.name, cmd);
  }
  console.log(`✅ ${commands.size} commandes chargées`);
}

// ================= START BOT =================
async function startBot(sessionId) {
  const sessionPath = path.join(SESSIONS_DIR, sessionId);
  fs.ensureDirSync(sessionPath);

  const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    logger: Pino({ level: "silent" }),
    browser: Browsers.ubuntu("Chrome"),
    printQRInTerminal: false
  });

  sockets.set(sessionId, sock);

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message || msg.key.fromMe) return;
    const text = msg.message.conversation;
    if (!text) return;

    const cmdName = text.split(" ")[0].toLowerCase();
    const cmd = commands.get(cmdName);
    if (cmd) cmd.execute(sock, msg);
  });

  sock.ev.on("connection.update", ({ connection, lastDisconnect }) => {
    if (connection === "open") {
      console.log(`✅ Session ${sessionId} connectée`);
    }

    if (connection === "close") {
      const reason = lastDisconnect?.error?.output?.statusCode;
      if (reason === DisconnectReason.loggedOut) {
        fs.removeSync(sessionPath);
        sockets.delete(sessionId);
        console.log(`❌ Session ${sessionId} supprimée`);
      }
    }
  });

  return sock;
}

// ================= PAIR CODE =================
app.get("/code", async (req, res) => {
  const number = req.query.number;
  if (!number) return res.json({ error: "Numéro manquant" });

  if (sockets.size >= MAX_SESSIONS) {
    return res.json({ error: "Limite de sessions atteinte" });
  }

  const sessionId = "user_" + Date.now();
  const sessionPath = path.join(SESSIONS_DIR, sessionId);
  fs.ensureDirSync(sessionPath);

  try {
    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
      version,
      auth: state,
      logger: Pino({ level: "silent" }),
      browser: Browsers.ubuntu("Chrome"),
      printQRInTerminal: false
    });

    sockets.set(sessionId, sock);
    sock.ev.on("creds.update", saveCreds);

    // ⚡ ATTEND QUE LE SOCKET SOIT CONNECTÉ
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject("Timeout socket"), 10000);
      sock.ev.on("connection.update", ({ connection, lastDisconnect }) => {
        if (connection === "open") {
          clearTimeout(timeout);
          resolve();
        }
        if (connection === "close") {
          const reason = lastDisconnect?.error?.output?.statusCode;
          if (reason === DisconnectReason.loggedOut) {
            fs.removeSync(sessionPath);
            sockets.delete(sessionId);
            reject("Logged out");
          }
        }
      });
    });

    // Nettoie le numéro et ajoute 243 si nécessaire
    const clean = number.replace(/\D/g, "");
    const full = clean.startsWith("243") ? clean : "243" + clean;

    const code = await sock.requestPairingCode(full);
    res.json({ code, sessionId });

  } catch (err) {
    console.log("❌ Erreur génération code:", err);
    res.json({ error: "Impossible de générer le code" });
  }
});

// ================= SERVER =================
app.listen(PORT, () => {
  loadCommands();
  console.log(`🚀 Serveur en ligne sur le port ${PORT}`);
});
