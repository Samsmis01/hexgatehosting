this.commands.set("demote", {
  name: "demote",
  description: "Rétrograder un admin",
  execute: async (sock, msg, args) => {
    const from = msg.key.remoteJid;
    if (!from.endsWith("@g.us")) return await sendFormattedMessage(sock, from, "❌ Groupe uniquement");

    if (!msg.mention || msg.mention.length === 0) return await sendFormattedMessage(sock, from, "❌ Mentionne un membre à rétrograder");

    try {
      const metadata = await sock.groupMetadata(from);
      const participants = metadata.participants || [];
      const botJid = sock.user.id.split(":")[0] + "@s.whatsapp.net";
      const botIsAdmin = participants.some(p => p.id === botJid && (p.admin === "admin" || p.admin === "superadmin"));

      if (!botIsAdmin) return await sendFormattedMessage(sock, from, "❌ Je dois être admin pour démote");

      let success = 0, fail = 0;
      for (const userId of msg.mention) {
        try {
          await sock.groupParticipantsUpdate(from, [userId], "demote");
          success++;
        } catch {
          fail++;
        }
      }

      await sendFormattedMessage(sock, from, `✅ Démotion terminée\n✔️ Rétrogradés : ${success}\n❌ Échecs : ${fail}`);
    } catch (err) {
      console.log("Demote error:", err);
      await sendFormattedMessage(sock, from, "❌ Erreur lors de la démotion");
    }
  }
});