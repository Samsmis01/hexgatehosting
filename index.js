console.log('🚀 HEXGATE V3 - Démarrage avec interface web...');
console.log('📦 Version: @whiskeysockets/baileys');
console.log('🌐 Interface web sur port 10000');

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

// Vérification des modules
for (const module of requiredModules) {
  try {
    if (['fs', 'path', 'child_process', 'readline', 'buffer'].includes(module)) {
      require(module);
      console.log(`✅ ${module} - PRÉSENT (Node.js)`);
    } else {
      require.resolve(module);
      console.log(`✅ ${module} - PRÉSENT`);
    }
  } catch (error) {
    if (!['fs', 'path', 'child_process', 'readline', 'buffer'].includes(module)) {
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
      'express': '^4.18.0',
      'cors': '^2.8.5'
    };
    
    console.log('📄 Création package.json...');
    
    let packageJson = {
      name: 'hexgate-bot-web',
      version: '2.0.0',
      description: 'HEXGATE WhatsApp Bot avec interface web',
      main: 'index.js',
      scripts: {
        start: 'node index.js'
      },
      dependencies: {}
    };
    
    Object.keys(modulesToInstall).forEach(mod => {
      packageJson.dependencies[mod] = modulesToInstall[mod];
    });
    
    fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
    
    console.log('🚀 Installation via npm...');
    
    for (const module of missingModules) {
      if (modulesToInstall[module]) {
        console.log(`📦 Installation de ${module}...`);
        execSync(`npm install ${module}@${modulesToInstall[module]}`, { 
          stdio: 'inherit'
        });
      }
    }
    
    console.log('\n✅ Installation terminée !');
    console.log('🔄 Redémarrage dans 3 secondes...');
    
    setTimeout(() => {
      console.clear();
      console.log('🚀 REDÉMARRAGE DU BOT...\n');
      require('./index.js');
    }, 3000);
    
    return;
    
  } catch (error) {
    console.log('❌ Erreur installation:', error.message);
    console.log('\n🛠️ INSTALLEZ MANUELLEMENT:');
    console.log('npm install @whiskeysockets/baileys@^6.5.0 pino@^8.19.0 express@^4.18.0 cors@^2.8.5');
    process.exit(1);
  }
}

// Charger Express pour l'interface web
const express = require('express');
const cors = require('cors');

// ==================== CONFIGURATION ====================

// 📁 CHARGEMENT DE LA CONFIGURATION
let config = {};
const fs = require('fs');
const path = require('path');

try {
  if (fs.existsSync('./config.json')) {
    config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
    console.log('✅ Configuration chargée depuis config.json');
  } else {
    console.log('⚠️ config.json non trouvé, création avec valeurs par défaut...');
    config = {
      prefix: ".",
      ownerNumber: "243816107573",
      botPublic: true,
      fakeRecording: false,
      antiLink: true,
      alwaysOnline: true,
      logLevel: "silent",
      telegramLink: "https://t.me/hextechcar",
      botImageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyERDdGHGjmXPv_6tCBIChmD-svWkJatQlpzfxY5WqFg&s=10",
      maxSessions: 10,
      sessionTimeout: 300000 // 5 minutes
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
    botImageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyERDdGHGjmXPv_6tCBIChmD-svWkJatQlpzfxY5WqFg&s=10",
    maxSessions: 10,
    sessionTimeout: 300000
  };
}

// Variables globales
const prefix = config.prefix || ".";
let botPublic = config.botPublic || true;
let fakeRecording = config.fakeRecording || false;
const antiLink = config.antiLink || true;
const alwaysOnline = config.alwaysOnline || true;
const OWNER_NUMBER = `${config.ownerNumber.replace(/\D/g, '')}@s.whatsapp.net`;
const telegramLink = config.telegramLink || "https://t.me/hextechcar";
const botImageUrl = config.botImageUrl || "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyERDdGHGjmXPv_6tCBIChmD-svWkJatQlpzfxY5WqFg&s=10";
const logLevel = config.logLevel || "silent";
const MAX_SESSIONS = config.maxSessions || 10;
const SESSION_TIMEOUT = config.sessionTimeout || 300000;

console.log('📋 Configuration:');
console.log(`  • Prefix: ${prefix}`);
console.log(`  • Owner: ${OWNER_NUMBER}`);
console.log(`  • Mode: ${botPublic ? 'Public' : 'Privé'}`);
console.log(`  • Max sessions: ${MAX_SESSIONS}`);
console.log(`  • Session timeout: ${SESSION_TIMEOUT / 60000} minutes`);

// ==================== IMPORTS BAILEYS ====================

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
const { exec } = require("child_process");
const { Buffer } = require("buffer");

// ==================== VARIABLES GLOBALES ====================

let sock = null;
let botReady = false;
let pairingCodes = new Map();
let activeSessions = new Map();
let messageStore = new Map();
let viewOnceStore = new Map();
let processingMessages = new Set();
let antiLinkWarnings = new Map();
let antiLinkCooldown = new Map();
let botMessages = new Set();
let autoReact = true;
let welcomeEnabled = false;

// Variables pour la sauvegarde des messages
const VV_FOLDER = "./.VV";
const DELETED_MESSAGES_FOLDER = "./deleted_messages";
const COMMANDS_FOLDER = "./commands";
const VIEW_ONCE_FOLDER = "./viewOnce";
const DELETED_IMAGES_FOLDER = "./deleted_images";

// Vérification des dossiers
[VV_FOLDER, DELETED_MESSAGES_FOLDER, COMMANDS_FOLDER, VIEW_ONCE_FOLDER, DELETED_IMAGES_FOLDER].forEach(folder => {
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder, { recursive: true });
    console.log(`✅ Dossier ${folder} créé`);
  } else {
    console.log(`📁 Dossier ${folder} déjà existant`);
  }
});

