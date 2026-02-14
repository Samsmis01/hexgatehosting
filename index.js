console.log('🔧 HEXGATE V3 - Vérification des dépendances...');
console.log('📦 Version correcte: @whiskeysockets/baileys (avec un seul L)');

const requiredModules = [
  '@whiskeysockets/baileys',
  'pino',
  'fs',
  'path',
  'child_process',
  'readline',
  'buffer',
  'express',
  'cors'
];

const missingModules = [];

// 📁 CHARGEMENT DE LA CONFIGURATION
let config = {};
try {
  const fs = require('fs');
  const path = require('path');
  
  if (fs.existsSync('./config.json')) {
    config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
    console.log('✅ Configuration chargée depuis config.json');
  } else {
    console.log('⚠️ config.json non trouvé, création avec valeurs par défaut...');
    config = {
      prefix: ".",
      ownerNumber: "243983205767",
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
    ownerNumber: "243983205767",
    botPublic: false,
    fakeRecording: false,
    antiLink: true,
    alwaysOnline: true,
    logLevel: "silent",
    telegramLink: "https://t.me/hextechcar",
    botImageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRCIwiz88R6J5X8x1546iN-aFfGXxKtlUQDStbvnHV7sb-FHYTQKQd358M&s=10"
  };
}

// Variables globales depuis config.json
const prefix = config.prefix || ".";
let botPublic = config.botPublic || true;
let welcomeEnabled = false;
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

// Vérifier chaque module
for (const module of requiredModules) {
  try {
    if (['fs', 'path', 'child_process', 'readline', 'buffer', 'express', 'cors'].includes(module)) {
      require(module);
      console.log(`✅ ${module} - PRÉSENT (Node.js)`);
    } else {
      require.resolve(module);
      console.log(`✅ ${module} - PRÉSENT`);
    }
  } catch (error) {
    if (!['fs', 'path', 'child_process', 'readline', 'buffer', 'express', 'cors'].includes(module)) {
      missingModules.push(module);
      console.log(`❌ ${module} - MANQUANT`);
    }
  }
}

// Installation automatique si modules manquants
if (missingModules.length > 0) {
  console.log('\n📥 Installation automatique des modules manquants...');
  
  try {
    const { execSync } = require('child_process');
    const fs = require('fs');
    const path = require('path');
    
    const modulesToInstall = {
      '@whiskeysockets/baileys': '^6.5.0',
      'pino': '^8.19.0',
      'express': '^4.18.2',
      'cors': '^2.8.5'
    };
    
    console.log('📄 Création/MAJ package.json...');
    
    let packageJson = {
      name: 'hexgate-bot',
      version: '5.2.0',
      description: 'HEXGATE WhatsApp Bot',
      main: 'index.js',
      scripts: {
        start: 'node index.js',
        install: 'echo "Installation des dépendances..."'
      },
      dependencies: {}
    };
    
    if (fs.existsSync('package.json')) {
      try {
        const existing = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        packageJson = { ...packageJson, ...existing };
      } catch (e) {
        console.log('⚠️ package.json existant invalide, création nouveau');
      }
    }
    
    Object.keys(modulesToInstall).forEach(mod => {
      packageJson.dependencies[mod] = modulesToInstall[mod];
    });
    
    fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
    
    console.log('🚀 Installation via npm...');
    
    for (const module of missingModules) {
      if (modulesToInstall[module]) {
        console.log(`📦 Installation de ${module}@${modulesToInstall[module]}...`);
        try {
          execSync(`npm install ${module}@${modulesToInstall[module]}`, { 
            stdio: 'inherit',
            cwd: process.cwd()
          });
        } catch (installError) {
          console.log(`⚠️ Tentative alternative pour ${module}...`);
          try {
            execSync(`npm install ${module}`, { 
              stdio: 'pipe',
              cwd: process.cwd() 
            });
          } catch (e) {
            console.log(`❌ Échec installation ${module}: ${e.message}`);
          }
        }
      }
    }
    
    console.log('\n✅ Installation terminée !');
    console.log('🔄 Redémarrage dans 3 secondes...');
    
    setTimeout(() => {
      console.clear();
      console.log('🚀 REDÉMARRAGE DU BOT HEXGATE...\n');
      require('./index.js');
    }, 3000);
    
    return;
    
  } catch (error) {
    console.log('❌ Erreur installation automatique:', error.message);
    console.log('\n🛠️ INSTALLEZ MANUELLEMENT:');
    console.log('npm install @whiskeysockets/baileys@^6.5.0 pino@^8.19.0 express@^4.18.2 cors@^2.8.5');
    
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    rl.question('\nVoulez-vous essayer l\'installation manuelle? (o/n): ', (answer) => {
      if (answer.toLowerCase() === 'o') {
        console.log('Exécutez cette commande:');
        console.log('npm install @whiskeysockets/baileys@^6.5.0 pino@^8.19.0 express@^4.18.2 cors@^2.8.5');
      }
      rl.close();
      process.exit(1);
    });
    
    return;
  }
}

const {
  default: makeWASocket,
  useMultiFileAuthState,
  downloadContentFromMessage,
  DisconnectReason,
  fetchLatestBaileysVersion,
  Browsers,
  delay,
  getContentType
} = require("@whiskeysockets/baileys");

const { handleAntitag } = require('./commands/antitag');
const antiLinkWarnings = new Map();
const P = require("pino");
const fs = require("fs");
const path = require("path");
const readline = require("readline");
const { exec } = require("child_process");
const { Buffer } = require("buffer");
const express = require('express');
const cors = require('cors');

const OWNER = ["243816107573@s.whatsapp.net"];

function isOwner(sender) {
    return sender === "243816107573@s.whatsapp.net" || 
           sender.endsWith("243816107573@s.whatsapp.net");
}

// ============================================
// 📦 SYSTÈME MULTI-SESSIONS (4 SESSIONS)
// ============================================

const SESSIONS_DIR = './sessions';
const MAX_SESSIONS = 4;

// Créer le dossier des sessions s'il n'existe pas
if (!fs.existsSync(SESSIONS_DIR)) {
    fs.mkdirSync(SESSIONS_DIR, { recursive: true });
}

// État des sessions
let sessions = {
    active: [],
    pending: []
};

// Charger l'état des sessions
const SESSIONS_STATE_FILE = path.join(SESSIONS_DIR, 'sessions.json');
if (fs.existsSync(SESSIONS_STATE_FILE)) {
    try {
        sessions = JSON.parse(fs.readFileSync(SESSIONS_STATE_FILE, 'utf8'));
    } catch (e) {
        console.log('⚠️ Erreur chargement état sessions, création nouveau');
    }
}

// Sauvegarder l'état des sessions
function saveSessionsState() {
    fs.writeFileSync(SESSIONS_STATE_FILE, JSON.stringify(sessions, null, 2));
}

// ⚡ VARIABLES POUR L'API
let sock = null;
let botReady = false;
let pairingCodes = new Map();

// 📋 FONCTIONS POUR L'API
function isBotReady() {
  return botReady;
}

// ============================================
// 🚀 API EXPRESS POUR LE SITE WEB
// ============================================

const app = express();
const PORT = process.env.PORT || 3000;

// Créer le dossier public s'il n'existe pas
const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
}

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Route pour obtenir le statut
app.get('/api/status', (req, res) => {
    res.json({
        success: true,
        totalSessions: MAX_SESSIONS,
        activeSessions: sessions.active,
        pendingSessions: sessions.pending,
        available: MAX_SESSIONS - sessions.active.length
    });
});

