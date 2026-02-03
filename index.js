console.log('🔧 HEXGATE V3 - Vérification des dépendances...');
console.log('📦 Version correcte: @whiskeysockets/baileys');

const requiredModules = [
  '@whiskeysockets/baileys',
  'pino',
  'fs',
  'path',
  'child_process',
  'readline',
  'buffer',
  'express',
  'cors',
  'body-parser'
];

const missingModules = [];

// 📁 CHARGEMENT DE LA CONFIGURATION
const fs = require('fs');
const path = require('path');
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
      maxSessions: 10,
      webPort: 3000,
      pairingExpiry: 300
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
    botImageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyERDdGHGjmXPv_6tCBIChmD-svWkJatQlpzfxY5WqFg&s=10",
    maxSessions: 10,
    webPort: 3000,
    pairingExpiry: 300
  };
}

// Variables globales
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
const PAIRING_EXPIRY = config.pairingExpiry || 300;

// Vérifier chaque module
for (const module of requiredModules) {
  try {
    if (['fs', 'path', 'child_process', 'readline', 'buffer'].includes(module)) {
      require(module);
      console.log(`✅ ${module} - PRÉSENT (Node.js)`);
    } else if (['express', 'cors', 'body-parser'].includes(module)) {
      try {
        require.resolve(module);
        console.log(`✅ ${module} - PRÉSENT`);
      } catch {
        missingModules.push(module);
        console.log(`❌ ${module} - MANQUANT`);
      }
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
    
    const modulesToInstall = {
      '@whiskeysockets/baileys': '^6.5.0',
      'pino': '^8.19.0',
      'express': '^4.18.2',
      'cors': '^2.8.5',
      'body-parser': '^1.20.2'
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
          execSync(`npm install ${module}@${modulesToInstall[module]} --save`, { 
            stdio: 'inherit',
            cwd: process.cwd()
          });
        } catch (installError) {
          console.log(`⚠️ Tentative alternative pour ${module}...`);
          try {
            execSync(`npm install ${module} --save`, { 
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
    console.log('npm install @whiskeysockets/baileys@^6.5.0 pino@^8.19.0 express@^4.18.2 cors@^2.8.5 body-parser@^1.20.2');
    process.exit(1);
  }
}

// Import des modules
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
const readline = require("readline");
const { exec } = require("child_process");
const { Buffer } = require("buffer");

// Import Express pour l'API web
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

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
const WEB_FOLDER = "./web";

// Vérification des dossiers
const folders = [VV_FOLDER, DELETED_MESSAGES_FOLDER, COMMANDS_FOLDER, VIEW_ONCE_FOLDER, DELETED_IMAGES_FOLDER, WEB_FOLDER];
for (const folder of folders) {
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder, { recursive: true });
    console.log(`${colors.green}✅ Dossier ${folder} créé${colors.reset}`);
  } else {
    console.log(`${colors.cyan}📁 Dossier ${folder} déjà existant${colors.reset}`);
  }
}

// Variables globales pour l'API
let sock = null;
let botReady = false;
let pairingCodes = new Map();
let activeSessions = new Map();

// ============================================
// 📦 SYSTÈME DE COMMANDES SIMPLIFIÉ
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
      
      // Charger les commandes du dossier
      this.loadCommandsFromDirectory();
      
      this.commandsLoaded = true;
      console.log(`${colors.green}✅ ${this.commands.size} commandes chargées avec succès${colors.reset}`);
      
      // Afficher la liste des commandes chargées
      console.log(`${colors.cyan}📋 Commandes disponibles:${colors.reset}`);
      this.commands.forEach((cmd, name) => {
        console.log(`  ${colors.green}•${colors.reset} ${prefix}${name}`);
      });
      
    } catch (error) {
      this.commandsLoaded = false;
      console.log(`${colors.red}❌ Erreur chargement commandes: ${error.message}${colors.reset}`);
    }
  }

  loadCommandsFromDirectory() {
    try {
      const commandsDir = path.join(__dirname, 'commands');
      
      if (!fs.existsSync(commandsDir)) {
        console.log(`${colors.yellow}⚠️ Dossier commands non trouvé${colors.reset}`);
        return;
      }
      
      const commandFiles = fs.readdirSync(commandsDir).filter(file => file.endsWith('.js'));
      
      for (const file of commandFiles) {
        try {
          const commandPath = path.join(commandsDir, file);
          delete require.cache[require.resolve(commandPath)];
          
          const command = require(commandPath);
          
          if (command && command.name && typeof command.execute === 'function') {
            const commandName = command.name.toLowerCase();
            
            // Filtrer les commandes non désirées
            if (['quiz', 'ascii', 'hack', 'ping'].includes(commandName)) {
              console.log(`${colors.yellow}⚠️ Commande filtrée ignorée: ${commandName}${colors.reset}`);
              continue;
            }
            
            this.commands.set(commandName, command);
            console.log(`${colors.green}✅ Commande chargée: ${colors.cyan}${command.name}${colors.reset}`);
          }
        } catch (error) {
          console.log(`${colors.yellow}⚠️ Erreur chargement ${file}: ${error.message}${colors.reset}`);
        }
      }
    } catch (error) {
      console.log(`${colors.red}❌ Erreur scan dossier commands: ${error.message}${colors.reset}`);
    }
  }

  async execute(commandName, sock, msg, args, context) {
    const cmd = commandName.toLowerCase();
    
    if (!this.commands.has(cmd)) {
      console.log(`${colors.yellow}⚠️ Commande inconnue: ${cmd}${colors.reset}`);
      
      // Envoyer message d'erreur si mode public
      if (context?.botPublic) {
        try {
          await sock.sendMessage(msg.key.remoteJid, { 
            text: `❌ Commande "${cmd}" non reconnue. Tapez ${prefix}menu pour voir la liste des commandes.`
          });
        } catch (error) {
          console.log(`${colors.yellow}⚠️ Impossible d'envoyer réponse${colors.reset}`);
        }
      }
      return false;
    }
    
    const command = this.commands.get(cmd);
    
    try {
      console.log(`${colors.cyan}⚡ Exécution: ${cmd} par ${context?.sender || 'Inconnu'}${colors.reset}`);
      await command.execute(sock, msg, args, context);
      console.log(`${colors.green}✅ Commande exécutée avec succès: ${cmd}${colors.reset}`);
      return true;
    } catch (error) {
      console.log(`${colors.red}❌ Erreur exécution ${cmd}: ${error.message}${colors.reset}`);
      console.error(error);
      
      // Envoyer message d'erreur
      try {
        await sock.sendMessage(msg.key.remoteJid, {
          text: `❌ *ERREUR D'EXÉCUTION*\n\nCommande: ${prefix}${cmd}\nErreur: ${error.message}\n\nContactez le propriétaire si le problème persiste.`
        });
      } catch (sendError) {
        console.log(`${colors.yellow}⚠️ Impossible d'envoyer message d'erreur${colors.reset}`);
      }
      
      return false;
    }
  }

  getCommandList() {
    return Array.from(this.commands.keys());
  }
}

