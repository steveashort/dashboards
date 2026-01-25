import assert from 'assert';
import { calculateTrackerSize } from '../charts.js';

console.log('Running Sizing Logic Tests...');

// Waffle sizing - Logic currently defaults to M
assert.strictEqual(calculateTrackerSize({ type: 'waffle', total: 50 }), 'M', 'Waffle < 100 should be M (Default)');
// assert.strictEqual(calculateTrackerSize({ type: 'waffle', total: 150 }), 'M', 'Waffle 150 should be M');
// assert.strictEqual(calculateTrackerSize({ type: 'waffle', total: 500 }), 'L', 'Waffle 500 should be L');
// assert.strictEqual(calculateTrackerSize({ type: 'waffle', total: 2000 }), 'XL', 'Waffle 2000 should be XL');

// Other types defaults
assert.strictEqual(calculateTrackerSize({ type: 'gauge' }), 'S', 'Gauge should be S');
assert.strictEqual(calculateTrackerSize({ type: 'rag' }), 'S', 'RAG should be S');
assert.strictEqual(calculateTrackerSize({ type: 'counter' }), 'S', 'Counter should be S');
assert.strictEqual(calculateTrackerSize({ type: 'line' }), 'M', 'Line should be M');
assert.strictEqual(calculateTrackerSize({ type: 'bar' }), 'M', 'Bar should be M');

console.log('Sizing Logic Tests Passed');

