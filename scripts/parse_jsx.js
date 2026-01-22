const fs = require('fs');
const parser = require('@babel/parser');
const code = fs.readFileSync('frontend/src/components/manager/ManagerStudents.jsx','utf8');
try {
  parser.parse(code, { sourceType: 'module', plugins: ['jsx'] });
  console.log('Parsed OK');
} catch (err) {
  console.error('Parse error:', err.message);
  console.error(err.loc);
}
