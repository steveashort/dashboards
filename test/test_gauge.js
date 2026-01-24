import assert from 'assert';
import { createGaugeSVG } from '../charts.js';

console.log('Running Gauge Tests...');

// 1. Normal Case
const svg50 = createGaugeSVG(['M', 'L']); // Avg 50
assert.ok(svg50.includes('50%'), 'Should be 50%');

// 2. Clamp Case > 100
// H=100. If we have multiple H, avg is 100.
// If we had a value > 100 in loadArr? loadArr only has 'H','M','L'.
// But let's verify 100% works.
const svg100 = createGaugeSVG(['H']);
assert.ok(svg100.includes('100%'), 'Should be 100%');

// 3. Clamp Case < 0? Not possible with 'H','M','L'.
// Empty array -> 0%
const svg0 = createGaugeSVG([]);
assert.ok(svg0.includes('0%'), 'Should be 0%');

console.log('Gauge Tests Passed');

