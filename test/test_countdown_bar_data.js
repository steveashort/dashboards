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

assert.ok(data.series.length > 0, 'Should return series');
assert.ok(data.series[0].data.length > 0, 'Series should have data');

// Verify sorting (ascending by diffDays, smallest at top) and data structure
const expectedData = [
    { x: 'Event Tomorrow', y: [0, 1], fillColor: '#ff1744' },
    { x: 'Event Future Near', y: [0, 10], fillColor: '#ff1744' },
    { x: 'Event 20 Days', y: [0, 20], fillColor: '#ffb300' },
    { x: 'Event 40 Days', y: [0, 40], fillColor: '#ffb300' },
    { x: 'Event Future Far', y: [0, 70], fillColor: '#00e676' },
];

data.series[0].data.forEach((item, index) => {
    assert.strictEqual(item.x, expectedData[index].x, `Item ${index} label mismatch`);
    assert.deepStrictEqual(item.y, expectedData[index].y, `Item ${index} y-range mismatch`);
    assert.strictEqual(item.fillColor, expectedData[index].fillColor, `Item ${index} color mismatch`);
    assert.ok(item.meta && item.meta.originalDate, `Item ${index} should have originalDate in meta`);
});

console.log('Countdown Bar Data Tests Passed');
