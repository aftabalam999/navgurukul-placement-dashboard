const AIService = require('../services/aiService');

(async () => {
  try {
    const ai = new AIService(null);
    const url = 'https://drive.google.com/file/d/1xqZP5efP0VHVKsqXDJ32UcTaNR-e3mgU/view?usp=drive_link';
    console.log('Testing extract from', url);
    const text = await ai.extractFromGoogleDrive(url);
    console.log('Extracted text length:', text.length);
    console.log('Preview:', text.slice(0, 500));
  } catch (e) {
    console.error('Test failed:', e.message);
    console.error(e);
  }
})();