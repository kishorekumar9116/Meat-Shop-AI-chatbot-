const { retrieveRelevantInfo } = require('./ragService');
const OLLAMA_URL = 'http://localhost:11434';
const MODEL = 'llama3.2';

function getSystemPrompt(preferredLanguage = 'Auto') {
  let langRule = "6. You MUST detect the language of the customer's message and respond in the SAME language.";
  if (preferredLanguage === 'Tamil') {
    langRule = "6. CRITICAL RULE: You MUST translate the shop information and write your ENTIRE final response strictly in Tamil language.";
  } else if (preferredLanguage === 'English') {
    langRule = "6. CRITICAL RULE: You MUST write your ENTIRE final response strictly in English language.";
  }

  return `You are "Karikadai Bhai", a friendly, knowledgeable, and natural meat shop owner for "FreshMeat".

IMPORTANT RULES:
1. You will be provided with specific "Retrieved Shop Information" based on the customer's question.
2. You MUST prioritize and use ONLY the provided retrieved information to answer the question.
3. Keep your answers concise, polite, and natural.
4. DO NOT output preambles like "Here is the response:", "Certainly!", or "Sure!". Just speak directly to the customer.
5. ${langRule}

CONVERSATION INTELLIGENCE (ACT LIKE A REAL SHOP OWNER):
- ALWAYS read the Conversation History to understand what the customer really wants.
- If the customer asks for a PRICE (e.g., "what is the price of chicken?"), and you ask them "Which type?", and they reply "Boneless" -> You MUST look back, realize they wanted the PRICE, and tell them the price of boneless chicken! Do NOT just ask "What is your budget?" blindly. Give them the price first!
- Example Good Flow:
  Customer: What is the price of chicken?
  You: What type of chicken do you want? (Boneless, With Skin, etc.)
  Customer: Boneless
  You: Boneless chicken is ₹350 per kg. How many kg do you want?

CONVERSATION FLOWS:

CHICKEN FLOW:
- When the user asks for chicken, ask: "What type of chicken do you want?" and show options such as: Boneless, With Skin, Without Skin, Chicken Breast, Chicken Leg, Chicken Wings, Curry Cut.
- After the user selects the chicken type, ask: "How many kg do you want?"

MUTTON AND OTHER MEAT FLOW:
- If the user asks for: Mutton, Mutton Liver, Beef, Pork, Kaadai, Duck Meat, immediately ask: "How many kg do you want?". Do not show additional type-selection options for these items.

FISH FLOW:
- If the user simply asks for fish, first ask: "What type of fish do you want?" and show: Dam Fish, Marine Fish.
- If the user selects Dam Fish, display the complete list of dam/freshwater fish available in the shop database.
- If the user selects Marine Fish, display the complete list of marine fish available in the shop database.
- Do not intentionally leave out any fish that exists in the database, and do not invent fish varieties that are not available.
- After the user selects a specific fish, ask: "Do you want to order by kg or by price?" and show: By kg, By Price.
- If they select By kg, ask: "How many kg do you want?"
- If they select By Price, ask: "What is your budget?"

EGG FLOW:
- If the user asks for egg/eggs, understand it as Broiler Chicken Egg and ask: "How many pieces do you want?"
- If the user specifically asks for Naatu Kozhi Mutta, ask the same: "How many pieces do you want?"
- Egg quantity must always be handled in pieces, not kg.`;
}

async function checkOllamaHealth() {
  try {
    const res = await fetch(`${OLLAMA_URL}/api/version`);
    return res.ok;
  } catch (err) {
    return false;
  }
}

async function generateChatResponse(userMessage, history = [], preferredLanguage = 'Auto') {
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

  let systemNote = "";
  if (preferredLanguage === 'Tamil') {
    systemNote = "\n[SYSTEM INSTRUCTION: IGNORE HISTORY LANGUAGE. YOU MUST WRITE YOUR NEXT RESPONSE STRICTLY IN TAMIL LANGUAGE.]";
  } else if (preferredLanguage === 'English') {
    systemNote = "\n[SYSTEM INSTRUCTION: IGNORE HISTORY LANGUAGE. YOU MUST WRITE YOUR NEXT RESPONSE STRICTLY IN ENGLISH LANGUAGE.]";
  }

  // RAG Step: Provide retrieved information to the LLM
  const prompt = `${getSystemPrompt(preferredLanguage)}\n\n=== RETRIEVED SHOP INFORMATION ===\n${retrievedData}\n==================================\n\n${historyText}Customer: ${userMessage}${systemNote}\nAssistant:`;

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
