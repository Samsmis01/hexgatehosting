/**
 * Logger simple – compatible Render / Node.js / CommonJS
 */

function time() {
  return new Date().toISOString().replace("T", " ").split(".")[0]
}

module.exports = {
  info: (...args) => {
    console.log(`[${time()}] ℹ️ INFO :`, ...args)
  },

  warn: (...args) => {
    console.warn(`[${time()}] ⚠️ WARN :`, ...args)
  },

  error: (...args) => {
    console.error(`[${time()}] ❌ ERROR :`, ...args)
  },

  success: (...args) => {
    console.log(`[${time()}] ✅ SUCCESS :`, ...args)
  }
}
