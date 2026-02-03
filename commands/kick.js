const messageFormatter = require('../lib/messageFormatter');

const fs = require('fs');

const path = require('path');

async function execute(sock, msg, args, context) {

  const from = msg.key.remoteJid;

  const sender = msg.key.participant || from;

  

  if (!from.endsWith('@g.us')) return;

  

  try {

    const groupMetadata = await sock.groupMetadata(from);

    const participants = groupMetadata.participants;

    

    const senderParticipant = participants.find(p => p.id === sender);

    const isAdmin = senderParticipant && ['admin', 'superadmin'].includes(senderParticipant.admin);

    

    if (!isAdmin) return;

    

    if (!msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length) return;

    

    const mentionedJid = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];

    const targetUser = participants.find(p => p.id === mentionedJid);

    

    if (!targetUser) return;

    if (targetUser.id === sender) return;

    if (targetUser.admin) return;

    

    const targetName = targetUser.notify || targetUser.id.split('@')[0];

    

    try {

      await sock.groupParticipantsUpdate(from, [targetUser.id], "remove");

      

      await sock.sendMessage(from, {

        text: `🗑️ @${targetName} retiré.`,

        mentions: [targetUser.id]

      });

      

      console.log(`🚫 kick par ${sender.split('@')[0]} → ${targetName}\n> 𝚙𝚘𝚠𝚎𝚛𝚎𝚍 𝚋𝚢 𝙷𝙴𝚇-𝚃𝙴𝙲𝙷`);

      

    } catch (kickError) {

      // Échec silencieux

    }

    

  } catch (error) {

    // Erreur silencieuse

  }

}

module.exports = {

  name: "kick",

  description: "Kick direct et discret",

  category: "admin",

  execute: execute

};