import assert from 'assert';
import { getCountdownBarData } from '../charts.js';

console.log('Running Countdown Bar Data Tests...');

const items = [
    { label: 'Event Future Far', date: new Date(Date.now() + 70 * 86400000).toISOString().split('T')[0] }, // 70 days future
    { label: 'Event Overdue', date: new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0] }, // 5 days ago
    { label: 'Event Today', date: new Date().toISOString().split('T')[0] }, // Today
    { label: 'Event Tomorrow', date: new Date(Date.now() + 1 * 86400000).toISOString().split('T')[0] }, // Tomorrow
    { label: 'Event Future Near', date: new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0] }, // 10 days future
];

const data = getCountdownBarData(items);

assert.ok(data.labels.length > 0, 'Should return labels');
assert.ok(data.series.length > 0, 'Should return series');
assert.ok(data.series[0].data.length === data.labels.length, 'Series data length should match labels length');
assert.ok(data.colors.length === data.labels.length, 'Colors length should match labels length');

// Verify sorting (ascending by diffDays)
assert.strictEqual(data.labels[0], 'Event Overdue', 'First item should be Event Overdue after sorting');
assert.strictEqual(data.series[0].data[0], -5, 'First item data should be -5');
assert.strictEqual(data.colors[0], '#ff1744', 'First item color should be red');

assert.strictEqual(data.labels[1], 'Event Today', 'Second item should be Event Today');
assert.strictEqual(data.series[0].data[1], 0, 'Second item data should be 0');
assert.strictEqual(data.colors[1], '#ffb300', 'Second item color should be amber');

assert.strictEqual(data.labels[2], 'Event Tomorrow', 'Third item should be Event Tomorrow');
assert.strictEqual(data.series[0].data[2], 1, 'Third item data should be 1');
assert.strictEqual(data.colors[2], '#ff1744', 'Third item color should be red');

console.log('Countdown Bar Data Tests Passed');
