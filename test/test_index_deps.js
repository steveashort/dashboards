import assert from 'assert';
import fs from 'fs';

console.log('Running Index Dependencies Tests...');

const html = fs.readFileSync('index.html', 'utf8');

// Check for ApexCharts CDN
const hasApex = html.includes('cdn.jsdelivr.net/npm/apexcharts');
assert.ok(hasApex, 'index.html should include ApexCharts CDN');

console.log('Index Dependencies Tests Passed');

