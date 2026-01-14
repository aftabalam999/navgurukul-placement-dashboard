const Settings = require('../models/Settings');
const AIService = require('../services/aiService');

(async () => {
  try {
    const settings = await Settings.getSettings();
    const apiKey = settings.aiConfig?.googleApiKey;
    console.log('AI key present:', !!apiKey);
    const ai = new AIService(apiKey);
    const status = await ai.getStatus();
    console.log('AI status:', status);
  } catch (e) {
    console.error('Failed to check AI status:', e.message);
  }
})();