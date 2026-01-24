import assert from 'assert';
import { getCountdownBarData } from '../charts.js';

console.log('Running Countdown Bar Data Tests...');

const today = new Date();
today.setHours(0,0,0,0);
const todayTimestamp = today.getTime();

// Note: Test data only includes future events to match filtering logic
const items = [
    { label: 'Event Future Far', date: new Date(today.getTime() + 70 * 86400000).toISOString().split('T')[0] }, // 70 days future
    { label: 'Event Tomorrow', date: new Date(today.getTime() + 1 * 86400000).toISOString().split('T')[0] }, // Tomorrow (1 day)
    { label: 'Event Future Near', date: new Date(today.getTime() + 10 * 86400000).toISOString().split('T')[0] }, // 10 days future
    { label: 'Event 20 Days', date: new Date(today.getTime() + 20 * 86400000).toISOString().split('T')[0] }, // 20 days future
    { label: 'Event 40 Days', date: new Date(today.getTime() + 40 * 86400000).toISOString().split('T')[0] }, // 40 days future
];

const data = getCountdownBarData(items);

assert.ok(data.series.length > 0, 'Should return series');
assert.ok(data.series[0].data.length > 0, 'Series should have data');

// Calculate expected timestamps
const expectedTimestamps = items.map(item => {
    const d = new Date(item.date);
    d.setHours(0,0,0,0);
    return d.getTime();
});

// Verify sorting (ascending by end timestamp) and data structure
const expectedData = [
    { x: 'Event Tomorrow', y: [todayTimestamp, expectedTimestamps[1]], fillColor: '#ff1744' }, // 1 day
    { x: 'Event Future Near', y: [todayTimestamp, expectedTimestamps[2]], fillColor: '#ff1744' }, // 10 days
    { x: 'Event 20 Days', y: [todayTimestamp, expectedTimestamps[3]], fillColor: '#ffb300' }, // 20 days
    { x: 'Event 40 Days', y: [todayTimestamp, expectedTimestamps[4]], fillColor: '#ffb300' }, // 40 days
    { x: 'Event Future Far', y: [todayTimestamp, expectedTimestamps[0]], fillColor: '#00e676' }, // 70 days
];

data.series[0].data.forEach((item, index) => {
    assert.strictEqual(item.x, expectedData[index].x, `Item ${index} label mismatch`);
    assert.deepStrictEqual(item.y, expectedData[index].y, `Item ${index} y-range mismatch`);
    assert.strictEqual(item.fillColor, expectedData[index].fillColor, `Item ${index} color mismatch`);
    assert.ok(item.meta && item.meta.originalDate, `Item ${index} should have originalDate in meta`);
    assert.ok(item.meta && typeof item.meta.diffDays === 'number', `Item ${index} should have diffDays in meta`);
});

console.log('Countdown Bar Data Tests Passed');
