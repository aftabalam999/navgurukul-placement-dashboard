const fetch = global.fetch || require('node-fetch');

async function run() {
  const apiBase = process.env.API_URL || 'http://localhost:5001/api';
  // Login
  const loginRes = await fetch(`${apiBase}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'john.doe@student.edu', password: 'password123' })
  });
  const login = await loginRes.json();
  console.log('LOGIN', loginRes.status, login);
  if (!login.token) return;
  const token = login.token;

  // Get all cycles
  const cyclesRes = await fetch(`${apiBase}/placement-cycles` , { headers: { Authorization: `Bearer ${token}` } });
  const cycles = await cyclesRes.json();
  console.log('CYCLES', cyclesRes.status, cycles.length);
  if (!cycles.length) return;

  const targetCycle = cycles[0];
  console.log('Trying to set cycle:', targetCycle._id, targetCycle.name);

  // Update my cycle
  const updateRes = await fetch(`${apiBase}/placement-cycles/my-cycle`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ cycleId: targetCycle._id })
  });
  const update = await updateRes.json();
  console.log('UPDATE', updateRes.status, update);
}

run().catch(e => { console.error(e); process.exit(1); });
