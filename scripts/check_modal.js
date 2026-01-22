const fs = require('fs');
const path = 'frontend/src/components/manager/ManagerStudents.jsx';
const s = fs.readFileSync(path, 'utf8');
const start = s.indexOf('<Modal');
const end = s.indexOf('</Modal>') + '</Modal>'.length;
const snippet = s.slice(start, end);
console.log('---SNIPPET START---');
console.log(snippet);
console.log('---SNIPPET END---');
let counts = { '{':0,'}':0,'(':0,')':0,'[':0,']':0 };
for (let ch of snippet) { if (counts.hasOwnProperty(ch)) counts[ch]++; }
console.log('counts', counts);
// Balanced check
const check = (obj) => {
  for (const k of Object.keys(obj)) {
    if (obj[k] % 2 !== 0) console.log('Unbalanced', k, obj[k]);
  }
}
check(counts);
