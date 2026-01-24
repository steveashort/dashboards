import assert from 'assert';
import { formatCountdown } from '../charts.js';

console.log('Running Countdown Logic Tests...');

const today = new Date();
const todayStr = today.toISOString().split('T')[0];

const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
const tomorrowStr = tomorrow.toISOString().split('T')[0];

// Test 1: Today
const resToday = formatCountdown(todayStr);
assert.ok(resToday.text.includes('Today'), 'Should say Today');
assert.strictEqual(resToday.color, '#ffb300', 'Today should be amber');
assert.strictEqual(resToday.icon, '🚨', 'Today should have siren icon');
assert.strictEqual(resToday.flashClass, 'flash-siren', 'Today should flash siren');

// Test 2: Tomorrow (1 day)
const resTom = formatCountdown(tomorrowStr);
assert.ok(resTom.text.includes('Tomorrow'), 'Should say Tomorrow');
assert.strictEqual(resTom.color, '#ff1744', 'Tomorrow (1 day) should be red');
assert.strictEqual(resTom.icon, '🚨', 'Tomorrow (1 day) should have siren icon');
assert.strictEqual(resTom.flashClass, 'flash-siren', 'Tomorrow (1 day) should flash siren');

// Test 3: 10 days (Red)
const tenDaysAway = new Date(today); tenDaysAway.setDate(today.getDate() + 10);
const resTenDays = formatCountdown(tenDaysAway.toISOString().split('T')[0]);
assert.ok(resTenDays.text.includes('10 days'), 'Should say 10 days');
assert.strictEqual(resTenDays.color, '#ff1744', '10 days should be red');
assert.strictEqual(resTenDays.icon, '🚨', '10 days should have siren icon');
assert.strictEqual(resTenDays.flashClass, '', '10 days should not flash');

// Test 4: 20 days (Flashing Yellow)
const twentyDaysAway = new Date(today); twentyDaysAway.setDate(today.getDate() + 20);
const resTwentyDays = formatCountdown(twentyDaysAway.toISOString().split('T')[0]);
assert.ok(resTwentyDays.text.includes('20 days'), 'Should say 20 days');
assert.strictEqual(resTwentyDays.color, '#ffb300', '20 days should be amber');
assert.strictEqual(resTwentyDays.icon, '🔔', '20 days should have bell icon');
assert.strictEqual(resTwentyDays.flashClass, 'flash-yellow', '20 days should flash yellow');

// Test 5: 40 days (Yellow)
const fortyDaysAway = new Date(today); fortyDaysAway.setDate(today.getDate() + 40);
const resFortyDays = formatCountdown(fortyDaysAway.toISOString().split('T')[0]);
assert.ok(resFortyDays.text.includes('40 days'), 'Should say 40 days');
assert.strictEqual(resFortyDays.color, '#ffb300', '40 days should be amber');
assert.strictEqual(resFortyDays.icon, '🔔', '40 days should have bell icon');
assert.strictEqual(resFortyDays.flashClass, '', '40 days should not flash');

// Test 6: 70 days (Green)
const seventyDaysAway = new Date(today); seventyDaysAway.setDate(today.getDate() + 70);
const resSeventyDays = formatCountdown(seventyDaysAway.toISOString().split('T')[0]);
assert.ok(resSeventyDays.text.includes('70 days'), 'Should say 70 days');
assert.strictEqual(resSeventyDays.color, '#00e676', '70 days should be green');
assert.strictEqual(resSeventyDays.icon, '✅', '70 days should have check icon');
assert.strictEqual(resSeventyDays.flashClass, '', '70 days should not flash');

// Test 7: Overdue (5 days ago)
const fiveDaysAgo = new Date(today); fiveDaysAgo.setDate(today.getDate() - 5);
const resFiveDaysAgo = formatCountdown(fiveDaysAgo.toISOString().split('T')[0]);
assert.ok(resFiveDaysAgo.text.includes('5 days ago'), 'Should say 5 days ago');
assert.strictEqual(resFiveDaysAgo.color, '#ff1744', 'Overdue should be red');
assert.strictEqual(resFiveDaysAgo.icon, '⚠️', 'Overdue should have warning icon');
assert.strictEqual(resFiveDaysAgo.flashClass, 'flash-red', 'Overdue should flash red');

console.log('Countdown Logic Tests Passed');

