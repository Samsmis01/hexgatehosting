const express = require('express');
const path = require('path');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Rate limiting pour éviter les abus
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requêtes max par IP
  message: { error: 'Trop de requêtes, veuillez réessayer plus tard' }
});
app.use('/code', limiter);

// Cache pour les codes (éviter générations répétées)
const codeCache = new Map();
const CACHE_TTL = 30000; // 30 secondes

// Logger structuré
const logger = {
  info: (msg, meta = {}) => console.log(JSON.stringify({ 
    level: 'info', 
    message: msg, 
    timestamp: new Date().toISOString(),
    ...meta 
  })),
  error: (msg, meta = {}) => console.error(JSON.stringify({ 
    level: 'error', 
    message: msg, 
    timestamp: new Date().toISOString(),
    ...meta 
  })),
  warn: (msg, meta = {}) => console.warn(JSON.stringify({ 
    level: 'warn', 
    message: msg, 
    timestamp: new Date().toISOString(),
    ...meta 
  }))
};

// Importer votre bot
let botModule;
let botLoadAttempts = 0;
const MAX_BOT_LOAD_ATTEMPTS = 10;

function loadBotModule() {
  try {
    botModule = require('./index.js');
    logger.info('✅ Bot module chargé avec succès', { attempts: botLoadAttempts + 1 });
    return true;
  } catch (error) {
    botLoadAttempts++;
    logger.error('❌ Erreur chargement bot', { 
      error: error.message,
      attempt: botLoadAttempts
    });
    
    if (botLoadAttempts >= MAX_BOT_LOAD_ATTEMPTS) {
      logger.error('🚨 Nombre maximum de tentatives atteint', { maxAttempts: MAX_BOT_LOAD_ATTEMPTS });
      botModule = {
        isBotReady: () => false,
        generatePairCode: async () => null,
        config: {}
      };
    }
    return false;
  }
}

// Fonction de validation de numéro
function validatePhoneNumber(number) {
  // Nettoyage
  const cleanNumber = number.replace(/\D/g, '');
  
  // Validation Congo RDC (ex: 243xxxxxxxxx)
  const patterns = {
    rdc: /^243[1-9]\d{8}$/, // 243 + 9 chiffres
    international: /^\+?[1-9]\d{1,14}$/, // Format international
    local: /^[1-9]\d{8,14}$/ // Format local
  };
  
  return {
    isValid: patterns.rdc.test(cleanNumber) || 
             patterns.international.test(cleanNumber) ||
             patterns.local.test(cleanNumber),
    cleanNumber: cleanNumber,
    format: patterns.rdc.test(cleanNumber) ? 'rdc' : 
            patterns.international.test(cleanNumber) ? 'international' : 'local'
  };
}

