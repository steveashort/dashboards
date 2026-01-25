import assert from 'assert';
import { getCountdownBarData } from '../charts.js';

console.log('Running Countdown Bar Data Tests...');

const today = new Date();
today.setHours(0,0,0,0);

// Note: Test data only includes future events to match filtering logic
const items = [
    { label: 'Event Future Far', date: new Date(today.getTime() + 70 * 86400000).toISOString().split('T')[0] }, // 70 days future
    { label: 'Event Tomorrow', date: new Date(today.getTime() + 1 * 86400000).toISOString().split('T')[0] }, // Tomorrow (1 day)
    { label: 'Event Future Near', date: new Date(today.getTime() + 10 * 86400000).toISOString().split('T')[0] }, // 10 days future
    { label: 'Event 20 Days', date: new Date(today.getTime() + 20 * 86400000).toISOString().split('T')[0] }, // 20 days future
    { label: 'Event 40 Days', date: new Date(today.getTime() + 40 * 86400000).toISOString().split('T')[0] }, // 40 days future
    { label: 'Event Today', date: new Date(today.getTime()).toISOString().split('T')[0] }, // Today (0 days)
];

const data = getCountdownBarData(items);

assert.ok(data.series.length > 0, 'Should return series');
assert.ok(data.series[0].data.length > 0, 'Series should have data');

// Verify structure and data
// Sorted by diffDays: Today (0), Tomorrow (1), Near (10), 20 Days (20), 40 Days (40), Far (70)
const expectedData = [
    { x: 'Event Today', y: [0.4, 0.4], fillColor: '#ffb300' }, 
    { x: 'Event Tomorrow', y: [0.4, 1.4], fillColor: '#ff1744' }, 
    { x: 'Event Future Near', y: [0.4, 10.4], fillColor: '#ff1744' }, 
    { x: 'Event 20 Days', y: [0.4, 20.4], fillColor: '#ffb300' }, 
    { x: 'Event 40 Days', y: [0.4, 40.4], fillColor: '#ffb300' }, 
    { x: 'Event Future Far', y: [0.4, 70.4], fillColor: '#00e676' }, 
];

data.series[0].data.forEach((item, index) => {
    assert.strictEqual(item.x, expectedData[index].x, `Item ${index} label mismatch`);
    assert.deepStrictEqual(item.y, expectedData[index].y, `Item ${index} y-range mismatch`);
    assert.strictEqual(item.fillColor, expectedData[index].fillColor, `Item ${index} color mismatch`);
    assert.ok(item.meta && item.meta.originalDate, `Item ${index} should have originalDate in meta`);
    assert.ok(item.meta && typeof item.meta.diffDays === 'number', `Item ${index} should have diffDays in meta`);
});

// Past events should be filtered out
const itemsWithPast = [
    { label: 'Past', date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0] },
    { label: 'Future', date: new Date(today.getTime() + 86400000 * 5).toISOString().split('T')[0] }
];
const data2 = getCountdownBarData(itemsWithPast);
assert.strictEqual(data2.series[0].data.length, 1, 'Past events should be filtered');
assert.strictEqual(data2.series[0].data[0].x, 'Future', 'Only future event should remain');
assert.strictEqual(data2.series[0].data[0].y[1], 5.4, 'Future event end point should be 5.4');

console.log('Countdown Bar Data Tests Passed');