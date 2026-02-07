const express = require("express");
const cors = require("cors");
const fs = require("fs-extra");
const path = require("path");
const Pino = require("pino");
const { default: makeWASocket, fetchLatestBaileysVersion, Browsers } = require("@whiskeysockets/baileys");

// ================= APP =================
const app = express();
const PORT = process.env.PORT || 3000;

// === Middleware ===
app.use(cors());
app.use(express.json());

// === SERVIR LE DOSSIER PUBLIC ===
app.use(express.static(path.join(__dirname, "public"))); // <-- index.html doit être dans ./public

// ================= CONFIG =================
const OWNER_NUMBER = "243816107573"; // ton numéro sans +
let pairingCodes = new Map();

// === COMMANDS ===
const COMMANDS_DIR = path.join(__dirname, "commands");
fs.ensureDirSync(COMMANDS_DIR); // Créé le dossier commands si inexistant
// Ici tu peux plus tard charger tes fichiers JS de commandes si besoin

// === UTILITAIRES ===
function delay(ms) {
  return new Promise(res => setTimeout(res, ms));
}

// === GENERATION DU PAIR CODE ===
async function generatePairCode(phone) {
  const { version } = await fetchLatestBaileysVersion();

  // ⚡ Socket fraîchement créé juste pour générer le code
  const sock = makeWASocket({
    version,
    logger: Pino({ level: "silent" }),
    browser: Browsers.ubuntu("Chrome")
  });

  const cleanPhone = phone.replace(/\D/g, "");
  const phoneWithCountry = cleanPhone.startsWith("243") ? cleanPhone : `243${cleanPhone}`;

  // Génération du pair code
  const code = await sock.requestPairingCode(phoneWithCountry);
  pairingCodes.set(phoneWithCountry, { code, timestamp: Date.now() });
  setTimeout(() => pairingCodes.delete(phoneWithCountry), 5 * 60 * 1000);

  console.log(`✅ Pair code généré: ${code} pour ${phoneWithCountry}`);

  // ✉️ Envoyer un message au propriétaire
  try {
    await sock.sendMessage(OWNER_NUMBER + "@s.whatsapp.net", { text: "Bonjour je suis connecté" });
    console.log("📩 Message de confirmation envoyé à", OWNER_NUMBER);
  } catch (err) {
    console.log("❌ Impossible d'envoyer le message:", err.message);
  }

  return code;
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
