import assert from 'assert';
import { getApexConfig } from '../charts.js';

console.log('Running Apex Render Tests...');

// Mock ApexCharts
class MockApexCharts {
    constructor(el, config) {
        this.el = el;
        this.config = config;
    }
    render() {
        this.el.rendered = true;
    }
}
global.ApexCharts = MockApexCharts;

// We need a render function. Let's assume we create one in charts.js
// export const renderChart = (el, type, data) => { ... }

// But first I need to implement it to import it.
// So I will write the test assuming it exists, fail, then implement.

import { renderChart } from '../charts.js';

const el = { id: 'test-div' };
renderChart(el, 'bar', { labels: ['A'], series: [{data:[1]}] });

assert.ok(el.rendered, 'Chart should be rendered');

console.log('Apex Render Tests Passed');

