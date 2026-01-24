import assert from 'assert';
import fs from 'fs';

console.log('Running Layout Tests...');

const css = fs.readFileSync('styles.css', 'utf8');

// Check Grid Definition
assert.ok(css.includes('grid-template-columns: repeat(5, 1fr)'), 'Should define 5 column grid');

// Check Sizes
assert.ok(css.includes('.size-S { grid-column: span 1; grid-row: span 1; }'), 'Size S definition');
assert.ok(css.includes('.size-M { grid-column: span 2; grid-row: span 1; }'), 'Size M definition');
assert.ok(css.includes('.size-L { grid-column: span 3; grid-row: span 1; }'), 'Size L definition');
assert.ok(css.includes('.size-XL { grid-column: span 3; grid-row: span 2; }'), 'Size XL definition');

console.log('Layout Tests Passed');

