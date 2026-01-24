import assert from 'assert';
import fs from 'fs';
console.log('Running Countdown Modal Tests...');
const html = fs.readFileSync('app.js', 'utf8');
const hasInputs = html.includes('tkCountdownStyle');
assert.ok(hasInputs, 'app.js should have Countdown display style inputs (in HTML string)');
console.log('Countdown Modal Tests Passed');
