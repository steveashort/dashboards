import assert from 'assert';
import { getCountdownBarData } from '../charts.js';

console.log('Running Countdown Bar Data Tests...');

// Note: Test data only includes future events to match filtering logic
const items = [
    { label: 'Event Future Far', date: new Date(Date.now() + 70 * 86400000).toISOString().split('T')[0] }, // 70 days future
    { label: 'Event Tomorrow', date: new Date(Date.now() + 1 * 86400000).toISOString().split('T')[0] }, // Tomorrow (1 day)
    { label: 'Event Future Near', date: new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0] }, // 10 days future
    { label: 'Event 20 Days', date: new Date(Date.now() + 20 * 86400000).toISOString().split('T')[0] }, // 20 days future
    { label: 'Event 40 Days', date: new Date(Date.now() + 40 * 86400000).toISOString().split('T')[0] }, // 40 days future
];

const data = getCountdownBarData(items);

assert.ok(data.labels.length > 0, 'Should return labels');
assert.ok(data.series.length > 0, 'Should return series');
assert.ok(data.series[0].data.length === data.labels.length, 'Series data length should match labels length');
assert.ok(data.colors.length === data.labels.length, 'Colors length should match labels length');

// Verify sorting (ascending by diffDays, smallest at top)
// Event Tomorrow: diff = 1
assert.strictEqual(data.labels[0], 'Event Tomorrow', 'First item should be Event Tomorrow after sorting');
assert.strictEqual(data.series[0].data[0], 1, 'First item data should be 1');
assert.strictEqual(data.colors[0], '#ff1744', 'First item color should be red');

// Event Future Near: diff = 10
assert.strictEqual(data.labels[1], 'Event Future Near', 'Second item should be Event Future Near');
assert.strictEqual(data.series[0].data[1], 10, 'Second item data should be 10');
assert.strictEqual(data.colors[1], '#ff1744', 'Second item color should be red');

// Event 20 Days: diff = 20
assert.strictEqual(data.labels[2], 'Event 20 Days', 'Third item should be Event 20 Days');
assert.strictEqual(data.series[0].data[2], 20, 'Third item data should be 20');
assert.strictEqual(data.colors[2], '#ffb300', 'Third item color should be amber');

// Event 40 Days: diff = 40
assert.strictEqual(data.labels[3], 'Event 40 Days', 'Fourth item should be Event 40 Days');
assert.strictEqual(data.series[0].data[3], 40, 'Fourth item data should be 40');
assert.strictEqual(data.colors[3], '#ffb300', 'Fourth item color should be amber');

// Event Future Far: diff = 70
assert.strictEqual(data.labels[4], 'Event Future Far', 'Fifth item should be Event Future Far');
assert.strictEqual(data.series[0].data[4], 70, 'Fifth item data should be 70');
assert.strictEqual(data.colors[4], '#00e676', 'Fifth item color should be green');

console.log('Countdown Bar Data Tests Passed');
