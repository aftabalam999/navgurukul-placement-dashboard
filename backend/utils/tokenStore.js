const crypto = require('crypto');

// Simple in-memory single-node token store for short-lived code exchange
// WARNING: This is in-memory and not suitable for multi-process deployments (use Redis for production)
const store = new Map();

function createTokenEntry(payload, ttlMs = 2 * 60 * 1000) {
  const code = crypto.randomBytes(16).toString('hex');
  const expiresAt = Date.now() + ttlMs;
  store.set(code, { payload, expiresAt });
  return code;
}

function consumeTokenEntry(code) {
  const entry = store.get(code);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(code);
    return null;
  }
  // Single-use
  store.delete(code);
  return entry.payload;
}

// Periodic cleanup to avoid memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (entry.expiresAt <= now) store.delete(key);
  }
}, 60 * 1000).unref();

module.exports = { createTokenEntry, consumeTokenEntry };
