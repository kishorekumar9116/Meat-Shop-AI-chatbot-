const OLLAMA_URL = 'http://localhost:11434';
const MODEL = 'llama3.2';

const SYSTEM_PROMPT = `You are a helpful, friendly, and knowledgeable assistant for "FreshMeat", a local meat shop.
You can answer questions about:
- Chicken (whole, breast, wings, minced, etc.)
- Mutton (curry cut, minced, chops, etc.)
- Fish (rohu, catla, salmon, prawns, etc.)
- Meat varieties (goat, lamb, etc.)
- Shop timings: Monday to Sunday, 8:00 AM to 9:00 PM.
- Available products: Fresh and marinated meats.
- Prices: Competitive daily prices. (Give typical estimates if asked: Chicken ~$5/lb, Mutton ~$10/lb, Fish ~$8/lb).
- Delivery: Free home delivery within 5 miles for orders over $20. Delivery takes 30-45 minutes.
- Location: 123 Main Street, Downtown.
- Ordering process: Customers can order via the website or by calling 555-0198.

IMPORTANT RULES:
1. If a customer asks something outside of this information, you MUST clearly say that the information is unavailable.
2. Keep your answers concise, polite, and beginner-friendly.`;

async function checkOllamaHealth() {
  try {
    const res = await fetch(`${OLLAMA_URL}/api/version`);
    return res.ok;
  } catch (err) {
    return false;
  }
}

async function generateChatResponse(userMessage) {
  const prompt = `${SYSTEM_PROMPT}\n\nCustomer: ${userMessage}\nAssistant:`;

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
