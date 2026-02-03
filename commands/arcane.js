const fs = require('fs');

const path = require('path');

// ============================================

// 🚀 SOLUTION SANS GLOBAL.SOCK

// ============================================

// Mots interdits

const FORBIDDEN_WORDS = [

  'fdp', 'ta mère', 'salope', 'ta grand mère', 'ta chatte',

  'porno', 'xxx', 'goro', '666', 'porte-monnaie magique',

  'multiplication d\'argent', 'grand maître marabout'

];

// Stockage des avertissements par groupe

const groupWarnings = new Map();

const activeGroups = new Set();

let sockInstance = null;

let isInitialized = false;

// ============================================

// 🔧 FONCTION D'INITIALISATION AMÉLIORÉE

// ============================================

function initArcaneSystem(sock) {

  if (!sock) {

    console.error("❌ Socket non fourni");

    return;

  }

  

  sockInstance = sock;

  console.log("✅ Système Arcane initialisé");

  

  sock.ev.on('messages.upsert', async ({ messages }) => {

    try {

      const msg = messages[0];

      if (!msg.message) return;

      

      const from = msg.key.remoteJid;

      const sender = msg.key.participant || from;

      

      // Vérifier si c'est un groupe et si Arcane est actif

      if (!from.endsWith('@g.us') || !activeGroups.has(from)) return;

      

      // Ignorer les messages du bot

      if (msg.key.fromMe) return;

      

      // Récupérer le texte

      let text = '';

      if (msg.message.conversation) text = msg.message.conversation.toLowerCase();

      else if (msg.message.extendedTextMessage?.text) text = msg.message.extendedTextMessage.text.toLowerCase();

      else if (msg.message.imageMessage?.caption) text = msg.message.imageMessage.caption.toLowerCase();

      else if (msg.message.videoMessage?.caption) text = msg.message.videoMessage.caption.toLowerCase();

      

      if (!text) return;

      

      // Vérifier les mots interdits

      let foundWord = null;

      for (const word of FORBIDDEN_WORDS) {

        if (text.includes(word.toLowerCase())) {

          foundWord = word;

          break;

        }

      }

      

      if (!foundWord) return;

      

      try {

        const groupMetadata = await sock.groupMetadata(from);

        const participants = groupMetadata.participants;

        const senderParticipant = participants.find(p => p.id === sender);

        

        // Ne pas sanctionner les admins

        if (senderParticipant && senderParticipant.admin) return;

        

        // Gérer les avertissements

        if (!groupWarnings.has(from)) groupWarnings.set(from, new Map());

        const warnings = groupWarnings.get(from);

        

        const currentWarnings = warnings.get(sender) || 0;

        const newWarnings = currentWarnings + 1;

        warnings.set(sender, newWarnings);

        

        const senderName = sender.split('@')[0];

        

        // Messages d'avertissement

        const warningMessages = [

          `⚠️ *PREMIER AVERTISSEMENT*\n━━━━━━━━━━━━━━━━━━━━━━━\n👤 *Membre:* @${senderName}\n🚫 *Mot interdit:* "${foundWord}"\n📊 *Statut:* 1/3 avertissements\n━━━━━━━━━━━━━━━━━━━━━━━\n\nÉvitez les mots interdits.\n\n> 𝚙𝚘𝚠𝚎𝚛𝚎𝚍 𝚋𝚢 𝙷𝙴𝚇-𝚃𝙴𝙲𝙷`,

          `⚠️ *DEUXIÈME AVERTISSEMENT*\n━━━━━━━━━━━━━━━━━━━━━━━\n👤 *Membre:* @${senderName}\n🚫 *Mot interdit:* "${foundWord}"\n📊 *Statut:* 2/3 avertissements\n🔥 *Dernier avertissement!*\n━━━━━━━━━━━━━━━━━━━━━━━\n\n> 𝚙𝚘𝚠𝚎𝚛𝚎𝚍 𝚋𝚢 𝙷𝙴𝚇-𝚃𝙴𝙲𝙷`,

          `⚠️ *DERNIER AVERTISSEMENT*\n━━━━━━━━━━━━━━━━━━━━━━━\n👤 *Membre:* @${senderName}\n🚫 *Mot interdit:* "${foundWord}"\n📊 *Statut:* 3/3 avertissements\n💥 *Expulsion!*\n━━━━━━━━━━━━━━━━━━━━━━━\n\n> 𝚙𝚘𝚠𝚎𝚛𝚎𝚍 𝚋𝚢 𝙷𝙴𝚇-𝚃𝙴𝙲𝙷`

        ];

        

        await sock.sendMessage(from, {

          text: warningMessages[newWarnings - 1],

          mentions: [sender]

        });

        

        // Supprimer le message

        try {

          await sock.sendMessage(from, { delete: msg.key });

        } catch (e) {}

        

        // Expulser à 3 avertissements

        if (newWarnings >= 3) {

          try {

            await sock.groupParticipantsUpdate(from, [sender], "remove");

            await sock.sendMessage(from, {

              text: `🚫 *EXPULSION*\n@${senderName} pour 3 avertissements.\n\n> 𝚙𝚘𝚠𝚎𝚛𝚎𝚍 𝚋𝚢 𝙷𝙴𝚇-𝚃𝙴𝙲𝙷`,

              mentions: [sender]

            });

            warnings.delete(sender);

          } catch (e) {}

        }

        

      } catch (e) {}

      

    } catch (e) {}

  });

  

  isInitialized = true;

}

