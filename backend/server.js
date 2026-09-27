const express = require('express');
const cors = require('cors');
const { generateChatResponse, checkOllamaHealth, MODEL } = require('./aiService');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', async (req, res) => {
  const isOllamaUp = await checkOllamaHealth();
  if (isOllamaUp) {
    res.json({ success: true, ollama: true, model: MODEL });
  } else {
    res.status(503).json({ success: false, ollama: false, error: 'Ollama is not running.' });
  }
});

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ success: false, error: 'Invalid message format.' });
    }

    const aiResponse = await generateChatResponse(message);
    
    res.json({ success: true, response: aiResponse });
  } catch (error) {
    console.error('Chat endpoint error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Sorry, I am having trouble connecting right now. Please try again later.' 
    });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
  console.log(`Connected to local Ollama on http://localhost:11434 with model ${MODEL}`);
});
