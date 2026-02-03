// commands/close.js - Version corrigée

const fs = require('fs');

const path = require('path');

const closedGroups = new Map();

module.exports = {

  name: "close",

  description: "Fermer le groupe pour X minutes",

  category: "admin",

  

  execute: async function(sock, msg, args) {

    try {

      const from = msg.key.remoteJid;

      const sender = msg.key.participant || from;

      

      // Vérifier si c'est un groupe

      if (!from.endsWith('@g.us')) {

        await sock.sendMessage(from, { 

          text: "❌ Cette commande fonctionne seulement dans les groupes." 

        });

        return;

      }

      

      // Vérifier les permissions admin

      const groupMetadata = await sock.groupMetadata(from);

      const participants = groupMetadata.participants;

      const senderParticipant = participants.find(p => p.id === sender);

      const isAdmin = senderParticipant && ['admin', 'superadmin'].includes(senderParticipant.admin);

      

      if (!isAdmin) {

        await sock.sendMessage(from, { 

          text: "❌ Seuls les administrateurs peuvent utiliser cette commande." 

        });

        return;

      }

      

      // Si pas d'argument, montrer l'aide

      if (!args || args.length === 0) {

        await sock.sendMessage(from, {

          text: `🔒 *COMMANDE CLOSE*\n\nUtilisation:\n• \`.close 5\` - Ferme le groupe pour 5 minutes\n• \`.close 60\` - Ferme pour 1 heure\n• \`.open\` - Ouvre le groupe manuellement\n\nExemple: \`.close 10\``

        });

        return;

      }

      

      const command = args[0].toLowerCase();

      

      // Commande .close X

      if (command === 'close' && args[1]) {

        const minutes = parseInt(args[1]);

        

        if (isNaN(minutes) || minutes < 1 || minutes > 1440) {

          await sock.sendMessage(from, { 

            text: "❌ Durée invalide. Utilisez un nombre entre 1 et 1440 minutes (24h).\nExemple: `.close 10`" 

          });

          return;

        }

        

        // Message de confirmation

        await sock.sendMessage(from, {

          text: `🔒 *FERMETURE DU GROUPE*\n━━━━━━━━━━━━━━━━━━━━━━━\n⏰ *Durée:* ${minutes} minute${minutes > 1 ? 's' : ''}\n👤 *Par:* Admin\n🕒 *Réouverture automatique à:* ${new Date(Date.now() + (minutes * 60000)).toLocaleTimeString()}\n━━━━━━━━━━━━━━━━━━━━━━━\n\nLe groupe est maintenant en mode "annonces seulement".`

        });

        

        // Fermer le groupe (mode annonce seulement)

        await sock.groupSettingUpdate(from, 'announcement');

        

        // Programmer la réouverture automatique

        const timerId = setTimeout(async () => {

          try {

            await sock.groupSettingUpdate(from, 'not_announcement');

            await sock.sendMessage(from, { 

              text: `🔓 *GROUPE RÉOUVERT*\n━━━━━━━━━━━━━━━━━━━━━━━\n✅ Le groupe a été réouvert automatiquement après ${minutes} minute${minutes > 1 ? 's' : ''}.\n🕒 *Heure:* ${new Date().toLocaleTimeString()}\n━━━━━━━━━━━━━━━━━━━━━━━` 

            });

            closedGroups.delete(from);

          } catch (error) {

            console.error("❌ Erreur réouverture:", error);

          }

        }, minutes * 60000);

        

        // Sauvegarder les infos du timer

        closedGroups.set(from, {

          timerId: timerId,

          closedAt: Date.now(),

          reopenAt: Date.now() + (minutes * 60000),

          closedBy: sender,

          duration: minutes

        });

        

        console.log(`✅ Groupe ${from} fermé pour ${minutes} minutes`);

        return;

      }

      

      // Commande .open

      if (command === 'open') {

        // Annuler le timer si existant

        if (closedGroups.has(from)) {

          clearTimeout(closedGroups.get(from).timerId);

          closedGroups.delete(from);

        }

        

        // Ouvrir le groupe

        await sock.groupSettingUpdate(from, 'not_announcement');

        

        await sock.sendMessage(from, {

          text: `🔓 *GROUPE OUVERT*\n━━━━━━━━━━━━━━━━━━━━━━━\n✅ Le groupe a été rouvert manuellement.\n👤 *Par:* Admin\n🕒 *Heure:* ${new Date().toLocaleTimeString()}\n━━━━━━━━━━━━━━━━━━━━━━━`

        });

        

        console.log(`✅ Groupe ${from} ouvert manuellement`);

        return;

      }

      

      // Commande non reconnue

      await sock.sendMessage(from, {

        text: "❌ Commande non reconnue.\nUtilisez:\n• `.close 5` (ferme 5 minutes)\n• `.open` (ouvre le groupe)"

      });

      

    } catch (error) {

      console.error("❌ Erreur commande close:", error);

      

      // Essayer d'envoyer un message d'erreur

      try {

        await sock.sendMessage(msg.key.remoteJid, {

          text: `❌ Erreur lors de l'exécution de la commande:\n${error.message}`

        });

      } catch (e) {}

    }

  }

};