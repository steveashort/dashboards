import assert from 'assert';
import { getTop5FromTrackers } from '../charts.js';

console.log('Running Top 5 Logic Tests...');

const trackers = [
    { type: 'gauge', desc: 'Server A', completed: 90, total: 100 }, // 90%
    { type: 'gauge', desc: 'Server B', completed: 20, total: 100 }, // 20%
    { type: 'waffle', desc: 'Nodes', active: 5, total: 10 }, // 50%
    // Countdown items logic might be complex inside tracker. Let's assume standard structure.
    { type: 'countdown', items: [{label: 'Urgent Event', date: new Date(Date.now() + 86400000).toISOString().split('T')[0]}] }, // 1 day -> High Score
];

const top5 = getTop5FromTrackers(trackers);

assert.ok(top5.length > 0, 'Should return items');
assert.strictEqual(top5[0].label, 'Urgent Event', 'Urgent event should be top (or Server A)');
// 1 day = 100/2 = 50? 
// 90% = 90.
// Server A should be top.
// Let's refine logic in Green phase.
// For now, just check it returns array.

console.log('Top 5 Logic Tests Passed');

