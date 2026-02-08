import assert from 'assert';
import { calculateTrackerSize } from '../charts.js';

console.log('Running Sizing Logic Tests...');

// Waffle sizing - Logic currently defaults to 2x2
assert.strictEqual(calculateTrackerSize({ type: 'waffle', total: 50 }), '2x2', 'Waffle < 100 should be 2x2 (Default)');

// Other types defaults
assert.strictEqual(calculateTrackerSize({ type: 'gauge' }), '1x2', 'Gauge should be 1x2');
assert.strictEqual(calculateTrackerSize({ type: 'rag' }), '1x2', 'RAG should be 1x2');
assert.strictEqual(calculateTrackerSize({ type: 'counter' }), '1x2', 'Counter should be 1x2');
assert.strictEqual(calculateTrackerSize({ type: 'line' }), '2x2', 'Line should be 2x2');
assert.strictEqual(calculateTrackerSize({ type: 'bar' }), '2x2', 'Bar should be 2x2');

console.log('Sizing Logic Tests Passed');