// Route pour générer un code - VERSION CORRIGÉE avec 8 chiffres
app.post('/api/generate-code', async (req, res) => {
    const { phone } = req.body;
    
    if (!phone) {
        return res.status(400).json({
            success: false,
            error: 'Numéro de téléphone requis'
        });
    }
    
    // Nettoyer le numéro
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Validation simple
    if (cleanPhone.length < 10 || cleanPhone.length > 15) {
        return res.status(400).json({
            success: false,
            error: 'Format invalide. Le numéro doit contenir 10-15 chiffres'
        });
    }
    
    console.log(`🌐 Nouvelle demande de code pour: ${cleanPhone}`);
    
    const result = await generatePairCode(cleanPhone);
    res.json(result);
});

// Route pour obtenir les codes actifs
app.get('/api/codes', (req, res) => {
    const codes = Array.from(pairingCodes.entries()).map(([phone, data]) => ({
        phone,
        code: data.code,
        code8Digits: data.code8Digits, // Ajout du code à 8 chiffres
        expiresIn: Math.max(0, 300 - Math.floor((Date.now() - data.timestamp) / 1000))
    }));
    
    res.json({
        success: true,
        codes
    });
});

// Route pour obtenir la page HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Démarrer le serveur API
app.listen(PORT, () => {
    console.log(`🌐 API server running on port ${PORT}`);
    console.log(`📱 Site web: http://localhost:${PORT}`);
    console.log(`📊 API Status: http://localhost:${PORT}/api/status`);
    console.log(`✅ Support de TOUS les indicatifs (224, 237, 243, 1, etc.)`);
});

// Fonction pour trouver le bot dans les participants
function findBotParticipant(participants, botJid) {
  const possibleBotIds = [
    botJid,
    botJid.split(':')[0] + '@s.whatsapp.net',
    botJid.replace(/:\d+/, ''),
    botJid.split(':')[0] + ':' + botJid.split(':')[1],
    botJid.includes('@') ? botJid : botJid + '@s.whatsapp.net'
  ];
  
  return participants.find(p => 
    possibleBotIds.some(id => p.id === id || p.id.includes(id.split('@')[0]))
  );
}

// 🔴 FONCTION CORRIGÉE : Génère le code à 8 chiffres pour WhatsApp
async function generatePairCode(phone) {
  try {
    if (!sock) {
      console.log('❌ Bot non initialisé');
      return {
        success: false,
        error: 'Bot non initialisé'
      };
    }
    
    console.log(`👤 Génération pour l'utilisateur: ${phone}`);
    
    if (sessions.active.length >= MAX_SESSIONS) {
        return {
            success: false,
            error: 'Limite de sessions atteinte (4 maximum)'
        };
    }
    
    // ✅ ÉTAPE 1 : Baileys génère un code de 16 caractères
    const baileysCode = await sock.requestPairingCode(phone);
    console.log(`📦 Code Baileys brut (16 caractères): ${baileysCode}`);
    
    if (baileysCode) {
      // ✅ ÉTAPE 2 : Extraire les 8 PREMIERS caractères pour WhatsApp
      // WhatsApp utilise les 8 PREMIERS caractères du code Baileys comme code d'appairage
      const whatsappCode = baileysCode.substring(0, 8);
      
      // ✅ ÉTAPE 3 : Formater pour l'affichage (optionnel)
      const formattedCode = whatsappCode.match(/.{1,4}/g)?.join('-') || whatsappCode;
      
      console.log(`📱 Code WhatsApp (8 chiffres): ${whatsappCode}`);
      console.log(`📋 Code formaté pour affichage: ${formattedCode}`);
      
      // Stocker les deux versions
      pairingCodes.set(phone, {
        code: baileysCode,           // Code complet Baileys (16 caractères)
        code8Digits: whatsappCode,    // Code à 8 chiffres pour WhatsApp
        formattedCode: formattedCode, // Code formaté avec tirets
        timestamp: Date.now()
      });
      
      // Créer une session en attente
      const sessionId = `session${sessions.pending.length + 1}`;
      sessions.pending.push({
          sessionId,
          phone,
          code: whatsappCode, // Stocker le code à 8 chiffres
          formattedCode: formattedCode,
          generatedAt: Date.now()
      });
      
      saveSessionsState();
      
      // Nettoyer après 5 minutes
      setTimeout(() => {
        pairingCodes.delete(phone);
        sessions.pending = sessions.pending.filter(s => s.phone !== phone);
        saveSessionsState();
        console.log(`⏰ Code expiré pour ${phone}`);
      }, 300000);
      
      console.log(`✅ Code généré: ${whatsappCode} (8 chiffres) pour ${phone}`);
      
      return {
          success: true,
          sessionId,
          code: whatsappCode,        // Code à 8 chiffres pour WhatsApp
          formattedCode: formattedCode, // Code formaté avec tirets
          fullCode: baileysCode,     // Code complet (optionnel)
          expiresIn: 300,
          message: `Code: ${formattedCode} (8 chiffres)`
      };
    }
    
    return {
      success: false,
      error: 'Impossible de générer le code'
    };
  } catch (error) {
    console.log(`❌ Erreur: ${error.message}`);
    return {
        success: false,
        error: error.message
    };
  }
}

// 🌈 COULEURS POUR LE TERMINAL
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

// 📁 Dossiers
const VV_FOLDER = "./.VV";
const DELETED_MESSAGES_FOLDER = "./deleted_messages";
const COMMANDS_FOLDER = "./commands";
const VIEW_ONCE_FOLDER = "./viewOnce";
const DELETED_IMAGES_FOLDER = "./deleted_images";

