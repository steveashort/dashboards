import assert from 'assert';
import { createWaffleHTML } from '../charts.js';

console.log('Running Waffle Tests...');

// Test Total 10
// Should have dynamic width based on total if total < default cols
const html10 = createWaffleHTML(10, 5, 'red', 'grey');

// Current implementation hardcodes cols to 15 (if < 200).
// Width = 15 * 9 - 2 = 133.
// We expect it to be 10 * 9 - 2 = 88.
// So this test SHOULD FAIL if code is not fixed.
const expectedWidth = (10 * 9) - 2; 
assert.ok(html10.includes('width: ' + expectedWidth + 'px'), 'Waffle width should match total items (' + expectedWidth + 'px) but got: ' + html10.match(/width: \d+px/)[0]);

console.log('Waffle Tests Passed');

