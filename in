console.log('🔧 HEXGATE V3 - Vérification des dépendances...');
console.log('📦 Version correcte: @whiskeysockets/baileys');

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
            webEnabled: true,
            useQRCode: false
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
        webEnabled: true,
        useQRCode: false
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
const WEB_PORT = config.webPort || 3000;
const USE_QR_CODE = config.useQRCode || false;

console.log('📋 Configuration chargée:');
console.log(`  • Prefix: ${prefix}`);
console.log(`  • Owner: ${OWNER_NUMBER}`);
console.log(`  • Mode: ${botPublic ? 'Public' : 'Privé'}`);
console.log(`  • Max Sessions: ${MAX_SESSIONS}`);
console.log(`  • Web Port: ${WEB_PORT}`);
console.log(`  • QR Code: ${USE_QR_CODE ? 'Activé' : 'Désactivé'}`);

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

// Vérifier chaque module
for (const module of requiredModules) {
    try {
        if (['fs', 'path', 'child_process', 'readline', 'buffer'].includes(module)) {
            require(module);
            console.log(`✅ ${module} - PRÉSENT (Node.js)`);
        } else if (module === 'express' || module === 'cors') {
            require.resolve(module);
            console.log(`✅ ${module} - PRÉSENT`);
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
                start: 'node index.js'
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
        
        const installCmd = `npm install ${missingModules.map(m => `${m}@${modulesToInstall[m] || 'latest'}`).join(' ')}`;
        console.log(`📦 Commande: ${installCmd}`);
        
        try {
            execSync(installCmd, { 
                stdio: 'inherit',
                cwd: process.cwd()
            });
        } catch (installError) {
            console.log(`⚠️ Tentative alternative...`);
            try {
                execSync('npm install', { 
                    stdio: 'inherit',
                    cwd: process.cwd() 
                });
            } catch (e) {
                console.log(`❌ Échec installation: ${e.message}`);
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
        process.exit(1);
    }
}

const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    Browsers
} = require("@whiskeysockets/baileys");
const P = require("pino");
const fs = require("fs");
const path = require("path");
const express = require('express');
const cors = require('cors');

// ==================== CONFIGURATION API ====================
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// ⚡ VARIABLES GLOBALES
let sock = null;
let botReady = false;
let pairingCodes = new Map();
let activeSessions = new Set();
let currentQR = null;
let connectionOpen = false;

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
    const isReady = botReady && sock !== null && connectionOpen;
    
    res.json({
        ready: isReady,
        activeSessions: activeSessionCount,
        maxSessions: MAX_SESSIONS,
        status: isReady ? 'online' : 'offline',
        message: isReady ? 
            `Bot connecté (${activeSessionCount}/${MAX_SESSIONS} sessions)` : 
            'Bot non connecté',
        useQRCode: USE_QR_CODE,
        connectionOpen: connectionOpen
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
        
        // Vérifier si le bot est connecté
        if (!connectionOpen || !sock) {
            return res.status(503).json({ 
                success: false, 
                error: 'Bot non connecté à WhatsApp. Veuillez attendre la connexion.' 
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
        
        console.log(`${colors.cyan}📱 Génération pair code pour: ${phoneWithCountry}${colors.reset}`);
        
        try {
            // Générer le code de pairing
            const code = await sock.requestPairingCode(phoneWithCountry);
            
            if (!code) {
                throw new Error('Aucun code généré');
            }
            
            // Ajouter la session
            activeSessions.add(phoneWithCountry);
            
            // Stocker temporairement (5 minutes)
            pairingCodes.set(phoneWithCountry, {
                code: code,
                timestamp: Date.now(),
                expiresAt: Date.now() + 300000
            });
            
            // Nettoyer après 5 minutes
            setTimeout(() => {
                if (pairingCodes.has(phoneWithCountry)) {
                    pairingCodes.delete(phoneWithCountry);
                    activeSessions.delete(phoneWithCountry);
                    console.log(`${colors.yellow}🗑️ Session expirée pour: ${phoneWithCountry}${colors.reset}`);
                }
            }, 300000);
            
            console.log(`${colors.green}✅ Pair code généré: ${code} pour ${phoneWithCountry}${colors.reset}`);
            console.log(`${colors.cyan}📊 Sessions actives: ${activeSessions.size}/${MAX_SESSIONS}${colors.reset}`);
            
            return res.json({ 
                success: true, 
                code: code,
                phone: phoneWithCountry,
                expiresIn: 300,
                activeSessions: activeSessions.size,
                maxSessions: MAX_SESSIONS,
                message: `Code pair généré avec succès pour ${phoneWithCountry}`
            });
            
        } catch (pairError) {
            console.log(`${colors.red}❌ Erreur génération pair code: ${pairError.message}${colors.reset}`);
            
            // Vérifier le type d'erreur
            if (pairError.message.includes('not registered')) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Numéro WhatsApp non enregistré. Vérifiez que le numéro est bien utilisé sur WhatsApp.' 
                });
            } else if (pairError.message.includes('timeout') || pairError.message.includes('connect')) {
                return res.status(500).json({ 
                    success: false, 
                    error: 'Timeout de connexion. Vérifiez votre connexion Internet et réessayez.' 
                });
            } else if (pairError.message.includes('device')) {
                return res.status(500).json({ 
                    success: false, 
                    error: 'Problème de connexion au téléphone. Assurez-vous que WhatsApp est ouvert sur le téléphone.' 
                });
            }
            
            return res.status(500).json({ 
                success: false, 
                error: `Erreur: ${pairError.message}` 
            });
        }
        
    } catch (error) {
        console.log(`${colors.red}❌ Erreur API generate-pair-code: ${error.message}${colors.reset}`);
        
        return res.status(500).json({ 
            success: false, 
            error: error.message || 'Erreur interne du serveur' 
        });
    }
});

// Route pour obtenir le QR code (si activé)
app.get('/api/qr-code', (req, res) => {
    if (!USE_QR_CODE) {
        return res.status(400).json({ 
            success: false, 
            error: 'QR code non activé dans la configuration' 
        });
    }
    
    res.json({
        success: true,
        qrCode: currentQR,
        ready: connectionOpen
    });
});

// Route pour servir index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Route pour les fichiers statiques
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// Démarrer le serveur web
if (config.webEnabled !== false) {
    app.listen(WEB_PORT, () => {
        console.log(`${colors.green}🌐 Serveur web démarré sur le port ${WEB_PORT}${colors.reset}`);
        console.log(`${colors.cyan}📱 Interface disponible sur: http://localhost:${WEB_PORT}${colors.reset}`);
        console.log(`${colors.cyan}📱 Pair code endpoint: http://localhost:${WEB_PORT}/api/generate-pair-code${colors.reset}`);
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
            
            // Charger depuis le dossier commands
            this.loadCommandsFromDirectory();
            
            console.log(`${colors.green}✅ ${this.commands.size} commandes chargées avec succès${colors.reset}`);
            
        } catch (error) {
            console.log(`${colors.red}❌ Erreur chargement commandes: ${error.message}${colors.reset}`);
            this.loadBuiltinCommands();
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
                        
                        // Supprimer les commandes spécifiées
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

                    try {
                        await sock.sendMessage(from, {
                            image: { url: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRv53_O-g3xpl_VtrctVQ0HbSUMCJ3fUkfx6l1SiUc64ag4ypnPyBR5k0s&s=10" },
                            caption: menuText
                        });
                    } catch (error) {
                        await sock.sendMessage(from, { text: menuText });
                    }
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
                        await sendFormattedMessage(sock, from, "❌ Impossible de récupérer les infos");
                    }
                }
            }
        };
        
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

// ==================== DÉMARRAGE DU BOT ====================
async function startBot() {
    try {
        console.log(`${colors.magenta}🚀 Démarrage de HEXGATE V3...${colors.reset}`);
        console.log(`${colors.cyan}🖥️  Browser: Ubuntu Chrome (Baileys Pairing)${colors.reset}`);
        
        const { state, saveCreds } = await useMultiFileAuthState("auth_info_baileys");
        const { version } = await fetchLatestBaileysVersion();
        
        const socketConfig = {
            version,
            logger: P({ level: logLevel }),
            auth: state,
            browser: Browsers.ubuntu("Chrome"),
            markOnlineOnConnect: alwaysOnline,
            syncFullHistory: false,
            printQRInTerminal: USE_QR_CODE, // QR code seulement si activé
            connectTimeoutMs: 60000,
            keepAliveIntervalMs: 30000
        };
        
        console.log(`${colors.cyan}📱 Mode: ${USE_QR_CODE ? 'QR Code' : 'Pairing Code'}${colors.reset}`);
        console.log(`${colors.cyan}🔧 Configuration socket créée${colors.reset}`);
        
        sock = makeWASocket(socketConfig);
        const commandHandler = new CommandHandler();

        sock.ev.on("creds.update", saveCreds);

        sock.ev.on("connection.update", async (update) => {
            const { connection, lastDisconnect, qr } = update;
            
            // Stocker le QR code si disponible
            if (qr && USE_QR_CODE) {
                currentQR = qr;
                console.log(`${colors.green}📱 QR Code généré${colors.reset}`);
                console.log(`${colors.cyan}📱 Scannez le QR code avec WhatsApp${colors.reset}`);
            }
            
            if (connection === "close") {
                connectionOpen = false;
                botReady = false;
                const reason = new Error(lastDisconnect?.error)?.output?.statusCode;
                console.log(`${colors.red}❌ Déconnecté, code: ${reason || 'Inconnu'}${colors.reset}`);
                
                if (reason === DisconnectReason.loggedOut) {
                    console.log(`${colors.yellow}🗑️ Suppression des données d'authentification...${colors.reset}`);
                    try {
                        const authDir = path.join(__dirname, 'auth_info_baileys');
                        if (fs.existsSync(authDir)) {
                            fs.rmSync(authDir, { recursive: true, force: true });
                            console.log(`${colors.green}✅ Données supprimées${colors.reset}`);
                        }
                    } catch (error) {
                        console.log(`${colors.yellow}⚠️ Erreur suppression données: ${error.message}${colors.reset}`);
                    }
                }
                
                console.log(`${colors.yellow}🔄 Reconnexion dans 5 secondes...${colors.reset}`);
                setTimeout(() => {
                    startBot();
                }, 5000);
                
            } else if (connection === "connecting") {
                console.log(`${colors.cyan}🔄 Connexion en cours...${colors.reset}`);
                connectionOpen = false;
                
            } else if (connection === "open") {
                connectionOpen = true;
                botReady = true;
                console.log(`${colors.green}✅ Connecté à WhatsApp!${colors.reset}`);
                console.log(`${colors.cyan}🔓 Mode: ${botPublic ? 'PUBLIC' : 'PRIVÉ'}${colors.reset}`);
                console.log(`${colors.cyan}📊 Limite de sessions: ${MAX_SESSIONS}${colors.reset}`);
                console.log(`${colors.cyan}🌐 Interface web: http://localhost:${WEB_PORT}${colors.reset}`);
                console.log(`${colors.green}📱 Prêt à générer des codes pair!${colors.reset}`);
                
                currentQR = null; // Nettoyer le QR code
                
                // Envoyer confirmation au propriétaire
                try {
                    const confirmMessage = `✅ *HEX-GATE CONNECTÉ*\n\n🚀 *HEXGATE V3* est en ligne!\n📊 *Sessions:* 0/${MAX_SESSIONS}\n🌐 *Interface:* http://localhost:${WEB_PORT}\n🔧 *Mode:* ${botPublic ? 'PUBLIC' : 'PRIVÉ'}\n📱 *Méthode:* ${USE_QR_CODE ? 'QR Code' : 'Pairing Code'}\n🖥️  *Browser:* Ubuntu Chrome`;
                    
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
                    if (body && body.startsWith(prefix)) {
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
        process.stdin.on('data', (input) => {
            const text = input.toString().trim();
            
            if (text === 'sessions') {
                console.log(`${colors.cyan}📊 Sessions actives: ${activeSessions.size}/${MAX_SESSIONS}${colors.reset}`);
                if (activeSessions.size > 0) {
                    activeSessions.forEach(num => {
                        const codeInfo = pairingCodes.get(num);
                        console.log(`${colors.yellow}  • ${num} - Code: ${codeInfo?.code || 'N/A'}${colors.reset}`);
                    });
                } else {
                    console.log(`${colors.yellow}  Aucune session active${colors.reset}`);
                }
            } else if (text === 'status') {
                console.log(`${colors.cyan}📊 STATUT DU BOT${colors.reset}`);
                console.log(`${colors.yellow}• Connecté: ${connectionOpen ? 'OUI' : 'NON'}${colors.reset}`);
                console.log(`${colors.yellow}• Socket: ${sock ? 'OK' : 'NULL'}${colors.reset}`);
                console.log(`${colors.yellow}• Bot Ready: ${botReady ? 'OUI' : 'NON'}${colors.reset}`);
                console.log(`${colors.yellow}• Sessions: ${activeSessions.size}/${MAX_SESSIONS}${colors.reset}`);
                console.log(`${colors.yellow}• Mode: ${botPublic ? 'PUBLIC' : 'PRIVÉ'}${colors.reset}`);
                console.log(`${colors.yellow}• Port web: ${WEB_PORT}${colors.reset}`);
                console.log(`${colors.yellow}• Prefix: "${prefix}"${colors.reset}`);
                console.log(`${colors.yellow}• QR Code: ${USE_QR_CODE ? 'ACTIVÉ' : 'DÉSACTIVÉ'}${colors.reset}`);
                console.log(`${colors.yellow}• Browser: Ubuntu Chrome${colors.reset}`);
            } else if (text === 'clear') {
                console.clear();
                console.log(`${colors.magenta}🚀 HEXGATE V3 - Bot WhatsApp${colors.reset}`);
                console.log(`${colors.cyan}🖥️  Browser: Ubuntu Chrome (Baileys Pairing)${colors.reset}`);
            } else if (text === 'exit') {
                console.log(`${colors.yellow}👋 Arrêt du bot...${colors.reset}`);
                process.exit(0);
            } else if (text === 'restart') {
                console.log(`${colors.yellow}🔄 Redémarrage du bot...${colors.reset}`);
                setTimeout(() => {
                    startBot();
                }, 2000);
            } else if (text) {
                console.log(`${colors.yellow}⚠️ Commandes console: sessions, status, clear, restart, exit${colors.reset}`);
            }
        });

        console.log(`${colors.green}✅ Bot initialisé avec succès${colors.reset}`);
        console.log(`${colors.cyan}📝 Attente de connexion WhatsApp...${colors.reset}`);

    } catch (error) {
        console.log(`${colors.red}❌ Erreur démarrage bot: ${error.message}${colors.reset}`);
        console.error(error);
        
        // Tentative de redémarrage après 10 secondes
        console.log(`${colors.yellow}🔄 Nouvelle tentative dans 10 secondes...${colors.reset}`);
        setTimeout(() => {
            startBot();
        }, 10000);
    }
}

// ==================== GESTION DES SIGNALS ====================
process.on('SIGINT', () => {
    console.log('\n' + `${colors.yellow}👋 Arrêt du bot...${colors.reset}`);
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n' + `${colors.yellow}👋 Arrêt du bot...${colors.reset}`);
    process.exit(0);
});

process.on('uncaughtException', (error) => {
    console.log(`${colors.red}❌ Exception non capturée: ${error.message}${colors.reset}`);
    console.error(error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.log(`${colors.red}❌ Rejet non géré: ${reason}${colors.reset}`);
});

// ==================== DÉMARRAGE ====================
startBot();

// ==================== EXPORTS ====================
module.exports = {
    bot: sock,
    generatePairCode: async (phone) => {
        if (!botReady || !sock || !connectionOpen) {
            throw new Error('Bot non connecté');
        }
        
        if (activeSessions.size >= MAX_SESSIONS) {
            throw new Error(`Limite de ${MAX_SESSIONS} sessions atteinte`);
        }
        
        try {
            const code = await sock.requestPairingCode(phone);
            
            if (code) {
                activeSessions.add(phone);
                
                setTimeout(() => {
                    activeSessions.delete(phone);
                }, 300000);
                
                return code;
            }
            
            throw new Error('Impossible de générer le code');
        } catch (error) {
            throw error;
        }
    },
    isBotReady: () => botReady && connectionOpen,
    config,
    activeSessionsCount: () => activeSessions.size,
    getActiveSessions: () => Array.from(activeSessions),
    getConnectionStatus: () => connectionOpen
};
