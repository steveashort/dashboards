import assert from 'assert';
import { formatCountdown } from '../charts.js';

console.log('Running Countdown Logic Tests...');

const today = new Date();
const todayStr = today.toISOString().split('T')[0];

const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
const tomorrowStr = tomorrow.toISOString().split('T')[0];

const resToday = formatCountdown(todayStr);
assert.ok(resToday.text.includes('Today'), 'Should say Today');
assert.ok(resToday.text.includes(today.getDate()), 'Should include day number');

const resTom = formatCountdown(tomorrowStr);
assert.ok(resTom.text.includes('Tomorrow'), 'Should say Tomorrow');

console.log('Countdown Logic Tests Passed');

