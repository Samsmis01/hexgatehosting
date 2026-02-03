
module.exports = {
  name: "ping",
  execute: async (sock, msg) => {
    const from = msg.key.remoteJid;
    const start = Date.now();
    
    await sock.sendMessage(from, {
      text: "🏓 Pong!"
    });
    
    const latency = Date.now() - start;
    await sock.sendMessage(from, {
      text: `🚀 Latence: ${latency}ms\n✅ Bot opérationnel!`
    });
  }
};