[VV_FOLDER, DELETED_MESSAGES_FOLDER, COMMANDS_FOLDER, VIEW_ONCE_FOLDER, DELETED_IMAGES_FOLDER].forEach(folder => {
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder, { recursive: true });
    console.log(`${colors.green}✅ Dossier ${folder} créé${colors.reset}`);
  } else {
    console.log(`${colors.cyan}📁 Dossier ${folder} déjà existant${colors.reset}`);
  }
});

const randomEmojis = ["😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚", "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🤩", "🥳", "😏", "😒", "😞", "😔", "😟", "😕", "🙁", "☹️", "😣", "😖", "😫", "😩", "🥺", "😢", "😭", "😤", "😠", "😡", "🤬", "🤯", "😳", "🥵", "🥶", "😱", "😨", "😰", "😥", "😓", "🤗", "🤔", "🤭", "🤫", "🤥", "😶", "😐", "😑", "😬", "🙄", "😯", "😦", "😧", "😮", "😲", "🥱", "😴", "🤤", "😪", "😵", "🤐", "🥴", "🤢", "🤮", "🤧", "😷", "🤒", "🤕", "🤑", "🤠", "😈", "👿", "👹", "👺", "🤡", "💩", "👻", "💀", "☠️", "👽", "👾", "🤖", "🎃", "😺", "😸", "😹", "😻", "😼", "😽", "🙀", "😿", "😾"];

let processingMessages = new Set();
let isProcessing = false;
let lastDeletedMessage = new Map();
let antiLinkCooldown = new Map();
let botMessages = new Set();
let autoReact = true;

const messageStore = new Map();
const viewOnceStore = new Map();

// ============================================
// 🖼️ FONCTION DE FORMATAGE UNIFIÉE
// ============================================
async function sendFormattedMessage(sock, jid, messageText, pushName = 'Inconnu') {
  const formattedMessage = `┏━━❖ ＡＲＣＡＮＥ❖━━┓
┃ 🛡️ 𝐇𝐄𝐗✦𝐆Ａ𝐓Ｅ 𝑽_1
┃
┃ 👨‍💻 𝙳𝙴𝚅 : ${pushName}
┗━━━━━━━━━━━━━━━┛

┏━━【𝙷𝙴𝚇𝙶𝙰𝚃𝙴_𝐕1】━━┓
┃
┃ ${messageText}
┗━━━━━━━━━━━━━━━┛

 ┏━━【𝚃𝙴𝙻𝙴𝙶𝚁𝙰𝙼 】━━┓
┃
┃ ${telegramLink}
┃
┗━━━━━━━━━━━━━━━┛`;

  try {
    if (botImageUrl && botImageUrl.startsWith('http')) {
      const sentMsg = await sock.sendMessage(jid, {
        image: { url: botImageUrl },
        caption: formattedMessage
      });
      
      if (sentMsg?.key?.id) {
        botMessages.add(sentMsg.key.id);
        setTimeout(() => botMessages.delete(sentMsg.key.id), 300000);
      }
      return;
    }
  } catch (imageError) {
    console.log(`${colors.yellow}⚠️ Erreur avec l'image: ${imageError.message}${colors.reset}`);
  }

  try {
    const alternativeImage = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyERDdGHGjmXPv_6tCBIChmD-svWkJatQlpzfxY5WqFg&s";
    const sentMsg = await sock.sendMessage(jid, {
      image: { url: alternativeImage },
      caption: formattedMessage
    });
    
    if (sentMsg?.key?.id) {
      botMessages.add(sentMsg.key.id);
      setTimeout(() => botMessages.delete(sentMsg.key.id), 300000);
    }
  } catch (secondImageError) {
    console.log(`${colors.yellow}⚠️ Erreur image alternative, envoi texte: ${secondImageError.message}${colors.reset}`);
    
    const sentMsg = await sock.sendMessage(jid, { 
      text: formattedMessage 
    });
    
    if (sentMsg?.key?.id) {
      botMessages.add(sentMsg.key.id);
      setTimeout(() => botMessages.delete(sentMsg.key.id), 300000);
    }
  }
}

// ============================================
// 📦 SYSTÈME DE COMMANDES
// ============================================
class CommandHandler {
  constructor() {
    this.commands = new Map();
    this.commandsLoaded = false;
    this.initializeCommands();
  }

  initializeCommands() {
    try {
      console.log(`${colors.cyan}📁 Initialisation des commandes...${colors.reset}`);
      
      this.loadBuiltinCommands();
      this.loadCommandsFromDirectory();
      
      this.commandsLoaded = true;
      console.log(`${colors.green}✅ ${this.commands.size} commandes chargées avec succès${colors.reset}`);
      
    } catch (error) {
      this.commandsLoaded = false;
      console.log(`${colors.red}❌ Erreur chargement commandes: ${error.message}${colors.reset}`);
      console.log(`${colors.yellow}⚠️ Utilisation des commandes intégrées uniquement${colors.reset}`);
      
      this.loadBuiltinCommands();
      this.commandsLoaded = true;
    }
  }

  loadCommandsFromDirectory() {
    let count = 0;
    
    try {
      const commandsDir = path.join(__dirname, 'commands');
      
      if (!fs.existsSync(commandsDir)) {
        console.log(`${colors.yellow}⚠️ Dossier commands non trouvé${colors.reset}`);
        return count;
      }
      
      const items = fs.readdirSync(commandsDir, { withFileTypes: true });
      
      for (const item of items) {
        const fullPath = path.join(commandsDir, item.name);
        
        try {
          if (item.isDirectory()) {
            const subItems = fs.readdirSync(fullPath, { withFileTypes: true });
            for (const subItem of subItems) {
              if (subItem.isFile() && subItem.name.endsWith('.js')) {
                const subPath = path.join(fullPath, subItem.name);
                count += this.loadSingleCommand(subPath);
              }
            }
          } else if (item.isFile() && item.name.endsWith('.js')) {
            count += this.loadSingleCommand(fullPath);
          }
        } catch (error) {
          console.log(`${colors.yellow}⚠️ Erreur chargement ${item.name}: ${error.message}${colors.reset}`);
        }
      }
      
      return count;
      
    } catch (error) {
      console.log(`${colors.yellow}⚠️ Erreur scan dossier commands: ${error.message}${colors.reset}`);
      return count;
    }
  }

  loadSingleCommand(fullPath) {
    try {
      delete require.cache[require.resolve(fullPath)];
      const command = require(fullPath);
      
      if (command && command.name && typeof command.execute === 'function') {
        const commandName = command.name.toLowerCase();
        
        if (this.commands.has(commandName)) {
          console.log(`${colors.yellow}⚠️ Commande en doublon ignorée: ${commandName}${colors.reset}`);
          return 0;
        }
        
        this.commands.set(commandName, command);
        
        console.log(`${colors.green}✅ Commande chargée: ${colors.cyan}${command.name}${colors.reset}`);
        return 1;
      }
      return 0;
      
    } catch (requireError) {
      if (!requireError.message.includes('Cannot find module')) {
        console.log(`${colors.yellow}⚠️ Erreur chargement ${path.basename(fullPath)}: ${requireError.message}${colors.reset}`);
      }
      return 0;
    }
  }

