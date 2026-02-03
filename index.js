console.log('🔧 HEXGATE V3 - Démarrage...');
console.log('📦 Version: @whiskeysockets/baileys');

// ==================== CONFIGURATION ====================
const fs = require('fs');
const path = require('path');

// 📁 CHARGEMENT DE LA CONFIGURATION
let config = {};
try {
  if (fs.existsSync('./config.json')) {
    config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
    console.log('✅ Configuration chargée depuis config.json');
  } else {
    console.log('⚠️ config.json non trouvé, création avec valeurs par défaut...');
    config = {
      prefix: ".",
      ownerNumber: "243816107573",
      botPublic: false,
      fakeRecording: false,
      antiLink: true,
      alwaysOnline: true,
      logLevel: "silent",
      telegramLink: "https://t.me/hextechcar",
      botImageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyERDdGHGjmXPv_6tCBIChmD-svWkJatQlpzfxY5WqFg&s=10"
    };
    fs.writeFileSync('./config.json', JSON.stringify(config, null, 2));
    console.log('✅ config.json créé avec valeurs par défaut');
  }
} catch (error) {
  console.log('❌ Erreur chargement config.json:', error.message);
  config = {
    prefix: ".",
    ownerNumber: "243816107573",
    botPublic: true,
    fakeRecording: false,
    antiLink: true,
    alwaysOnline: true,
    logLevel: "silent",
    telegramLink: "https://t.me/hextechcar",
    botImageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyERDdGHGjmXPv_6tCBIChmD-svWkJatQlpzfxY5WqFg&s=10"
  };
}

// Variables globales depuis config.json
const prefix = config.prefix || ".";
let botPublic = config.botPublic || true;
let fakeRecording = config.fakeRecording || false;
const antiLink = config.antiLink || true;
const alwaysOnline = config.alwaysOnline || true;
const OWNER_NUMBER = `${config.ownerNumber.replace(/\D/g, '')}@s.whatsapp.net`;
const telegramLink = config.telegramLink || "https://t.me/hextechcar";
const botImageUrl = config.botImageUrl || "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyERDdGHGjmXPv_6tCBIChmD-svWkJatQlpzfxY5WqFg&s=10";
const logLevel = config.logLevel || "silent";

console.log('📋 Configuration chargée:');
console.log(`  • Prefix: ${prefix}`);
console.log(`  • Owner: ${OWNER_NUMBER}`);
console.log(`  • Mode: ${botPublic ? 'Public' : 'Privé'}`);
console.log(`  • Fake Recording: ${fakeRecording ? 'Activé' : 'Désactivé'}`);

// ==================== IMPORTS ====================
const {
  default: makeWASocket,
  useMultiFileAuthState,
  downloadContentFromMessage,
  DisconnectReason,
  fetchLatestBaileysVersion,
  Browsers,
  delay
} = require("@whiskeysockets/baileys");

const P = require("pino");
const readline = require("readline");

// 📡 API WEB SERVER
const express = require('express');
const cors = require('cors');

// ==================== VARIABLES GLOBALES ====================
let sock = null;
let botReady = false;
let pairingCodes = new Map();
let processingMessages = new Set();
let messageStore = new Map();
let viewOnceStore = new Map();
let antiLinkCooldown = new Map();
let antiLinkWarnings = new Map();
let botMessages = new Set();
let autoReact = true;

// 🌈 COULEURS POUR LE TERMINAL
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// 📁 Dossiers
const DELETED_MESSAGES_FOLDER = "./deleted_messages";
const VIEW_ONCE_FOLDER = "./viewOnce";
const DELETED_IMAGES_FOLDER = "./deleted_images";

// Vérification des dossiers
[DELETED_MESSAGES_FOLDER, VIEW_ONCE_FOLDER, DELETED_IMAGES_FOLDER].forEach(folder => {
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder, { recursive: true });
    console.log(`${colors.green}✅ Dossier ${folder} créé${colors.reset}`);
  }
});

// ==================== FONCTIONS API ====================
function isBotReady() {
  return botReady && sock !== null;
}

