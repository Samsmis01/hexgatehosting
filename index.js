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
  Browsers,
  makeCacheableSignalKeyStore
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
let qrCode = null;
let isConnected = false;
let pairingAttempts = {};

// ================= UTIL =================
const delay = ms => new Promise(r => setTimeout(r, ms));

// Fonction pour nettoyer le numéro
function cleanNumber(phone) {
  const clean = phone.replace(/\D/g, "");
  return clean.startsWith("224") ? clean : `224${clean}`;
}

// ================= START BOT (VERSION SIMPLIFIÉE) =================
async function startBot() {
  try {
    console.log("🔄 Démarrage du bot...");
    
    // Supprimer la session si elle existe pour forcer le pairing
    if (fs.existsSync(SESSION_DIR)) {
      console.log("🧹 Nettoyage de l'ancienne session...");
      await fs.remove(SESSION_DIR);
      await fs.ensureDir(SESSION_DIR);
    }

    const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);
    const { version } = await fetchLatestBaileysVersion();

    sock = makeWASocket({
      version,
      logger: Pino({ level: "debug" }), // Mode debug pour voir tout
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, Pino({ level: "fatal" }))
      },
      browser: Browsers.ubuntu("Chrome"),
      printQRInTerminal: true, // ✅ Afficher QR en terminal pour debug
      markOnlineOnConnect: false, // Important: rester offline
      syncFullHistory: false,
      connectTimeoutMs: 60000,
      defaultQueryTimeoutMs: 0,
      keepAliveIntervalMs: 10000,
      emitOwnEvents: true,
      generateHighQualityLinkPreview: false,
      linkPreviewImageThumbnailWidth: 192,
      shouldIgnoreJid: () => false,
      retryRequestDelayMs: 250,
      fireInitQueries: false, // Important: ne pas charger les contacts
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect, qr } = update;
      
      console.log("🔍 Update connexion:", {
        connection,
        hasQR: !!qr,
        lastDisconnect: lastDisconnect?.error?.message
      });

      // Stocker le QR code
      if (qr) {
        qrCode = qr;
        console.log("📱 QR Code disponible pour pairing");
      }

      if (connection === "open") {
        console.log("✅ Connecté à WhatsApp!");
        isConnected = true;
        
        // Mettre le statut en ligne après connexion
        await sock.sendPresenceUpdate('available');
      }

      if (connection === "close") {
        console.log("❌ Déconnecté");
        isConnected = false;
        qrCode = null;
        
        const shouldReconnect = (lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut);
        
        if (shouldReconnect) {
          console.log("🔄 Reconnexion dans 3 secondes...");
          await delay(3000);
          startBot();
        } else {
          console.log("🚫 Logged out, nettoyage...");
          await fs.remove(SESSION_DIR);
          await delay(2000);
          startBot();
        }
      }
    });

    // Gestion des erreurs
    sock.ev.on("messages.upsert", () => {});
    sock.ev.on("message-receipt.update", () => {});
    sock.ev.on("contacts.update", () => {});

    console.log("🤖 Bot initialisé, en attente de connexion...");

  } catch (err) {
    console.error("💥 Erreur démarrage bot:", err);
    setTimeout(startBot, 5000);
  }
}

// ================= FONCTION ALTERNATIVE POUR PAIRING =================
async function generatePairCodeAlternative(phone) {
  const fullNumber = cleanNumber(phone);
  console.log(`🔐 Tentative pairing pour: ${fullNumber}`);
  
  if (!sock) {
    console.log("❌ Socket non disponible");
    return null;
  }

  // Attendre que le socket soit un peu stable
  await delay(2000);

  try {
    // ESSAYER LA MÉTHODE DIRECTE
    console.log("🔄 Méthode 1: requestPairingCode direct...");
    const code = await sock.requestPairingCode(fullNumber);
    if (code) {
      console.log(`✅ Code généré: ${code}`);
      return code;
    }
  } catch (err1) {
    console.log("⚠️ Méthode 1 échouée:", err1.message);
    
    // ESSAYER UNE AUTRE APPROCHE - Simuler un QR puis générer
    try {
      console.log("🔄 Méthode 2: Approche alternative...");
      
      // Forcer un rechargement de l'état
      if (!isConnected && qrCode) {
        console.log("📱 Utilisation du QR existant pour pairing");
        // Attendre un peu pour que le QR soit valide
        await delay(3000);
      }
      
      // Nouvelle tentative
      const code = await sock.requestPairingCode(fullNumber);
      if (code) {
        console.log(`✅ Code généré (méthode 2): ${code}`);
        return code;
      }
    } catch (err2) {
      console.log("⚠️ Méthode 2 échouée:", err2.message);
      
      // DERNIER ESSAI - Reset partiel
      try {
        console.log("🔄 Méthode 3: Reset et réessai...");
        
        // Fermer et recréer le socket si problème
        if (sock.ws?.readyState) {
          sock.ws.close();
          await delay(1000);
        }
        
        // Utiliser une timeout plus courte
        const code = await Promise.race([
          sock.requestPairingCode(fullNumber),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error("Timeout")), 10000)
          )
        ]);
        
        if (code) {
          console.log(`✅ Code généré (méthode 3): ${code}`);
          return code;
        }
      } catch (err3) {
        console.log("❌ Toutes méthodes échouées:", err3.message);
      }
    }
  }
  
  return null;
}