  loadBuiltinCommands() {
    this.commands.set("setname", {
      name: "setname",
      description: "Change le nom du groupe",
      execute: async (sock, msg, args) => {
        const from = msg.key.remoteJid;

        if (!from.endsWith("@g.us")) {
          return sock.sendMessage(from, { text: "❌ Commande réservée aux groupes" });
        }

        const newName = args.join(" ");
        if (!newName) {
          return sock.sendMessage(from, {
            text: "❌ Utilisation : .setname <nouveau nom>"
          });
        }

        try {
          const metadata = await sock.groupMetadata(from);
          const participants = metadata.participants;
          const sender = msg.key.participant || msg.key.remoteJid;

          const isAdmin = participants.some(
            p => p.id === sender && (p.admin === "admin" || p.admin === "superadmin")
          );

          if (!isAdmin) {
            return sock.sendMessage(from, {
              text: "❌ Seuls les admins peuvent changer le nom du groupe"
            });
          }

          await sock.groupUpdateSubject(from, newName);
          await sock.sendMessage(from, {
            text: `✅ Nom du groupe changé en : *${newName}*`
          });

        } catch (err) {
          console.log("setname error:", err);
          await sock.sendMessage(from, {
            text: "❌ Erreur lors du changement de nom du groupe"
          });
        }
      }
    });

    this.commands.set("link", {
      name: "link",
      description: "Donne le lien d'invitation du groupe",
      execute: async (sock, msg, args) => {
        const from = msg.key.remoteJid;

        if (!from.endsWith("@g.us")) {
          return await sock.sendMessage(from, { text: "❌ Commande réservée aux groupes" });
        }

        try {
          const inviteCode = await sock.groupInviteCode(from);

          if (!inviteCode) {
            return await sock.sendMessage(from, {
              text: "❌ Impossible de récupérer le lien. Assurez-vous que le bot est admin."
            });
          }

          await sock.sendMessage(from, {
            text: `🔗 Lien du groupe :\nhttps://chat.whatsapp.com/${inviteCode}`
          });

        } catch (err) {
          console.log("link error:", err);
          await sock.sendMessage(from, { text: "❌ Erreur lors de la récupération du lien du groupe" });
        }
      }
    });

    this.commands.set("stealpp", {
      name: "stealpp",
      description: "Récupère la photo de profil d'un utilisateur",
      execute: async (sock, msg, args) => {
        const from = msg.key.remoteJid;

        try {
          let targetJid;

          if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length) {
            targetJid = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
          } else if (args[0]) {
            const num = args[0].replace(/\D/g, "");
            if (!num) {
              return sock.sendMessage(from, { text: "❌ Numéro invalide" });
            }
            targetJid = num + "@s.whatsapp.net";
          } else {
            targetJid = msg.key.participant || msg.key.remoteJid;
          }

          let ppUrl;
          try {
            ppUrl = await sock.profilePictureUrl(targetJid, "image");
          } catch {
            return sock.sendMessage(from, {
              text: "❌ Photo de profil privée ou indisponible"
            });
          }

          await sock.sendMessage(from, {
            image: { url: ppUrl },
            caption: `🕵️ *STEAL PP*\n\n👤 @${targetJid.split("@")[0]}`,
            mentions: [targetJid]
          });

        } catch (err) {
          console.log("stealpp error:", err);
          await sock.sendMessage(from, {
            text: "❌ Erreur lors de la récupération de la photo"
          });
        }
      }
    });