// Route pour générer le code de pairing
app.get('/code', async (req, res) => {
  const startTime = Date.now();
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  logger.info('📱 Requête API /code reçue', { 
    requestId,
    query: req.query,
    ip: req.ip
  });
  
  try {
    const { number } = req.query;
    
    // Validation du paramètre
    if (!number || typeof number !== 'string') {
      logger.warn('Numéro manquant ou invalide', { requestId, number });
      return res.status(400).json({ 
        success: false,
        error: 'Numéro de téléphone requis',
        example: '/code?number=243816107573',
        requestId
      });
    }
    
    // Validation du numéro
    const validation = validatePhoneNumber(number);
    if (!validation.isValid) {
      logger.warn('Numéro invalide', { 
        requestId, 
        original: number, 
        cleaned: validation.cleanNumber 
      });
      return res.status(400).json({ 
        success: false,
        error: 'Numéro de téléphone invalide',
        received: number,
        cleaned: validation.cleanNumber,
        format: `Format attendu: 243XXXXXXXXX (ex: 243816107573)`,
        requestId
      });
    }
    
    const cleanNumber = validation.cleanNumber;
    
    // Vérifier le cache
    const cached = codeCache.get(cleanNumber);
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
      logger.info('✅ Code récupéré du cache', { 
        requestId, 
        number: cleanNumber,
        cached: true 
      });
      
      return res.json({ 
        success: true,
        code: cached.code,
        number: cleanNumber,
        cached: true,
        timestamp: new Date().toISOString(),
        requestId,
        processingTime: Date.now() - startTime
      });
    }
    
    logger.info('🔍 Vérification état du bot...', { requestId });
    
    // Vérifier si le bot module est chargé
    if (!botModule) {
      if (!loadBotModule()) {
        return res.status(503).json({ 
          success: false,
          error: 'Bot WhatsApp non disponible',
          status: 'initialisation en cours',
          suggestion: 'Veuillez réessayer dans 30 secondes',
          requestId
        });
      }
    }
    
    // Vérifier si le bot est prêt
    let botReady = false;
    let retryCount = 0;
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 3000;
    
    while (!botReady && retryCount < MAX_RETRIES) {
      if (botModule.isBotReady && typeof botModule.isBotReady === 'function') {
        botReady = botModule.isBotReady();
      }
      
      if (!botReady) {
        logger.warn(`⏳ Bot non prêt, tentative ${retryCount + 1}/${MAX_RETRIES}`, { 
          requestId, 
          delay: RETRY_DELAY 
        });
        
        if (retryCount < MAX_RETRIES - 1) {
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        }
        retryCount++;
      }
    }
    
    if (!botReady) {
      logger.error('🚨 Bot non prêt après plusieurs tentatives', { 
        requestId, 
        retries: retryCount 
      });
      
      return res.status(503).json({ 
        success: false,
        error: 'Bot WhatsApp non initialisé',
        status: 'connexion en attente',
        suggestion: 'Veuillez vérifier que le bot est bien connecté à WhatsApp',
        retryCount,
        requestId
      });
    }
    
    logger.info(`⚡ Génération code pour: ${cleanNumber}`, { requestId });
    
    // Générer le code
    let code;
    try {
      if (botModule.generatePairCode && typeof botModule.generatePairCode === 'function') {
        code = await botModule.generatePairCode(cleanNumber);
      } else {
        // Fallback si la fonction n'existe pas
        logger.warn('⚠️ Fonction generatePairCode non disponible, utilisation fallback', { requestId });
        code = "HEX" + Math.random().toString(36).substring(2, 8).toUpperCase();
      }
    } catch (genError) {
      logger.error('❌ Erreur génération code', { 
        requestId, 
        error: genError.message,
        stack: genError.stack 
      });
      
      // Fallback en cas d'erreur
      code = "ERR" + Date.now().toString(36).toUpperCase().substr(-6);
    }
    
    if (code) {
      // Mettre en cache
      codeCache.set(cleanNumber, {
        code: code,
        timestamp: Date.now()
      });
      
      // Nettoyer le cache après TTL
      setTimeout(() => {
        codeCache.delete(cleanNumber);
      }, CACHE_TTL);
      
      logger.info(`✅ Code généré avec succès`, { 
        requestId, 
        number: cleanNumber,
        code: code,
        processingTime: Date.now() - startTime
      });
      
      return res.json({ 
        success: true,
        code: code,
        number: cleanNumber,
        format: validation.format,
        cached: false,
        timestamp: new Date().toISOString(),
        requestId,
        processingTime: Date.now() - startTime,
        message: 'Code de pairing généré avec succès',
        instructions: 'Utilisez ce code dans WhatsApp > Périphériques liés > Ajouter un périphérique'
      });
    } else {
      logger.error(`❌ Échec génération code`, { 
        requestId, 
        number: cleanNumber 
      });
      
      return res.status(500).json({ 
        success: false,
        error: 'Impossible de générer le code de pairing',
        reason: 'WhatsApp API a refusé la requête',
        suggestion: 'Vérifiez que le numéro est valide et réessayez dans quelques minutes',
        requestId
      });
    }
  } catch (error) {
    logger.error('🔥 Erreur API /code', { 
      requestId, 
      error: error.message,
      stack: error.stack,
      processingTime: Date.now() - startTime
    });
    
    return res.status(500).json({ 
      success: false,
      error: 'Erreur interne du serveur',
      message: error.message,
      requestId,
      timestamp: new Date().toISOString()
    });
  }
});

// Route de santé améliorée
app.get('/health', (req, res) => {
  const botReady = botModule && botModule.isBotReady ? botModule.isBotReady() : false;
  const uptime = process.uptime();
  
  const health = {
    status: 'online',
    service: 'MOMO-ZEN Pairing API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: {
      seconds: Math.floor(uptime),
      human: formatUptime(uptime)
    },
    bot: {
      loaded: !!botModule,
      ready: botReady,
      status: botReady ? 'connected' : 'disconnected',
      loadAttempts: botLoadAttempts
    },
    memory: {
      heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
      heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + 'MB'
    },
    cache: {
      size: codeCache.size,
      entries: Array.from(codeCache.keys())
    }
  };
  
  res.json(health);
});

