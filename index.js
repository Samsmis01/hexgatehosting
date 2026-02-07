const express = require("express");
const cors = require("cors");
const fs = require("fs-extra");
const path = require("path");
const Pino = require("pino");
const { exec } = require("child_process");
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
const SESSION_DIR = path.join(__dirname, "session");
fs.ensureDirSync(SESSION_DIR);

// ================= BOT GLOBAL =================
let sock = null;
let canPair = false; // 🔥 SEUL état valide pour requestPairingCode

// ================= UTIL =================
const delay = ms => new Promise(r => setTimeout(r, ms));

// ================= START BOT =================
async function startBot() {
  try {
    const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);
    const { version } = await fetchLatestBaileysVersion();

    sock = makeWASocket({
      version,
      logger: Pino({ level: "silent" }),
      auth: state,
      browser: Browsers.ubuntu("Chrome"),
      printQRInTerminal: false, // ❌ PAS de QR
      markOnlineOnConnect: true,
      syncFullHistory: false
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", async ({ connection, lastDisconnect, qr }) => {

      // ✅ SOCKET PRÊT POUR PAIR CODE
      if (qr) {
        console.log("🟢 Socket prêt pour générer un pair code");
        canPair = true;
      }

      // ✅ SESSION CRÉÉE APRÈS INSERTION DU CODE
      if (connection === "open") {
        console.log("✅ WhatsApp connecté, session créée");
        canPair = false;
      }

      // ❌ DÉCONNEXION
      if (connection === "close") {
        canPair = false;
        const reason = lastDisconnect?.error?.output?.statusCode;

        if (reason === DisconnectReason.loggedOut) {
          console.log("❌ Logged out, reset session");
          exec(`rm -rf ${SESSION_DIR}`, async () => {
            fs.ensureDirSync(SESSION_DIR);
            await startBot();
          });
        } else {
          console.log("⚠️ Reconnexion...");
          await delay(4000);
          await startBot();
        }
      }
    });

  } catch (err) {
    console.log("❌ Erreur démarrage bot:", err.message);
    setTimeout(startBot, 5000);
  }
}

// ================= PAIR CODE =================
async function generatePairCode(phone) {
  if (!sock || !canPair) {
    console.log("❌ Socket non prêt pour pairing");
    return null;
  }

  const clean = phone.replace(/\D/g, "");
  const full = clean.startsWith("243") ? clean : `243${clean}`;

  try {
    const code = await sock.requestPairingCode(full);
    console.log(`✅ Pair code généré: ${code}`);
    return code;
  } catch (err) {
    console.log("❌ Pair code error:", err.message);
    return null;
  }
}

// ================= ROUTE API =================
app.get("/code", async (req, res) => {
  const number = req.query.number;
  if (!number) return res.json({ error: "Numéro manquant" });

  const code = await generatePairCode(number);
  if (!code) return res.json({ error: "Pair code indisponible" });

  res.json({ code });
});

// ================= SERVER =================
app.listen(PORT, () => {
  console.log(`🚀 Serveur en ligne sur ${PORT}`);
});

// ================= INIT =================
startBot();