    this.commands.set("welcome", {
      name: "welcome",
      description: "Active ou désactive le message de bienvenue",
      execute: async (sock, msg, args) => {
        const from = msg.key.remoteJid;

        try {
          if (args[0] === "on") {
            welcomeEnabled = true;
            return await sock.sendMessage(from, { text: "✅ Messages de bienvenue activés" });
          } else if (args[0] === "off") {
            welcomeEnabled = false;
            return await sock.sendMessage(from, { text: "❌ Messages de bienvenue désactivés" });
          }

          if (!welcomeEnabled) {
            return await sock.sendMessage(from, {
              text: "❌ La fonctionnalité de bienvenue est désactivée. Tapez `.welcome on` pour l'activer."
            });
          }

          const mentions = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
          if (mentions.length === 0) {
            return await sock.sendMessage(from, {
              text: "❌ Veuillez mentionner la personne à accueillir\nExemple : .welcome @nom"
            });
          }

          const mentionJid = mentions[0];

          const text = `
┏━━━❖ ＡＲＣＡＮＥ❖━━━━┓
┃ @${mentionJid.split("@")[0]}
┃ 
┃ *BIENVENUE PAUVRE MORTEL*
┗━━━━━━━━━━━━━━━━━━┛
          `.trim();

          await sock.sendMessage(from, {
            image: { url: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRhoFTz9jVFxTVGAuh9RJIaNF0wH8WGvlOHM-q50RHZzg&s=10" },
            caption: text,
            mentions: [mentionJid]
          });

        } catch (err) {
          console.log("welcome command error:", err);
          await sock.sendMessage(from, { text: "❌ Une erreur est survenue" });
        }
      }
    });

    this.commands.set("autokick", {
      name: "autokick",
      description: "Active ou désactive l'autokick pour les nouveaux membres",
      execute: async (sock, msg, args) => {
        const from = msg.key.remoteJid;

        if (!from.endsWith("@g.us")) {
          return await sock.sendMessage(from, { text: "❌ Cette commande fonctionne uniquement dans les groupes" });
        }

        const option = args[0]?.toLowerCase();
        if (!option || !["on", "off"].includes(option)) {
          return await sock.sendMessage(from, { text: "❌ Usage : .autokick on/off" });
        }

        const configPath = path.join('./autokick.json');
        let config = {};
        if (fs.existsSync(configPath)) {
          config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        }
        config[from] = option === 'on';
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

        await sock.sendMessage(from, { text: `✅ Autokick ${option === 'on' ? 'activé' : 'désactivé'} pour ce groupe` });

        const metadata = await sock.groupMetadata(from);
        const knownMembers = new Set(metadata.participants.map(p => p.id));

        sock.ev.on('group-participants.update', async (update) => {
          if (update.id !== from) return;

          if (update.action === 'add') {
            for (const p of update.participants) {
              if (!knownMembers.has(p)) {
                knownMembers.add(p);

                if (config[from]) {
                  try {
                    await sock.groupParticipantsUpdate(from, [p], 'remove');
                    await sock.sendMessage(from, { text: `⚠️ Nouveau membre ${p.split('@')[0]} kické automatiquement` });
                  } catch (err) {
                    console.log("Erreur kick nouveau membre :", err);
                  }
                }
              }
            }
          }
        });
      }
    });

    this.commands.set("info", {
      name: "info",
      description: "Affiche les informations détaillées du groupe",
      execute: async (sock, msg, args) => {
        const from = msg.key.remoteJid;

        if (!from.endsWith("@g.us")) {
          return await sock.sendMessage(from, { text: "❌ Commande réservée aux groupes" });
        }

        try {
          const metadata = await sock.groupMetadata(from);
          const participants = metadata.participants || [];

          const total = participants.length;

          const admins = participants
            .filter(p => p.admin === "admin" || p.admin === "superadmin")
            .map(p => `@${p.id.split("@")[0]}`)
            .join(", ");

          const groupName = metadata.subject || "Groupe sans nom";
          const groupDesc = metadata.desc?.toString() || "Aucune description";
          const groupId = metadata.id;

          const infoText = `
┏━━━❖ ＧＲＯＵＰ ＩＮＦＯ ❖━━━┓
┃ Nom : ${groupName}
┃ ID : ${groupId}
┃ Membres : ${total}
┃ Admins : ${admins || "Aucun"}
┃ Description : ${groupDesc}
┗━━━━━━━━━━━━━━━━━━━━━━┛
*powered by HEXTECH*
          `.trim();

          await sock.sendMessage(from, {
            text: infoText,
            mentions: participants
              .filter(p => p.admin === "admin" || p.admin === "superadmin")
              .map(p => p.id)
          });

        } catch (err) {
          console.log("info error:", err);
          await sock.sendMessage(from, { text: "❌ Impossible de récupérer les infos du groupe" });
        }
      }
    });

    this.commands.set("update", {
      name: "update",
      description: "Redémarre le bot et recharge toutes les commandes",
      execute: async (sock, msg, args) => {
        const from = msg.key.remoteJid;
        const pushName = msg.pushName || 'Inconnu';

        await sendFormattedMessage(sock, from, "♻️ *Mise à jour en cours...*\n\n• Rechargement des commandes\n• Nettoyage de la mémoire\n• Redémarrage du bot\n\n⏳ Veuillez patienter...", pushName);

        await new Promise(r => setTimeout(r, 2000));
        console.log("🔄 UPDATE demandé, redémarrage du bot...");

        try {
          await sock.end();
        } catch (e) {}

        process.exit(0);
      }
    });

    this.commands.set("tag", {
      name: "tag",
      description: "Mentionne tout le monde avec ton texte",
      execute: async (sock, msg, args) => {
        const from = msg.key.remoteJid;
        const pushName = msg.pushName || 'Inconnu';

        if (!from.endsWith("@g.us")) {
          await sendFormattedMessage(sock, from, "❌ Commande utilisable uniquement dans un groupe", pushName);
          return;
        }

        const metadata = await sock.groupMetadata(from);
        const participants = metadata.participants || [];

        if (!args[0]) {
          await sendFormattedMessage(sock, from, "❌ Usage: .tag [texte]", pushName);
          return;
        }

        const text = args.join(" ");
        const mentions = participants.map(p => p.id);

        try {
          await sock.sendMessage(from, {
            text: text,
            mentions: mentions
          });
        } catch (error) {
          await sendFormattedMessage(sock, from, `❌ Erreur lors du tag: ${error.message}`, pushName);
        }
      }
    });

    this.commands.set("fakecall", {
      name: "fakecall",
      description: "Simule un appel WhatsApp entrant",
      execute: async (sock, msg, args) => {
        const from = msg.key.remoteJid;
        const pushName = msg.pushName || 'Inconnu';

        if (!args[0]) {
          return await sendFormattedMessage(
            sock,
            from,
            "❌ Usage : .fakecall @user\n\nExemple : .fakecall @243xxxxxxxx",
            pushName
          );
        }

        try {
          const target =
            msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] ||
            args[0].replace(/\D/g, "") + "@s.whatsapp.net";

          const time = new Date().toLocaleTimeString("fr-FR", {
            hour: "2-digit",
            minute: "2-digit"
          });

          const fakeCallMessage = {
            key: {
              remoteJid: from,
              fromMe: false,
              id: "FAKECALL-" + Date.now()
            },
            message: {
              callLogMesssage: {
                isVideo: false,
                callOutcome: "missed",
                durationSecs: 0,
                participants: [{ jid: target }]
              }
            }
          };

          await sock.sendMessage(from, {
            image: { url: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTZ1i7XIDDTRn01oToPCdQ4e5oCgZex2Iw1xg&s" },
            caption: `📞 *APPEL ENTRANT*\n\n👤 Cible : @${target.split("@")[0]}\n🕒 Heure : ${time}\n\n⏳ Connexion...`,
            mentions: [target]
          });

          await new Promise(r => setTimeout(r, 2000));

          await sock.relayMessage(from, fakeCallMessage.message, {
            messageId: fakeCallMessage.key.id
          });

        } catch (err) {
          console.log("fakecall error:", err);
          await sendFormattedMessage(sock, from, "❌ Erreur fakecall", pushName);
        }
      }
    });
   
    this.commands.set("tagadmin", {
      name: "tagadmin",
      description: "Mentionne tous les admins du groupe",
      execute: async (sock, msg, args) => {
        const from = msg.key.remoteJid;
        const pushName = msg.pushName || 'Inconnu';

        if (!from.endsWith("@g.us")) {
          return await sendFormattedMessage(sock, from, "❌ Cette commande fonctionne uniquement dans les groupes", pushName);
        }

        try {
          const metadata = await sock.groupMetadata(from);
          const participants = metadata.participants || [];

          const admins = participants.filter(p => p.admin === "admin" || p.admin === "superadmin");
          if (admins.length === 0) {
            return await sendFormattedMessage(sock, from, "❌ Aucun admin trouvé dans le groupe", pushName);
          }

          let text = `📣 Mention des admins :\n\n`;
          const mentions = [];

          for (const admin of admins) {
            const name = admin.notify || admin.id.split("@")[0];
            text += `➤ @${admin.id.split("@")[0]} (${name})\n`;
            mentions.push(admin.id);
          }

          text += `\n> Powered by HEXTECH`;

          await sock.sendMessage(from, { text, mentions });

        } catch (err) {
          console.log("tagadmin error:", err);
          await sendFormattedMessage(sock, from, "❌ Impossible de récupérer les admins", pushName);
        }
      },
    });

    this.commands.set("menu", {
      name: "menu",
      description: "Affiche le menu des commandes",
      execute: async (sock, msg, args) => {
        const from = msg.key.remoteJid;
        const pushName = msg.pushName || 'Inconnu';

        const menuText = `
┏━━❖ ＡＲＣＡＮＥ ❖━━┓
┃ 🛡️ HEX✦GATE V1
┃ 👨‍💻 Dev : T.me/hextechcar
┃ 
┗━━━━━━━━━━━━━━━━

  【 ${pushName}】
  
╭━━〔 𝙶𝚁𝙾𝚄𝙿𝙴 〕━━┈⊷
┃✰│➫ ${prefix}setname [nom]
┃✰│➫ ${prefix}link
┃✰│➫ ${prefix}tag [texte]
┃✰│➫ ${prefix}tagadmin
┃✰│➫ ${prefix}info
┃✰│➫ ${prefix}welcome on/off
┃✰│➫ ${prefix}autokick on/off
╰━━━━━━━━━━━━━━━┈⊷

╭━━〔 𝚄𝚃𝙸𝙻𝙸𝚃𝙰𝙸𝚁𝙴 〕━━┈⊷
┃✰│➫ ${prefix}ping
┃✰│➫ ${prefix}help
┃✰│➫ ${prefix}menu
┃✰│➫ ${prefix}stealpp
┃✰│➫ ${prefix}fakecall @user
┃✰│➫ ${prefix}update
╰━━━━━━━━━━━━━━━┈⊷
  
╭━━〔 𝙼𝙴𝙳𝙸𝙰 〕━━┈⊷
┃✰│➫ ${prefix}save
┃✰│➫ ${prefix}sticker
╰━━━━━━━━━━━━━━━┈⊷

╭━━〔 𝙲𝙰𝙽𝙰𝙻 𝚃𝙴𝙻𝙴𝙶𝚁𝙰𝙼 〕━━┈⊷
┃✰│➫ T.me/hextechcar
╰━━━━━━━━━━━━━━━┈⊷

  *powered by HEXTECH™*\n
`;

        try {
          await sock.sendMessage(from, {
            image: { url: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRv53_O-g3xpl_VtrctVQ0HbSUMCJ3fUkfx6l1SiUc64ag4ypnPyBR5k0s&s=10" },
            caption: menuText,
            contextInfo: {
              externalAdReply: {
                title: "HEX✦GATE V1",
                body: "Menu des commandes",
                thumbnail: null,
                mediaType: 1,
                mediaUrl: 'https://whatsapp.com/channel/0029Vb6qRMk4dTnLruvwbJ0Q',
                sourceUrl: 'https://whatsapp.com/channel/0029Vb6qRMk4dTnLruvwbJ0Q',
                showAdAttribution: false
              }
            }
          });

          try {
            const audioPath = './1000298450.mp3';
            
            if (fs.existsSync(audioPath)) {
              const stats = fs.statSync(audioPath);
              const fileSizeInMB = stats.size / (1024 * 1024);
              
              if (fileSizeInMB > 15) {
                console.log("⚠️ Audio trop volumineux:", fileSizeInMB.toFixed(2), "MB");
                await sock.sendMessage(from, {
                  text: "🔇 *Audio trop volumineux*\n\nLe fichier audio dépasse la limite WhatsApp (15MB maximum)."
                });
              } else {
                try {
                  await sock.sendMessage(from, {
                    audio: fs.readFileSync(audioPath),
                    mimetype: 'audio/mpeg',
                  });
                  console.log("✅ Audio envoyé avec succès");
                } catch (audioError) {
                  console.log("⚠️ Échec envoi audio:", audioError.message);
                }
              }
            }
          } catch (audioError) {
            console.error("❌ Erreur lors de l'envoi de l'audio:", audioError);
          }
          
        } catch (error) {
          console.error("❌ Erreur lors de l'envoi du menu:", error);
          await sock.sendMessage(from, { text: menuText });
        }
      }
    });
    
    this.commands.set("ping", {
      name: "ping",
      description: "Test de réponse du bot",
      execute: async (sock, msg, args) => {
        const from = msg.key.remoteJid;
        const pushName = msg.pushName || 'Inconnu';
        const start = Date.now();
        const latency = Date.now() - start;
        
        await sendFormattedMessage(sock, from, `🏓 *PONG!*\n\n📡 Latence: ${latency}ms\n🤖 HEXGATE V1 - En ligne!\n👤 Envoyé par: ${pushName}`, pushName);
      }
    });

    this.commands.set("help", {
      name: "help",
      description: "Affiche l'aide",
      execute: async (sock, msg, args) => {
        const from = msg.key.remoteJid;
        const pushName = msg.pushName || 'Inconnu';
        
        const helpText = `🛠️ *AIDE HEXGATE V3*\n\nPrefix: ${prefix}\n\nCommandes principales:\n• ${prefix}ping - Test du bot\n• ${prefix}menu - Menu complet\n• ${prefix}help - Cette aide\n• ${prefix}tag - Mention groupe\n\n👑 Propriétaire: ${config.ownerNumber}\n👤 Vous: ${pushName}`;
        
        await sendFormattedMessage(sock, from, helpText, pushName);
      }
    });

    console.log(`${colors.green}✅ Commandes intégrées chargées${colors.reset}`);
  }

  async execute(commandName, sock, msg, args, context) {
    const cmd = commandName.toLowerCase();
    
    if (!this.commands.has(cmd)) {
      console.log(`${colors.yellow}⚠️ Commande inconnue: ${cmd}${colors.reset}`);
      
      if (context?.botPublic) {
        try {
          await sendFormattedMessage(sock, msg.key.remoteJid, `❌ Commande "${cmd}" non reconnue. Tapez ${prefix}menu pour voir la liste des commandes.`, msg.pushName);
        } catch (error) {
          console.log(`${colors.yellow}⚠️ Impossible d'envoyer réponse${colors.reset}`);
        }
      }
      return false;
    }
    
    const command = this.commands.get(cmd);
    
    if (!command || typeof command.execute !== 'function') {
      console.log(`${colors.red}❌ Commande invalide: ${cmd}${colors.reset}`);
      return false;
    }
    
    try {
      console.log(`${colors.cyan}⚡ Exécution: ${cmd} par ${context?.sender || 'Inconnu'}${colors.reset}`);
      
      try {
        if (autoReact) {
          const randomEmoji = randomEmojis[Math.floor(Math.random() * randomEmojis.length)];
          await sock.sendMessage(msg.key.remoteJid, {
            react: { text: randomEmoji, key: msg.key }
          });
        }
      } catch (reactError) {}
      
      await command.execute(sock, msg, args, context);
      
      console.log(`${colors.green}✅ Commande exécutée avec succès: ${cmd}${colors.reset}`);
      return true;
      
    } catch (error) {
      console.log(`${colors.red}❌ Erreur exécution ${cmd}: ${error.message}${colors.reset}`);
      
      try {
        await sendFormattedMessage(sock, msg.key.remoteJid, `❌ *ERREUR D'EXÉCUTION*\n\nCommande: ${cmd}\nErreur: ${error.message}`, msg.pushName);
      } catch (sendError) {}
      
      return false;
    }
  }

  getCommandList() {
    return Array.from(this.commands.keys());
  }

  reloadCommands() {
    console.log(`${colors.cyan}🔄 Rechargement des commandes...${colors.reset}`);
    
    try {
      const currentCommands = new Map(this.commands);
      this.commands.clear();
      this.initializeCommands();
      
      if (this.commands.size === 0) {
        console.log(`${colors.yellow}⚠️ Rechargement échoué, restauration des commandes précédentes${colors.reset}`);
        this.commands = currentCommands;
      }
      
      console.log(`${colors.green}✅ ${this.commands.size} commandes rechargées${colors.reset}`);
    } catch (error) {
      console.log(`${colors.red}❌ Erreur rechargement commandes: ${error.message}${colors.reset}`);
    }
  }
}

global.activityTracker = global.activityTracker || new Map();

function trackActivity(msg) {
  const from = msg.key.remoteJid;
  const sender = msg.key.participant || msg.key.remoteJid;

  if (!from.endsWith("@g.us")) return;

  const groupData = global.activityTracker.get(from) || {};
  groupData[sender] = Date.now();
  global.activityTracker.set(from, groupData);
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

function displayBanner() {
  console.clear();
  console.log(`
${colors.magenta}╔══════════════════════════════════════════════════╗
║${colors.bright}${colors.cyan}         WHATSAPP BOT - HEXGATE EDITION          ${colors.reset}${colors.magenta}║
╠══════════════════════════════════════════════════╣
║${colors.green} ✅ BOT AVEC GESTION 4 SESSIONS                  ${colors.magenta}║
║${colors.green} ✅ API WEB POUR GÉNÉRATION DE CODES            ${colors.magenta}║
║${colors.green} ✅ CHARGEMENT DES COMMANDES                    ${colors.magenta}║
║${colors.green} ✅ CODES À 8 CHIFFRES POUR WHATSAPP            ${colors.magenta}║
╚══════════════════════════════════════════════════╝${colors.reset}
`);
}

// ============================================
// ⚡ FONCTION PRINCIPALE DU BOT
// ============================================
async function startBot() {
  try {
    displayBanner();
    
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

    // CONNEXION DU BOT PRINCIPAL
    sock.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect, qr } = update;
      
      if (qr) {
        console.log(`${colors.yellow}╔════════════════════════════════════╗${colors.reset}`);
        console.log(`${colors.yellow}║     CONNEXION DU BOT PRINCIPAL     ║${colors.reset}`);
        console.log(`${colors.yellow}╚════════════════════════════════════╝${colors.reset}`);
        console.log(`${colors.cyan}📱 Pour connecter le BOT PRINCIPAL :${colors.reset}`);
        console.log(`${colors.cyan}   1. Allez sur le site web: http://localhost:${PORT}${colors.reset}`);
        console.log(`${colors.cyan}   2. Entrez votre numéro${colors.reset}`);
        console.log(`${colors.cyan}   3. Utilisez le code généré${colors.reset}`);
      }
      
      if (connection === "close") {
        const reason = new Error(lastDisconnect?.error)?.output?.statusCode;
        if (reason === DisconnectReason.loggedOut) {
          console.log(`${colors.red}❌ Déconnecté, redémarrage...${colors.reset}`);
          setTimeout(() => process.exit(0), 3000);
        } else {
          console.log(`${colors.yellow}🔄 Reconnexion dans 5 secondes...${colors.reset}`);
          setTimeout(() => process.exit(0), 5000);
        }
      } else if (connection === "open") {
        console.log(`${colors.green}✅ Bot prêt à générer des codes !${colors.reset}`);
        console.log(`${colors.cyan}🌐 En attente de numéros sur: http://localhost:${PORT}${colors.reset}`);
        botReady = true;
      }
    });