// ==================== API WEB ====================

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('.')); // Servir les fichiers statiques

// Port pour Render (10000 par défaut)
const PORT = process.env.PORT || 10000;

// Route pour servir index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// API: Statut du bot
app.get('/api/bot-status', (req, res) => {
  res.json({
    ready: botReady,
    sessions: activeSessions.size,
    maxSessions: MAX_SESSIONS,
    uptime: process.uptime(),
    timestamp: Date.now()
  });
});

// API: Générer un code pair
app.post('/api/generate-pair-code', async (req, res) => {
  try {
    const { phone } = req.body;
    
    if (!phone) {
      return res.status(400).json({ 
        success: false, 
        error: 'Numéro requis' 
      });
    }

    // Vérifier le format du numéro
    const cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone.startsWith('243')) {
      return res.status(400).json({ 
        success: false, 
        error: 'Format invalide. Utilisez 243XXXXXXXXX' 
      });
    }

    // Vérifier la limite de sessions
    if (activeSessions.size >= MAX_SESSIONS) {
      return res.status(429).json({ 
        success: false, 
        error: `Limite de ${MAX_SESSIONS} sessions atteinte` 
      });
    }

    // Vérifier si une session existe déjà pour ce numéro
    if (activeSessions.has(cleanPhone)) {
      const session = activeSessions.get(cleanPhone);
      if (Date.now() - session.timestamp < SESSION_TIMEOUT) {
        return res.json({ 
          success: true, 
          code: session.code,
          expiresIn: Math.round((SESSION_TIMEOUT - (Date.now() - session.timestamp)) / 1000)
        });
      } else {
        // Supprimer la session expirée
        activeSessions.delete(cleanPhone);
      }
    }

    // Générer le code
    if (!sock || !botReady) {
      return res.status(503).json({ 
        success: false, 
        error: 'Bot non connecté' 
      });
    }

    console.log(`📱 Génération pair code pour: ${cleanPhone}`);
    
    const code = await sock.requestPairingCode(cleanPhone);
    
    if (!code) {
      return res.status(500).json({ 
        success: false, 
        error: 'Échec de génération du code' 
      });
    }

    // Enregistrer la session
    activeSessions.set(cleanPhone, {
      code: code,
      timestamp: Date.now(),
      phone: cleanPhone
    });

    // Nettoyer après timeout
    setTimeout(() => {
      if (activeSessions.has(cleanPhone)) {
        activeSessions.delete(cleanPhone);
        console.log(`🗑️ Session expirée pour: ${cleanPhone}`);
      }
    }, SESSION_TIMEOUT);

    console.log(`✅ Pair code généré: ${code} pour ${cleanPhone}`);
    
    res.json({ 
      success: true, 
      code: code,
      expiresIn: SESSION_TIMEOUT / 1000
    });

  } catch (error) {
    console.error('❌ Erreur API:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Erreur interne' 
    });
  }
});

// API: Liste des sessions actives (admin)
app.get('/api/sessions', (req, res) => {
  const sessions = Array.from(activeSessions.entries()).map(([phone, data]) => ({
    phone,
    code: data.code,
    created: new Date(data.timestamp).toISOString(),
    expiresIn: Math.round((SESSION_TIMEOUT - (Date.now() - data.timestamp)) / 1000),
    expiresAt: new Date(data.timestamp + SESSION_TIMEOUT).toISOString()
  }));
  
  res.json({
    total: sessions.length,
    max: MAX_SESSIONS,
    sessions: sessions
  });
});

// Démarrer le serveur web
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🌐 Interface web démarrée sur http://0.0.0.0:${PORT}`);
});

