const { retrieveRelevantInfo } = require('./ragService');
const OLLAMA_URL = 'http://localhost:11434';
const MODEL = 'llama3.2';

const SYSTEM_PROMPT = `You are a helpful, friendly, and knowledgeable assistant for "FreshMeat", a local meat shop.

IMPORTANT RULES:
1. You will be provided with specific "Retrieved Shop Information" based on the customer's question.
2. You MUST prioritize and use ONLY the provided retrieved information to answer the question.
3. If the retrieved information does not contain the answer, you MUST clearly say that you do not have that information (e.g., "I don't have that information right now, but you can call our shop at 555-0198!"). Do NOT invent or guess any answers.
4. Keep your answers concise, polite, and beginner-friendly.`;

async function checkOllamaHealth() {
  try {
    const res = await fetch(`${OLLAMA_URL}/api/version`);
    return res.ok;
  } catch (err) {
    return false;
  }
}

async function generateChatResponse(userMessage) {
  // RAG Step: Retrieve relevant shop data
  const retrievedData = retrieveRelevantInfo(userMessage);

  // RAG Step: Provide retrieved information to the LLM
  const prompt = `${SYSTEM_PROMPT}\n\n=== RETRIEVED SHOP INFORMATION ===\n${retrievedData}\n==================================\n\nCustomer: ${userMessage}\nAssistant:`;

  try {
    const response = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        prompt: prompt,
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.response;
  } catch (error) {
    console.error('Ollama fetch error:', error);
    if (error.cause && error.cause.code === 'ECONNREFUSED') {
      throw new Error('Ollama is not running. Please start Ollama.');
    }
    throw new Error('Ollama is not running or the model is unavailable. Please check your Ollama setup.');
  }
}

module.exports = { generateChatResponse, checkOllamaHealth, MODEL };
