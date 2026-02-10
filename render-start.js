// render-start.js - Script de démarrage optimisé pour Render
console.log('🚀 Démarrage MOMO-ZEN sur Render...');

const { spawn } = require('child_process');
const path = require('path');

// Démarrer le bot WhatsApp en arrière-plan
console.log('1. Démarrage du bot WhatsApp...');
const botProcess = spawn('node', ['index.js'], {
  stdio: 'pipe',
  env: { ...process.env, DISABLE_QR_TERMINAL: 'true' }
});

botProcess.stdout.on('data', (data) => {
  const output = data.toString();
  if (output.includes('Connecté à WhatsApp') || output.includes('✅ Connecté')) {
    console.log('✅ Bot WhatsApp connecté!');
  }
  console.log(`[BOT] ${output}`);
});

botProcess.stderr.on('data', (data) => {
  console.error(`[BOT-ERR] ${data.toString()}`);
});

// Attendre que le bot soit prêt
setTimeout(() => {
  console.log('2. Démarrage du serveur API...');
  
  // Démarrer le serveur API
  const apiProcess = spawn('node', ['server.js'], {
    stdio: 'inherit'
  });
  
  apiProcess.on('close', (code) => {
    console.log(`Serveur API arrêté avec code: ${code}`);
    botProcess.kill();
    process.exit(code);
  });
  
}, 15000); // Attendre 15 secondes pour la connexion WhatsApp

// Gérer l'arrêt propre
process.on('SIGINT', () => {
  console.log('🛑 Arrêt en cours...');
  botProcess.kill();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('🛑 Arrêt (SIGTERM)...');
  botProcess.kill();
  process.exit(0);
});
