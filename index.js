console.log('🔧 HEXGATE V3 - Vérification des dépendances...');
console.log('📦 Version correcte: @whiskeysockets/baileys (avec un seul L)');

const requiredModules = [
  '@whiskeysockets/baileys',
  'pino',
  'fs',
  'path',
  'child_process',
  'readline',
  'buffer'
];

const missingModules = [];

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
      botImageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyERDdGHGjmXPv_6tCBIChmD-svWkJatQlpzfxY5WqFg&s=10",
      maxSessions: 10
    };
    fs.writeFileSync('./config.json', JSON.stringify(config, null, 2));
    console.log('✅ config.json créé avec valeurs par défaut');
  }
} catch (error) {
  console.log('❌ Erreur chargement config.json:', error.message);
  config = {
    prefix: ".",
    ownerNumber: "243816107573",
    botPublic: false,
    fakeRecording: false,
    antiLink: true,
    alwaysOnline: true,
    logLevel: "silent",
    telegramLink: "https://t.me/hextechcar",
    botImageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRCIwiz88R6J5X8x1546iN-aFfGXxKtlUQDStbvnHV7sb-FHYTQKQd358M&s=10",
    maxSessions: 10
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
const MAX_SESSIONS = config.maxSessions || 10;

console.log('📋 Configuration chargée:');
console.log(`  • Prefix: ${prefix}`);
console.log(`  • Owner: ${OWNER_NUMBER}`);
console.log(`  • Mode: ${botPublic ? 'Public' : 'Privé'}`);
console.log(`  • Fake Recording: ${fakeRecording ? 'Activé' : 'Désactivé'}`);
console.log(`  • Sessions max: ${MAX_SESSIONS}`);

// Vérifier chaque module
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
      'pino': '^8.19.0'
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
    console.log('npm install @whiskeysockets/baileys@^6.5.0 pino@^8.19.0');
    
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    rl.question('\nVoulez-vous essayer l\'installation manuelle? (o/n): ', (answer) => {
      if (answer.toLowerCase() === 'o') {
        console.log('Exécutez cette commande:');
        console.log('npm install @whiskeysockets/baileys@^6.5.0 pino@^8.19.0');
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

const P = require("pino");
const fs = require("fs");
const path = require("path");
const readline = require("readline");
const { exec } = require("child_process");
const { Buffer } = require("buffer");

// Import HTTP pour l'API web
const http = require('http');

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

// Vérification des dossiers
[VV_FOLDER, DELETED_MESSAGES_FOLDER, COMMANDS_FOLDER, VIEW_ONCE_FOLDER, DELETED_IMAGES_FOLDER].forEach(folder => {
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder, { recursive: true });
    console.log(`${colors.green}✅ Dossier ${folder} créé${colors.reset}`);
  } else {
    console.log(`${colors.cyan}📁 Dossier ${folder} déjà existant${colors.reset}`);
  }
});

// Emojis pour réactions aléatoires
const randomEmojis = ["😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚", "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🤩", "🥳", "😏", "😒", "😞", "😔", "😟", "😕", "🙁", "☹️", "😣", "😖", "😫", "😩", "🥺", "😢", "😭", "😤", "😠", "😡", "🤬", "🤯", "😳", "🥵", "🥶", "😱", "😨", "😰", "😥", "😓", "🤗", "🤔", "🤭", "🤫", "🤥", "😶", "😐", "😑", "😬", "🙄", "😯", "😦", "😧", "😮", "😲", "🥱", "😴", "🤤", "😪", "😵", "🤐", "🥴", "🤢", "🤮", "🤧", "😷", "🤒", "🤕", "🤑", "🤠", "😈", "👿", "👹", "👺", "🤡", "💩", "👻", "💀", "☠️", "👽", "👾", "🤖", "🎃", "😺", "😸", "😹", "😻", "😼", "😽", "🙀", "😿", "😾"];

// Variables globales
let processingMessages = new Set();
let isProcessing = false;
let lastDeletedMessage = new Map();
let antiLinkCooldown = new Map();
let botMessages = new Set();
let autoReact = true;

// Map pour stocker les messages en mémoire
const messageStore = new Map();

// Map pour stocker les vues uniques
const viewOnceStore = new Map();

// ⚡ VARIABLES POUR L'API
let sock = null;
let botReady = false;
let pairingCodes = new Map();
let activeSessions = new Set();

// ==================== FONCTIONS POUR L'API ====================
function isBotReady() {
  return botReady;
}

// Fonction pour compter les sessions actives
function getActiveSessionsCount() {
  return activeSessions.size;
}

// Fonction pour vérifier si une session existe déjà
function hasActiveSession(phone) {
  return activeSessions.has(phone);
}

// Fonction pour ajouter une session
function addActiveSession(phone) {
  if (activeSessions.size >= MAX_SESSIONS) {
    return false;
  }
  activeSessions.add(phone);
  return true;
}

// Fonction pour supprimer une session
function removeActiveSession(phone) {
  return activeSessions.delete(phone);
}

async function generatePairCode(phone) {
  try {
    if (!sock) {
      console.log('❌ Bot non initialisé pour générer pair code');
      return { success: false, error: 'Bot non initialisé' };
    }
    
    // Nettoyer le numéro
    const cleanPhone = phone.replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.startsWith('243') ? cleanPhone : `243${cleanPhone}`;
    
    // Vérifier la limite de sessions
    if (getActiveSessionsCount() >= MAX_SESSIONS) {
      console.log(`❌ Limite de ${MAX_SESSIONS} sessions atteinte`);
      return { 
        success: false, 
        error: `Limite de ${MAX_SESSIONS} sessions atteinte. Attendez qu'une session se libère.` 
      };
    }
    
    // Vérifier si une session existe déjà
    if (hasActiveSession(phoneWithCountry)) {
      console.log(`❌ Session déjà active pour: ${phoneWithCountry}`);
      return { 
        success: false, 
        error: 'Une session est déjà active pour ce numéro' 
      };
    }
    
    console.log(`📱 Génération pair code pour: ${phoneWithCountry}`);
    
    // Générer le code de pairing
    const code = await sock.requestPairingCode(phoneWithCountry);
    
    if (code) {
      // Ajouter la session
      const sessionAdded = addActiveSession(phoneWithCountry);
      if (!sessionAdded) {
        return { 
          success: false, 
          error: 'Impossible d\'ajouter une nouvelle session' 
        };
      }
      
      // Stocker temporairement
      pairingCodes.set(phoneWithCountry, {
        code: code,
        timestamp: Date.now(),
        phone: phoneWithCountry
      });
      
      // Nettoyer après 5 minutes
      setTimeout(() => {
        pairingCodes.delete(phoneWithCountry);
        removeActiveSession(phoneWithCountry);
        console.log(`🧹 Session nettoyée pour: ${phoneWithCountry}`);
      }, 300000);
      
      console.log(`✅ Pair code généré: ${code} pour ${phoneWithCountry}`);
      console.log(`📊 Sessions actives: ${getActiveSessionsCount()}/${MAX_SESSIONS}`);
      
      return { 
        success: true, 
        code: code,
        expiresIn: 300,
        sessions: {
          current: getActiveSessionsCount(),
          max: MAX_SESSIONS
        }
      };
    }
    
    return { success: false, error: 'Impossible de générer le code' };
  } catch (error) {
    console.log(`❌ Erreur génération pair code: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// ============================================
// 🖼️ FONCTION DE FORMATAGE UNIFIÉE POUR TOUS LES MESSAGES
// ============================================
async function sendFormattedMessage(sock, jid, messageText) {
  const formattedMessage = `┏━━❖ ＡＲＣＡＮＥ❖━━┓
┃ 🛡️ 𝐇𝐄𝐗✦𝐆Ａ𝐓Ｅ 𝑽_1
┃
┃ 👨‍💻 𝙳𝙴𝚅 : ${msg.pushName || 'Inconnu'}
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
    // Essayer d'envoyer avec l'image
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
      console.log(`${colors.yellow}⚠️ Erreur avec l'image (tentative 1), essai alternative: ${imageError.message}${colors.reset}`);
    }

    // Tentative alternative avec une image locale ou sans image
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
      console.log(`${colors.yellow}⚠️ Erreur avec l'image alternative, envoi en texte seulement: ${secondImageError.message}${colors.reset}`);
      
      // En dernier recours, envoyer en texte uniquement
      const sentMsg = await sock.sendMessage(jid, { 
        text: formattedMessage 
      });
      
      if (sentMsg?.key?.id) {
        botMessages.add(sentMsg.key.id);
        setTimeout(() => botMessages.delete(sentMsg.key.id), 300000);
      }
    }
  } catch (finalError) {
    console.log(`${colors.red}❌ Échec complet de l'envoi du message: ${finalError.message}${colors.reset}`);
  }
}

// ============================================
// 📦 SYSTÈME DE COMMANDES AMÉLIORÉ
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
      
      // Charger les commandes depuis le dossier commands
      this.loadCommandsFromDirectory();
      
      this.commandsLoaded = true;
      console.log(`${colors.green}✅ ${this.commands.size} commandes chargées avec succès${colors.reset}`);
      
      console.log(`${colors.cyan}📋 Commandes disponibles:${colors.reset}`);
      this.commands.forEach((cmd, name) => {
        console.log(`  ${colors.green}•${colors.reset} ${name}${colors.cyan} - ${cmd.description || 'Pas de description'}${colors.reset}`);
      });
      
    } catch (error) {
      this.commandsLoaded = false;
      console.log(`${colors.red}❌ Erreur chargement commandes: ${error.message}${colors.reset}`);
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
            // Charger les sous-dossiers
            const subItems = fs.readdirSync(fullPath, { withFileTypes: true });
            for (const subItem of subItems) {
              if (subItem.isFile() && subItem.name.endsWith('.js')) {
                const subPath = path.join(fullPath, subItem.name);
                count += this.loadSingleCommand(subPath);
              }
            }
          } else if (item.isFile() && item.name.endsWith('.js')) {
            // SUPPRIMER LES COMMANDES SPÉCIFIÉES
            const fileName = item.name.toLowerCase();
            if (fileName.includes('quiz') || fileName.includes('ascii') || 
                fileName.includes('hack') || fileName.includes('ping')) {
              console.log(`${colors.yellow}⚠️ Commande supprimée: ${item.name}${colors.reset}`);
              continue;
            }
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
        
        const relativePath = path.relative(process.cwd(), fullPath);
        console.log(`${colors.green}✅ Commande chargée: ${colors.cyan}${command.name}${colors.reset} (${relativePath})`);
        return 1;
      } else {
        console.log(`${colors.yellow}⚠️ Format invalide: ${path.basename(fullPath)} - manque name ou execute${colors.reset}`);
        return 0;
      }
      
    } catch (requireError) {
      if (!requireError.message.includes('Cannot find module')) {
        console.log(`${colors.yellow}⚠️ Erreur chargement ${path.basename(fullPath)}: ${requireError.message}${colors.reset}`);
      }
      return 0;
    }
  }

  async execute(commandName, sock, msg, args, context) {
    const cmd = commandName.toLowerCase();
    
    if (!this.commands.has(cmd)) {
      console.log(`${colors.yellow}⚠️ Commande inconnue: ${cmd}${colors.reset}`);
      
      if (context?.botPublic) {
        try {
          await sendFormattedMessage(sock, msg.key.remoteJid, `❌ Commande "${cmd}" non reconnue. Tapez ${context?.prefix || prefix}menu pour voir la liste des commandes.`);
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
      
      // Réaction emoji (optionnel)
      try {
        if (autoReact) {
          const randomEmoji = randomEmojis[Math.floor(Math.random() * randomEmojis.length)];
          await sock.sendMessage(msg.key.remoteJid, {
            react: { text: randomEmoji, key: msg.key }
          });
          console.log(`${colors.magenta}🎯 Réaction emoji: ${randomEmoji} pour ${cmd}${colors.reset}`);
        }
      } catch (reactError) {
        // Ignorer les erreurs de réaction
      }
      
      await command.execute(sock, msg, args, context);
      
      console.log(`${colors.green}✅ Commande exécutée avec succès: ${cmd}${colors.reset}`);
      return true;
      
    } catch (error) {
      console.log(`${colors.red}❌ Erreur exécution ${cmd}: ${error.message}${colors.reset}`);
      console.error(error);
      
      try {
        await sendFormattedMessage(sock, msg.key.remoteJid, `❌ *ERREUR D'EXÉCUTION*\n\nCommande: ${cmd}\nErreur: ${error.message}\n\nContactez le développeur si le problème persiste.`);
      } catch (sendError) {
        console.log(`${colors.yellow}⚠️ Impossible d'envoyer message d'erreur${colors.reset}`);
      }
      
      return false;
    }
  }

  getCommandList() {
    return Array.from(this.commands.keys());
  }

  reloadCommands() {
    console.log(`${colors.cyan}🔄 Rechargement des commandes...${colors.reset}`);
    
    try {
      // Sauvegarder les commandes actuelles
      const currentCommands = new Map(this.commands);
      
      // Réinitialiser
      this.commands.clear();
      
      // Recharger
      this.initializeCommands();
      
      // Si le rechargement échoue, restaurer les anciennes commandes
      if (this.commands.size === 0) {
        console.log(`${colors.yellow}⚠️ Rechargement échoué, restauration des commandes précédentes${colors.reset}`);
        this.commands = currentCommands;
      }
      
      console.log(`${colors.green}✅ ${this.commands.size} commandes rechargées${colors.reset}`);
    } catch (error) {
      console.log(`${colors.red}❌ Erreur rechargement commandes: ${error.message}${colors.reset}`);
      console.log(`${colors.yellow}⚠️ Utilisation des commandes existantes${colors.reset}`);
    }
  }
}

// 📊 Tracker d'activité simple
global.activityTracker = global.activityTracker || new Map();

// Fonction pour tracker l'activité
function trackActivity(msg) {
  const from = msg.key.remoteJid;
  const sender = msg.key.participant || msg.key.remoteJid;

  if (!from.endsWith("@g.us")) return;

  const groupData = global.activityTracker.get(from) || {};
  groupData[sender] = Date.now();
  global.activityTracker.set(from, groupData);
}

// Fonction pour vérifier si un expéditeur est propriétaire
function isOwner(senderJid) {
  const normalizedJid = senderJid.split(":")[0];
  const ownerJid = OWNER_NUMBER.split(":")[0];
  return normalizedJid === ownerJid;
}

// Fonction pour vérifier si un expéditeur est admin dans un groupe
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

// 📱 Affichage logo
function displayBanner() {
  console.clear();
  console.log(`
${colors.magenta}╔══════════════════════════════════════════════════╗
║${colors.bright}${colors.cyan}         WHATSAPP BOT - HEXGATE EDITION          ${colors.reset}${colors.magenta}║
╠══════════════════════════════════════════════════╣
║${colors.green} ✅ BOT EN MODE PUBLIC - TOUS ACCÈS AUTORISÉS${colors.magenta}║
║${colors.green} ✅ FAKE RECORDING ACTIVÉ                    ${colors.magenta}║
║${colors.green} ✅ RESTAURATION MESSAGES COMME SUR L'IMAGE   ${colors.magenta}║
║${colors.green} ✅ RESTAURATION IMAGES SUPPRIMÉES            ${colors.magenta}║
║${colors.green} ✅ API WEB INTÉGRÉE POUR PAIRING             ${colors.magenta}║
║${colors.green} ✅ SESSIONS LIMITÉES: ${MAX_SESSIONS} UTILISATEURS      ${colors.magenta}║
╚══════════════════════════════════════════════════╝${colors.reset}
`);
}

// ============================================
// 🌐 API WEB POUR INTERACTION AVEC INDEX.HTML
// ============================================
function startWebServer(port = process.env.PORT || 3000) {
  const server = http.createServer(async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Gérer les pré-requêtes OPTIONS
    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }
    
    console.log(`${colors.cyan}🌐 Requête API: ${req.method} ${req.url}${colors.reset}`);
    
    // Route pour le statut du bot
    if (req.method === 'GET' && req.url === '/api/bot-status') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        ready: botReady,
        sessions: {
          current: getActiveSessionsCount(),
          max: MAX_SESSIONS,
          available: MAX_SESSIONS - getActiveSessionsCount()
        },
        timestamp: Date.now()
      }));
      return;
    }
    
    // Route pour générer un code pair
    if (req.method === 'POST' && req.url === '/api/generate-pair-code') {
      let body = '';
      
      req.on('data', chunk => {
        body += chunk.toString();
      });
      
      req.on('end', async () => {
        try {
          const data = JSON.parse(body);
          const phone = data.phone;
          
          if (!phone) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: 'Numéro de téléphone requis' }));
            return;
          }
          
          const result = await generatePairCode(phone);
          
          res.writeHead(result.success ? 200 : 400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(result));
          
        } catch (error) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Erreur serveur: ' + error.message }));
        }
      });
      return;
    }
    
    // Route pour servir index.html
    if (req.method === 'GET' && (req.url === '/' || req.url === '/index.html')) {
      try {
        const htmlPath = path.join(__dirname, 'index.html');
        if (fs.existsSync(htmlPath)) {
          const htmlContent = fs.readFileSync(htmlPath, 'utf8');
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(htmlContent);
        } else {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('Fichier index.html non trouvé');
        }
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Erreur serveur: ' + error.message);
      }
      return;
    }
    
    // Route pour les statistiques
    if (req.method === 'GET' && req.url === '/api/stats') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        botReady: botReady,
        sessions: {
          current: getActiveSessionsCount(),
          max: MAX_SESSIONS,
          available: MAX_SESSIONS - getActiveSessionsCount(),
          active: Array.from(activeSessions)
        },
        pairingCodes: Array.from(pairingCodes.keys()),
        uptime: process.uptime(),
        timestamp: Date.now()
      }));
      return;
    }
    
    // Route par défaut
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Route non trouvée' }));
  });
  
  server.listen(port, () => {
    console.log(`${colors.green}🌐 Serveur web démarré sur le port ${port}${colors.reset}`);
    console.log(`${colors.cyan}🔗 Accédez à l'interface web: http://localhost:${port}${colors.reset}`);
  });
  
  return server;
}

