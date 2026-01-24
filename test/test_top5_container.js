import assert from 'assert';
import fs from 'fs';
console.log('Running Top 5 Container Tests...');
const html = fs.readFileSync('index.html', 'utf8');
const hasContainer = html.includes('id="top5Container"');
assert.ok(hasContainer, 'index.html should include #top5Container');
console.log('Top 5 Container Tests Passed');
