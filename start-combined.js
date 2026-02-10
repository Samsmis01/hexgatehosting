// start-combined.js - Alternative pour démarrage local
const { exec } = require('child_process');
const fs = require('fs');

console.log(`
╔══════════════════════════════════════════════════╗
║           MOMO-ZEN COMBINED START                ║
╠══════════════════════════════════════════════════╣
║ Cette version démarre le bot ET le serveur       ║
║ ensemble. Idéal pour Render et production.       ║
╚══════════════════════════════════════════════════╝
`);

// Vérifier les fichiers
if (!fs.existsSync('index.js')) {
  console.error('❌ index.js non trouvé!');
  process.exit(1);
}

if (!fs.existsSync('server.js')) {
  console.error('❌ server.js non trouvé!');
  process.exit(1);
}

// Démarrer les deux processus
console.log('🔧 Démarrage en cours...');

const bot = exec('node index.js');
const server = exec('node server.js');

bot.stdout.on('data', (data) => {
  console.log(`[BOT] ${data}`);
});

bot.stderr.on('data', (data) => {
  console.error(`[BOT-ERR] ${data}`);
});

server.stdout.on('data', (data) => {
  console.log(`[API] ${data}`);
});

server.stderr.on('data', (data) => {
  console.error(`[API-ERR] ${data}`);
});

// Gestion d'arrêt
process.on('SIGINT', () => {
  console.log('\n🛑 Arrêt en cours...');
  bot.kill();
  server.kill();
  process.exit(0);
});

console.log(`
✅ Processus démarrés!
📱 Bot: http://localhost:3000
🌐 API: http://localhost:3000/code?number=243XXXXXXXXX
🏥 Health: http://localhost:3000/health

💡 Appuyez sur Ctrl+C pour arrêter
`);