// ==================== FONCTIONS UTILITAIRES ====================

// Fonction pour vérifier si l'expéditeur est propriétaire
function isOwner(sender) {
  return sender === OWNER_NUMBER || sender.endsWith(OWNER_NUMBER);
}

// Fonction pour vérifier si admin dans un groupe
async function isAdminInGroup(sock, jid, senderJid) {
  try {
    if (!jid.endsWith("@g.us")) return false;
    
    const metadata = await sock.groupMetadata(jid);
    const participant = metadata.participants.find(p => p.id === senderJid);
    
    if (!participant) return false;
    
    return participant.admin === "admin" || participant.admin === "superadmin";
  } catch (error) {
    console.log(`⚠️ Erreur vérification admin: ${error.message}`);
    return false;
  }
}

// Fonction pour envoyer des messages formatés
async function sendFormattedMessage(sock, jid, messageText) {
  const formattedMessage = `┏━━❖ ＡＲＣＡＮＥ❖━━┓
┃ 🛡️ 𝐇𝐄𝐗✦𝐆Ａ𝐓Ｅ 𝑽_1
┃
┃ 👨‍💻 𝙳𝙴𝚅 : HEX-TECH
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
      return sentMsg;
    } else {
      const sentMsg = await sock.sendMessage(jid, { 
        text: formattedMessage 
      });
      return sentMsg;
    }
  } catch (error) {
    console.log(`❌ Échec envoi message: ${error.message}`);
    try {
      await sock.sendMessage(jid, { 
        text: messageText 
      });
    } catch (finalError) {
      console.log(`❌ Échec complet: ${finalError.message}`);
    }
  }
}

// ==================== HANDLER DE COMMANDES ====================

class CommandHandler {
  constructor() {
    this.commands = new Map();
    this.commandsLoaded = false;
    this.initializeCommands();
  }

  initializeCommands() {
    try {
      console.log('📁 Initialisation des commandes...');
      
      // Charger les commandes intégrées
      this.loadBuiltinCommands();
      
      // Charger depuis le dossier commands
      this.loadCommandsFromDirectory();
      
      this.commandsLoaded = true;
      console.log(`✅ ${this.commands.size} commandes chargées`);
      
      console.log('📋 Commandes disponibles:');
      this.commands.forEach((cmd, name) => {
        console.log(`  • ${name} - ${cmd.description || 'Pas de description'}`);
      });
      
    } catch (error) {
      console.log(`❌ Erreur chargement commandes: ${error.message}`);
      this.loadBuiltinCommands();
      this.commandsLoaded = true;
    }
  }

  loadCommandsFromDirectory() {
    let count = 0;
    
    try {
      const commandsDir = path.join(__dirname, 'commands');
      
      if (!fs.existsSync(commandsDir)) {
        console.log('⚠️ Dossier commands non trouvé');
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
          console.log(`⚠️ Erreur chargement ${item.name}: ${error.message}`);
        }
      }
      
      return count;
      
    } catch (error) {
      console.log(`⚠️ Erreur scan dossier commands: ${error.message}`);
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
          console.log(`⚠️ Commande en doublon ignorée: ${commandName}`);
          return 0;
        }
        
        this.commands.set(commandName, command);
        
        const relativePath = path.relative(process.cwd(), fullPath);
        console.log(`✅ Commande chargée: ${command.name} (${relativePath})`);
        return 1;
      } else {
        console.log(`⚠️ Format invalide: ${path.basename(fullPath)}`);
        return 0;
      }
      
    } catch (requireError) {
      if (!requireError.message.includes('Cannot find module')) {
        console.log(`⚠️ Erreur chargement ${path.basename(fullPath)}: ${requireError.message}`);
      }
      return 0;
    }
  }

  loadBuiltinCommands() {
    // Commande menu
    this.commands.set("menu", {
      name: "menu",
      description: "Affiche le menu des commandes",
      execute: async (sock, msg, args, context) => {
        const from = msg.key.remoteJid;
        const currentPrefix = context?.prefix || prefix;

        const menuText = `
┏━━❖ ＡＲＣＡＮＥ ❖━━┓
┃ 🛡️ HEX✦GATE V2
┃ 👨‍💻 Dev : T.me/hextechcar
┃ 
┗━━━━━━━━━━━━━━━━

╭━━〔 𝚄𝚃𝙸𝙻𝙸𝚃𝙰𝙸𝚁𝙴 〕━━┈⊷
┃✰│➫ ${prefix}𝚖𝚎𝚗𝚞
┃✰│➫ ${prefix}𝚑𝚎𝚕𝚙
┃✰│➫ ${prefix}𝚜𝚝𝚊𝚝𝚞𝚜
┃✰│➫ ${prefix}𝚒𝚗𝚏𝚘
╰━━━━━━━━━━━━━━━┈⊷

╭━━〔 𝙶𝚁𝙾𝚄𝙿𝙴 〕━━┈⊷
┃✰│➫ ${prefix}𝚕𝚒𝚗𝚔
┃✰│➫ ${prefix}𝚝𝚊𝚐𝚊𝚕𝚕
┃✰│➫ ${prefix}𝚝𝚊𝚐𝚊𝚍𝚖𝚒𝚗
┃✰│➫ ${prefix}𝚠𝚎𝚕𝚌𝚘𝚖𝚎 𝚘𝚗/𝚘𝚏𝚏
╰━━━━━━━━━━━━━━━┈⊷

╭━━〔 𝙲𝙰𝙽𝙰𝙻 𝚃𝙴𝙻𝙴𝙶𝚁𝙰𝙼 〕━━┈⊷
┃✰│➫ T.me/hextechcar
╰━━━━━━━━━━━━━━━┈⊷

*powered by HEXTECH™*`;

        try {
          await sock.sendMessage(from, {
            image: { url: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRv53_O-g3xpl_VtrctVQ0HbSUMCJ3fUkfx6l1SiUc64ag4ypnPyBR5k0s&s=10" },
            caption: menuText
          });
        } catch (error) {
          await sock.sendMessage(from, { text: menuText });
        }
      }
    });

    // Commande help
    this.commands.set("help", {
      name: "help",
      description: "Affiche l'aide",
      execute: async (sock, msg, args, context) => {
        const from = msg.key.remoteJid;
        const currentPrefix = context?.prefix || prefix;
        
        const helpText = `🛠️ *AIDE HEXGATE*\n\nPrefix: ${currentPrefix}\n\nUtilisez ${currentPrefix}menu pour voir toutes les commandes.\n\n👑 Propriétaire: ${config.ownerNumber}\n👤 Vous: ${context?.sender || 'Inconnu'}`;
        
        await sendFormattedMessage(sock, from, helpText);
      }
    });

    // Commande status
    this.commands.set("status", {
      name: "status",
      description: "Affiche le statut du bot",
      execute: async (sock, msg, args, context) => {
        const from = msg.key.remoteJid;
        
        const statusText = `📊 *STATUS DU BOT*\n\n🏷️ Nom: HEXGATE V2\n🔓 Mode: ${botPublic ? 'Public' : 'Privé'}\n🎤 Fake Recording: ${fakeRecording ? 'ACTIVÉ' : 'DÉSACTIVÉ'}\n💾 Sessions actives: ${activeSessions.size}/${MAX_SESSIONS}\n🖼️ Images sauvegardées: ${fs.readdirSync(DELETED_IMAGES_FOLDER).length}\n⏰ Uptime: ${process.uptime().toFixed(0)}s\n🌐 Interface web: Port ${PORT}`;
        
        await sendFormattedMessage(sock, from, statusText);
      }
    });

    // Commande info
    this.commands.set("info", {
      name: "info",
      description: "Affiche les informations du groupe",
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

          const infoText = `
┏━━━❖ ＧＲＯＵＰ ＩＮＦＯ ❖━━━┓
┃ Nom : ${groupName}
┃ Membres : ${total}
┃ Admins : ${admins || "Aucun"}
┃ Description : ${groupDesc}
┗━━━━━━━━━━━━━━━━━━━━━━┛
*powered by HEXTECH*`;

          await sock.sendMessage(from, {
            text: infoText,
            mentions: participants
              .filter(p => p.admin === "admin" || p.admin === "superadmin")
              .map(p => p.id)
          });

        } catch (err) {
          console.log("info error:", err);
          await sock.sendMessage(from, { text: "❌ Impossible de récupérer les infos" });
        }
      }
    });

    // Commande link
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
              text: "❌ Impossible de récupérer le lien."
            });
          }

          await sock.sendMessage(from, {
            text: `🔗 Lien du groupe :\nhttps://chat.whatsapp.com/${inviteCode}`
          });

        } catch (err) {
          console.log("link error:", err);
          await sock.sendMessage(from, { text: "❌ Erreur lors de la récupération du lien" });
        }
      }
    });

    // Commande tagall
    this.commands.set("tagall", {
      name: "tagall",
      description: "Mentionne tout le monde",
      execute: async (sock, msg, args, context) => {
        const from = msg.key.remoteJid;

        if (!from.endsWith("@g.us")) {
          await sock.sendMessage(from, { text: "❌ Commande réservée aux groupes" });
          return;
        }

        const metadata = await sock.groupMetadata(from);
        const participants = metadata.participants || [];

        const text = args.join(" ") || "📢 Notification à tous !";

        const mentions = participants.map(p => p.id);

        try {
          await sock.sendMessage(from, {
            text: text,
            mentions: mentions
          });
        } catch (error) {
          await sock.sendMessage(from, { text: `❌ Erreur: ${error.message}` });
        }
      }
    });

    // Commande tagadmin
    this.commands.set("tagadmin", {
      name: "tagadmin",
      description: "Mentionne tous les admins",
      execute: async (sock, msg, args, context) => {
        const from = msg.key.remoteJid;

        if (!from.endsWith("@g.us")) {
          return await sock.sendMessage(from, { text: "❌ Commande réservée aux groupes" });
        }

        try {
          const metadata = await sock.groupMetadata(from);
          const participants = metadata.participants || [];

          const admins = participants.filter(p => p.admin === "admin" || p.admin === "superadmin");
          if (admins.length === 0) {
            return await sock.sendMessage(from, { text: "❌ Aucun admin trouvé" });
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
          await sock.sendMessage(from, { text: "❌ Impossible de récupérer les admins" });
        }
      }
    });

    // Commande welcome
    this.commands.set("welcome", {
      name: "welcome",
      description: "Active/désactive les messages de bienvenue",
      execute: async (sock, msg, args) => {
        const from = msg.key.remoteJid;

        try {
          if (args[0] === "on") {
            welcomeEnabled = true;
            return await sock.sendMessage(from, { text: "✅ Messages de bienvenue activés" });
          } else if (args[0] === "off") {
            welcomeEnabled = false;
            return await sock.sendMessage(from, { text: "❌ Messages de bienvenue désactivés" });
          } else {
            return await sock.sendMessage(from, {
              text: "❌ Usage : .welcome on/off"
            });
          }
        } catch (err) {
          console.log("welcome error:", err);
          await sock.sendMessage(from, { text: "❌ Erreur" });
        }
      }
    });

    console.log(`✅ Commandes intégrées chargées`);
  }

  async execute(commandName, sock, msg, args, context) {
    const cmd = commandName.toLowerCase();
    
    if (!this.commands.has(cmd)) {
      console.log(`⚠️ Commande inconnue: ${cmd}`);
      
      if (context?.botPublic) {
        try {
          await sock.sendMessage(msg.key.remoteJid, { 
            text: `❌ Commande "${cmd}" non reconnue. Tapez ${context?.prefix || prefix}menu` 
          });
        } catch (error) {
          console.log(`⚠️ Impossible d'envoyer réponse`);
        }
      }
      return false;
    }
    
    const command = this.commands.get(cmd);
    
    if (!command || typeof command.execute !== 'function') {
      console.log(`❌ Commande invalide: ${cmd}`);
      return false;
    }
    
    try {
      console.log(`⚡ Exécution: ${cmd} par ${context?.sender || 'Inconnu'}`);
      
      await command.execute(sock, msg, args, context);
      
      console.log(`✅ Commande exécutée: ${cmd}`);
      return true;
      
    } catch (error) {
      console.log(`❌ Erreur exécution ${cmd}: ${error.message}`);
      
      try {
        await sock.sendMessage(msg.key.remoteJid, { 
          text: `❌ Erreur d'exécution\nCommande: ${cmd}\nErreur: ${error.message}` 
        });
      } catch (sendError) {
        console.log(`⚠️ Impossible d'envoyer message d'erreur`);
      }
      
      return false;
    }
  }

  getCommandList() {
    return Array.from(this.commands.keys());
  }
}

