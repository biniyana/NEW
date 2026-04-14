import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, 'server/routes.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Replace using a simple substring replace
const oldResponse = `return "Hi, I'm Garbish, your WAIZ recycling assistant. I'm sorry, I can't answer that question, but I can help with recycling, eco-friendly tips, and anything related to the WAIZ marketplace.";`;

const newResponse = `return "Hi, I'm Garbish, the WAIZ recycling assistant. I can help with questions about recycling, eco-friendly practices, and how to use the WAIZ marketplace. Please ask something related to recycling or the WAIZ platform.";`;

if (content.includes(oldResponse)) {
  content = content.replace(oldResponse, newResponse);
  fs.writeFileSync(filePath, content);
  console.log('✅ Successfully updated the fallback response!');
} else {
  console.log('⚠️ Exact match not found, trying alternative method...');
  // Try splitting and replacing line by line, trimming the \r
  const lines = content.split('\n').map(l => l.replace(/\r$/,''));
  let updated = false;
  const newLines = lines.map((line) => {
    if (line.includes('I\'m Garbish, your WAIZ') && line.includes('I\'m sorry')) {
      console.log('✅ Found matching line');
      updated = true;
      return '    return "Hi, I\'m Garbish, the WAIZ recycling assistant. I can help with questions about recycling, eco-friendly practices, and how to use the WAIZ marketplace. Please ask something related to recycling or the WAIZ platform.";';
    }
    return line;
  });
  
  if (updated) {
    fs.writeFileSync(filePath, newLines.join('\r\n'));
    console.log('✅ Successfully updated the response!');
  }
}
