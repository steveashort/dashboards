import assert from 'assert';
import fs from 'fs';
console.log('Running Layout Tests...');
const css = fs.readFileSync('styles.css', 'utf8');
assert.ok(css.includes('grid-template-columns: repeat(5, 1fr)'), 'Should define 5 column grid');
assert.ok(css.includes('grid-auto-rows: minmax(280px, auto)'), 'Should define responsive row height');
console.log('Layout Tests Passed');
