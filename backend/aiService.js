const { retrieveRelevantInfo } = require('./ragService');
const OLLAMA_URL = 'http://localhost:11434';
const MODEL = 'llama3.2';

const SYSTEM_PROMPT = `You are a helpful, friendly, and knowledgeable assistant for "FreshMeat", a local meat shop.

IMPORTANT RULES:
1. You will be provided with specific "Retrieved Shop Information" based on the customer's question.
2. You MUST prioritize and use ONLY the provided retrieved information to answer the question.
3. If the retrieved information does not contain the answer, you MUST clearly say that you do not have that information. Do NOT invent answers.
4. Keep your answers concise, polite, and beginner-friendly.
5. Do not repeat questions that the customer has already answered.
6. The customer can type in English, Tamil, or Hindi. You MUST respond in the SAME language the customer used.
7. You must remember the customer's current product selection, variety, quantity, and budget from the Conversation History.

CONVERSATION FLOWS:

CHICKEN FLOW:
- If the customer asks for chicken, ask: "What type of chicken do you want?" and show these options as a bulleted list: Boneless, With Skin, Without Skin, Chicken Breast, Chicken Leg, Chicken Wings, Curry Cut.
- After they select the type, ask: "How many kg do you want?"
- Do not ask for type if they already specified it (e.g., "I want 2 kg boneless chicken").

MUTTON & OTHER MEATS FLOW:
- If the customer asks for Mutton, Mutton Liver, Beef, Pork, Kaadai, or Duck Meat, directly ask: "How many kg do you want?" (Do NOT ask for type).

FISH FLOW:
- If the customer asks for fish without specifying the variety, ask: "What type of fish do you want?" and show options as a bulleted list: Dam Fish, Marine Fish.
- If they select Dam Fish, display the complete list of dam/freshwater fish from the retrieved information.
- If they select Marine Fish, display the complete list of marine fish from the retrieved information.
- After they select a specific fish, ask: "Do you want to order by kg or by price?" (Show options: By kg, By Price).
- If they select "By kg", ask: "How many kg do you want?"
- If they select "By price", ask: "What is your budget?" and calculate the approximate quantity using the actual shop price if available.

EGG FLOW:
- If the customer asks for "egg" or "eggs", assume Broiler Chicken Egg and ask: "How many pieces do you want?" (Eggs are ALWAYS pieces, not kg).
- If the customer asks for "Naatu Kozhi Mutta" or Country Chicken Eggs, ask: "How many pieces do you want?"`;

async function checkOllamaHealth() {
  try {
    const res = await fetch(`${OLLAMA_URL}/api/version`);
    return res.ok;
  } catch (err) {
    return false;
  }
}

async function generateChatResponse(userMessage, history = []) {
  // RAG Step: Retrieve relevant shop data
  const retrievedData = retrieveRelevantInfo(userMessage);

  let historyText = "";
  if (history && history.length > 0) {
    historyText = "=== CONVERSATION HISTORY ===\n";
    history.forEach(msg => {
      // Don't duplicate the final user message here
      if (msg.role !== 'system') {
        historyText += `${msg.role === 'user' ? 'Customer' : 'Assistant'}: ${msg.content}\n`;
      }
    });
    historyText += "============================\n\n";
  }

  // RAG Step: Provide retrieved information to the LLM
  const prompt = `${SYSTEM_PROMPT}\n\n=== RETRIEVED SHOP INFORMATION ===\n${retrievedData}\n==================================\n\n${historyText}Customer: ${userMessage}\nAssistant:`;

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