async function generatePairCode(phone) {
  try {
    if (!sock) {
      console.log('❌ Bot non initialisé');
      return null;
    }
    
    const cleanPhone = phone.replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.startsWith('243') ? cleanPhone : `243${cleanPhone}`;
    
    console.log(`📱 Génération pair code pour: ${phoneWithCountry}`);
    
    const code = await sock.requestPairingCode(phoneWithCountry);
    
    if (code) {
      pairingCodes.set(phoneWithCountry, {
        code: code,
        timestamp: Date.now()
      });
      
      setTimeout(() => {
        pairingCodes.delete(phoneWithCountry);
      }, 300000);
      
      console.log(`✅ Pair code généré: ${code}`);
      return code;
    }
    
    return null;
  } catch (error) {
    console.log(`❌ Erreur génération pair code: ${error.message}`);
    return null;
  }
}

// ==================== SERVEUR WEB EXPRESS ====================
function startWebServer(port = process.env.PORT || 3000) {
  const app = express();
  
  app.use(cors());
  app.use(express.json());
  app.use(express.static('website'));
  
  // Route pour le site web
  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'website', 'index.html'));
  });
  
  // Route pour générer un code pair
  app.post('/api/generate-pair-code', async (req, res) => {
    try {
      const { phone } = req.body;
      
      if (!phone) {
        return res.status(400).json({ error: 'Numéro requis' });
      }
      
      console.log(`🌐 Demande de code pair pour: ${phone}`);
      
      const code = await generatePairCode(phone);
      
      if (code) {
        res.json({ 
          success: true, 
          code: code,
          message: 'Code généré avec succès'
        });
      } else {
        res.status(500).json({ 
          error: 'Impossible de générer le code' 
        });
      }
    } catch (error) {
      console.error('Erreur API:', error);
      res.status(500).json({ error: error.message });
    }
  });
  
  // Route pour vérifier l'état du bot
  app.get('/api/bot-status', (req, res) => {
    res.json({ 
      ready: isBotReady(),
      status: isBotReady() ? 'Bot en ligne' : 'Bot non connecté',
      version: 'HEX✦GATE V2'
    });
  });
  
  // Route pour obtenir les statistiques
  app.get('/api/stats', (req, res) => {
    res.json({
      ready: isBotReady(),
      pairingCodesGenerated: pairingCodes.size,
      uptime: process.uptime(),
      version: 'HEX✦GATE V2'
    });
  });
  
  // Health check pour Render
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });
  
  return app.listen(port, () => {
    console.log(`${colors.green}🌐 Serveur web démarré sur le port ${port}${colors.reset}`);
    console.log(`${colors.cyan}📱 Accédez au site: http://localhost:${port}${colors.reset}`);
  });
}

// ==================== FONCTIONS UTILITAIRES ====================
function isOwner(senderJid) {
  const normalizedJid = senderJid.split(":")[0];
  const ownerJid = OWNER_NUMBER.split(":")[0];
  return normalizedJid === ownerJid;
}

async function isAdminInGroup(sock, jid, senderJid) {
  try {
    if (!jid.endsWith("@g.us")) return false;
    
    const metadata = await sock.groupMetadata(jid);
    const participant = metadata.participants.find(p => p.id === senderJid);
    
    if (!participant) return false;
    
    return participant.admin === "admin" || participant.admin === "superadmin";
  } catch (error) {
    console.log(`${colors.yellow}⚠️ Erreur vérification admin: ${error.message}${colors.reset}`);
    return false;
  }
}

async function sendFormattedMessage(sock, jid, messageText) {
  const formattedMessage = `┏━━❖ ＡＲＣＡＮＥ❖━━┓
┃ 🛡️ 𝐇𝐄𝐗✦𝐆Ａ𝐓Ｅ 𝑽_1
┃
┃ ${messageText}
┗━━━━━━━━━━━━━━━┛`;

  try {
    const sentMsg = await sock.sendMessage(jid, { 
      text: formattedMessage 
    });
    
    if (sentMsg?.key?.id) {
      botMessages.add(sentMsg.key.id);
      setTimeout(() => botMessages.delete(sentMsg.key.id), 300000);
    }
  } catch (error) {
    console.log(`${colors.red}❌ Échec envoi message: ${error.message}${colors.reset}`);
  }
}

// ==================== CLASS COMMAND HANDLER ====================
class CommandHandler {
  constructor() {
    this.commands = new Map();
    this.initializeCommands();
  }