// ============================================

// 💫 COMMANDE PRINCIPALE (FONCTIONNE SANS INIT)

// ============================================

async function execute(sock, msg, args, context) {

  const from = msg.key.remoteJid;

  const sender = msg.key.participant || from;

  const senderName = sender.split('@')[0];

  

  if (!from.endsWith('@g.us')) {

    await sock.sendMessage(from, { 

      text: "❌ *Groupes seulement.*\n\n> 𝚙𝚘𝚠𝚎𝚛𝚎𝚍 𝚋𝚢 𝙷𝙴𝚇-𝚃𝙴𝙲𝙷" 

    });

    return;

  }

  

  try {

    const groupMetadata = await sock.groupMetadata(from);

    const participants = groupMetadata.participants;

    const senderParticipant = participants.find(p => p.id === sender);

    const isAdmin = senderParticipant && ['admin', 'superadmin'].includes(senderParticipant.admin);

    

    if (!isAdmin) {

      await sock.sendMessage(from, { 

        text: "❌ *Admin seulement.*\n\n> 𝚙𝚘𝚠𝚎𝚛𝚎𝚍 𝚋𝚢 𝙷𝙴𝚇-𝚃𝙴𝙲𝙷" 

      });

      return;

    }

    

    // INITIALISATION AUTOMATIQUE si pas encore faite

    if (!isInitialized && sock) {

      initArcaneSystem(sock);

      console.log("✅ Arcane auto-initialisé depuis la commande");

    }

    

    if (!args[0]) {

      const status = activeGroups.has(from) ? "🟢 *ACTIF*" : "🔴 *INACTIF*";

      const warningCount = groupWarnings.has(from) ? groupWarnings.get(from).size : 0;

      

      await sock.sendMessage(from, {

        text: `🔮 *ARCANE*\n━━━━━━━━━━━━━━━━━━━━━━━\n${status}\n📊 *Avertissements:* ${warningCount}\n📋 *Mots:* ${FORBIDDEN_WORDS.length}\n\n⚡ *Commandes:*\n• \`.arcane on\` - Activer\n• \`.arcane off\` - Désactiver\n• \`.arcane status\` - Statut\n• \`.arcane reset\` - Reset\n━━━━━━━━━━━━━━━━━━━━━━━\n\n> 𝚙𝚘𝚠𝚎𝚛𝚎𝚍 𝚋𝚢 𝙷𝙴𝚇-𝚃𝙴𝙲𝙷`

      });

      return;

    }

    

    const subCommand = args[0].toLowerCase();

    

    switch (subCommand) {

      case 'on':

        activeGroups.add(from);

        if (!groupWarnings.has(from)) groupWarnings.set(from, new Map());

        await sock.sendMessage(from, {

          text: `🔮 *ARCANE ACTIVÉ*\n━━━━━━━━━━━━━━━━━━━━━━━\n✅ *Protection activée*\n📊 *Mots surveillés:* ${FORBIDDEN_WORDS.length}\n⚠️ *Expulsion:* 3 avertissements\n━━━━━━━━━━━━━━━━━━━━━━━\n\n> 𝚙𝚘𝚠𝚎𝚛𝚎𝚍 𝚋𝚢 𝙷𝙴𝚇-𝚃𝙴𝙲𝙷`

        });

        break;

        

      case 'off':

        activeGroups.delete(from);

        await sock.sendMessage(from, {

          text: `🔮 *ARCANE DÉSACTIVÉ*\n━━━━━━━━━━━━━━━━━━━━━━━\n❌ *Protection désactivée*\n📊 *Avertissements conservés*\n━━━━━━━━━━━━━━━━━━━━━━━\n\n> 𝚙𝚘𝚠𝚎𝚛𝚎𝚍 𝚋𝚢 𝙷𝙴𝚇-𝚃𝙴𝙲𝙷`

        });

        break;

        

      case 'status':

        const isActive = activeGroups.has(from);

        const warnings = groupWarnings.get(from);

        const warningCount = warnings ? warnings.size : 0;

        

        let warningList = "Aucun";

        if (warnings && warnings.size > 0) {

          warningList = Array.from(warnings.entries())

            .map(([userId, count]) => `• @${userId.split('@')[0]}: ${count}/3`)

            .join('\n');

        }

        

        await sock.sendMessage(from, {

          text: `🔮 *STATUT*\n━━━━━━━━━━━━━━━━━━━━━━━\n${isActive ? "🟢 ACTIF" : "🔴 INACTIF"}\n📊 *Avertissements:* ${warningCount}\n👥 *Liste:*\n${warningList}\n━━━━━━━━━━━━━━━━━━━━━━━\n\n> 𝚙𝚘𝚠𝚎𝚛𝚎𝚍 𝚋𝚢 𝙷𝙴𝚇-𝚃𝙴𝙲𝙷`

        });

        break;

        

      case 'reset':

        if (groupWarnings.has(from)) {

          groupWarnings.get(from).clear();

        }

        await sock.sendMessage(from, {

          text: `🔮 *RESET*\n━━━━━━━━━━━━━━━━━━━━━━━\n✅ *Avertissements réinitialisés*\n📊 *Membres:* 0\n━━━━━━━━━━━━━━━━━━━━━━━\n\n> 𝚙𝚘𝚠𝚎𝚛𝚎𝚍 𝚋𝚢 𝙷𝙴𝚇-𝚃𝙴𝙲𝙷`

        });

        break;

        

      default:

        await sock.sendMessage(from, {

          text: "❌ *Commande inconnue*\n\n.arcane on/off/status/reset\n\n> 𝚙𝚘𝚠𝚎𝚛𝚎𝚍 𝚋𝚢 𝙷𝙴𝚇-𝚃𝙴𝙲𝙷"

        });

    }

    

  } catch (error) {

    await sock.sendMessage(from, {

      text: `❌ *Erreur*\n\n> 𝚙𝚘𝚠𝚎𝚛𝚎𝚍 𝚋𝚢 𝙷𝙴𝚇-𝚃𝙴𝙲𝙷`

    });

  }

}

// ============================================

// 📦 EXPORT

// ============================================

module.exports = {

  name: "arcane",

  description: "Protection mots interdits",

  category: "admin",

  execute: execute

};