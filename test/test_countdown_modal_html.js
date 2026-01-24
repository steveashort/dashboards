import assert from 'assert';
import fs from 'fs';
console.log('Running Countdown Modal HTML Tests...');
const html = fs.readFileSync('index.html', 'utf8');
const hasInputs = html.includes('name="tkCountdownStyle"');
assert.ok(hasInputs, 'index.html should have tkCountdownStyle radio inputs');
console.log('Countdown Modal HTML Tests Passed');
