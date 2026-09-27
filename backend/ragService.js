const fs = require('fs');
const path = require('path');

function retrieveRelevantInfo(userQuery) {
  // Load the structured knowledge base
  const dataPath = path.join(__dirname, 'knowledge_base.json');
  const kb = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  
  const query = userQuery.toLowerCase();
  let relevantContext = [];

  // Match general shop details
  if (query.match(/time|open|close|address|location|where|contact|phone|email|delivery/i)) {
    relevantContext.push(`Shop Information: ${JSON.stringify(kb.shop_info)}`);
  }
  
  // Match freshwater fishes (Katla, Rohu, Jilebi, Viraal, etc.)
  if (query.match(/fish|meen|katla|kendai|rohu|mirgal|jilebi|viraal|keluthi|vilangu|dam|freshwater|aeri/i)) {
    relevantContext.push(`Dam / Freshwater Fishes: ${JSON.stringify(kb.dam_freshwater_fishes)}`);
  }
  
  // Match sea fishes (Vanjaram, Vavval, Mathi, Nethili, Eral, Nandu, etc.)
  if (query.match(/fish|meen|vanjaram|vavval|kanangeluthi|ayilai|mathi|chaalai|nethili|koduva|sheela|sankara|paarai|kaala|choorai|kanavai|eral|prawn|crab|nandu|squid|marine|sea|kadal/i)) {
    relevantContext.push(`Sea / Marine Fishes: ${JSON.stringify(kb.sea_marine_fishes)}`);
  }
  
  // Match meats and poultry (Kozhi, Mutton, Aadu, Beef, Pork, Muttai, etc.)
  if (query.match(/meat|chicken|mutton|kozhi|broiler|nattu|aadu|eeral|beef|pork|panri|duck|vaathu|quail|kaadai|egg|muttai|liver/i)) {
    relevantContext.push(`Meat & Poultry: ${JSON.stringify(kb.other_non_veg_meat)}`);
  }
  
  // Match FAQs
  if (query.match(/faq|question|fresh/i)) {
    relevantContext.push(`Frequently Asked Questions: ${JSON.stringify(kb.frequently_asked_questions)}`);
  }

  // Fallback if nothing specific matched
  if (relevantContext.length === 0) {
    relevantContext.push(`Shop Information: ${JSON.stringify(kb.shop_info)}`);
    relevantContext.push(`Available Categories: Freshwater Fish (Katla, Jilebi, etc.), Sea Fish (Vanjaram, Nethili, Eral, etc.), and Meat/Poultry (Nattu Kozhi, Mutton, Beef, etc.).`);
  }

  return relevantContext.join('\n\n');
}

module.exports = { retrieveRelevantInfo };
