const express = require('express');
const router = express.Router();
const axios = require('axios');
const { auth } = require('../middleware/auth');

// POST /api/utils/check-url
// Body: { url: string }
// Returns: { ok: boolean, status: number, statusText?: string }
router.post('/check-url', auth, async (req, res) => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ message: 'Invalid URL' });
    }

    // Basic URL validation
    let parsed;
    try {
      parsed = new URL(url);
    } catch (err) {
      return res.status(400).json({ message: 'Invalid URL format' });
    }

        // Use robust checker to determine accessibility
    const { checkUrlAccessible } = require('../utils/urlChecker');
    const result = await checkUrlAccessible(url);
    // Normalize response
    return res.json({ ok: !!result.ok, status: result.status || null, contentType: result.contentType || null, reason: result.reason || null });
  } catch (error) {
    console.error('Check URL error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
