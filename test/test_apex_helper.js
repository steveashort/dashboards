import assert from 'assert';
import { getApexConfig } from '../charts.js';

console.log('Running Apex Helper Tests...');

// Test 1: Basic Config
const config = getApexConfig('bar', {
    series: [{name: 'Test', data: [1, 2, 3]}],
    labels: ['A', 'B', 'C']
});

assert.strictEqual(config.chart.type, 'bar', 'Should set chart type');
assert.strictEqual(config.chart.background, 'transparent', 'Should be transparent');
assert.strictEqual(config.theme.mode, 'dark', 'Should be dark theme');
assert.ok(config.colors.length > 0, 'Should have default colors');

// Verify Color Palette matches CSS vars (approximate check for known colors)
const knownColors = ['#03dac6', '#ff4081', '#bb86fc']; // From charts.js current logic
assert.ok(knownColors.includes(config.colors[0]), 'First color should be from palette');

console.log('Apex Helper Tests Passed');

