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

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public"))); // <-- ton index.html ici

// ================= CONFIG =================
const OWNER_NUMBER = "243816107573"; // ton numéro sans +
const SESSION_DIR = path.join(__dirname, "session");
fs.ensureDirSync(SESSION_DIR);

// === BOT GLOBAL ===
let sock = null;
let botReady = false;
let pairingCodes = new Map();

// === UTILITAIRES ===
function delay(ms) {
  return new Promise(res => setTimeout(res, ms));
}

// === START BOT ===
async function startBot() {
  try {
    const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);
    const { version } = await fetchLatestBaileysVersion();

    sock = makeWASocket({
      version,
      logger: Pino({ level: "silent" }),
      printQRInTerminal: true, // affiche QR la première fois
      auth: state,
      browser: Browsers.ubuntu("Chrome"),
      markOnlineOnConnect: true,
      syncFullHistory: false
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", async ({ connection, lastDisconnect, qr }) => {
      if (qr) {
        console.log("📱 Scanner ce QR code sur WhatsApp Web pour connecter le bot !");
      }

      if (connection === "open") {
        console.log("✅ Bot connecté et prêt !");
        botReady = true;
      }

      if (connection === "close") {
        const reason = lastDisconnect?.error?.output?.statusCode;
        if (reason === DisconnectReason.loggedOut) {
          console.log("❌ Déconnecté, suppression de session...");
          exec(`rm -rf ${SESSION_DIR}`, async () => {
            fs.ensureDirSync(SESSION_DIR);
            console.log("🔄 Redémarrage du bot...");
            await startBot();
          });
        } else {
          console.log("⚠️ Connexion fermée, tentative de reconnexion...");
          await delay(5000);
          await startBot();
        }
      }
    });

  } catch (err) {
    console.log("❌ Erreur démarrage bot:", err.message);
    setTimeout(startBot, 5000);
  }
}

// === GENERATION DU PAIR CODE ===
async function generatePairCode(phone) {
  if (!sock || !botReady) {
    console.log("❌ Bot non prêt pour générer le pair code");
    return null;
  }

  const cleanPhone = phone.replace(/\D/g, "");
  const phoneWithCountry = cleanPhone.startsWith("243") ? cleanPhone : `243${cleanPhone}`;

  try {
    const code = await sock.requestPairingCode(phoneWithCountry);
    pairingCodes.set(phoneWithCountry, { code, timestamp: Date.now() });
    setTimeout(() => pairingCodes.delete(phoneWithCountry), 5 * 60 * 1000);

    console.log(`✅ Pair code généré: ${code} pour ${phoneWithCountry}`);
    return code;

  } catch (err) {
    console.log("❌ Erreur génération pair code:", err.message);
    return null;
  }
}

// === ROUTE HTML / GET CODE ===
app.get("/code", async (req, res) => {
  try {
    const number = req.query.number;
    if (!number) return res.json({ error: "Numéro manquant" });

    const code = await generatePairCode(number);
    if (!code) return res.json({ error: "Impossible de générer le code" });

    res.json({ code });

  } catch (err) {
    console.error("PAIR ERROR:", err);
    res.status(500).json({ error: "Erreur de service" });
  }
});

// === START SERVER ===
app.listen(PORT, () => console.log(`✅ Bot en ligne sur le port ${PORT}`));

// === LANCEMENT INITIAL DU BOT ===
startBot();