// ============================================
// 🌐 API WEB POUR PAIRING
// ============================================
function setupWebAPI() {
  const app = express();
  app.use(cors());
  app.use(bodyParser.json());
  
  // Servir les fichiers statiques du dossier web
  app.use(express.static(path.join(__dirname, 'web')));
  
  // Route pour vérifier le statut du bot
  app.get('/api/bot-status', (req, res) => {
    res.json({
      ready: botReady,
      activeSessions: activeSessions.size,
      maxSessions: MAX_SESSIONS,
      botName: sock?.user?.name || 'HEX✦GATE',
      version: 'V2'
    });
  });
  
  // Route pour générer un code pair
  app.post('/api/generate-pair-code', async (req, res) => {
    try {
      const { phone } = req.body;
      
      if (!phone) {
        return res.status(400).json({ 
          success: false, 
          error: 'Numéro de téléphone requis' 
        });
      }
      
      // Vérifier le format du numéro
      const cleanPhone = phone.replace(/\D/g, '');
      if (cleanPhone.length < 9) {
        return res.status(400).json({ 
          success: false, 
          error: 'Numéro de téléphone invalide' 
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
        if (session.expiry > Date.now()) {
          return res.json({ 
            success: true, 
            code: session.code,
            expiresIn: Math.floor((session.expiry - Date.now()) / 1000)
          });
        } else {
          activeSessions.delete(cleanPhone);
        }
      }
      
      // Générer le code pair
      if (!sock || !botReady) {
        return res.status(503).json({ 
          success: false, 
          error: 'Bot non connecté' 
        });
      }
      
      const code = await sock.requestPairingCode(cleanPhone);
      
      if (!code) {
        return res.status(500).json({ 
          success: false, 
          error: 'Échec de génération du code' 
        });
      }
      
      // Enregistrer la session
      const session = {
        code: code,
        phone: cleanPhone,
        timestamp: Date.now(),
        expiry: Date.now() + (PAIRING_EXPIRY * 1000)
      };
      
      activeSessions.set(cleanPhone, session);
      pairingCodes.set(cleanPhone, code);
      
      // Nettoyer après expiration
      setTimeout(() => {
        activeSessions.delete(cleanPhone);
        pairingCodes.delete(cleanPhone);
        console.log(`${colors.yellow}🗑️ Session expirée pour ${cleanPhone}${colors.reset}`);
      }, PAIRING_EXPIRY * 1000);
      
      console.log(`${colors.green}✅ Code pair généré: ${code} pour ${cleanPhone}${colors.reset}`);
      
      res.json({
        success: true,
        code: code,
        expiresIn: PAIRING_EXPIRY
      });
      
    } catch (error) {
      console.log(`${colors.red}❌ Erreur API generate-pair-code: ${error.message}${colors.reset}`);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  });
  
  // Route pour lister les sessions actives (admin seulement)
  app.get('/api/sessions', (req, res) => {
    const sessions = Array.from(activeSessions.entries()).map(([phone, session]) => ({
      phone: phone,
      code: session.code,
      timestamp: new Date(session.timestamp).toLocaleString(),
      expiresIn: Math.floor((session.expiry - Date.now()) / 1000)
    }));
    
    res.json({
      total: activeSessions.size,
      max: MAX_SESSIONS,
      sessions: sessions
    });
  });
  
  // Route pour supprimer une session (admin seulement)
  app.delete('/api/sessions/:phone', (req, res) => {
    const { phone } = req.params;
    const cleanPhone = phone.replace(/\D/g, '');
    
    if (activeSessions.has(cleanPhone)) {
      activeSessions.delete(cleanPhone);
      pairingCodes.delete(cleanPhone);
      res.json({ success: true, message: `Session ${cleanPhone} supprimée` });
    } else {
      res.status(404).json({ success: false, error: 'Session non trouvée' });
    }
  });
  
  // Route par défaut pour servir index.html
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'web', 'index.html'));
  });
  
  // Démarrer le serveur
  const PORT = config.webPort || 3000;
  app.listen(PORT, () => {
    console.log(`${colors.green}🌐 Interface web démarrée sur http://localhost:${PORT}${colors.reset}`);
  });
  
  return app;
}

