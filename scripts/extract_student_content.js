const fs = require('fs');
const path = 'frontend/src/components/manager/ManagerStudents.jsx';
let s = fs.readFileSync(path, 'utf8');
const startMarker = '{selectedStudent && (';
const endMarker = '\n        )}\n\n        {/* No student */}';
const start = s.indexOf(startMarker);
const end = s.indexOf(endMarker, start);
if (start === -1 || end === -1) { console.error('Markers not found'); process.exit(1); }
const block = s.slice(start, end);
console.log('BLOCK LENGTH', block.length);
// Extract inner div part - remove leading marker and wrapping
const innerStart = block.indexOf('<div');
const inner = block.slice(innerStart).replace(/\n\s*\)\}/, '\n');
// Build const
const constStr = `const studentContent = selectedStudent ? (\n${inner}\n) : null;\n\n  `;
// Insert const before return
const insertPoint = s.indexOf('\n  return (');
if (insertPoint === -1) { console.error('Return not found'); process.exit(1); }
const newS = s.slice(0, insertPoint) + '\n  ' + constStr + s.slice(insertPoint);
// Replace original block with {studentContent}
const newS2 = newS.replace(block + endMarker, '{studentContent}' + endMarker);
fs.writeFileSync(path, newS2);
console.log('Done');