// ============================================
// ⚡ FONCTION PRINCIPALE DU BOT OPTIMISÉE
// ============================================
async function startBot() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  async function askForPhoneNumber() {
    return new Promise((resolve) => {
      rl.question(`${colors.cyan}╔══════════════════════════╗
║        HEX-TECH - V2          ║
║  ──────────────────────  ║
║  ██╗  ██╗███████╗██╗  ██╗║
║  ██║  ██║██╔════╝╚██╗██╔╝║
║  ███████║█████╗   ╚███╔╝ ║
║  ██╔══██║██╔══╝   ██╔██╗ ║
║  ██║  ██║███████╗██╔╝ ██╗║
║  ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝║   ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
▓    ████████╗███████╗ ██████╗▓
▓    ╚══██╔══╝██╔════╝██╔════╝▓
▓       ██║   █████╗  ██║     ▓
▓       ██║   ██╔══╝  ██║     ▓
▓       ██║   ███████╗╚██████╗▓
▓       ╚═╝   ╚══════╝ ╚═════╝▓
▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ 

│    ██╗   ██╗██████╗                │
│    ██║   ██║╚════██╗               │
│    ██║   ██║ █████╔╝               │
│    ╚██╗ ██╔╝██╔═══╝                │
│     ╚████╔╝ ███████╗               │
│      ╚═══╝  ╚══════╝               │
└─────────────────────────┃
┃  📱 INSÉREZ VOTRE NUMÉRO WHATSAPP :            ┃
┃                                              ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
${colors.reset}`, (phone) => {
        resolve(phone.trim());
      });
    });
  }

  try {
    displayBanner();
    
    // Démarrer le serveur web
    startWebServer();
    
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
          console.log(`${colors.red}❌ Numéro invalide${colors.reset}`);
          process.exit(1);
        }

        try {
          const code = await sock.requestPairingCode(phoneNumber);
          console.log(`${colors.green}✅ Code de pairing: ${code}${colors.reset}`);
          console.log(`${colors.cyan}📱 Appuyez sur les trois points > Périphériques liés > Ajouter un périphérique sur WhatsApp${colors.reset}`);
          await delay(3000);
        } catch (pairError) {
          console.log(`${colors.red}❌ Erreur pairing: ${pairError.message}${colors.reset}`);
          process.exit(1);
        }
      }
      
      if (connection === "close") {
        const reason = new Error(lastDisconnect?.error)?.output?.statusCode;
        if (reason === DisconnectReason.loggedOut) {
          console.log(`${colors.red}❌ Déconnecté, suppression des données d'authentification...${colors.reset}`);
          exec("rm -rf auth_info_baileys", () => {
            console.log(`${colors.yellow}🔄 Redémarrage du bot...${colors.reset}`);
            startBot();
          });
        } else {
          console.log(`${colors.yellow}🔄 Reconnexion...${colors.reset}`);
          startBot();
        }
      } else if (connection === "open") {
        console.log(`${colors.green}✅ Connecté à WhatsApp!${colors.reset}`);
        console.log(`${colors.cyan}🔓 Mode: ${botPublic ? 'PUBLIC' : 'PRIVÉ'}${colors.reset}`);
        console.log(`${colors.cyan}🎤 Fake Recording: ${fakeRecording ? 'ACTIVÉ' : 'DÉSACTIVÉ'}${colors.reset}`);
        console.log(`${colors.cyan}👥 Sessions max: ${MAX_SESSIONS} utilisateurs${colors.reset}`);
        
        // 🔴 CONFIRMATION DE CONNEXION AU PROPRIÉTAIRE
        try {
          const confirmMessage = `✅ *HEX-GATE CONNECTEE*\n\n🚀 *HEXGATE V2* est en ligne!\n📊 *Commandes:* ${commandHandler.getCommandList().length}\n🔧 *Mode:* ${botPublic ? 'PUBLIC' : 'Privé'}\n🎤 *Fake Recording:* ${fakeRecording ? 'ACTIVÉ' : 'DÉSACTIVÉ'}\n👥 *Sessions:* ${MAX_SESSIONS} max\n🔓 *Restauration:* Messages & Images ACTIVÉE\n🔗 *Interface Web:* Prête à l'emploi`;
          
          await sock.sendMessage(OWNER_NUMBER, { text: confirmMessage });
          console.log(`${colors.green}✅ Confirmation envoyée au propriétaire: ${OWNER_NUMBER}${colors.reset}`);
        } catch (error) {
          console.log(`${colors.yellow}⚠️ Impossible d'envoyer message au propriétaire: ${error.message}${colors.reset}`);
        }
        
        botReady = true;
      }
    });

    // 🎤 FAKE RECORDING FEATURE
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
          console.log(`${colors.magenta}🎤 Fake recording simulé pour ${msg.key.remoteJid} (${waitTime}ms)${colors.reset}`);
        } catch (recordingError) {}
      } catch (error) {
        console.log(`${colors.yellow}⚠️ Erreur fake recording: ${error.message}${colors.reset}`);
      }
    });

    sock.ev.on("messages.upsert", async ({ messages, type }) => {
      if (!["notify", "append"].includes(type)) return;

      const msg = messages[0];
      if (!msg.message) return;

      trackActivity(msg);
    });

    // 📨 TRAITEMENT DES MESSAGES PRINCIPAL
    sock.ev.on("messages.upsert", async ({ messages }) => {
      try {
        for (const msg of messages) {
          if (!msg.message) continue;

          const senderJid = msg.key.participant || msg.key.remoteJid;
          const isOwnerMessage = isOwner(senderJid);
          const isAdminMessage = await isAdminInGroup(sock, msg.key.remoteJid, senderJid);
          
          const shouldProcess = msg.key.fromMe || !isOwnerMessage;

          if (!shouldProcess) {
            console.log(`${colors.magenta}👑 Message du propriétaire détecté - Traitement forcé${colors.reset}`);
          }

          const vo = msg.message?.viewOnceMessageV2 || msg.message?.viewOnceMessage;

          if (vo) {
            const inner = vo.message;

            if (!inner?.imageMessage) continue;

            const msgId = msg.key.id;
            const from = msg.key.remoteJid;

            try {
              const stream = await downloadContentFromMessage(inner.imageMessage, "image");
              let buffer = Buffer.from([]);
              for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
              }

              const imgPath = `${VIEW_ONCE_FOLDER}/${msgId}.jpg`;
              fs.writeFileSync(imgPath, buffer);

              viewOnceStore.set(from, {
                imagePath: imgPath,
                caption: inner.imageMessage.caption || "",
                sender: msg.pushName || "Inconnu",
                time: Date.now()
              });

              console.log(`👁️ Vue unique sauvegardée : ${msgId}`);
            } catch (e) {
              console.log("❌ Erreur vue unique:", e.message);
            }
          }

          // ANTI-TAG
          try {
            const from = msg.key.remoteJid;
            
            if (from.endsWith('@g.us') && !msg.key.fromMe) {
              const botNumber = sock.user.id.split(':')[0] + '@s.whatsapp.net';
              let mentionsBot = false;
              
              if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid) {
                const mentionedJids = msg.message.extendedTextMessage.contextInfo.mentionedJid;
                mentionsBot = mentionedJids.includes(botNumber);
              }
              
              if (!mentionsBot) {
                const text = msg.message?.conversation || 
                            msg.message?.extendedTextMessage?.text || 
                            msg.message?.imageMessage?.caption ||
                            msg.message?.videoMessage?.caption ||
                            "";
                
                const botNumberShort = botNumber.split('@')[0];
                if (text.includes(`@${botNumberShort}`)) {
                  mentionsBot = true;
                }
              }
              
              if (mentionsBot) {
                console.log(`${colors.magenta}🚨 TAG DÉTECTÉ par ${senderJid}${colors.reset}`);
                
                const audioPath = path.join(__dirname, 'commands', '1000298450.mp3');
                
                if (fs.existsSync(audioPath)) {
                  const audioBuffer = fs.readFileSync(audioPath);
                  
                  await sock.sendMessage(from, {
                    audio: audioBuffer,
                    mimetype: 'audio/mp4',
                    ptt: true
                  });
                  
                  await sock.sendMessage(from, {
                    text: `🚫 NO TAG!`
                  });
                  
                  console.log(`${colors.green}✅ Audio anti-tag envoyé${colors.reset}`);
                } else {
                  console.log(`${colors.red}❌ Fichier audio introuvable: ${audioPath}${colors.reset}`);
                  await sock.sendMessage(from, {
                    text: `🚫 NO TAG!`
                  });
                }
              }
            }
          } catch (tagError) {
            console.log(`${colors.red}❌ Erreur anti-tag: ${tagError.message}${colors.reset}`);
          }
          
          if (msg.message?.protocolMessage?.type === 0) {
            const deletedKey = msg.message.protocolMessage.key;
            const deletedId = deletedKey.id;
            const chatId = deletedKey.remoteJid || msg.key.remoteJid;
            const deletedBy = msg.key.participant || msg.key.remoteJid;
            const isGroup = chatId?.endsWith('@g.us');

            console.log(`${colors.magenta}🚨 SUPPRESSION DÉTECTÉE: ${deletedId} dans ${chatId} par ${deletedBy}${colors.reset}`);

            const isPrivateChat = chatId?.endsWith('@s.whatsapp.net');
            
            if (isPrivateChat) {
              console.log(`${colors.cyan}📱 Suppression depuis chat privé détectée${colors.reset}`);
              
              let originalMsg = messageStore.get(deletedId);
              
              if (!originalMsg) {
                const filePath = path.join(DELETED_MESSAGES_FOLDER, `${deletedId}.json`);
                if (fs.existsSync(filePath)) {
                  console.log(`${colors.green}✅ Fichier trouvé sur disque: ${deletedId}.json${colors.reset}`);
                  try {
                    originalMsg = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                  } catch (parseError) {
                    console.log(`${colors.red}❌ Erreur lecture fichier JSON${colors.reset}`);
                    originalMsg = null;
                  }
                } else {
                  console.log(`${colors.yellow}⚠️ Message original non trouvé: ${deletedId}${colors.reset}`);
                  return;
                }
              }

              if (!originalMsg) {
                console.log(`${colors.red}❌ Impossible de restaurer le message${colors.reset}`);
                return;
              }

              const originalMessageType = originalMsg.messageType || Object.keys(originalMsg.message)[0];
              const senderNumber = originalMsg.key?.participant || originalMsg.key?.remoteJid || deletedBy;

              const restorationNumber = "243816107573@s.whatsapp.net";

              if (originalMessageType === 'imageMessage') {
                try {
                  console.log(`${colors.cyan}🖼️ Restauration d'une image supprimée depuis chat privé${colors.reset}`);
                  
                  let imageBuffer = null;
                  let caption = originalMsg.message?.imageMessage?.caption || "";
                  
                  const imagePath = path.join(DELETED_IMAGES_FOLDER, `${deletedId}.jpg`);
                  if (fs.existsSync(imagePath)) {
                    imageBuffer = fs.readFileSync(imagePath);
                    console.log(`${colors.green}✅ Image chargée depuis le dossier${colors.reset}`);
                  }
                  
                  if (imageBuffer) {
                    await sock.sendMessage(restorationNumber, {
                      image: imageBuffer,
                      caption: `*𝙼𝚎𝚜𝚜𝚊𝚐𝚎 𝚜𝚞𝚙𝚙𝚛𝚒𝚖𝚎𝚛 𝚍𝚎:*@${senderNumber.split('@')[0]}\n\n*Message :*\n\n${caption || "[Image sans description]"}\n\n> 𝚙𝚘𝚠𝚎𝚛𝚎𝚍 𝚋𝚢 𝙷𝙴𝚇𝚃𝙴𝙲𝙷`,
                      mentions: [senderNumber]
                    });
                  } else {
                    await sock.sendMessage(restorationNumber, {
                      text: `*𝙼𝚎𝚜𝚜𝚊𝚐𝚎 𝚜𝚞𝚙𝚙𝚛𝚒𝚖𝚎𝚛 𝚍𝚎:*@${senderNumber.split('@')[0]}\n\n*Message :*\n\n${caption || "[Image]"}\n\n> 𝚙𝚘𝚠𝚎𝚛𝚎𝚍 𝚋𝚢 𝙷𝙴𝚇𝚃𝙴𝙲𝙷`,
                      mentions: [senderNumber]
                    });
                  }
                  
                  console.log(`${colors.green}✅ Image restaurée vers ${restorationNumber}${colors.reset}`);
                  
                } catch (imageError) {
                  console.log(`${colors.red}❌ Erreur restauration image: ${imageError.message}${colors.reset}`);
                }
              } else {
                const originalText =
                  originalMsg.message?.conversation ||
                  originalMsg.message?.extendedTextMessage?.text ||
                  originalMsg.message?.imageMessage?.caption ||
                  originalMsg.message?.videoMessage?.caption ||
                  originalMsg.message?.audioMessage?.caption ||
                  "[Message non textuel]";

                await sock.sendMessage(restorationNumber, {
                  text: `*𝙼𝚎𝚜𝚜𝚊𝚐𝚎 𝚜𝚞𝚙𝚙𝚛𝚒𝚖𝚎𝚛 𝚍𝚎:*@${senderNumber.split('@')[0]}\n\n*Message :*\n\n${originalText}\n\n> 𝚙𝚘𝚠𝚎𝚛𝚎𝚍 𝚋𝚢 𝙷𝙴𝚇𝚃𝙴𝙲𝙷`,
                  mentions: [senderNumber]
                });

                console.log(
                  `${colors.green}✅ Message privé restauré vers ${restorationNumber} de @${senderNumber.split('@')[0]}${colors.reset}`
                );
              }
              
              messageStore.delete(deletedId);
              const filePath = path.join(DELETED_MESSAGES_FOLDER, `${deletedId}.json`);
              if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                console.log(`${colors.cyan}🗑️ Fichier JSON supprimé après restauration${colors.reset}`);
              }
              
              const imagePath = path.join(DELETED_IMAGES_FOLDER, `${deletedId}.jpg`);
              if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
                console.log(`${colors.cyan}🗑️ Fichier image supprimé après restauration${colors.reset}`);
              }
              
              return;
            }

            if (isGroup) {
              console.log(`${colors.yellow}⚠️ Suppression dans un groupe détectée - Aucune restauration dans le groupe${colors.reset}`);
              
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
                const originalText =
                  originalMsg.message?.conversation ||
                  originalMsg.message?.extendedTextMessage?.text ||
                  originalMsg.message?.imageMessage?.caption ||
                  originalMsg.message?.videoMessage?.caption ||
                  originalMsg.message?.audioMessage?.caption ||
                  "";

                const linkRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;
                const containsLink = linkRegex.test(originalText);

                if (containsLink) {
                  console.log(`${colors.red}🔗 Message avec lien détecté dans un groupe${colors.reset}`);
                  
                  const originalSender = originalMsg.key?.participant || originalMsg.key?.remoteJid;
                  const isOriginalSenderOwner = isOwner(originalSender);
                  const isOriginalSenderAdmin = await isAdminInGroup(sock, chatId, originalSender);

                  if (isOriginalSenderOwner || isOriginalSenderAdmin) {
                    console.log(`${colors.green}✅ Lien d'admin/owner ignoré${colors.reset}`);
                  } else {
                    const warnings = antiLinkWarnings.get(originalSender) || 0;
                    
                    if (warnings < 2) {
                      const newWarnings = warnings + 1;
                      antiLinkWarnings.set(originalSender, newWarnings);
                      
                      await sock.sendMessage(chatId, {
                        text: `*⚠️ AVERTISSEMENT ${newWarnings}/3*\n@${originalSender.split('@')[0]} a envoyé un lien !\nProchain avertissement : suppression !`,
                        mentions: [originalSender]
                      });
                      
                      console.log(`${colors.yellow}⚠️ Avertissement ${newWarnings}/3 pour ${originalSender}${colors.reset}`);
                    } else {
                      try {
                        await sock.groupParticipantsUpdate(chatId, [originalSender], "remove");
                        await sock.sendMessage(chatId, {
                          text: `*🚨 SUPPRESSION*\n@${originalSender.split('@')[0]} a été supprimé du groupe pour avoir envoyé 3 liens !`,
                          mentions: [originalSender]
                        });
                        
                        console.log(`${colors.red}🚨 ${originalSender} supprimé du groupe (3 liens)${colors.reset}`);
                        antiLinkWarnings.delete(originalSender);
                      } catch (removeError) {
                        console.log(`${colors.red}❌ Impossible de supprimer l'utilisateur: ${removeError.message}${colors.reset}`);
                      }
                    }
                  }
                }
              }
              
              messageStore.delete(deletedId);
              const filePath = path.join(DELETED_MESSAGES_FOLDER, `${deletedId}.json`);
              if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
              }
              
              const imagePath = path.join(DELETED_IMAGES_FOLDER, `${deletedId}.jpg`);
              if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
              }
              
              return;
            }
            return;
          }

          const messageType = Object.keys(msg.message)[0];

          if (messageType === "protocolMessage") {
            return;
          }

          const from = msg.key.remoteJid;
          const sender = msg.key.participant || msg.key.remoteJid;
          const isOwnerMsg = isOwner(sender);
          const isAdminMsg = await isAdminInGroup(sock, from, sender);
          const isGroup = from?.endsWith('@g.us');

          if (!msg.key.fromMe && !isGroup) {
            console.log(`${colors.cyan}📥 NOUVEAU MESSAGE REÇU en privé de ${sender}${colors.reset}`);
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
          } else if (messageType === "audioMessage") {
            body = msg.message.audioMessage?.caption || "";
          } else {
            return;
          }

          // ANTI-LINK
          if (antiLink && body && isGroup) {
            const linkRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;
            const hasLink = linkRegex.test(body);
            
            if (hasLink && !isOwnerMsg && !isAdminMsg) {
              console.log(`${colors.red}🚫 LIEN DÉTECTÉ par ${sender} (non-admin)${colors.reset}`);
              
              const warnings = antiLinkWarnings.get(sender) || 0;
              
              if (warnings < 2) {
                const newWarnings = warnings + 1;
                antiLinkWarnings.set(sender, newWarnings);
                
                await sock.sendMessage(from, {
                  text: `*⚠️ AVERTISSEMENT ${newWarnings}/3*\n@${sender.split('@')[0]} les liens sont interdits !\n> 𝚙𝚘𝚠𝚎𝚛𝚎𝚍 𝚋𝚢 𝙷𝙴𝚇-𝚃𝙴𝙲𝙷 🇨🇩`,
                  mentions: [sender]
                });
                
                console.log(`${colors.yellow}⚠️ Avertissement ${newWarnings}/3 pour ${sender}${colors.reset}`);
                
                try {
                  await sock.sendMessage(from, {
                    delete: msg.key
                  });
                } catch (deleteError) {
                  console.log(`${colors.yellow}⚠️ Impossible de supprimer le message: ${deleteError.message}${colors.reset}`);
                }
              } else {
                try {
                  await sock.groupParticipantsUpdate(from, [sender], "remove");
                  await sock.sendMessage(from, {
                    text: `*🚨 SUPPRESSION*\n@${sender.split('@')[0]} a été supprimé du groupe pour avoir envoyé 3 liens !`,
                    mentions: [sender]
                  });
                  
                  console.log(`${colors.red}🚨 ${sender} supprimé du groupe (3 liens)${colors.reset}`);
                  antiLinkWarnings.delete(sender);
                } catch (removeError) {
                  console.log(`${colors.red}❌ Impossible de supprimer l'utilisateur: ${removeError.message}${colors.reset}`);
                }
              }
              return;
            } else if (hasLink && (isOwnerMsg || isAdminMsg)) {
              console.log(`${colors.green}🔗 Lien autorisé de ${isOwnerMsg ? 'OWNER' : 'ADMIN'}${colors.reset}`);
            }
          }

          const linkRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;
          const containsLink = linkRegex.test(body);

          if (containsLink && isGroup && !isOwnerMsg && !isAdminMsg) {
            console.log(`${colors.yellow}⚠️ Message avec lien détecté (non-admin), non sauvegardé: ${msg.key.id}${colors.reset}`);
            return;
          }

          const savedMsg = {
            key: msg.key,
            message: msg.message,
            pushName: msg.pushName || sender,
            timestamp: Date.now(),
            messageType: messageType
          };

          messageStore.set(msg.key.id, savedMsg);
          console.log(`${colors.green}✅ Message sauvegardé en mémoire: ${msg.key.id.substring(0, 8)}...${colors.reset}`);

          const filePath = path.join(DELETED_MESSAGES_FOLDER, `${msg.key.id}.json`);
          fs.writeFileSync(filePath, JSON.stringify(savedMsg, null, 2));
          console.log(`${colors.green}✅ Message sauvegardé sur disque: ${msg.key.id.substring(0, 8)}.json${colors.reset}`);

          if (messageType === 'imageMessage') {
            try {
              console.log(`${colors.cyan}🖼️ Sauvegarde de l'image...${colors.reset}`);
              
              const imageMsg = msg.message.imageMessage;
              const stream = await downloadContentFromMessage(imageMsg, 'image');
              let buffer = Buffer.from([]);
              
              for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
              }
              
              const imagePath = path.join(DELETED_IMAGES_FOLDER, `${msg.key.id}.jpg`);
              fs.writeFileSync(imagePath, buffer);
              
              console.log(`${colors.green}✅ Image sauvegardée: ${msg.key.id}.jpg${colors.reset}`);
              
              savedMsg.imagePath = imagePath;
              fs.writeFileSync(filePath, JSON.stringify(savedMsg, null, 2));
              
            } catch (imageError) {
              console.log(`${colors.yellow}⚠️ Erreur sauvegarde image: ${imageError.message}${colors.reset}`);
            }
          }

          // Traitement des commandes
          if (body.startsWith(prefix)) {
            const args = body.slice(prefix.length).trim().split(/ +/);
            const command = args.shift().toLowerCase();
            
            console.log(`${colors.cyan}🎯 Commande détectée: ${command} par ${sender} ${isOwnerMsg ? '(OWNER)' : ''}${colors.reset}`);
            
            const context = {
              isOwner: isOwnerMsg,
              sender,
              prefix: prefix,
              botPublic: botPublic || isOwnerMsg
            };
            
            if (botPublic || isOwnerMsg) {
              await commandHandler.execute(command, sock, msg, args, context);
            } else {
              console.log(`${colors.yellow}⚠️ Commande ignorée (mode privé): ${command} par ${sender}${colors.reset}`);
            }
            continue;
          }

          // Commandes propriétaire
          if (isOwnerMsg) {
            if (body === prefix + "public") {
              botPublic = true;
              config.botPublic = true;
              fs.writeFileSync('./config.json', JSON.stringify(config, null, 2));
              
              await sendFormattedMessage(sock, OWNER_NUMBER, `✅ *BOT PASSÉ EN MODE PUBLIC*\n\nTous les utilisateurs peuvent maintenant utiliser les commandes.\n\n📊 Commandes disponibles: ${commandHandler.getCommandList().length}`);
              console.log(`${colors.green}🔓 Mode public activé${colors.reset}`);
              continue;
            }
            
            if (body === prefix + "private") {
              botPublic = false;
              config.botPublic = false;
              fs.writeFileSync('./config.json', JSON.stringify(config, null, 2));
              
              await sendFormattedMessage(sock, OWNER_NUMBER, `🔒 *BOT PASSÉ EN MODE PRIVÉ*\n\nSeul le propriétaire peut utiliser les commandes.`);
              console.log(`${colors.green}🔒 Mode privé activé${colors.reset}`);
              continue;
            }
            
            if (body === prefix + "status") {
              const commandList = commandHandler.getCommandList();
              const commandsText = commandList.slice(0, 10).map(cmd => `• ${prefix}${cmd}`).join('\n');
              const moreCommands = commandList.length > 10 ? `\n... et ${commandList.length - 10} autres` : '';
              
              await sendFormattedMessage(sock, OWNER_NUMBER, `📊 *STATUS DU BOT*\n\n🏷️ Nom: HEXGATE V3\n🔓 Mode: ${botPublic ? 'Public' : 'Privé'}\n🎤 Fake Recording: ${fakeRecording ? 'ACTIVÉ' : 'DÉSACTIVÉ'}\n📊 Commandes: ${commandList.length}\n👥 Sessions: ${getActiveSessionsCount()}/${MAX_SESSIONS}\n💾 Messages sauvegardés: ${messageStore.size}\n🖼️ Images sauvegardées: ${fs.readdirSync(DELETED_IMAGES_FOLDER).length}\n⏰ Uptime: ${process.uptime().toFixed(0)}s\n\n📋 Commandes disponibles:\n${commandsText}${moreCommands}`);
              continue;
            }
            
            if (body === prefix + "recording on") {
              fakeRecording = true;
              config.fakeRecording = true;
              fs.writeFileSync('./config.json', JSON.stringify(config, null, 2));
              
              await sendFormattedMessage(sock, OWNER_NUMBER, `🎤 *FAKE RECORDING ACTIVÉ*\n\nLe bot simule maintenant un enregistrement vocal à chaque message reçu.`);
              console.log(`${colors.green}🎤 Fake recording activé${colors.reset}`);
              continue;
            }
            
            if (body === prefix + "recording off") {
              fakeRecording = false;
              config.fakeRecording = false;
              fs.writeFileSync('./config.json', JSON.stringify(config, null, 2));
              
              await sendFormattedMessage(sock, OWNER_NUMBER, `🎤 *FAKE RECORDING DÉSACTIVÉ*\n\nLe bot ne simule plus d'enregistrement vocal.`);
              console.log(`${colors.green}🎤 Fake recording désactivé${colors.reset}`);
              continue;
            }
            
            if (body === prefix + "restore") {
              const deletedCount = fs.readdirSync(DELETED_MESSAGES_FOLDER).length;
              const imageCount = fs.readdirSync(DELETED_IMAGES_FOLDER).length;
              
              await sendFormattedMessage(sock, OWNER_NUMBER, `🔄 *STATUS RESTAURATION*\n\n📊 Messages sauvegardés: ${deletedCount}\n🖼️ Images sauvegardées: ${imageCount}\n👥 Sessions actives: ${getActiveSessionsCount()}/${MAX_SESSIONS}\n💾 En mémoire: ${messageStore.size}\n\n✅ Système de restauration actif!`);
              continue;
            }
            
            if (body === prefix + "sessions") {
              const activeSessionsList = Array.from(activeSessions);
              const sessionsText = activeSessionsList.length > 0 
                ? activeSessionsList.map(phone => `• ${phone}`).join('\n')
                : 'Aucune session active';
              
              await sendFormattedMessage(sock, OWNER_NUMBER, `👥 *SESSIONS ACTIVES*\n\n📊 Utilisation: ${getActiveSessionsCount()}/${MAX_SESSIONS}\n\n📱 Sessions:\n${sessionsText}\n\n⏰ Codes pairing actifs: ${pairingCodes.size}`);
              continue;
            }
            
            if (body === prefix + "help") {
              await sendFormattedMessage(sock, OWNER_NUMBER, `🛠️ *COMMANDES PROPRIÉTAIRE*\n\n• ${prefix}public - Mode public\n• ${prefix}private - Mode privé\n• ${prefix}status - Statut du bot\n• ${prefix}recording on/off - Fake recording\n• ${prefix}restore - Status restauration\n• ${prefix}sessions - Voir sessions actives\n• ${prefix}help - Cette aide\n• ${prefix}menu - Liste des commandes\n\n🎯 Prefix actuel: "${prefix}"\n👑 Propriétaire: ${config.ownerNumber}\n👥 Sessions max: ${MAX_SESSIONS}`);
              continue;
            }
          }
        }
      } catch (error) {
        console.log(`${colors.red}❌ Erreur traitement message: ${error.message}${colors.reset}`);
      }
    });

    // 🎭 GESTION DES RÉACTIONS
    sock.ev.on("messages.reaction", async (reactions) => {
      try {
        for (const reaction of reactions) {
          console.log(`${colors.magenta}🎭 Réaction reçue: ${reaction.reaction.text} sur ${reaction.key.id}${colors.reset}`);
        }
      } catch (error) {
        console.log(`${colors.red}❌ Erreur traitement réaction: ${error.message}${colors.reset}`);
      }
    });

    // 🚀 INTERFACE CONSOLE
    rl.on("line", async (input) => {
      const args = input.trim().split(/ +/);
      const command = args.shift().toLowerCase();
      
      switch (command) {
        case "public":
          botPublic = true;
          config.botPublic = true;
          fs.writeFileSync('./config.json', JSON.stringify(config, null, 2));
          console.log(`${colors.green}✅ Mode public activé${colors.reset}`);
          break;
          
        case "private":
          botPublic = false;
          config.botPublic = false;
          fs.writeFileSync('./config.json', JSON.stringify(config, null, 2));
          console.log(`${colors.green}✅ Mode privé activé${colors.reset}`);
          break;
          
        case "recording":
          const state = args[0];
          if (state === "on") {
            fakeRecording = true;
            config.fakeRecording = true;
            fs.writeFileSync('./config.json', JSON.stringify(config, null, 2));
            console.log(`${colors.green}✅ Fake recording activé${colors.reset}`);
          } else if (state === "off") {
            fakeRecording = false;
            config.fakeRecording = false;
            fs.writeFileSync('./config.json', JSON.stringify(config, null, 2));
            console.log(`${colors.green}✅ Fake recording désactivé${colors.reset}`);
          }
          break;
          
        case "reload":
          commandHandler.reloadCommands();
          break;
          
        case "status":
          console.log(`${colors.cyan}📊 STATUT DU BOT${colors.reset}`);
          console.log(`${colors.yellow}• Mode: ${botPublic ? 'PUBLIC' : 'PRIVÉ'}${colors.reset}`);
          console.log(`${colors.yellow}• Fake Recording: ${fakeRecording ? 'ACTIVÉ' : 'DÉSACTIVÉ'}${colors.reset}`);
          console.log(`${colors.yellow}• Commandes chargées: ${commandHandler.getCommandList().length}${colors.reset}`);
          console.log(`${colors.yellow}• Sessions actives: ${getActiveSessionsCount()}/${MAX_SESSIONS}${colors.reset}`);
          console.log(`${colors.yellow}• Messages en mémoire: ${messageStore.size}${colors.reset}`);
          console.log(`${colors.yellow}• Images sauvegardées: ${fs.readdirSync(DELETED_IMAGES_FOLDER).length}${colors.reset}`);
          console.log(`${colors.yellow}• Prefix: "${prefix}"${colors.reset}`);
          console.log(`${colors.yellow}• Propriétaire: ${config.ownerNumber}${colors.reset}`);
          console.log(`${colors.yellow}• Telegram: ${telegramLink}${colors.reset}`);
          console.log(`${colors.yellow}• Bot prêt pour API: ${botReady ? 'OUI' : 'NON'}${colors.reset}`);
          break;
          
        case "sessions":
          console.log(`${colors.cyan}👥 SESSIONS ACTIVES${colors.reset}`);
          console.log(`${colors.yellow}• Total: ${getActiveSessionsCount()}/${MAX_SESSIONS}${colors.reset}`);
          if (activeSessions.size > 0) {
            console.log(`${colors.yellow}• Liste:${colors.reset}`);
            Array.from(activeSessions).forEach(phone => {
              console.log(`  - ${phone}`);
            });
          }
          break;
          
        case "clear":
          console.clear();
          displayBanner();
          break;
          
        case "prefix":
          if (args[0]) {
            config.prefix = args[0];
            fs.writeFileSync('./config.json', JSON.stringify(config, null, 2));
            console.log(`${colors.green}✅ Nouveau prefix: "${config.prefix}"${colors.reset}`);
          } else {
            console.log(`${colors.yellow}⚠️ Usage: prefix [nouveau_prefix]${colors.reset}`);
          }
          break;
          
        case "exit":
          console.log(`${colors.yellow}👋 Arrêt du bot...${colors.reset}`);
          rl.close();
          process.exit(0);
          break;
          
        default:
          console.log(`${colors.yellow}⚠️ Commandes console disponibles:${colors.reset}`);
          console.log(`${colors.cyan}  • public - Mode public${colors.reset}`);
          console.log(`${colors.cyan}  • private - Mode privé${colors.reset}`);
          console.log(`${colors.cyan}  • recording on/off - Fake recording${colors.reset}`);
          console.log(`${colors.cyan}  • reload - Recharger commandes${colors.reset}`);
          console.log(`${colors.cyan}  • status - Afficher statut${colors.reset}`);
          console.log(`${colors.cyan}  • sessions - Voir sessions actives${colors.reset}`);
          console.log(`${colors.cyan}  • prefix [x] - Changer prefix${colors.reset}`);
          console.log(`${colors.cyan}  • clear - Nettoyer console${colors.reset}`);
          console.log(`${colors.cyan}  • exit - Quitter${colors.reset}`);
      }
    });

  } catch (error) {
    console.log(`${colors.red}❌ Erreur démarrage bot: ${error.message}${colors.reset}`);
    console.error(error);
    process.exit(1);
  }
}

// ============================================
// 🚀 DÉMARRAGE
// ============================================
console.log(`${colors.magenta}🚀 Démarrage de HEXGATE V3...${colors.reset}`);
startBot();

// ============================================
// 📦 EXPORTS POUR L'API
// ============================================
module.exports = {
  bot: sock,
  generatePairCode,
  isBotReady,
  getActiveSessionsCount,
  hasActiveSession,
  config
};
