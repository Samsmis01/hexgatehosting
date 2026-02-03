const logger = require('../lib/logger');
const ownerManager = require('../lib/ownerManager');
const commandHandler = require('../lib/commandHandler');
const messageFormatter = require('../lib/messageFormatter');
module.exports = {
  name: "hextech",
  execute: async (sock, msg) => {
    const from = msg.key.remoteJid;

    await sock.sendMessage(from, {
      interactiveMessage: {
        header: {
          hasMediaAttachment: true,
          imageMessage: {
            url: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTZ1i7XIDDTRn01oToPCdQ4e5oCgZex2Iw1xg&s" // ton image
          }
        },
        body: {
          text: `┏━━❖ ＡＲＣＡＮＥ ❖━━┓
┃ 🛡️ HEX✦GATE
┃ 👨‍💻 Dev : @shimmerAC
┗━━━━━━━━━━━━━━━┛

*HEXTECH OFFICIEL*

🚀 Canal officiel HEXTECH  
📢 Scripts • Bots • Sécurité • Astuces  
🔥 Mises à jour en temps réel  

_Rejoins la communauté maintenant 👇_`
        },
        footer: {
          text: "© HEXTECH"
        },
        action: {
          buttons: [
            {
              type: "cta_url",
              displayText: "🔗 REJOINDRE HEXTECH",
              url: "https://t.me/hextechcar"
            }
          ]
        }
      }
    });
  }
};
