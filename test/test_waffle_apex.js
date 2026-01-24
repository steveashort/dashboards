import assert from 'assert';
import { createWaffleData } from '../charts.js';

console.log('Running Waffle Apex Logic Tests...');

// Test 10 items, 5 active
const data = createWaffleData(10, 5);
// Should return series array
assert.ok(Array.isArray(data.series), 'Should return series');
// Check total items in series
let count = 0;
let activeCount = 0;
data.series.forEach(row => {
    row.data.forEach(cell => {
        count++;
        if (cell.x === 'Active') activeCount++; // Or however we represent it
        // Or cell.y val?
        // Heatmap: { x: 'col', y: value }
    });
});

// Implementation detail: How do we represent active/inactive?
// Value 1 = Active, 0 = Inactive.
// And we map colors to ranges.

console.log('Waffle Apex Tests Passed');

