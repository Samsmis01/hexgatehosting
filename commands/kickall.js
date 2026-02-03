const fs = require('fs');
const messageFormatter = require('../lib/messageFormatter');
const path = require('path');

async function execute(sock, msg, args, context) {

  const from = msg.key.remoteJid;

  const sender = msg.key.participant || from;

  

  // Vérifier si c'est un groupe

  if (!from.endsWith('@g.us')) {

    await sock.sendMessage(from, {

      text: "❌ *Cette commande ne fonctionne que dans les groupes.*"

    });

    return;

  }

  

  try {

    // Récupérer les informations du groupe

    const groupMetadata = await sock.groupMetadata(from);

    const participants = groupMetadata.participants;

    

    // Vérifier si l'expéditeur est admin

    const senderParticipant = participants.find(p => p.id === sender);

    const isAdmin = senderParticipant && ['admin', 'superadmin'].includes(senderParticipant.admin);

    

    if (!isAdmin) {

      await sock.sendMessage(from, {

        text: "❌ *Permission refusée*\nSeuls les administrateurs peuvent utiliser cette commande."

      });

      return;

    }

    

    // Identifier les membres non-admin à expulser (exclure l'expéditeur)

    const membersToKick = participants.filter(p => !p.admin && p.id !== sender);

    

    if (membersToKick.length === 0) {

      await sock.sendMessage(from, {

        text: "ℹ️ *Aucun membre à expulser*\nIl n'y a que des administrateurs dans ce groupe."

      });

      return;

    }

    

    // Message d'avertissement avec compte à rebours

    const warningMessage = `⚠️ *ATTENTION - EXPULSION MASSIVE*\n━━━━━━━━━━━━━━━━━━━━━━━\n👤 *Déclenché par:* @${sender.split('@')[0]}\n👥 *Cible:* ${membersToKick.length} membres non-admins\n👑 *Admins protégés:* ${participants.filter(p => p.admin).length}\n━━━━━━━━━━━━━━━━━━━━━━━\n⏱️ *Début dans 3 secondes...*\n\n🚫 *Tous les membres non-admins seront expulsés !*`;

    

    await sock.sendMessage(from, {

      text: warningMessage,

      mentions: [sender]

    });

    

    // Compte à rebours

    await sleep(1000);

    await sock.sendMessage(from, { text: "⏱️ *2...*" });

    

    await sleep(1000);

    await sock.sendMessage(from, { text: "⏱️ *1...*" });

    

    await sleep(1000);

    

    // Début de l'expulsion

    await sock.sendMessage(from, {

      text: `🚀 *DÉBUT DE L'EXPULSION*\n\nExpulsion de ${membersToKick.length} membres en cours...`

    });

    

    let kickedCount = 0;

    let failedCount = 0;

    

    // Expulser par lots de 4

    for (let i = 0; i < membersToKick.length; i += 4) {

      const batch = membersToKick.slice(i, i + 4);

      

      try {

        await sock.groupParticipantsUpdate(

          from,

          batch.map(m => m.id),

          "remove"

        );

        

        kickedCount += batch.length;

        

        // Mettre à jour le statut toutes les 10 expulsions

        if (kickedCount % 10 === 0) {

          await sock.sendMessage(from, {

            text: `📊 *Progression:* ${kickedCount}/${membersToKick.length} expulsés`

          });

        }

        

        // Petite pause pour éviter le rate limiting

        await sleep(800);

        

      } catch (error) {

        failedCount += batch.length;

        console.error(`❌ Erreur expulsion batch ${i}:`, error.message);

      }

    }

    

    // Résultats finaux

    const remainingAdmins = participants.filter(p => p.admin).length;

    const remainingTotal = participants.length - kickedCount;

    

    const resultMessage = `✅ *EXPULSION TERMINÉE*\n━━━━━━━━━━━━━━━━━━━━━━━\n📊 *STATISTIQUES FINALES*\n━━━━━━━━━━━━━━━━━━━━━━━\n✅ *Expulsés avec succès:* ${kickedCount}\n❌ *Échecs:* ${failedCount}\n👑 *Admins restants:* ${remainingAdmins}\n👥 *Total restant:* ${remainingTotal}\n━━━━━━━━━━━━━━━━━━━━━━━\n🎯 *Taux de réussite:* ${Math.round((kickedCount / membersToKick.length) * 100)}%\n\nLe groupe a été nettoyé avec succès ! 🧹`;

    

    await sock.sendMessage(from, { text: resultMessage });

    

    // Log dans la console

    console.log(`🚫 kickall exécuté par ${sender.split('@')[0]} dans ${from}`);

    console.log(`📊 Résultats: ${kickedCount} expulsés, ${failedCount} échecs`);

    

  } catch (error) {

    console.error("❌ Erreur kickall:", error);

    await sock.sendMessage(from, {

      text: `❌ *ERREUR CRITIQUE*\n\nL'expulsion a échoué:\n\`${error.message}\`\n\nVeuillez réessayer plus tard.`

    });

  }

}

// Fonction utilitaire pour attendre

function sleep(ms) {

  return new Promise(resolve => setTimeout(resolve, ms));

}

module.exports = {

  name: "kickall",

  description: "Expulser automatiquement tous les membres non-admins après 3 secondes d'avertissement",

  category: "admin",

  execute: execute

};