  initializeCommands() {
    console.log(`${colors.cyan}📁 Initialisation des commandes...${colors.reset}`);
    
    // Commandes simplifiées
    this.commands.set("ping", {
      name: "ping",
      description: "Test du bot",
      execute: async (sock, msg) => {
        const from = msg.key.remoteJid;
        await sock.sendMessage(from, { text: "🏓 PONG! Bot en ligne." });
      }
    });

    this.commands.set("menu", {
      name: "menu",
      description: "Affiche le menu",
      execute: async (sock, msg) => {
        const from = msg.key.remoteJid;
        const menuText = `┏━━❖ ＡＲＣＡＮＥ ❖━━┓
┃ 🛡️ HEX✦GATE V2
┃ 👨‍💻 Dev : T.me/hextechcar
┃ 
┗━━━━━━━━━━━━━━━━

Commandes disponibles:
• .ping - Test du bot
• .menu - Ce menu
• .status - Statut du bot
• .pair - Générez un code pairing

🔗 Telegram: ${telegramLink}`;

        await sock.sendMessage(from, { text: menuText });
      }
    });

    this.commands.set("status", {
      name: "status",
      description: "Statut du bot",
      execute: async (sock, msg) => {
        const from = msg.key.remoteJid;
        const statusText = `📊 *STATUS DU BOT*
        
🤖 Nom: HEX✦GATE V2
✅ Statut: ${botReady ? 'En ligne' : 'Hors ligne'}
🔓 Mode: ${botPublic ? 'Public' : 'Privé'}
📱 Propriétaire: ${config.ownerNumber}
🔗 Telegram: ${telegramLink}

${botReady ? '🚀 Bot prêt à utiliser !' : '⏳ Bot en cours de connexion...'}`;

        await sock.sendMessage(from, { text: statusText });
      }
    });

    console.log(`${colors.green}✅ ${this.commands.size} commandes chargées${colors.reset}`);
  }

  async execute(commandName, sock, msg, args) {
    const cmd = commandName.toLowerCase();
    
    if (!this.commands.has(cmd)) {
      console.log(`${colors.yellow}⚠️ Commande inconnue: ${cmd}${colors.reset}`);
      return false;
    }
    
    const command = this.commands.get(cmd);
    
    try {
      console.log(`${colors.cyan}⚡ Exécution: ${cmd}${colors.reset}`);
      await command.execute(sock, msg, args);
      return true;
    } catch (error) {
      console.log(`${colors.red}❌ Erreur exécution ${cmd}: ${error.message}${colors.reset}`);
      return false;
    }
  }
}

