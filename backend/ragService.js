const fs = require('fs');
const path = require('path');

function retrieveRelevantInfo(userQuery) {
  // Load the structured knowledge base
  const dataPath = path.join(__dirname, 'knowledge_base.json');
  const kb = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  
  const query = userQuery.toLowerCase();
  let relevantContext = [];

  // Simple RAG-style keyword retrieval
  // Identify relevant information based on customer question
  if (query.match(/time|open|close|address|location|where|contact|phone|email/i)) {
    relevantContext.push(`Shop Information: ${JSON.stringify(kb.shop_info)}`);
  }
  
  if (query.match(/chicken|poultry/i)) {
    relevantContext.push(`Chicken Products: ${JSON.stringify(kb.chicken_products)}`);
  }
  
  if (query.match(/mutton|goat|lamb|keema/i)) {
    relevantContext.push(`Mutton Products: ${JSON.stringify(kb.mutton_products)}`);
  }
  
  if (query.match(/fish|prawn|salmon|rohu|catla|seafood/i)) {
    relevantContext.push(`Fish Products: ${JSON.stringify(kb.fish_products)}`);
  }
  
  if (query.match(/other|beef|turkey/i)) {
    relevantContext.push(`Other Meat Products: ${JSON.stringify(kb.other_meat_products)}`);
  }
  
  if (query.match(/deliver|shipping|bring|home/i)) {
    relevantContext.push(`Delivery Information: ${JSON.stringify(kb.delivery_information)}`);
  }
  
  if (query.match(/order|buy|purchase/i)) {
    relevantContext.push(`Ordering Information: ${JSON.stringify(kb.ordering_information)}`);
  }
  
  if (query.match(/halal|marinat|card|pay|question|faq/i)) {
    relevantContext.push(`Frequently Asked Questions: ${JSON.stringify(kb.frequently_asked_questions)}`);
  }

  // If no specific category matched, provide general shop info and a list of available categories
  if (relevantContext.length === 0) {
    relevantContext.push(`Shop Information: ${JSON.stringify(kb.shop_info)}`);
    relevantContext.push(`We sell: Chicken, Mutton, Fish, and Other Specialty Meats.`);
  }

  return relevantContext.join('\n\n');
}

module.exports = { retrieveRelevantInfo };
