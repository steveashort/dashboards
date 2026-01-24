import assert from 'assert';
import { getCountdownGanttData } from '../charts.js';

console.log('Running Countdown Gantt Data Tests...');

const items = [
    { label: 'Event Overdue', date: new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0] }, // 5 days ago
    { label: 'Event Today', date: new Date().toISOString().split('T')[0] }, // Today
    { label: 'Event Tomorrow', date: new Date(Date.now() + 1 * 86400000).toISOString().split('T')[0] }, // Tomorrow
    { label: 'Event Future', date: new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0] }, // 10 days future
];

const data = getCountdownGanttData(items);

assert.ok(data.series.length > 0, 'Should return series');
assert.ok(data.series[0].data.length > 0, 'Series should have data');

// Test specific ranges
// Event Overdue: diff = -5. Should be [-5, 0].
assert.deepStrictEqual(data.series[0].data[0].x, 'Event Overdue', 'First item should be Event Overdue');
assert.deepStrictEqual(data.series[0].data[0].y, [-5, 0], 'Overdue event should have range [-5, 0]');

// Event Today: diff = 0. Should be [0, 0]. (Or small range to visualize)
assert.deepStrictEqual(data.series[0].data[1].x, 'Event Today', 'Second item should be Event Today');
assert.deepStrictEqual(data.series[0].data[1].y, [0, 0], 'Today event should have range [0, 0]');

console.log('Countdown Gantt Data Tests Passed');