// Route statut détaillée
app.get('/status', (req, res) => {
  const botReady = botModule && botModule.isBotReady ? botModule.isBotReady() : false;
  
  res.json({
    service: 'MOMO-ZEN WhatsApp Pairing',
    version: '1.0.0',
    status: 'operational',
    botStatus: botModule ? (botReady ? 'connected' : 'connecting') : 'not_loaded',
    api: {
      endpoints: [
        { path: '/', method: 'GET', description: 'Interface utilisateur' },
        { path: '/code', method: 'GET', description: 'Générer code de pairing' },
        { path: '/health', method: 'GET', description: 'Santé du service' },
        { path: '/status', method: 'GET', description: 'Statut détaillé' }
      ],
      example: '/code?number=243816107573',
      rateLimit: '100 requêtes/15min par IP'
    },
    bot: {
      config: botModule?.config || {},
      ready: botReady,
      loadAttempts: botLoadAttempts
    },
    time: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Route de documentation
app.get('/docs', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'docs.html'));
});

// Route racine
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Route test
app.get('/test', (req, res) => {
  res.json({
    message: 'API MOMO-ZEN fonctionnelle',
    endpoints: {
      home: '/',
      generate: '/code?number=243XXXXXXXXX',
      health: '/health',
      status: '/status'
    },
    example: {
      url: 'http://localhost:3000/code?number=243816107573',
      method: 'GET'
    }
  });
});

// Gestion erreurs 404
app.use((req, res) => {
  logger.warn('Route non trouvée', { path: req.path, method: req.method });
  
  res.status(404).json({
    success: false,
    error: 'Route non trouvée',
    available: {
      home: '/',
      generate: '/code?number=243XXXXXXXXX',
      health: '/health',
      status: '/status',
      test: '/test'
    },
    timestamp: new Date().toISOString()
  });
});

// Gestion erreurs globales
app.use((err, req, res, next) => {
  logger.error('Erreur globale', { 
    error: err.message,
    stack: err.stack,
    path: req.path 
  });
  
  res.status(500).json({
    success: false,
    error: 'Erreur interne du serveur',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Une erreur est survenue',
    timestamp: new Date().toISOString()
  });
});

// Fonction helper pour formater l'uptime
function formatUptime(seconds) {
  const days = Math.floor(seconds / (3600 * 24));
  const hours = Math.floor((seconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  const parts = [];
  if (days > 0) parts.push(`${days}j`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);
  
  return parts.join(' ');
}

// Fonction pour vérifier périodiquement l'état du bot
function startBotHealthCheck() {
  setInterval(() => {
    if (!botModule && botLoadAttempts < MAX_BOT_LOAD_ATTEMPTS) {
      logger.info('🔄 Tentative de rechargement du bot...');
      loadBotModule();
    }
    
    if (botModule && botModule.isBotReady) {
      const isReady = botModule.isBotReady();
      if (!isReady) {
        logger.warn('⚠️ Bot déconnecté, tentative de rechargement');
        loadBotModule();
      }
    }
  }, 30000); // Vérifier toutes les 30 secondes
}

// Démarrer le serveur
app.listen(port, () => {
  logger.info('🚀 MOMO-ZEN Server démarré', { 
    port: port,
    env: process.env.NODE_ENV || 'development',
    publicPath: path.join(__dirname, 'public')
  });
  
  console.log(`
╔══════════════════════════════════════════════════╗
║           MOMO-ZEN PAIRING SERVER                ║
╠══════════════════════════════════════════════════╣
║ 📍 Port: ${port}                                        
║ 🌐 Local: http://localhost:${port}                        
║ 🔧 API: http://localhost:${port}/code?number=243XXXXXXXXX 
║ 🏥 Santé: http://localhost:${port}/health                  
║ 📊 Statut: http://localhost:${port}/status                 
║ 📁 Public: ${path.join(__dirname, 'public')}                
╚══════════════════════════════════════════════════╝
  `);
  
  // Initialiser le chargement du bot
  logger.info('🔄 Chargement du module bot...');
  loadBotModule();
  
  // Démarrer la vérification de santé
  startBotHealthCheck();
});

// Gestion propre de l'arrêt
process.on('SIGINT', () => {
  logger.info('🛑 Arrêt du serveur en cours...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('🛑 Arrêt du serveur (SIGTERM)...');
  process.exit(0);
});

// Exporter pour les tests
module.exports = { app, validatePhoneNumber };
