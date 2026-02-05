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
  'express' // AJOUT: Pour le serveur web
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
      botPublic: true,
      fakeRecording: false,
      antiLink: true,
      alwaysOnline: true,
      logLevel: "silent",
      telegramLink: "https://t.me/hextechcar",
      botImageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyERDdGHGjmXPv_6tCBIChmD-svWkJatQlpzfxY5WqFg&s=10",
      maxSessions: 10, // NOUVEAU: Limite de sessions
      webPort: 3000,   // NOUVEAU: Port web
      webEnabled: true // NOUVEAU: Activer le serveur web
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
    webPort: 3000,
    webEnabled: true
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
const MAX_SESSIONS = config.maxSessions || 10; // NOUVEAU: Limite de sessions
const WEB_PORT = config.webPort || 3000; // NOUVEAU: Port web

console.log('📋 Configuration chargée:');
console.log(`  • Prefix: ${prefix}`);
console.log(`  • Owner: ${OWNER_NUMBER}`);
console.log(`  • Mode: ${botPublic ? 'Public' : 'Privé'}`);
console.log(`  • Fake Recording: ${fakeRecording ? 'Activé' : 'Désactivé'}`);
console.log(`  • Max Sessions: ${MAX_SESSIONS}`);
console.log(`  • Web Port: ${WEB_PORT}`);

