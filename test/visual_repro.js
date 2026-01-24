import { createGaugeSVG, createWaffleHTML } from './charts.js';

console.log('--- Testing Gauge SVG ---');
console.log('0%:', createGaugeSVG([]));
console.log('50%:', createGaugeSVG(['M', 'H', 'L'])); 
console.log('100%:', createGaugeSVG(['H']));

console.log('\n--- Testing Waffle HTML ---');
console.log('Total 10, Active 5:', createWaffleHTML(10, 5, 'red', 'grey'));