// ================= ROUTE API AMÉLIORÉE =================
app.get("/code", async (req, res) => {
  const number = req.query.number;
  const requestId = Date.now();
  
  console.log(`\n=== REQUÊTE ${requestId} ===`);
  console.log(`📞 Numéro: ${number}`);
  
  if (!number || number.replace(/\D/g, '').length < 8) {
    console.log("❌ Numéro invalide");
    return res.json({ 
      success: false, 
      error: "Numéro WhatsApp invalide",
      code: null
    });
  }

  // Anti-spam: maximum 3 tentatives par numéro en 5 minutes
  const cleanNum = cleanNumber(number);
  const now = Date.now();
  
  if (!pairingAttempts[cleanNum]) {
    pairingAttempts[cleanNum] = [];
  }
  
  // Nettoyer les vieilles tentatives
  pairingAttempts[cleanNum] = pairingAttempts[cleanNum].filter(
    time => now - time < 5 * 60 * 1000
  );
  
  if (pairingAttempts[cleanNum].length >= 3) {
    console.log("🚫 Trop de tentatives pour ce numéro");
    return res.json({
      success: false,
      error: "Trop de tentatives. Réessayez dans 5 minutes.",
      code: null
    });
  }
  
  pairingAttempts[cleanNum].push(now);

  // Vérifier l'état du bot
  if (!sock) {
    console.log("⚠️ Bot non initialisé, démarrage...");
    await startBot();
    await delay(3000);
  }

  // Attendre un peu si pas connecté
  if (!isConnected) {
    console.log("⏳ En attente de connexion...");
    for (let i = 0; i < 10 && !isConnected; i++) {
      await delay(1000);
      console.log(`Attente ${i+1}/10...`);
    }
    
    if (!isConnected) {
      console.log("❌ Bot non connecté après attente");
      return res.json({
        success: false,
        error: "Service temporairement indisponible. Réessayez dans 30 secondes.",
        code: null
      });
    }
  }

  try {
    // Générer le code avec retry
    let code = null;
    let attempts = 0;
    
    while (!code && attempts < 2) {
      attempts++;
      console.log(`🔄 Tentative ${attempts}/2...`);
      
      code = await generatePairCodeAlternative(number);
      
      if (!code) {
        await delay(2000);
        
        // Relancer le bot si échec
        if (attempts === 1) {
          console.log("🔄 Redémarrage partiel du bot...");
          if (sock.ws) sock.ws.close();
          await delay(3000);
        }
      }
    }

    if (code) {
      console.log(`✅ SUCCÈS: Code ${code} pour ${cleanNum}`);
      return res.json({
        success: true,
        code: code,
        error: null,
        expiresIn: "5 minutes"
      });
    } else {
      console.log("❌ Échec final de génération");
      return res.json({
        success: false,
        code: null,
        error: "Impossible de générer le code. Assurez-vous que le numéro WhatsApp est valide et actif."
      });
    }
    
  } catch (error) {
    console.error("💥 Erreur fatale:", error);
    return res.json({
      success: false,
      code: null,
      error: "Erreur serveur. Réessayez plus tard."
    });
  }
});

// Route de vérification d'état
app.get("/status", (req, res) => {
  res.json({
    botReady: !!sock,
    isConnected: isConnected,
    hasQR: !!qrCode,
    sessionExists: fs.existsSync(path.join(SESSION_DIR, 'creds.json')),
    timestamp: new Date().toISOString()
  });
});

// Route de reset
app.get("/reset", async (req, res) => {
  console.log("🔄 Reset manuel demandé");
  
  if (sock?.ws) {
    sock.ws.close();
  }
  
  await fs.remove(SESSION_DIR).catch(() => {});
  await delay(1000);
  
  startBot();
  
  res.json({
    success: true,
    message: "Bot reset en cours..."
  });
});

// ================= SERVER =================
app.listen(PORT, () => {
  console.log(`🚀 Serveur MOMO-ZEN sur le port ${PORT}`);
  console.log(`📡 Endpoints:`);
  console.log(`   GET /code?number=224XXXXXXXXX`);
  console.log(`   GET /status`);
  console.log(`   GET /reset`);
  console.log(`\n=== DÉMARRAGE DU BOT ===`);
});

// ================= INIT =================
startBot();

// Nettoyage périodique
setInterval(() => {
  const now = Date.now();
  for (const num in pairingAttempts) {
    pairingAttempts[num] = pairingAttempts[num].filter(
      time => now - time < 10 * 60 * 1000
    );
    if (pairingAttempts[num].length === 0) {
      delete pairingAttempts[num];
    }
  }
}, 60000);
