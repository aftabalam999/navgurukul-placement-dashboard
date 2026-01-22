const fs = require('fs');
const path = 'frontend/src/components/manager/ManagerStudents.jsx';
const s = fs.readFileSync(path, 'utf8');
const start = s.indexOf('<Modal');
const end = s.indexOf('</Modal>') + '</Modal>'.length;
const snippet = s.slice(start, end);

// Find unmatched <div>
const regexOpen = /<div\b/g;
const regexClose = /<\/div>/g;
let matchOpen, matchClose;
let opens = [];
let closes = [];
while ((matchOpen = regexOpen.exec(snippet)) !== null) opens.push({ idx: matchOpen.index });
while ((matchClose = regexClose.exec(snippet)) !== null) closes.push({ idx: matchClose.index });

// Simple stack match by order
let stack = [];
let tokens = [];
opens.forEach(o => tokens.push({ idx: o.idx, type: 'open' }));
closes.forEach(c => tokens.push({ idx: c.idx, type: 'close' }));
// sort by index
tokens.sort((a,b)=>a.idx-b.idx);
for (const t of tokens) {
  if (t.type === 'open') stack.push(t.idx);
  else {
    if (stack.length === 0) {
      console.log('Extra closing at', t.idx); break;
    } else stack.pop();
  }
}
if (stack.length>0) {
  console.log('Unclosed <div> at indices (first):', stack[0]);
  const pos = stack[0];
  console.log('Context:\n', snippet.slice(Math.max(0,pos-80), pos+80));
} else console.log('All <div> balanced');