// ==================== FONCTION PRINCIPALE DU BOT ====================
async function startBot() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  async function askForPhoneNumber() {
    return new Promise((resolve) => {
      rl.question(`${colors.cyan}📱 Entrez votre numéro WhatsApp (format: 243XXXXXXXXX): ${colors.reset}`, (phone) => {
        resolve(phone.trim());
      });
    });
  }

  try {
    console.log(`
${colors.magenta}╔══════════════════════════════════════════════════╗
║         WHATSAPP BOT - HEXGATE EDITION          ║
╠══════════════════════════════════════════════════╣
║ ✅ API WEB INTÉGRÉE POUR PAIRING                 ║
║ ✅ SITE WEB INCLUS                               ║
║ ✅ OPTIMISÉ POUR RENDER                         ║
╚══════════════════════════════════════════════════╝${colors.reset}
`);
    
    // Démarrer le serveur web
    startWebServer();
    
    // Initialiser WhatsApp
    const { state, saveCreds } = await useMultiFileAuthState("auth_info_baileys");
    const { version } = await fetchLatestBaileysVersion();
    
    sock = makeWASocket({
      version,
      logger: P({ level: logLevel }),
      printQRInTerminal: false,
      auth: state,
      browser: Browsers.ubuntu("Chrome"),
      markOnlineOnConnect: alwaysOnline,
      syncFullHistory: false,
    });

    const commandHandler = new CommandHandler();

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect, qr } = update;
      
      if (qr) {
        console.log(`${colors.cyan}📱 QR Code disponible - Demande pairing par numéro${colors.reset}`);
        
        if (process.env.RENDER) {
          console.log(`${colors.green}🌐 Utilisez le site web pour générer un code pairing${colors.reset}`);
          console.log(`${colors.cyan}📱 Accédez à: https://votre-app.render.com${colors.reset}`);
        } else {
          const phoneNumber = await askForPhoneNumber();
          if (!phoneNumber || phoneNumber.length < 9) {
            console.log(`${colors.red}❌ Numéro invalide${colors.reset}`);
            process.exit(1);
          }

          try {
            const code = await sock.requestPairingCode(phoneNumber);
            console.log(`${colors.green}✅ Code de pairing: ${code}${colors.reset}`);
            console.log(`${colors.cyan}📱 Instructions: WhatsApp > ⋮ > Appareils liés > Ajouter un périphérique${colors.reset}`);
          } catch (pairError) {
            console.log(`${colors.red}❌ Erreur pairing: ${pairError.message}${colors.reset}`);
          }
        }
      }
      
      if (connection === "close") {
        const reason = new Error(lastDisconnect?.error)?.output?.statusCode;
        if (reason === DisconnectReason.loggedOut) {
          console.log(`${colors.red}❌ Déconnecté, redémarrage...${colors.reset}`);
          startBot();
        } else {
          console.log(`${colors.yellow}🔄 Reconnexion...${colors.reset}`);
          startBot();
        }
      } else if (connection === "open") {
        console.log(`${colors.green}✅ Connecté à WhatsApp!${colors.reset}`);
        botReady = true;
        
        // Envoi de confirmation au propriétaire
        try {
          await sock.sendMessage(OWNER_NUMBER, { 
            text: `✅ *HEX-GATE CONNECTÉ*\n\n🚀 HEXGATE V2 est en ligne!\n🌐 API Web active\n🔗 Site pairing disponible` 
          });
          console.log(`${colors.green}✅ Confirmation envoyée au propriétaire${colors.reset}`);
        } catch (error) {
          console.log(`${colors.yellow}⚠️ Impossible d'envoyer message au propriétaire${colors.reset}`);
        }
      }
    });

    // 📨 TRAITEMENT DES MESSAGES
    sock.ev.on("messages.upsert", async ({ messages }) => {
      try {
        const msg = messages[0];
        if (!msg.message) return;

        const from = msg.key.remoteJid;
        const sender = msg.key.participant || msg.key.remoteJid;
        
        // Récupérer le texte du message
        let body = "";
        if (msg.message.conversation) {
          body = msg.message.conversation;
        } else if (msg.message.extendedTextMessage?.text) {
          body = msg.message.extendedTextMessage.text;
        } else if (msg.message.imageMessage?.caption) {
          body = msg.message.imageMessage.caption;
        }

        // Traitement des commandes
        if (body.startsWith(prefix)) {
          const args = body.slice(prefix.length).trim().split(/ +/);
          const command = args.shift().toLowerCase();
          
          console.log(`${colors.cyan}🎯 Commande détectée: ${command} par ${sender}${colors.reset}`);
          
          if (botPublic || isOwner(sender)) {
            await commandHandler.execute(command, sock, msg, args);
          }
        }
      } catch (error) {
        console.log(`${colors.red}❌ Erreur traitement message: ${error.message}${colors.reset}`);
      }
    });

    // 🚀 INTERFACE CONSOLE SIMPLIFIÉE
    rl.on("line", (input) => {
      const args = input.trim().split(/ +/);
      const command = args.shift().toLowerCase();
      
      switch (command) {
        case "status":
          console.log(`${colors.cyan}📊 STATUT DU BOT${colors.reset}`);
          console.log(`${colors.yellow}• Connecté: ${botReady ? 'OUI' : 'NON'}${colors.reset}`);
          console.log(`${colors.yellow}• Mode: ${botPublic ? 'PUBLIC' : 'PRIVÉ'}${colors.reset}`);
          console.log(`${colors.yellow}• Socket: ${sock ? 'ACTIF' : 'INACTIF'}${colors.reset}`);
          console.log(`${colors.yellow}• Codes pairing: ${pairingCodes.size}${colors.reset}`);
          break;
          
        case "clear":
          console.clear();
          break;
          
        case "exit":
          console.log(`${colors.yellow}👋 Arrêt...${colors.reset}`);
          rl.close();
          process.exit(0);
          break;
          
        default:
          console.log(`${colors.cyan}Commandes: status, clear, exit${colors.reset}`);
      }
    });

  } catch (error) {
    console.log(`${colors.red}❌ Erreur démarrage bot: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

// ==================== DÉMARRAGE ====================
console.log(`${colors.magenta}🚀 Démarrage de HEXGATE V3...${colors.reset}`);
startBot();
