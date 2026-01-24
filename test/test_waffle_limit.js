import assert from 'assert';
import { createWaffleHTML } from '../charts.js';

console.log('Running Waffle Limit Tests...');

const html = createWaffleHTML(1000, 500, 'red', 'grey');
// Check count of 'waffle-cell'
const count = (html.match(/waffle-cell/g) || []).length;

console.log('Cell count for 1000 items:', count);

// Assert it respects input > 450
assert.ok(count > 450, 'Should allow more than 450 cells');
assert.strictEqual(count, 1000, 'Should have exactly 1000 cells');

console.log('Waffle Limit Tests Passed');