// ============================================
// 📱 FONCTION POUR ENVOYER DES MESSAGES FORMATÉS
// ============================================
async function sendFormattedMessage(sock, jid, messageText) {
  const formattedMessage = `┏━━❖ ＡＲＣＡＮＥ❖━━┓
┃ 🛡️ 𝐇𝐄𝐗✦𝐆Ａ𝐓Ｅ 𝑽_2
┃
┃ ${messageText}
┗━━━━━━━━━━━━━━━┛

┏━━【𝚃𝙴𝙻𝙴𝙶𝚁𝙰𝙼 】━━┓
┃
┃ ${telegramLink}
┃
┗━━━━━━━━━━━━━━━┛`;

  try {
    await sock.sendMessage(jid, { text: formattedMessage });
  } catch (error) {
    console.log(`${colors.red}❌ Erreur envoi message: ${error.message}${colors.reset}`);
  }
}

// ============================================
// ⚡ FONCTION PRINCIPALE DU BOT
// ============================================
async function startBot() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  try {
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
        console.log(`${colors.cyan}📊 Commandes chargées: ${commandHandler.getCommandList().length}${colors.reset}`);
        
        botReady = true;
        
        // 🔴 CONFIRMATION DE CONNEXION AU PROPRIÉTAIRE
        try {
          const commandCount = commandHandler.getCommandList().length;
          const confirmationMessage = `✅ *HEX✦GATE CONNECTÉ*\n\n🚀 Bot en ligne!\n📊 Commandes chargées: ${commandCount}\n🔓 Mode: ${botPublic ? 'Public' : 'Privé'}\n🌐 Interface: http://localhost:${config.webPort || 3000}\n🔗 Sessions max: ${MAX_SESSIONS}\n\n📋 Commandes disponibles:\n${commandHandler.getCommandList().slice(0, 10).map(cmd => `• ${prefix}${cmd}`).join('\n')}${commandCount > 10 ? `\n... et ${commandCount - 10} autres` : ''}`;
          
          await sock.sendMessage(OWNER_NUMBER, { text: confirmationMessage });
          console.log(`${colors.green}✅ Confirmation envoyée au propriétaire: ${OWNER_NUMBER}${colors.reset}`);
        } catch (error) {
          console.log(`${colors.red}❌ Impossible d'envoyer message au propriétaire: ${error.message}${colors.reset}`);
        }
        
        // Démarrer l'API web
        setupWebAPI();
      }
    });
    
    // 📨 TRAITEMENT DES MESSAGES
    sock.ev.on("messages.upsert", async ({ messages }) => {
      try {
        const msg = messages[0];
        if (!msg.message) return;
        
        const from = msg.key.remoteJid;
        const senderJid = msg.key.participant || msg.key.remoteJid;
        const isOwnerMessage = senderJid === OWNER_NUMBER;
        
        // Récupérer le texte du message
        let body = "";
        const messageType = Object.keys(msg.message)[0];
        
        if (messageType === "conversation") {
          body = msg.message.conversation;
        } else if (messageType === "extendedTextMessage") {
          body = msg.message.extendedTextMessage.text;
        } else if (messageType === "imageMessage") {
          body = msg.message.imageMessage?.caption || "";
        } else {
          return;
        }
        
        // Traitement des commandes
        if (body.startsWith(prefix)) {
          const args = body.slice(prefix.length).trim().split(/ +/);
          const command = args.shift().toLowerCase();
          
          const context = {
            isOwner: isOwnerMessage,
            sender: senderJid,
            prefix: prefix,
            botPublic: botPublic || isOwnerMessage
          };
          
          if (botPublic || isOwnerMessage) {
            await commandHandler.execute(command, sock, msg, args, context);
          } else {
            console.log(`${colors.yellow}⚠️ Commande ignorée (mode privé): ${command} par ${senderJid}${colors.reset}`);
          }
        }
        
        // Commandes spéciales du propriétaire
        if (isOwnerMessage) {
          if (body === `${prefix}status`) {
            const commandList = commandHandler.getCommandList();
            await sendFormattedMessage(sock, from, 
              `📊 *STATUS*\n\n` +
              `🔓 Mode: ${botPublic ? 'Public' : 'Privé'}\n` +
              `📊 Commandes: ${commandList.length}\n` +
              `🌐 Sessions: ${activeSessions.size}/${MAX_SESSIONS}\n` +
              `🔗 Web: http://localhost:${config.webPort || 3000}\n` +
              `✅ Bot: ${botReady ? 'Connecté' : 'Déconnecté'}`
            );
          }
          
          if (body === `${prefix}public`) {
            botPublic = true;
            config.botPublic = true;
            fs.writeFileSync('./config.json', JSON.stringify(config, null, 2));
            await sendFormattedMessage(sock, from, `✅ Mode public activé`);
          }
          
          if (body === `${prefix}private`) {
            botPublic = false;
            config.botPublic = false;
            fs.writeFileSync('./config.json', JSON.stringify(config, null, 2));
            await sendFormattedMessage(sock, from, `🔒 Mode privé activé`);
          }
          
          if (body === `${prefix}sessions`) {
            const sessions = Array.from(activeSessions.values());
            let sessionsText = `📱 *Sessions actives* (${sessions.length}/${MAX_SESSIONS})\n\n`;
            
            if (sessions.length === 0) {
              sessionsText += "Aucune session active";
            } else {
              sessions.forEach((session, index) => {
                const expiresIn = Math.floor((session.expiry - Date.now()) / 1000);
                sessionsText += `${index + 1}. ${session.phone}\n   Code: ${session.code}\n   Expire dans: ${expiresIn}s\n\n`;
              });
            }
            
            await sendFormattedMessage(sock, from, sessionsText);
          }
          
          if (body === `${prefix}reload`) {
            commandHandler.initializeCommands();
            await sendFormattedMessage(sock, from, `🔄 Commandes rechargées: ${commandHandler.getCommandList().length}`);
          }
          
          if (body === `${prefix}menu`) {
            const commandList = commandHandler.getCommandList();
            const commandsText = commandList.slice(0, 20).map(cmd => `• ${prefix}${cmd}`).join('\n');
            const moreCommands = commandList.length > 20 ? `\n... et ${commandList.length - 20} autres` : '';
            
            await sendFormattedMessage(sock, from, 
              `📋 *MENU DES COMMANDES*\n\n` +
              `🔓 Mode: ${botPublic ? 'Public' : 'Privé'}\n` +
              `📊 Total: ${commandList.length} commandes\n\n` +
              `${commandsText}${moreCommands}\n\n` +
              `🌐 Interface web: http://localhost:${config.webPort || 3000}`
            );
          }
        }
        
      } catch (error) {
        console.log(`${colors.red}❌ Erreur traitement message: ${error.message}${colors.reset}`);
      }
    });

    // 🚀 INTERFACE CONSOLE
    rl.on("line", (input) => {
      const args = input.trim().split(/ +/);
      const command = args.shift().toLowerCase();
      
      switch (command) {
        case "status":
          console.log(`${colors.cyan}📊 STATUT DU BOT${colors.reset}`);
          console.log(`${colors.yellow}• Connecté: ${botReady ? 'OUI' : 'NON'}${colors.reset}`);
          console.log(`${colors.yellow}• Mode: ${botPublic ? 'PUBLIC' : 'PRIVÉ'}${colors.reset}`);
          console.log(`${colors.yellow}• Commandes: ${commandHandler.getCommandList().length}${colors.reset}`);
          console.log(`${colors.yellow}• Sessions: ${activeSessions.size}/${MAX_SESSIONS}${colors.reset}`);
          console.log(`${colors.yellow}• Propriétaire: ${config.ownerNumber}${colors.reset}`);
          console.log(`${colors.yellow}• Web: http://localhost:${config.webPort || 3000}${colors.reset}`);
          break;
          
        case "sessions":
          console.log(`${colors.cyan}📱 SESSIONS ACTIVES${colors.reset}`);
          if (activeSessions.size === 0) {
            console.log(`${colors.yellow}Aucune session active${colors.reset}`);
          } else {
            activeSessions.forEach((session, phone) => {
              const expiresIn = Math.floor((session.expiry - Date.now()) / 1000);
              console.log(`${colors.green}${phone}: ${session.code} (expire dans ${expiresIn}s)${colors.reset}`);
            });
          }
          break;
          
        case "commands":
          console.log(`${colors.cyan}📋 COMMANDES CHARGÉES${colors.reset}`);
          const commandList = commandHandler.getCommandList();
          commandList.forEach((cmd, index) => {
            console.log(`${colors.green}${index + 1}. ${prefix}${cmd}${colors.reset}`);
          });
          console.log(`${colors.yellow}Total: ${commandList.length} commandes${colors.reset}`);
          break;
          
        case "clear":
          console.clear();
          console.log(`
${colors.magenta}╔══════════════════════════════════════════════════╗
║         WHATSAPP BOT - HEXGATE EDITION          ║
╠══════════════════════════════════════════════════╣
║${colors.green} ✅ BOT AVEC INTERFACE WEB DE PAIRING      ${colors.magenta}║
║${colors.green} ✅ LIMITE DE ${MAX_SESSIONS} SESSIONS SIMULTANÉES ${colors.magenta}║
║${colors.green} ✅ CHARGEMENT DES COMMANDES DU DOSSIER     ${colors.magenta}║
╚══════════════════════════════════════════════════╝${colors.reset}
`);
          break;
          
        case "reload":
          commandHandler.initializeCommands();
          console.log(`${colors.green}✅ Commandes rechargées${colors.reset}`);
          break;
          
        case "exit":
          console.log(`${colors.yellow}👋 Arrêt du bot...${colors.reset}`);
          rl.close();
          process.exit(0);
          break;
          
        default:
          console.log(`${colors.yellow}⚠️ Commandes console:${colors.reset}`);
          console.log(`${colors.cyan}  • status - Afficher statut${colors.reset}`);
          console.log(`${colors.cyan}  • sessions - Lister sessions${colors.reset}`);
          console.log(`${colors.cyan}  • commands - Lister commandes${colors.reset}`);
          console.log(`${colors.cyan}  • reload - Recharger commandes${colors.reset}`);
          console.log(`${colors.cyan}  • clear - Nettoyer console${colors.reset}`);
          console.log(`${colors.cyan}  • exit - Quitter${colors.reset}`);
      }
    });

  } catch (error) {
    console.log(`${colors.red}❌ Erreur démarrage bot: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

// ============================================
// 🚀 DÉMARRAGE
// ============================================
console.log(`
${colors.magenta}╔══════════════════════════════════════════════════╗
║         WHATSAPP BOT - HEXGATE EDITION          ║
╠══════════════════════════════════════════════════╣
║${colors.green} ✅ BOT AVEC INTERFACE WEB DE PAIRING      ${colors.magenta}║
║${colors.green} ✅ LIMITE DE ${MAX_SESSIONS} SESSIONS SIMULTANÉES ${colors.magenta}║
║${colors.green} ✅ CHARGEMENT DES COMMANDES DU DOSSIER     ${colors.magenta}║
╚══════════════════════════════════════════════════╝${colors.reset}
`);

startBot();