// Vérifier chaque module
for (const module of requiredModules) {
  try {
    if (['fs', 'path', 'child_process', 'readline', 'buffer', 'express'].includes(module)) {
      require(module);
      console.log(`✅ ${module} - PRÉSENT (Node.js)`);
    } else {
      require.resolve(module);
      console.log(`✅ ${module} - PRÉSENT`);
    }
  } catch (error) {
    if (!['fs', 'path', 'child_process', 'readline', 'buffer', 'express'].includes(module)) {
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
      'express': '^4.18.2' // AJOUT: Express pour le serveur web
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
    console.log('npm install @whiskeysockets/baileys@^6.5.0 pino@^8.19.0 express@^4.18.2');
    
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    rl.question('\nVoulez-vous essayer l\'installation manuelle? (o/n): ', (answer) => {
      if (answer.toLowerCase() === 'o') {
        console.log('Exécutez cette commande:');
        console.log('npm install @whiskeysockets/baileys@^6.5.0 pino@^8.19.0 express@^4.18.2');
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
  delay
} = require("@whiskeysockets/baileys");
const P = require("pino");
const fs = require("fs");
const path = require("path");
const readline = require("readline");
const { exec } = require("child_process");
const { Buffer } = require("buffer");
const express = require('express'); // NOUVEAU: Serveur Express

// ==================== CONFIGURATION API ====================
const app = express();
app.use(express.json());
app.use(express.static('.')); // Servir les fichiers statiques

// ⚡ VARIABLES POUR L'API
let sock = null;
let botReady = false;
let pairingCodes = new Map(); // Stockage des codes temporaires
let activeSessions = new Set(); // NOUVEAU: Suivi des sessions actives

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

// ==================== API ROUTES ====================
// Route pour vérifier le statut du bot
app.get('/api/bot-status', (req, res) => {
  const activeSessionCount = activeSessions.size;
  const isReady = botReady && sock !== null;
  
  res.json({
    ready: isReady,
    activeSessions: activeSessionCount,
    maxSessions: MAX_SESSIONS,
    status: isReady ? 'online' : 'offline',
    message: isReady ? 
      `Bot connecté (${activeSessionCount}/${MAX_SESSIONS} sessions)` : 
      'Bot non connecté'
  });
});

// Route pour générer un pair code
app.post('/api/generate-pair-code', async (req, res) => {
  try {
    const { phone } = req.body;
    
    if (!phone) {
      return res.status(400).json({ 
        success: false, 
        error: 'Numéro de téléphone requis' 
      });
    }
    
    // Vérifier si le bot est prêt
    if (!botReady || !sock) {
      return res.status(503).json({ 
        success: false, 
        error: 'Bot non connecté à WhatsApp' 
      });
    }
    
    // Vérifier la limite de sessions
    if (activeSessions.size >= MAX_SESSIONS) {
      return res.status(429).json({ 
        success: false, 
        error: `Limite de ${MAX_SESSIONS} sessions atteinte. Veuillez réessayer plus tard.` 
      });
    }
    
    // Nettoyer le numéro
    const cleanPhone = phone.replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.startsWith('243') ? cleanPhone : `243${cleanPhone}`;
    
    // Vérifier la longueur
    if (phoneWithCountry.length < 12) {
      return res.status(400).json({ 
        success: false, 
        error: 'Numéro invalide. Format: 243XXXXXXXXX (12 chiffres)' 
      });
    }
    
    console.log(`📱 Génération pair code pour: ${phoneWithCountry}`);
    
    // Générer le code de pairing
    const code = await sock.requestPairingCode(phoneWithCountry);
    
    if (code) {
      // Ajouter la session
      activeSessions.add(phoneWithCountry);
      
      // Stocker temporairement (5 minutes)
      pairingCodes.set(phoneWithCountry, {
        code: code,
        timestamp: Date.now(),
        expiresAt: Date.now() + 300000 // 5 minutes
      });
      
      // Nettoyer après 5 minutes
      setTimeout(() => {
        pairingCodes.delete(phoneWithCountry);
        activeSessions.delete(phoneWithCountry);
        console.log(`🗑️ Session expirée pour: ${phoneWithCountry}`);
      }, 300000);
      
      console.log(`✅ Pair code généré: ${code} pour ${phoneWithCountry}`);
      console.log(`📊 Sessions actives: ${activeSessions.size}/${MAX_SESSIONS}`);
      
      return res.json({ 
        success: true, 
        code: code,
        phone: phoneWithCountry,
        expiresIn: 300,
        activeSessions: activeSessions.size,
        maxSessions: MAX_SESSIONS
      });
    } else {
      return res.status(500).json({ 
        success: false, 
        error: 'Impossible de générer le code de pairing' 
      });
    }
    
  } catch (error) {
    console.log(`❌ Erreur génération pair code: ${error.message}`);
    
    // Erreur spécifique pour "Impossible de connecter l'appareil"
    if (error.message.includes("connect") || error.message.includes("device")) {
      return res.status(500).json({ 
        success: false, 
        error: 'Impossible de connecter l\'appareil. Vérifiez que le numéro est correct sur votre appareil WhatsApp.' 
      });
    }
    
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Erreur interne du serveur' 
    });
  }
});

// Route pour servir index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Démarrer le serveur web
if (config.webEnabled !== false) {
  app.listen(WEB_PORT, () => {
    console.log(`${colors.green}🌐 Serveur web démarré sur le port ${WEB_PORT}${colors.reset}`);
    console.log(`${colors.cyan}📱 Interface disponible sur: http://localhost:${WEB_PORT}${colors.reset}`);
  });
}

// ==================== FONCTIONS UTILITAIRES ====================
async function sendFormattedMessage(sock, jid, messageText) {
  const formattedMessage = `┏━━❖ ＡＲＣＡＮＥ❖━━┓
┃ 🛡️ 𝐇𝐄𝐗✦𝐆Ａ𝐓Ｅ 𝑽_1
┃
┃ 👨‍💻 𝙳𝙴𝚅 : T.me/hextechcar
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
      await sock.sendMessage(jid, {
        image: { url: botImageUrl },
        caption: formattedMessage
      });
    } else {
      await sock.sendMessage(jid, { 
        text: formattedMessage 
      });
    }
  } catch (error) {
    console.log(`${colors.red}❌ Échec de l'envoi du message: ${error.message}${colors.reset}`);
  }
}

// ==================== GESTION DES COMMANDES ====================
class CommandHandler {
  constructor() {
    this.commands = new Map();
    this.initializeCommands();
  }

  initializeCommands() {
    try {
      console.log(`${colors.cyan}📁 Initialisation des commandes...${colors.reset}`);
      
      // Charger les commandes intégrées de base
      this.loadBuiltinCommands();
      
      // Charger depuis le dossier commands (MAINTENU)
      this.loadCommandsFromDirectory();
      
      console.log(`${colors.green}✅ ${this.commands.size} commandes chargées avec succès${colors.reset}`);
      
    } catch (error) {
      console.log(`${colors.red}❌ Erreur chargement commandes: ${error.message}${colors.reset}`);
      this.loadBuiltinCommands(); // Au moins les commandes de base
    }
  }

  loadCommandsFromDirectory() {
    try {
      const commandsDir = path.join(__dirname, 'commands');
      
      if (!fs.existsSync(commandsDir)) {
        console.log(`${colors.yellow}⚠️ Dossier commands non trouvé${colors.reset}`);
        return;
      }
      
      const files = fs.readdirSync(commandsDir).filter(file => file.endsWith('.js'));
      let loadedCount = 0;
      
      for (const file of files) {
        try {
          const commandPath = path.join(commandsDir, file);
          delete require.cache[require.resolve(commandPath)];
          const command = require(commandPath);
          
          if (command && command.name && typeof command.execute === 'function') {
            const commandName = command.name.toLowerCase();
            
            // ⚠️ SUPPRESSION DES COMMANDES SPÉCIFIQUES
            const commandsToRemove = ['quiz', 'ascii', 'hack', 'ping'];
            if (commandsToRemove.includes(commandName)) {
              console.log(`${colors.yellow}⚠️ Commande supprimée: ${commandName}${colors.reset}`);
              continue;
            }
            
            this.commands.set(commandName, command);
            loadedCount++;
            console.log(`${colors.green}✅ Commande chargée: ${colors.cyan}${command.name}${colors.reset}`);
          }
        } catch (error) {
          console.log(`${colors.yellow}⚠️ Erreur chargement ${file}: ${error.message}${colors.reset}`);
        }
      }
      
      console.log(`${colors.green}📁 ${loadedCount} commandes chargées depuis le dossier commands${colors.reset}`);
      
    } catch (error) {
      console.log(`${colors.red}❌ Erreur scan dossier commands: ${error.message}${colors.reset}`);
    }
  }

  loadBuiltinCommands() {
    // Commandes de base restantes
    const basicCommands = {
      menu: {
        name: "menu",
        description: "Affiche le menu des commandes",
        execute: async (sock, msg) => {
          const from = msg.key.remoteJid;
          const menuText = `
┏━━❖ ＡＲＣＡＮＥ ❖━━┓
┃ 🛡️ HEX✦GATE V2
┃ 👨‍💻 Dev : T.me/hextechcar
┗━━━━━━━━━━━━━━━━

【 ${msg.pushName || "Utilisateur"} 】

╭━━〔 𝚄𝚃𝙸𝙻𝙸𝚃𝙰𝙸𝚁𝙴 〕━━┈⊷
┃✰│➫ ${prefix}𝚖𝚎𝚗𝚞
┃✰│➫ ${prefix}𝚑𝚎𝚕𝚙
┃✰│➫ ${prefix}𝚜𝚝𝚊𝚝𝚞𝚜
┃✰│➫ ${prefix}𝚒𝚗𝚏𝚘
┃✰│➫ ${prefix}𝚠𝚎𝚕𝚌𝚘𝚖𝚎
╰━━━━━━━━━━━━━━━┈⊷

╭━━〔 𝙶𝚁𝙾𝚄𝙿𝙴 〕━━┈⊷
┃✰│➫ ${prefix}𝚝𝚊𝚐𝚊𝚕𝚕
┃✰│➫ ${prefix}𝚕𝚒𝚗𝚔
┃✰│➫ ${prefix}𝚒𝚗𝚏𝚘
┃✰│➫ ${prefix}𝚝𝚊𝚐𝚊𝚍𝚖𝚒𝚗
╰━━━━━━━━━━━━━━━┈⊷

╭━━〔 𝙲𝙰𝙽𝙰𝙻 𝚃𝙴𝙻𝙴𝙶𝚁𝙰𝙼 〕━━┈⊷
┃✰│➫ T.me/hextechcar
╰━━━━━━━━━━━━━━━┈⊷

*powered by HEXTECH™*`;

          await sock.sendMessage(from, {
            image: { url: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRv53_O-g3xpl_VtrctVQ0HbSUMCJ3fUkfx6l1SiUc64ag4ypnPyBR5k0s&s=10" },
            caption: menuText
          });
        }
      },
      
      help: {
        name: "help",
        description: "Affiche l'aide",
        execute: async (sock, msg) => {
          const from = msg.key.remoteJid;
          await sendFormattedMessage(sock, from, `🛠️ *AIDE HEXGATE V3*\n\nPrefix: ${prefix}\n\nTapez ${prefix}menu pour voir toutes les commandes.\n\n👑 Propriétaire: ${config.ownerNumber}`);
        }
      },
      
      status: {
        name: "status",
        description: "Affiche le statut du bot",
        execute: async (sock, msg) => {
          const from = msg.key.remoteJid;
          const activeSessionCount = activeSessions.size;
          
          const statusText = `📊 *STATUS DU BOT*\n\n🏷️ Nom: HEXGATE V3\n🔓 Mode: ${botPublic ? 'Public' : 'Privé'}\n📡 Sessions: ${activeSessionCount}/${MAX_SESSIONS}\n🌐 Web: http://localhost:${WEB_PORT}\n⏰ Uptime: ${process.uptime().toFixed(0)}s\n\n*powered by HEXTECH*`;
          
          await sendFormattedMessage(sock, from, statusText);
        }
      },
      
      info: {
        name: "info",
        description: "Informations du groupe",
        execute: async (sock, msg) => {
          const from = msg.key.remoteJid;
          
          if (!from.endsWith("@g.us")) {
            await sendFormattedMessage(sock, from, "❌ Commande réservée aux groupes");
            return;
          }
          
          try {
            const metadata = await sock.groupMetadata(from);
            const participants = metadata.participants || [];
            
            const total = participants.length;
            const admins = participants
              .filter(p => p.admin === "admin" || p.admin === "superadmin")
              .map(p => `@${p.id.split("@")[0]}`)
              .join(", ");
            
            const infoText = `
┏━━━❖ ＧＲＯＵＰ ＩＮＦＯ ❖━━━┓
┃ Nom : ${metadata.subject || "Groupe sans nom"}
┃ Membres : ${total}
┃ Admins : ${admins || "Aucun"}
┃ Description : ${metadata.desc?.toString() || "Aucune"}
┗━━━━━━━━━━━━━━━━━━━━━━┛
*powered by HEXTECH*`;
            
            await sock.sendMessage(from, { text: infoText });
            
          } catch (error) {
            console.log("info error:", error);
            await sendFormattedMessage(sock, from, "❌ Impossible de récupérer les infos");
          }
        }
      }
    };
    
    // Ajouter les commandes de base
    Object.entries(basicCommands).forEach(([name, cmd]) => {
      this.commands.set(name, cmd);
    });
    
    console.log(`${colors.green}✅ Commandes de base chargées${colors.reset}`);
  }

  async execute(commandName, sock, msg, args, context) {
    const cmd = commandName.toLowerCase();
    
    if (!this.commands.has(cmd)) {
      console.log(`${colors.yellow}⚠️ Commande inconnue: ${cmd}${colors.reset}`);
      return false;
    }
    
    const command = this.commands.get(cmd);
    
    try {
      console.log(`${colors.cyan}⚡ Exécution: ${cmd}${colors.reset}`);
      await command.execute(sock, msg, args, context);
      return true;
    } catch (error) {
      console.log(`${colors.red}❌ Erreur exécution ${cmd}: ${error.message}${colors.reset}`);
      return false;
    }
  }
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
    return false;
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
      rl.question(`${colors.cyan}📱 Entrez votre numéro WhatsApp (ex: 243XXXXXXXXX): ${colors.reset}`, (phone) => {
        resolve(phone.trim());
      });
    });
  }

  try {
    console.log(`${colors.magenta}🚀 Démarrage de HEXGATE V3...${colors.reset}`);
    
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
        console.log(`${colors.yellow}⚠️ QR Code détecté, utilisation du pairing...${colors.reset}`);
        
        const phoneNumber = await askForPhoneNumber();
        if (!phoneNumber || phoneNumber.length < 9) {
          console.log(`${colors.red}❌ Numéro invalide${colors.reset}`);
          process.exit(1);
        }

        try {
          const code = await sock.requestPairingCode(phoneNumber);
          console.log(`${colors.green}✅ Code de pairing: ${code}${colors.reset}`);
          console.log(`${colors.cyan}📱 Instructions:`);
          console.log(`${colors.cyan}1. Ouvrez WhatsApp sur votre téléphone${colors.reset}`);
          console.log(`${colors.cyan}2. Appuyez sur ⋮ (trois points)${colors.reset}`);
          console.log(`${colors.cyan}3. Sélectionnez "Appareils liés"${colors.reset}`);
          console.log(`${colors.cyan}4. Choisissez "Associer un appareil"${colors.reset}`);
          console.log(`${colors.cyan}5. Entrez ce code: ${code}${colors.reset}`);
          
          await delay(3000);
        } catch (pairError) {
          console.log(`${colors.red}❌ Erreur pairing: ${pairError.message}${colors.reset}`);
          
          // Message d'erreur spécifique
          if (pairError.message.includes("connect") || pairError.message.includes("device")) {
            console.log(`${colors.red}❌ IMPOSSIBLE DE CONNECTER L'APPAREIL${colors.reset}`);
            console.log(`${colors.yellow}⚠️ Vérifiez que:${colors.reset}`);
            console.log(`${colors.yellow}  1. Le numéro est correct sur votre appareil${colors.reset}`);
            console.log(`${colors.yellow}  2. WhatsApp est bien installé${colors.reset}`);
            console.log(`${colors.yellow}  3. Vous avez une connexion Internet${colors.reset}`);
          }
          
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
        console.log(`${colors.cyan}📊 Limite de sessions: ${MAX_SESSIONS}${colors.reset}`);
        console.log(`${colors.cyan}🌐 Interface web: http://localhost:${WEB_PORT}${colors.reset}`);
        
        botReady = true;
        
        // Envoyer confirmation au propriétaire
        try {
          const confirmMessage = `✅ *HEX-GATE CONNECTÉ*\n\n🚀 *HEXGATE V3* est en ligne!\n📊 *Sessions:* 0/${MAX_SESSIONS}\n🌐 *Interface:* http://localhost:${WEB_PORT}\n🔧 *Mode:* ${botPublic ? 'PUBLIC' : 'PRIVÉ'}`;
          
          await sock.sendMessage(OWNER_NUMBER, { text: confirmMessage });
          console.log(`${colors.green}✅ Confirmation envoyée au propriétaire${colors.reset}`);
        } catch (error) {
          console.log(`${colors.yellow}⚠️ Impossible d'envoyer message au propriétaire: ${error.message}${colors.reset}`);
        }
      }
    });

    // Gestion des messages
    sock.ev.on("messages.upsert", async ({ messages }) => {
      try {
        for (const msg of messages) {
          if (!msg.message) continue;

          const senderJid = msg.key.participant || msg.key.remoteJid;
          const isOwnerMsg = isOwner(senderJid);
          
          // Récupérer le texte du message
          let body = "";
          const messageType = Object.keys(msg.message)[0];
          
          if (messageType === "conversation") {
            body = msg.message.conversation;
          } else if (messageType === "extendedTextMessage") {
            body = msg.message.extendedTextMessage.text;
          } else if (messageType === "imageMessage") {
            body = msg.message.imageMessage?.caption || "";
          }
          
          // Traitement des commandes
          if (body.startsWith(prefix)) {
            const args = body.slice(prefix.length).trim().split(/ +/);
            const command = args.shift().toLowerCase();
            
            const context = {
              isOwner: isOwnerMsg,
              sender: senderJid,
              prefix: prefix,
              botPublic: botPublic || isOwnerMsg
            };
            
            if (botPublic || isOwnerMsg) {
              await commandHandler.execute(command, sock, msg, args, context);
            }
          }
        }
      } catch (error) {
        console.log(`${colors.red}❌ Erreur traitement message: ${error.message}${colors.reset}`);
      }
    });

    // Interface console
    rl.on("line", async (input) => {
      const args = input.trim().split(/ +/);
      const command = args.shift().toLowerCase();
      
      switch (command) {
        case "sessions":
          console.log(`${colors.cyan}📊 Sessions actives: ${activeSessions.size}/${MAX_SESSIONS}${colors.reset}`);
          console.log(`${colors.yellow}📱 Numéros:${colors.reset}`);
          activeSessions.forEach(num => {
            console.log(`${colors.yellow}  • ${num}${colors.reset}`);
          });
          break;
          
        case "status":
          console.log(`${colors.cyan}📊 STATUT DU BOT${colors.reset}`);
          console.log(`${colors.yellow}• Connecté: ${botReady ? 'OUI' : 'NON'}${colors.reset}`);
          console.log(`${colors.yellow}• Sessions: ${activeSessions.size}/${MAX_SESSIONS}${colors.reset}`);
          console.log(`${colors.yellow}• Mode: ${botPublic ? 'PUBLIC' : 'PRIVÉ'}${colors.reset}`);
          console.log(`${colors.yellow}• Port web: ${WEB_PORT}${colors.reset}`);
          console.log(`${colors.yellow}• Prefix: "${prefix}"${colors.reset}`);
          break;
          
        case "clear":
          console.clear();
          console.log(`${colors.magenta}🚀 HEXGATE V3 - Bot WhatsApp${colors.reset}`);
          break;
          
        case "exit":
          console.log(`${colors.yellow}👋 Arrêt du bot...${colors.reset}`);
          rl.close();
          process.exit(0);
          break;
          
        default:
          console.log(`${colors.yellow}⚠️ Commandes console:${colors.reset}`);
          console.log(`${colors.cyan}  • sessions - Voir les sessions actives${colors.reset}`);
          console.log(`${colors.cyan}  • status - Afficher le statut${colors.reset}`);
          console.log(`${colors.cyan}  • clear - Nettoyer la console${colors.reset}`);
          console.log(`${colors.cyan}  • exit - Quitter${colors.reset}`);
      }
    });

  } catch (error) {
    console.log(`${colors.red}❌ Erreur démarrage bot: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

// ==================== DÉMARRAGE ====================
startBot();

// ==================== EXPORTS ====================
module.exports = {
  bot: sock,
  generatePairCode: async (phone) => {
    if (!botReady || !sock) return null;
    
    // Vérifier la limite
    if (activeSessions.size >= MAX_SESSIONS) {
      throw new Error(`Limite de ${MAX_SESSIONS} sessions atteinte`);
    }
    
    try {
      const code = await sock.requestPairingCode(phone);
      
      if (code) {
        activeSessions.add(phone);
        
        // Nettoyer après 5 minutes
        setTimeout(() => {
          activeSessions.delete(phone);
        }, 300000);
        
        return code;
      }
      
      return null;
    } catch (error) {
      throw error;
    }
  },
  isBotReady: () => botReady,
  config,
  activeSessionsCount: () => activeSessions.size
};
