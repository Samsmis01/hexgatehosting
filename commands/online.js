module.exports = {
  name: "online",
  description: "Affiche l'état du bot",
  execute: async ({ sock, from }) => {
    await sock.sendMessage(from, { text: "🟢 Bot en ligne" });
  }
};