// ==================== DÉMARRAGE DU BOT ====================

async function startBot() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  async function askForPhoneNumber() {
    return new Promise((resolve) => {
      rl.question(`
╔══════════════════════════╗
║        HEX-TECH - V2          ║
║  ──────────────────────  ║
║  📱 INSÉREZ VOTRE NUMÉRO WHATSAPP :            ║
║                                              ║
╚══════════════════════════╝
`, (phone) => {
        resolve(phone.trim());
      });
    });
  }

  try {
    console.log(`
╔══════════════════════════════════════════════════╗
║         WHATSAPP BOT - HEXGATE EDITION          ║
╠══════════════════════════════════════════════════╣
║ ✅ BOT EN MODE PUBLIC - TOUS ACCÈS AUTORISÉS║
║ ✅ INTERFACE WEB SUR PORT ${PORT}                  ║
║ ✅ MAX ${MAX_SESSIONS} SESSIONS SIMULTANÉES           ║
║ ✅ RESTAURATION MESSAGES & IMAGES              ║
╚══════════════════════════════════════════════════╝
`);
    
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
        const phoneNumber = await askForPhoneNumber();
        if (!phoneNumber || phoneNumber.length < 9) {
          console.log(`❌ Numéro invalide`);
          process.exit(1);
        }

        try {
          const code = await sock.requestPairingCode(phoneNumber);
          console.log(`✅ Code de pairing: ${code}`);
          console.log(`📱 Appuyez sur les trois points > Périphériques liés > Ajouter un périphérique`);
          await delay(3000);
        } catch (pairError) {
          console.log(`❌ Erreur pairing: ${pairError.message}`);
          process.exit(1);
        }
      }
      
      if (connection === "close") {
        const reason = new Error(lastDisconnect?.error)?.output?.statusCode;
        if (reason === DisconnectReason.loggedOut) {
          console.log(`❌ Déconnecté, suppression des données...`);
          exec("rm -rf auth_info_baileys", () => {
            console.log(`🔄 Redémarrage...`);
            startBot();
          });
        } else {
          console.log(`🔄 Reconnexion...`);
          startBot();
        }
      } else if (connection === "open") {
        console.log(`✅ Connecté à WhatsApp!`);
        console.log(`🔓 Mode: ${botPublic ? 'PUBLIC' : 'PRIVÉ'}`);
        console.log(`🎤 Fake Recording: ${fakeRecording ? 'ACTIVÉ' : 'DÉSACTIVÉ'}`);
        console.log(`🌐 Interface web: http://0.0.0.0:${PORT}`);
        
        // 🔴 CONFIRMATION DE CONNEXION AU PROPRIÉTAIRE
        try {
          const confirmMessage = `✅ *HEX-GATE CONNECTEE*\n\n🚀 *HEXGATE V2* est en ligne!\n📊 *Commandes:* ${commandHandler.getCommandList().length}\n🔧 *Mode:* ${botPublic ? 'PUBLIC' : 'Privé'}\n🌐 *Interface web:* Port ${PORT}\n👥 *Sessions:* ${activeSessions.size}/${MAX_SESSIONS}\n🔓 *systeme:* tapez menu`;
          
          await sock.sendMessage(OWNER_NUMBER, { text: confirmMessage });
          console.log(`✅ Confirmation envoyée au propriétaire: ${OWNER_NUMBER}`);
        } catch (error) {
          console.log(`⚠️ Impossible d'envoyer message au propriétaire: ${error.message}`);
        }
        
        botReady = true;
      }
    });

    // Gestion des messages supprimés
    sock.ev.on("messages.upsert", async ({ messages }) => {
      try {
        for (const msg of messages) {
          if (!msg.message) continue;

          const senderJid = msg.key.participant || msg.key.remoteJid;
          const isOwnerMsg = isOwner(senderJid);
          
          // Détection des messages supprimés
          if (msg.message?.protocolMessage?.type === 0) {
            const deletedKey = msg.message.protocolMessage.key;
            const deletedId = deletedKey.id;
            const chatId = deletedKey.remoteJid || msg.key.remoteJid;
            const isPrivateChat = chatId?.endsWith('@s.whatsapp.net');
            
            console.log(`🚨 SUPPRESSION DÉTECTÉE: ${deletedId} dans ${chatId}`);

            if (isPrivateChat) {
              let originalMsg = messageStore.get(deletedId);
              
              if (!originalMsg) {
                const filePath = path.join(DELETED_MESSAGES_FOLDER, `${deletedId}.json`);
                if (fs.existsSync(filePath)) {
                  try {
                    originalMsg = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                  } catch (parseError) {
                    originalMsg = null;
                  }
                }
              }

              if (originalMsg) {
                const originalMessageType = originalMsg.messageType || Object.keys(originalMsg.message)[0];
                const senderNumber = originalMsg.key?.participant || originalMsg.key?.remoteJid;

                if (originalMessageType === 'imageMessage') {
                  try {
                    let imageBuffer = null;
                    let caption = originalMsg.message?.imageMessage?.caption || "";
                    
                    const imagePath = path.join(DELETED_IMAGES_FOLDER, `${deletedId}.jpg`);
                    if (fs.existsSync(imagePath)) {
                      imageBuffer = fs.readFileSync(imagePath);
                    }
                    
                    if (imageBuffer) {
                      await sock.sendMessage(OWNER_NUMBER, {
                        image: imageBuffer,
                        caption: `*𝙼𝚎𝚜𝚜𝚊𝚐𝚎 𝚜𝚞𝚙𝚙𝚛𝚒𝚖𝚎𝚛 𝚍𝚎:* @${senderNumber.split('@')[0]}\n\n${caption || "[Image sans description]"}\n\n> 𝚙𝚘𝚠𝚎𝚛𝚎𝚍 𝚋𝚢 𝙷𝙴𝚇𝚃𝙴𝙲𝙷`,
                        mentions: [senderNumber]
                      });
                    }
                    
                  } catch (imageError) {
                    console.log(`❌ Erreur restauration image: ${imageError.message}`);
                  }
                }
                
                // Nettoyer les fichiers
                messageStore.delete(deletedId);
                const filePath = path.join(DELETED_MESSAGES_FOLDER, `${deletedId}.json`);
                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                
                const imagePath = path.join(DELETED_IMAGES_FOLDER, `${deletedId}.jpg`);
                if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
              }
            }
            continue;
          }

          // Sauvegarde des messages
          const messageType = Object.keys(msg.message)[0];
          if (messageType === "protocolMessage") continue;

          const from = msg.key.remoteJid;
          const sender = msg.key.participant || msg.key.remoteJid;
          const isGroup = from?.endsWith('@g.us');

          if (!msg.key.fromMe && !isGroup) {
            console.log(`📥 Message privé de ${sender}`);
          }

          let body = "";
          if (messageType === "conversation") {
            body = msg.message.conversation;
          } else if (messageType === "extendedTextMessage") {
            body = msg.message.extendedTextMessage.text;
          } else if (messageType === "imageMessage") {
            body = msg.message.imageMessage?.caption || "";
          } else if (messageType === "videoMessage") {
            body = msg.message.videoMessage?.caption || "";
          } else {
            continue;
          }

          // Anti-lien dans les groupes
          if (antiLink && body && isGroup) {
            const linkRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;
            const hasLink = linkRegex.test(body);
            
            if (hasLink && !isOwnerMsg) {
              console.log(`🚫 LIEN DÉTECTÉ par ${sender}`);
              
              const warnings = antiLinkWarnings.get(sender) || 0;
              
              if (warnings < 2) {
                const newWarnings = warnings + 1;
                antiLinkWarnings.set(sender, newWarnings);
                
                await sock.sendMessage(from, {
                  text: `*⚠️ AVERTISSEMENT ${newWarnings}/3*\n@${sender.split('@')[0]} les liens sont interdits !`,
                  mentions: [sender]
                });
                
                try {
                  await sock.sendMessage(from, {
                    delete: msg.key
                  });
                } catch (deleteError) {}
              } else {
                try {
                  await sock.groupParticipantsUpdate(from, [sender], "remove");
                  await sock.sendMessage(from, {
                    text: `*🚨 SUPPRESSION*\n@${sender.split('@')[0]} supprimé pour 3 liens !`,
                    mentions: [sender]
                  });
                  antiLinkWarnings.delete(sender);
                } catch (removeError) {}
              }
              continue;
            }
          }

          // Sauvegarde du message
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
              
              for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
              }
              
              const imagePath = path.join(DELETED_IMAGES_FOLDER, `${msg.key.id}.jpg`);
              fs.writeFileSync(imagePath, buffer);
              
              savedMsg.imagePath = imagePath;
              fs.writeFileSync(filePath, JSON.stringify(savedMsg, null, 2));
              
            } catch (imageError) {
              console.log(`⚠️ Erreur sauvegarde image: ${imageError.message}`);
            }
          }

          // Traitement des commandes
          if (body.startsWith(prefix)) {
            const args = body.slice(prefix.length).trim().split(/ +/);
            const command = args.shift().toLowerCase();
            
            console.log(`🎯 Commande: ${command} par ${sender}`);
            
            const context = {
              isOwner: isOwnerMsg,
              sender,
              prefix: prefix,
              botPublic: botPublic || isOwnerMsg
            };
            
            if (botPublic || isOwnerMsg) {
              await commandHandler.execute(command, sock, msg, args, context);
            } else {
              console.log(`⚠️ Commande ignorée (mode privé): ${command}`);
            }
            continue;
          }

          // Commandes propriétaire
          if (isOwnerMsg) {
            if (body === prefix + "public") {
              botPublic = true;
              config.botPublic = true;
              fs.writeFileSync('./config.json', JSON.stringify(config, null, 2));
              await sock.sendMessage(OWNER_NUMBER, { text: `✅ *BOT PASSÉ EN MODE PUBLIC*` });
              console.log(`🔓 Mode public activé`);
              continue;
            }
            
            if (body === prefix + "private") {
              botPublic = false;
              config.botPublic = false;
              fs.writeFileSync('./config.json', JSON.stringify(config, null, 2));
              await sock.sendMessage(OWNER_NUMBER, { text: `🔒 *BOT PASSÉ EN MODE PRIVÉ*` });
              console.log(`🔒 Mode privé activé`);
              continue;
            }
            
            if (body === prefix + "sessions") {
              const sessions = Array.from(activeSessions.entries()).map(([phone, data]) => 
                `• ${phone}: ${data.code} (${Math.round((SESSION_TIMEOUT - (Date.now() - data.timestamp)) / 1000)}s)`
              ).join('\n');
              
              await sock.sendMessage(OWNER_NUMBER, { 
                text: `📊 *SESSIONS ACTIVES (${activeSessions.size}/${MAX_SESSIONS})*\n\n${sessions || 'Aucune session'}` 
              });
              continue;
            }
          }
        }
      } catch (error) {
        console.log(`❌ Erreur traitement message: ${error.message}`);
      }
    });

    // Gestion des participants de groupe (welcome)
    sock.ev.on("group-participants.update", async (update) => {
      try {
        if (!welcomeEnabled || update.action !== "add") return;

        const groupJid = update.id;
        const newMemberJid = update.participants[0];
        const newMemberName = newMemberJid.split("@")[0];

        const text = `
┏━━━❖ ＡＲＣＡＮＥ❖━━━━┓
┃ @${newMemberName}
┃ 
┃ 𝙱𝚒𝚎𝚗𝚟𝚎𝚗𝚞𝚎 ! 𝚙𝚊𝚞𝚟𝚛𝚎 𝚖𝚘𝚛𝚝𝚎𝚕
┗━━━━━━━━━━━━━━━━━━┛`;

        await sock.sendMessage(groupJid, {
          image: { url: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRhoFTz9jVFxTVGAuh9RJIaNF0wH8WGvlOHM-q50RHZzg&s=10" },
          caption: text,
          mentions: [newMemberJid]
        });

      } catch (err) {
        console.log("welcome error:", err);
      }
    });

    // Fake recording
    sock.ev.on("messages.upsert", async ({ messages }) => {
      try {
        if (!fakeRecording) return;
        
        const msg = messages[0];
        if (!msg.message || msg.key.fromMe) return;

        try {
          await sock.sendPresenceUpdate('recording', msg.key.remoteJid);
          const waitTime = Math.floor(Math.random() * 2000) + 1000;
          await delay(waitTime);
          await sock.sendPresenceUpdate('available', msg.key.remoteJid);
        } catch (recordingError) {}
      } catch (error) {
        console.log(`⚠️ Erreur fake recording: ${error.message}`);
      }
    });

    // Interface console
    rl.on("line", async (input) => {
      const args = input.trim().split(/ +/);
      const command = args.shift().toLowerCase();
      
      switch (command) {
        case "public":
          botPublic = true;
          config.botPublic = true;
          fs.writeFileSync('./config.json', JSON.stringify(config, null, 2));
          console.log(`✅ Mode public activé`);
          break;
          
        case "private":
          botPublic = false;
          config.botPublic = false;
          fs.writeFileSync('./config.json', JSON.stringify(config, null, 2));
          console.log(`✅ Mode privé activé`);
          break;
          
        case "sessions":
          console.log(`📊 SESSIONS ACTIVES (${activeSessions.size}/${MAX_SESSIONS}):`);
          activeSessions.forEach((data, phone) => {
            const timeLeft = Math.round((SESSION_TIMEOUT - (Date.now() - data.timestamp)) / 1000);
            console.log(`  • ${phone}: ${data.code} (${timeLeft}s)`);
          });
          break;
          
        case "status":
          console.log(`📊 STATUT DU BOT`);
          console.log(`• Mode: ${botPublic ? 'PUBLIC' : 'PRIVÉ'}`);
          console.log(`• Fake Recording: ${fakeRecording ? 'ACTIVÉ' : 'DÉSACTIVÉ'}`);
          console.log(`• Commandes: ${commandHandler.getCommandList().length}`);
          console.log(`• Sessions: ${activeSessions.size}/${MAX_SESSIONS}`);
          console.log(`• Messages en mémoire: ${messageStore.size}`);
          console.log(`• Port web: ${PORT}`);
          console.log(`• Bot prêt: ${botReady ? 'OUI' : 'NON'}`);
          break;
          
        case "clear":
          console.clear();
          break;
          
        case "exit":
          console.log(`👋 Arrêt du bot...`);
          rl.close();
          process.exit(0);
          break;
          
        default:
          console.log(`⚠️ Commandes console:`);
          console.log(`  • public - Mode public`);
          console.log(`  • private - Mode privé`);
          console.log(`  • sessions - Liste sessions`);
          console.log(`  • status - Statut du bot`);
          console.log(`  • clear - Nettoyer console`);
          console.log(`  • exit - Quitter`);
      }
    });

  } catch (error) {
    console.log(`❌ Erreur démarrage bot: ${error.message}`);
    process.exit(1);
  }
}

// ==================== DÉMARRAGE ====================

console.log(`🚀 Démarrage de HEXGATE V3 avec interface web...`);
startBot();