    // Gestion des vues uniques
    try {
      const { saveViewOnce } = require("./viewonce/store");
      
      sock.ev.on("messages.upsert", async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message) return;

        const viewOnce = msg.message.viewOnceMessageV2 || msg.message.viewOnceMessageV2Extension;
        if (!viewOnce) return;

        const inner = viewOnce.message.imageMessage || viewOnce.message.videoMessage;
        if (!inner) return;

        try {
          const type = inner.mimetype.startsWith("image") ? "image" : "video";
          const stream = await downloadContentFromMessage(inner, type);
          let buffer = Buffer.from([]);

          for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
          }

          const filePath = path.join(VIEW_ONCE_FOLDER, `${msg.key.id}.${type === 'image' ? 'jpg' : 'mp4'}`);
          fs.writeFileSync(filePath, buffer);
          console.log("✅ Vue unique interceptée");
        } catch (e) {}
      });
    } catch (e) {}

    // Bienvenue automatique
    sock.ev.on("group-participants.update", async (update) => {
      try {
        if (!welcomeEnabled || update.action !== "add") return;
        const groupJid = update.id;
        const newMemberJid = update.participants[0];

        const text = `
┏━━━❖ ＡＲＣＡＮＥ❖━━━━┓
┃ @${newMemberJid.split("@")[0]}
┃ 
┃ 𝙱𝚒𝚎𝚗𝚟𝚎𝚗𝚞𝚎 ! 𝚙𝚊𝚞𝚟𝚛𝚎 𝚖𝚘𝚛𝚝𝚎𝚕
┗━━━━━━━━━━━━━━━━━━┛`.trim();

        await sock.sendMessage(groupJid, {
          image: { url: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRhoFTz9jVFxTVGAuh9RJIaNF0wH8WGvlOHM-q50RHZzg&s=10" },
          caption: text,
          mentions: [newMemberJid]
        });
      } catch (err) {}
    });

    // Fake recording
    sock.ev.on("messages.upsert", async ({ messages }) => {
      if (!fakeRecording) return;
      const msg = messages[0];
      if (!msg.message || msg.key.fromMe) return;
      try {
        await sock.sendPresenceUpdate('recording', msg.key.remoteJid);
        await delay(Math.floor(Math.random() * 2000) + 1000);
        await sock.sendPresenceUpdate('available', msg.key.remoteJid);
      } catch (recordingError) {}
    });

    // Traitement des messages
    sock.ev.on("messages.upsert", async ({ messages, type }) => {
      if (!["notify", "append"].includes(type)) return;

      for (const msg of messages) {
        try {
          if (!msg.message) continue;

          const senderJid = msg.key.participant || msg.key.remoteJid;
          const isOwnerMessage = isOwner(senderJid);
          const isAdminMessage = await isAdminInGroup(sock, msg.key.remoteJid, senderJid);
          
          trackActivity(msg);

          const messageType = Object.keys(msg.message)[0];
          if (messageType === "protocolMessage") continue;

          const from = msg.key.remoteJid;
          const sender = msg.key.participant || msg.key.remoteJid;
          const isGroup = from?.endsWith('@g.us');

          let body = "";
          if (messageType === "conversation") body = msg.message.conversation;
          else if (messageType === "extendedTextMessage") body = msg.message.extendedTextMessage.text;
          else if (messageType === "imageMessage") body = msg.message.imageMessage?.caption || "";
          else if (messageType === "videoMessage") body = msg.message.videoMessage?.caption || "";
          else if (messageType === "audioMessage") body = msg.message.audioMessage?.caption || "";
          else continue;

          // ANTI-LINK
          if (antiLink && body && isGroup) {
            const linkRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;
            const hasLink = linkRegex.test(body);
            
            if (hasLink && !isOwnerMessage && !isAdminMessage) {
              const warnings = antiLinkWarnings.get(sender) || 0;
              
              if (warnings < 2) {
                const newWarnings = warnings + 1;
                antiLinkWarnings.set(sender, newWarnings);
                
                await sock.sendMessage(from, {
                  text: `*⚠️ AVERTISSEMENT ${newWarnings}/3*\n@${sender.split('@')[0]} les liens sont interdits !`,
                  mentions: [sender]
                });
                
                try { await sock.sendMessage(from, { delete: msg.key }); } catch (deleteError) {}
              } else {
                try {
                  await sock.groupParticipantsUpdate(from, [sender], "remove");
                  await sock.sendMessage(from, {
                    text: `*🚨 SUPPRESSION*\n@${sender.split('@')[0]} a été supprimé du groupe`,
                    mentions: [sender]
                  });
                  antiLinkWarnings.delete(sender);
                } catch (removeError) {}
              }
              continue;
            }
          }

          // SAUVEGARDE DES MESSAGES
          const savedMsg = {
            key: msg.key,
            message: msg.message,
            pushName: msg.pushName || sender,
            timestamp: Date.now(),
            messageType: messageType
          };

          messageStore.set(msg.key.id, savedMsg);
          const filePath = path.join(DELETED_MESSAGES_FOLDER, `${msg.key.id}.json`);
          fs.writeFileSync(filePath, JSON.stringify(savedMsg, null, 2));

          if (messageType === 'imageMessage') {
            try {
              const imageMsg = msg.message.imageMessage;
              const stream = await downloadContentFromMessage(imageMsg, 'image');
              let buffer = Buffer.from([]);
              for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
              const imagePath = path.join(DELETED_IMAGES_FOLDER, `${msg.key.id}.jpg`);
              fs.writeFileSync(imagePath, buffer);
              savedMsg.imagePath = imagePath;
              fs.writeFileSync(filePath, JSON.stringify(savedMsg, null, 2));
            } catch (imageError) {}
          }

          // TRAITEMENT DES COMMANDES
          if (body.startsWith(prefix)) {
            const args = body.slice(prefix.length).trim().split(/ +/);
            const command = args.shift().toLowerCase();
            
            const context = {
              isOwner: isOwnerMessage,
              sender,
              prefix: prefix,
              botPublic: botPublic || isOwnerMessage
            };
            
            if (botPublic || isOwnerMessage) {
              await commandHandler.execute(command, sock, msg, args, context);
            }
            continue;
          }

          // COMMANDES PROPRIÉTAIRE
          if (isOwnerMessage) {
            if (body === prefix + "public") {
              botPublic = true;
              config.botPublic = true;
              fs.writeFileSync('./config.json', JSON.stringify(config, null, 2));
              await sendFormattedMessage(sock, OWNER_NUMBER, `✅ Mode PUBLIC activé`, 'Owner');
              continue;
            }
            
            if (body === prefix + "private") {
              botPublic = false;
              config.botPublic = false;
              fs.writeFileSync('./config.json', JSON.stringify(config, null, 2));
              await sendFormattedMessage(sock, OWNER_NUMBER, `🔒 Mode PRIVÉ activé`, 'Owner');
              continue;
            }
            
            if (body === prefix + "status") {
              await sendFormattedMessage(sock, OWNER_NUMBER, 
                `📊 *STATUS*\n\n🔓 Mode: ${botPublic ? 'Public' : 'Privé'}\n📊 Commandes: ${commandHandler.getCommandList().length}\n📱 Sessions: ${sessions.active.length}/${MAX_SESSIONS} actives\n🌐 Site: http://localhost:${PORT}`, 'Owner');
              continue;
            }
            
            if (body === prefix + "recording on") {
              fakeRecording = true;
              config.fakeRecording = true;
              fs.writeFileSync('./config.json', JSON.stringify(config, null, 2));
              await sendFormattedMessage(sock, OWNER_NUMBER, `🎤 Fake recording ACTIVÉ`, 'Owner');
              continue;
            }
            
            if (body === prefix + "recording off") {
              fakeRecording = false;
              config.fakeRecording = false;
              fs.writeFileSync('./config.json', JSON.stringify(config, null, 2));
              await sendFormattedMessage(sock, OWNER_NUMBER, `🎤 Fake recording DÉSACTIVÉ`, 'Owner');
              continue;
            }
          }
        } catch (error) {}
      }
    });

    console.log(`${colors.green}✅ Bot démarré avec succès sur Render !${colors.reset}`);
    console.log(`${colors.cyan}🌐 Site web: http://localhost:${PORT}${colors.reset}`);
    console.log(`${colors.yellow}⏳ En attente de numéros depuis le web...${colors.reset}`);

  } catch (error) {
    console.log(`${colors.red}❌ Erreur démarrage: ${error.message}${colors.reset}`);
  }
}

// ============================================
// 🚀 DÉMARRAGE
// ============================================
console.log(`${colors.magenta}🚀 Démarrage de HEXGATE V3 sur Render...${colors.reset}`);
startBot();

// ============================================
// 📦 EXPORTS POUR L'API
// ============================================
module.exports = {
  bot: sock,
  generatePairCode,
  isBotReady,
  config,
  sessions
};
