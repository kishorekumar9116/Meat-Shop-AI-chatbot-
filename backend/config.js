require('dotenv').config();

module.exports = {
  port: process.env.PORT || 5000,
  ai: {
    apiKey: process.env.GEMINI_API_KEY,
    model: process.env.AI_MODEL || 'gemini-2.5-flash'
  }
};
