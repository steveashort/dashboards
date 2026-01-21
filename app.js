/**
 * SERVER PLATFORMS TRACKER v32
 * ES6 MODULE STRUCTURE
 */
export { createGaugeSVG, createWaffleHTML, Visuals } from './charts.js';
import { createGaugeSVG, createWaffleHTML, Visuals } from './charts.js';

// --- GLOBAL STATE ---
let State = {
    title: "Server Platforms",
    additionalInfo: "",
    trackers: [],
    members: [],
    editingTrackerIndex: -1,
    currentTrackerType: 'gauge'
};

let chartInstances = []; // Track dashboard chart instances
let zoomedChartInstance = null; // Track zoomed chart instance

// --- DOM HELPERS ---
const getEl = (id) => document.getElementById(id);

const formatDate = (date) => date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
const getRanges = () => {
    const today = new Date();
    const d = today.getDay();
    const diff = d === 0 ? -6 : 1 - d;
    const cm = new Date(today);
    cm.setDate(today.getDate() + diff);
    const cf = new Date(cm);
    cf.setDate(cm.getDate() + 6);
    
    const nm = new Date(cm);
    nm.setDate(cm.getDate() + 7);
    const nf = new Date(nm);
    nf.setDate(nm.getDate() + 6);
    
    const lm = new Date(cm);
    lm.setDate(cm.getDate() - 7);
    const lf = new Date(lm);
    lf.setDate(lm.getDate() + 6);

    return { 
        current: `${formatDate(cm)} - ${formatDate(cf)}`, 
        next: `${formatDate(nm)} - ${formatDate(nf)}`,
        last: `${formatDate(lm)} - ${formatDate(lf)}`
    };
};

const getTwoWeeksDates = () => {
    const today = new Date();
    const d = today.getDay();
    const diff = d === 0 ? -6 : 1 - d;
    // Current Monday
    const cm = new Date(today);
    cm.setDate(today.getDate() + diff);

    const dates = [];
    for(let i=0; i<14; i++) {
        const date = new Date(cm);
        date.setDate(cm.getDate() + i);
        dates.push(date);
    }
    return dates;
};

// --- APEXCHARTS HELPERS ---
const cleanupCharts = () => {
    chartInstances.forEach(chart => chart.destroy());
    chartInstances = [];
};

const getCommonApexOptions = (isZoomed = false) => ({
    chart: {
        background: 'transparent',
        toolbar: { show: isZoomed },
        animations: { enabled: true },
        fontFamily: 'Segoe UI, sans-serif'
    },
    theme: { mode: 'dark', palette: 'palette1' },
    dataLabels: { enabled: false },
    grid: { borderColor: '#333', strokeDashArray: 2 },
    xaxis: {
        labels: { style: { colors: '#a0a0a0', fontSize: '12px', fontFamily: 'Segoe UI' } },
        axisBorder: { show: false },
        axisTicks: { color: '#333' }
    },
    yaxis: {
        labels: { style: { colors: '#a0a0a0', fontSize: '12px', fontFamily: 'Segoe UI' } }
    },
    legend: { labels: { colors: '#e0e0e0' }, position: 'bottom' },
    tooltip: { theme: 'dark' }
});

// --- CORE FUNCTIONS ---
export const initApp = () => {
    
    const updateDateUI = () => {
        const r = getRanges();
        const drd = getEl('dateRangeDisplay');
        if (drd) drd.innerText = `Last: ${r.last} | Current: ${r.current} | Next: ${r.next}`;
        
        const otc = getEl('overviewTitleCurrent');
        if (otc) otc.innerHTML = `Top 5 Team Achievements <span class="date-suffix">${r.current}</span>`;
        
        const otn = getEl('overviewTitleNext');
        if (otn) otn.innerHTML = `Top 5 Activities Next Week <span class="date-suffix">${r.next}</span>`;
        
        const lwt = getEl('lastWeekTitle');
        if(lwt) lwt.innerText = `Last Week (${r.last})`;
        
        const twt = getEl('thisWeekTitle');
        if(twt) twt.innerText = `Current Week (${r.current})`;
        
        const nwt = getEl('nextWeekTitle');
        if(nwt) nwt.innerText = `Next Week (${r.next})`;
    };

    updateDateUI();
    renderBoard();
    console.log("App Initialized");
};

const parseMarkdown = (t) => {
    if(!t) return '';
    let h = t.replace(/&/g,"&amp;").replace(/</g,"&lt;")
             .replace(/^# (.*?)$/gm, '<h3>$1</h3>')
             .replace(/^## (.*?)$/gm, '<h4>$1</h4>')
             .replace(/\*\*(.*?)\*\*/g,'<b>$1</b>')
             .replace(/\*(.*?)\*/g,'<i>$1</i>')
             .replace(/\[(.*?)\]\((.*?)\)/g, (match, text, url) => {
                 let finalUrl = url.trim();
                 if(!/^https?:\/\//i.test(finalUrl)) finalUrl = 'https://' + finalUrl;
                 return `<a href="${finalUrl}" target="_blank">${text}</a>`;
             });
    
    // Simple List Parsing
    let lines = h.split('\n');
    let output = '';
    let inList = false;
    
    lines.forEach(line => {
        let trimmed = line.trim();
        if (trimmed.startsWith('- ')) {
            if (!inList) { output += '<ul>'; inList = true; }
            output += `<li>${trimmed.substring(2)}</li>`;
        } else {
            if (inList) { output += '</ul>'; inList = false; }
            if (trimmed.length > 0) output += trimmed + '<br>';
        }
    });
    if (inList) output += '</ul>';
    
    return output;
};

export const App = {
    init: () => {
        initApp();
        App.initDragAndDrop();
    },
    initDragAndDrop: () => {
        const grid = getEl('trackerGrid');
        if (!grid) return;
        let dragSrcEl = null;

        grid.addEventListener('dragstart', (e) => {
            if (document.body.classList.contains('publishing')) return;
            dragSrcEl = e.target.closest('.tracker-card');
            if(!dragSrcEl) return;
            dragSrcEl.classList.add('dragging');
            grid.classList.add('drag-active');
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/html', dragSrcEl.innerHTML);
        });

        grid.addEventListener('dragover', (e) => {
            if (e.preventDefault) e.preventDefault(); 
            e.dataTransfer.dropEffect = 'move';
            return false;
        });

        grid.addEventListener('dragenter', (e) => {
            const target = e.target.closest('.tracker-card');
            if (target && target !== dragSrcEl) {
                target.classList.add('over');
            }
        });

        grid.addEventListener('dragleave', (e) => {
            const target = e.target.closest('.tracker-card');
            if (target) {
                target.classList.remove('over');
            }
        });

        grid.addEventListener('drop', (e) => {
            if (e.stopPropagation) e.stopPropagation();
            const target = e.target.closest('.tracker-card');
            
            if (dragSrcEl && target && dragSrcEl !== target) {
                const srcIdx = parseInt(dragSrcEl.dataset.index);
                const tgtIdx = parseInt(target.dataset.index);
                
                const temp = State.trackers[srcIdx];
                State.trackers.splice(srcIdx, 1);
                State.trackers.splice(tgtIdx, 0, temp);
                
                renderBoard();
            }
            return false;
        });

        grid.addEventListener('dragend', () => {
            grid.classList.remove('drag-active');
            document.querySelectorAll('.tracker-card').forEach(c => {
                c.classList.remove('dragging');
                c.classList.remove('over');
            });
        });
    },
    alert: (msg) => {
        const am = getEl('alertMessage');
        if (am) am.innerText = msg;
        const modal = getEl('alertModal');
        if (modal) modal.classList.add('active');
        console.log("Alert:", msg);
    },
    confirm: (msg, callback) => {
        const cm = getEl('confirmMessage');
        if (cm) cm.innerText = msg;
        const btn = getEl('confirmYesBtn');
        if (btn) {
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            newBtn.addEventListener('click', () => {
                if(callback) callback();
                ModalManager.closeModal('confirmModal');
            });
        }
        const modal = getEl('confirmModal');
        if (modal) modal.classList.add('active');
    },
    togglePublishMode: () => {
        document.body.classList.toggle('publishing');
        const isPub = document.body.classList.contains('publishing');
        const btn = getEl('expandTeamBtn');
        if(btn) {
            btn.style.display = isPub ? 'inline-block' : 'none';
            btn.innerText = "Expand Team Data";
        }
        
        const ganttSec = getEl('ganttSection');
        const teamHead = getEl('teamSectionHeader');
        const teamGrid = getEl('teamGrid');
        
        if (ganttSec) ganttSec.style.display = 'none';
        if (teamHead) teamHead.style.display = isPub ? 'none' : 'flex';
        if (teamGrid) teamGrid.style.display = isPub ? 'none' : 'grid';
        
        renderBoard();
    },
    toggleTeamData: () => {
        const ganttSec = getEl('ganttSection');
        const teamHead = getEl('teamSectionHeader');
        const teamGrid = getEl('teamGrid');
        const btn = getEl('expandTeamBtn');
        
        const isHidden = ganttSec.style.display === 'none';
        
        if (isHidden) {
            ganttSec.style.display = 'block';
            if (teamHead) teamHead.style.display = 'flex';
            if (teamGrid) teamGrid.style.display = 'grid';
            if (btn) btn.innerText = "Collapse Team Data";
            
            // Render Gantt
            Visuals.renderResourcePlanner(State.members);
        } else {
            ganttSec.style.display = 'none';
            if (teamHead) teamHead.style.display = 'none';
            if (teamGrid) teamGrid.style.display = 'none';
            if (btn) btn.innerText = "Expand Team Data";
        }
    },
    saveTitle: () => {
        const titleEl = getEl('appTitle');
        if (titleEl) State.title = titleEl.innerText;
        console.log("Title saved");
    }
};

// Override Visuals.renderResourcePlanner to use ApexCharts
// Extending the imported Visuals object directly is tricky with ES modules if it's not mutable or if we want to replace it.
// Instead, we'll attach a new method to the Visuals object if it's exported as an object, or just define a local function.
// Since Visuals is imported, we can add properties to it if it's an object.
Visuals.renderResourcePlanner = (members) => {
    // 1. Aggregate Data
    const dates = getTwoWeeksDates();
    const dateLabels = dates.map(d => d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' }));

    // Calculate Totals
    const dailyTotals = new Array(14).fill(0);

    // Prepare Heatmap Data
    const heatmapSeries = [];

    // Mapping: L=1, N=2, R=3, X=0. OnCall adds 10.
    const valMap = { 'L': 1, 'N': 2, 'R': 3, 'X': 0 };

    members.forEach(m => {
        const thisLoad = (m.thisWeek && m.thisWeek.load) ? (m.thisWeek.load.length === 5 ? [...m.thisWeek.load, 'X', 'X'] : m.thisWeek.load) : ['N','N','N','N','N','X','X'];
        const nextLoad = (m.nextWeek && m.nextWeek.load) ? (m.nextWeek.load.length === 5 ? [...m.nextWeek.load, 'X', 'X'] : m.nextWeek.load) : ['N','N','N','N','N','X','X'];
        const thisOc = (m.thisWeek && m.thisWeek.onCall) ? (m.thisWeek.onCall.length === 5 ? [...m.thisWeek.onCall, false, false] : m.thisWeek.onCall) : [false,false,false,false,false,false,false];
        const nextOc = (m.nextWeek && m.nextWeek.onCall) ? (m.nextWeek.onCall.length === 5 ? [...m.nextWeek.onCall, false, false] : m.nextWeek.onCall) : [false,false,false,false,false,false,false];

        const combinedLoad = [...thisLoad, ...nextLoad];
        const combinedOc = [...thisOc, ...nextOc];

        const dataPoints = combinedLoad.map((val, i) => {
            const score = valMap[val] || 0;
            // Add to daily total (simple score sum)
            dailyTotals[i] += score;

            // Encode for heatmap
            let encodedVal = score;
            if (combinedOc[i]) encodedVal += 10;

            return {
                x: dateLabels[i],
                y: encodedVal
            };
        });

        heatmapSeries.push({
            name: m.name,
            data: dataPoints
        });
    });

    // --- RENDER AGGREGATE CHART ---
    const aggContainer = getEl('resourceAggregateChart');
    if (aggContainer) {
        aggContainer.innerHTML = '';
        const aggOptions = {
            ...getCommonApexOptions(),
            chart: {
                type: 'bar',
                height: 200,
                background: 'transparent',
                toolbar: { show: false }
            },
            series: [{ name: 'Total Capacity', data: dailyTotals }],
            xaxis: { categories: dateLabels },
            yaxis: { title: { text: 'Capacity Score' } },
            colors: ['#bb86fc'],
            plotOptions: { bar: { borderRadius: 4, columnWidth: '50%' } },
            title: { text: 'Team Availability Forecast', style: { color: '#bb86fc', fontSize: '14px', fontFamily: 'Segoe UI' } }
        };
        const aggChart = new ApexCharts(aggContainer, aggOptions);
        aggChart.render();
        chartInstances.push(aggChart);
    }

    // --- RENDER DETAILED HEATMAP ---
    const ganttContainer = getEl('ganttContainer');
    if (ganttContainer) {
        ganttContainer.innerHTML = '';

        // Define Color Ranges
        // 0=Absent, 1=Low, 2=Med, 3=High
        // +10 for OnCall
        const ranges = [
            { from: 0, to: 0, color: '#333333', name: 'Absent' }, // Grey
            { from: 1, to: 1, color: '#ff1744', name: 'Low' },    // Red
            { from: 2, to: 2, color: '#ffb300', name: 'Medium' }, // Amber
            { from: 3, to: 3, color: '#00e676', name: 'High' },   // Green

            // On Call Variants (Same colors, icon handled by formatter)
            { from: 10, to: 10, color: '#333333', name: 'Absent (On Call)' },
            { from: 11, to: 11, color: '#ff1744', name: 'Low (On Call)' },
            { from: 12, to: 12, color: '#ffb300', name: 'Medium (On Call)' },
            { from: 13, to: 13, color: '#00e676', name: 'High (On Call)' }
        ];

        // Shade Weekends
        const annotations = {
            xaxis: [
                { x: dateLabels[5], x2: dateLabels[6], fillColor: '#ffffff', opacity: 0.1, label: { text: '' } }, // Current Sat-Sun
                { x: dateLabels[12], x2: dateLabels[13], fillColor: '#ffffff', opacity: 0.1, label: { text: '' } } // Next Sat-Sun
            ]
        };

        const detailOptions = {
            ...getCommonApexOptions(),
            chart: {
                type: 'heatmap',
                height: Math.max(250, members.length * 40 + 50),
                background: 'transparent',
                toolbar: { show: false },
                fontFamily: 'Segoe UI, sans-serif'
            },
            series: heatmapSeries,
            plotOptions: {
                heatmap: {
                    shadeIntensity: 0.5,
                    radius: 2,
                    useFillColorAsStroke: false,
                    colorScale: {
                        ranges: ranges
                    }
                }
            },
            dataLabels: {
                enabled: true,
                formatter: function(val, opts) {
                    if (val >= 10) return '☎';
                    return '';
                },
                style: {
                    colors: ['#fff'],
                    fontSize: '16px'
                }
            },
            annotations: annotations,
            xaxis: {
                categories: dateLabels,
                labels: { style: { colors: '#a0a0a0', fontSize: '11px' } },
                position: 'top'
            },
            stroke: { width: 1, colors: ['#1e1e1e'] },
            title: { text: 'Individual Availability & On-Call', style: { color: '#bb86fc', fontSize: '14px', fontFamily: 'Segoe UI' } }
        };

        const detailChart = new ApexCharts(ganttContainer, detailOptions);
        detailChart.render();
        chartInstances.push(detailChart);
    }
};

export const ModalManager = {
    openModal: (id) => {
        console.log("Opening modal:", id);
        const el = document.getElementById(id);
        if (el) el.classList.add('active');
    },
    closeModal: (id) => {
        const el = document.getElementById(id);
        if (el) el.classList.remove('active');
        if (id === 'zoomModal') {
            if (zoomedChartInstance) {
                zoomedChartInstance.destroy();
                zoomedChartInstance = null;
            }
        }
    }
};

export const renderBoard = () => {
    console.log("Rendering Board...");
    cleanupCharts();

    const titleEl = getEl('appTitle');
    if (titleEl) titleEl.innerText = State.title || "Server Platforms";
    
    const sL = getEl('teamSuccessList'); 
    const aL = getEl('teamActivityList');
    if (sL) sL.innerHTML = ''; 
    if (aL) aL.innerHTML = ''; 
    let sc = 0, ac = 0;

    State.members.forEach(m => {
        if(m.lastWeek && m.lastWeek.tasks) {
            m.lastWeek.tasks.forEach(t => {
                if(t.isTeamSuccess && t.text.trim()) { 
                    sc++; if (sL) sL.innerHTML += `<li class="auto-item"><b>${m.name}:</b> ${t.text}</li>`; 
                }
            });
        }
        if(m.thisWeek && m.thisWeek.tasks) {
            m.thisWeek.tasks.forEach(t => {
                if(t.isTeamSuccess && t.text.trim()) { 
                    sc++; if (sL) sL.innerHTML += `<li class="auto-item"><b>${m.name}:</b> ${t.text}</li>`; 
                }
            });
        }
        if(m.nextWeek && m.nextWeek.tasks) {
            m.nextWeek.tasks.forEach(t => {
                if(t.isTeamActivity && t.text.trim()) { 
                    ac++; if (aL) aL.innerHTML += `<li class="auto-item"><b>${m.name}:</b> ${t.text}</li>`; 
                }
            });
        }
    });

    if(sc===0 && sL) sL.innerHTML = '<li>No items selected.</li>'; 
    if(ac===0 && aL) aL.innerHTML = '<li>No items selected.</li>';
    
    const aip = getEl('additionalInfoPreview');
    if (aip) aip.innerHTML = parseMarkdown(State.additionalInfo) || "No additional info.";

    const tGrid = getEl('trackerGrid');
    if (tGrid) {
        tGrid.innerHTML = '';
        
        State.trackers.forEach((t, i) => {
            const card = document.createElement('div');
            // Force Donut to always be Small
            const displaySize = t.type === 'donut' ? 'S' : (t.size || 'M');
            card.className = `tracker-card size-${displaySize} type-${t.type}`;
            card.dataset.index = i;
            
            if (!document.body.classList.contains('publishing')) {
                card.draggable = true;
            }

            card.onclick = () => {
                 console.log("Card clicked. Type:", t.type, "Publishing:", document.body.classList.contains('publishing'));
                 if (document.body.classList.contains('publishing')) {
                     // Zoom requested
                     const canZoom = ['line', 'bar', 'note', 'rag', 'ryg', 'waffle', 'donut', 'gauge'].includes(t.type);
                     if (canZoom) ZoomManager.openChartModal(i);
                 } else {
                     TrackerManager.openModal(i);
                 }
            };

            // Zoom Icon
            if (document.body.classList.contains('publishing') && ['line', 'bar', 'note', 'rag', 'ryg', 'waffle', 'donut', 'gauge'].includes(t.type)) {
                card.innerHTML += `<div class="zoom-icon" style="position:absolute; top:5px; right:5px; color:#666; font-size:14px; pointer-events:none;">&#128269;</div>`;
            }

            const noteText = (t.notes || t.content || '').replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/"/g, "&quot;").replace(/\n/g, "<br>");
            if (noteText && t.type !== 'note') {
                card.onmousemove = (e) => {
                    if (!document.body.classList.contains('publishing')) return;
                    if (e.target.closest('.apexcharts-canvas')) return; // Avoid tooltip overlap on charts
                    if (e.target.closest('circle, rect, path')) return;
                    Visuals.showTooltip(e, noteText);
                };
                card.onmouseout = () => Visuals.hideTooltip();
            }

            let visualHTML = '';
            let statsHTML = '';
            let chartConfig = null;
            let chartId = `chart-tk-${i}`;
            
            let renderType = t.type;
            if (renderType === 'line' || renderType === 'bar' || renderType === 'line1' || renderType === 'line2') {
                let labels = t.labels || [];
                let series = t.series || [];
                
                // Legacy Data Migration (Bar or Line)
                if ((!t.labels || t.labels.length === 0) && t.data) {
                    labels = t.data.map(d => d.label);
                    series = [{ name: 'Series 1', color: t.color1 || '#03dac6', values: t.data.map(d => d.val) }];
                }

                // Render based on displayStyle
                const style = (t.displayStyle === 'bar' || t.type === 'bar') ? 'bar' : 'line';
                
                visualHTML = `<div id="${chartId}" style="width:100%; height:160px;"></div>`;

                // Build Apex Options
                const common = getCommonApexOptions();
                chartConfig = {
                    ...common,
                    chart: { ...common.chart, type: style, height: 160 },
                    series: series.map(s => ({ name: s.name, data: s.values, color: s.color })),
                    xaxis: { ...common.xaxis, categories: labels },
                    yaxis: { ...common.yaxis, title: { text: t.yLabel || '' } },
                    stroke: { width: style === 'line' ? 2 : 0, curve: 'smooth' }
                };

            } else if (renderType === 'gauge') {
                const pct = t.total>0 ? Math.round((t.completed/t.total)*100) : 0;
                visualHTML = `<div id="${chartId}" style="width:100%; height:160px; display:flex; justify-content:center;"></div>`;
                statsHTML = `<div class="tracker-stats">${t.completed} / ${t.total} ${t.metric}</div>`;

                // Apex Radial Bar
                const c1 = t.colorVal || t.color1 || '#00e676';
                const common = getCommonApexOptions();
                chartConfig = {
                    ...common,
                    chart: { ...common.chart, type: 'radialBar', height: 180 },
                    series: [pct],
                    plotOptions: {
                        radialBar: {
                            hollow: { size: '60%' },
                            track: { background: '#333' },
                            dataLabels: {
                                show: true,
                                name: { show: false },
                                value: { color: '#fff', fontSize: '20px', show: true, offsetY: 8 }
                            }
                        }
                    },
                    fill: { colors: [c1] },
                    stroke: { lineCap: 'round' }
                };

            } else if (renderType === 'counter') {
                visualHTML = `<div class="counter-display" style="color:${t.color1}">${t.value}</div>`;
                statsHTML = `<div class="counter-sub">${t.subtitle || ''}</div>`;
            } else if (renderType === 'rag' || renderType === 'ryg') {
                const status = t.status || 'grey';
                const iconHTML = Visuals.createRAGIconHTML(status);
                visualHTML = `<div class="ryg-icon-wrapper">${iconHTML}</div>`;
                statsHTML = `<div class="counter-sub" style="margin-top:10px; font-weight:bold;">${t.message || ''}</div>`;
            } else if (renderType === 'waffle') {
                const html = createWaffleHTML(t.total || 100, t.active || 0, t.colorVal || '#228B22', t.colorBg || '#696969');
                visualHTML = `<div style="width:100%;">${html}</div>`;
                statsHTML = `<div class="tracker-stats">${t.active} / ${t.total} ${t.metric || ''}</div>`;
            } else if (renderType === 'note') {
                visualHTML = `<div class="note-render-container" style="text-align:${t.align || 'left'}">${parseMarkdown(t.content || '')}</div>`;
                statsHTML = '';
            } else if (renderType === 'donut') {
                const labels = (t.dataPoints || []).map(dp => dp.label);
                const values = (t.dataPoints || []).map(dp => dp.value);
                visualHTML = `<div id="${chartId}" style="width:100%; height:160px;"></div>`;
                statsHTML = '';

                const common = getCommonApexOptions();
                chartConfig = {
                    ...common,
                    chart: { ...common.chart, type: 'donut', height: 160 },
                    series: values,
                    labels: labels,
                    plotOptions: { pie: { donut: { size: '60%' } } },
                    dataLabels: { enabled: false },
                    legend: { show: false }
                };
            }

            card.innerHTML = `<button class="btn-del-tracker" onclick="event.stopPropagation(); TrackerManager.deleteTracker(${i})">&times;</button>`;
            card.innerHTML += `<div class="tracker-desc">${t.desc}</div>`;
            card.innerHTML += `<div class="tracker-viz-container">${visualHTML}</div>`;
            card.innerHTML += `<div class="tracker-stats">${statsHTML}</div>`;
            
            tGrid.appendChild(card);

            // Render ApexChart if config exists
            if (chartConfig) {
                const el = document.getElementById(chartId);
                if (el) {
                    const chart = new ApexCharts(el, chartConfig);
                    chart.render();
                    chartInstances.push(chart);
                }
            }
        });
    }

    const grid = getEl('teamGrid');
    if (grid) {
        grid.innerHTML = '';
        State.members.forEach((m, i) => {
            let lw = ''; 
            if(m.lastWeek && m.lastWeek.tasks) {
                m.lastWeek.tasks.forEach((t,x) => {
                    if(t.text.trim()) lw += `<li class="card-task-li" onclick="event.stopPropagation()"><input type="checkbox" ${t.isTeamSuccess?'checked':''} onchange="UserManager.toggleSuccess(${i},${x})"><span>${t.text}</span></li>`;
                });
            }

            let tw = ''; 
            if(m.thisWeek && m.thisWeek.tasks) {
                m.thisWeek.tasks.forEach((t,x) => {
                    if(t.text.trim()) tw += `<li class="card-task-li" onclick="event.stopPropagation()"><input type="checkbox" ${t.isTeamSuccess?'checked':''} onchange="UserManager.toggleActivity(${i},${x})"><span>${t.text}</span></li>`;
                });
            }

            let nw = '';
            if(m.nextWeek && m.nextWeek.tasks) {
                m.nextWeek.tasks.forEach((t,x) => {
                    if(t.text.trim()) nw += `<li class="card-task-li" onclick="event.stopPropagation()"><input type="checkbox" ${t.isTeamActivity?'checked':''} onchange="UserManager.toggleFuture(${i},${x})"><span>${t.text}</span></li>`;
                });
            }
            
            const getAvgPill = (loadArr) => {
                let score = 0; let count = 0;
                (loadArr||[]).forEach(v => {
                    if(v === 'L') { score += 1; count++; } 
                    else if(v === 'N') { score += 2; count++; } 
                    else if(v === 'R') { score += 3; count++; }
                    else { count++; } // Absent counts as 0, but increments count
                });
                const avg = count === 0 ? 0 : score / count;
                let text = 'Medium'; let cls = 'status-busy'; // Default Amber
                if(avg > 2.4) { text = 'High'; cls = 'status-over'; } // Green
                else if(avg <= 1.4) { text = 'Low'; cls = 'status-under'; } // Red
                
                return `<div class="status-pill ${cls}" style="font-size:0.75rem; padding:2px 8px; width:auto; display:inline-block;">${text}</div>`;
            };

            const c = document.createElement('div');
            c.className = 'member-card';
            c.onclick = () => UserManager.openUserModal(i);
            
            const mapDisplay = (v) => {
                if (v === 'R') return 'H';
                if (v === 'N') return 'M';
                if (v === 'L') return 'L';
                if (v === 'X') return 'A';
                return v;
            };

            const thisLoadRaw = (m.thisWeek && m.thisWeek.load) ? m.thisWeek.load : ['N','N','N','N','N','X','X'];
            const thisLoad = thisLoadRaw.length === 5 ? [...thisLoadRaw, 'X', 'X'] : thisLoadRaw;
            const thisOc = (m.thisWeek && m.thisWeek.onCall) ? m.thisWeek.onCall : [false,false,false,false,false,false,false];
            const mgThis = thisLoad.map((v,k) => {
                const isOc = thisOc[k] ? '<div style="font-size:0.5rem; position:absolute; bottom:1px; right:1px; color:#00FFFF;">☎</div>' : '';
                return `<div class="dm-box" style="position:relative;"><span class="dm-day">${['M','T','W','T','F','S','S'][k]}</span><span class="dm-val val-${v}">${mapDisplay(v)}</span>${isOc}</div>`;
            }).join('');

            const nextLoadRaw = (m.nextWeek && m.nextWeek.load) ? m.nextWeek.load : ['N','N','N','N','N','X','X'];
            const nextLoad = nextLoadRaw.length === 5 ? [...nextLoadRaw, 'X', 'X'] : nextLoadRaw;
            const nextOc = (m.nextWeek && m.nextWeek.onCall) ? m.nextWeek.onCall : [false,false,false,false,false,false,false];
            const mgNext = nextLoad.map((v,k) => {
                const isOc = nextOc[k] ? '<div style="font-size:0.5rem; position:absolute; bottom:1px; right:1px; color:#00FFFF;">☎</div>' : '';
                return `<div class="dm-box" style="position:relative;"><span class="dm-day">${['M','T','W','T','F','S','S'][k]}</span><span class="dm-val val-${v}">${mapDisplay(v)}</span>${isOc}</div>`;
            }).join('');

            c.innerHTML = `<div class="member-header">${m.name}</div>`;
            
            let content = `<div class="member-card-content">`;
            content += `<div class="card-col"><div class="col-header">Last Week <span style="font-weight:normal; font-size:0.65rem;">(${getRanges().last.split(' - ')[0]})</span></div>`;
            content += `<ul class="card-task-list" style="padding-left:10px; font-size:0.8rem;">${lw || '<li style="list-style:none; opacity:0.5;">No items</li>'}</ul>`;
            content += `</div>`;

            content += `<div class="card-col"><div class="col-header">Current Week <span style="font-weight:normal; font-size:0.65rem;">(${getRanges().current.split(' - ')[0]})</span></div>`;
            content += `<div style="text-align:center; margin-bottom:5px;">${getAvgPill(m.thisWeek ? m.thisWeek.load : [])}</div>`;
            content += `<ul class="card-task-list" style="padding-left:10px; font-size:0.8rem;">${tw || '<li style="list-style:none; opacity:0.5;">No items</li>'}</ul>`;
            content += `<div class="daily-mini-grid" style="margin-top:auto;">${mgThis}</div>`;
            content += `</div>`;

            content += `<div class="card-col"><div class="col-header">Next Week <span style="font-weight:normal; font-size:0.65rem;">(${getRanges().next.split(' - ')[0]})</span></div>`;
            content += `<div style="text-align:center; margin-bottom:5px;">${getAvgPill(m.nextWeek ? m.nextWeek.load : [])}</div>`;
            content += `<ul class="card-task-list" style="padding-left:10px; font-size:0.8rem;">${nw || '<li style="list-style:none; opacity:0.5;">No items</li>'}</ul>`;
            content += `<div class="daily-mini-grid" style="margin-top:auto;">${mgNext}</div>`;
            content += `</div>`;

            content += `</div>`;
            
            if (m.notes) {
                content += `<div style="padding: 10px 1.5rem; border-top: 1px solid #333; font-size: 0.85rem; color: #ccc;">${m.notes}</div>`;
            }
            
            c.innerHTML += content;

            grid.appendChild(c);
        });
    }
};

export const ZoomManager = {
    openGanttModal: () => {
        const titleEl = getEl('zoomTitle');
        if (titleEl) titleEl.innerText = "Absenteeism Tracker";
        
        const r = getRanges();
        const content = Visuals.createGanttChartSVG(State.members, r.current, r.next);
        
        const bodyEl = getEl('zoomBody');
        if (bodyEl) {
            bodyEl.className = 'zoom-body-chart';
            bodyEl.innerHTML = `<div style="width:100%; height:100%; display:flex; align-items:center; justify-content:center; overflow:auto;">${content}</div>`;
        }
        ModalManager.openModal('zoomModal');
    },

    openChartModal: (index) => {
        console.log("ZoomManager.openChartModal called for index:", index);
        const t = State.trackers[index];
        if(!t) return;

        // Cleanup existing zoomed chart
        if (zoomedChartInstance) {
            zoomedChartInstance.destroy();
            zoomedChartInstance = null;
        }

        const titleEl = getEl('zoomTitle');
        if (titleEl) titleEl.innerText = t.desc;
        
        const bodyEl = getEl('zoomBody');
        if (!bodyEl) return;
        bodyEl.className = 'zoom-body-chart';

        let chartConfig = null;
        let htmlContent = '';
        let renderType = t.type;
        const chartId = 'zoomedChartContainer';

        if (renderType === 'line' || renderType === 'bar' || renderType === 'line1' || renderType === 'line2') {
            let labels = t.labels || [];
            let series = t.series || [];
            if ((!labels.length) && t.data) {
                labels = t.data.map(d => d.label);
                series = [{ name: 'Series 1', color: t.color1 || '#03dac6', values: t.data.map(d => d.val) }];
            }
            
            const style = (t.displayStyle === 'bar' || t.type === 'bar') ? 'bar' : 'line';
            htmlContent = `<div id="${chartId}" style="width:100%; height:100%;"></div>`;

            const common = getCommonApexOptions(true);
            chartConfig = {
                ...common,
                chart: { ...common.chart, type: style, height: '100%' },
                series: series.map(s => ({ name: s.name, data: s.values, color: s.color })),
                xaxis: { ...common.xaxis, categories: labels },
                yaxis: { ...common.yaxis, title: { text: t.yLabel || '' } },
                stroke: { width: style === 'line' ? 3 : 0, curve: 'smooth' }
            };

        } else if (renderType === 'gauge') {
             const pct = t.total>0 ? Math.round((t.completed/t.total)*100) : 0;
             const c1 = t.colorVal || t.color1 || '#00e676';

             htmlContent = `<div id="${chartId}" style="width:100%; height:100%; display:flex; justify-content:center; align-items:center;"></div>`;

             const common = getCommonApexOptions(true);
             chartConfig = {
                 ...common,
                 chart: { ...common.chart, type: 'radialBar', height: 500 },
                 series: [pct],
                 plotOptions: {
                     radialBar: {
                         hollow: { size: '70%' },
                         track: { background: '#333' },
                         dataLabels: {
                             show: true,
                             name: { show: false },
                             value: { color: '#fff', fontSize: '40px', show: true, offsetY: 10 }
                         }
                     }
                 },
                 fill: { colors: [c1] },
                 stroke: { lineCap: 'round' }
             };

        } else if (renderType === 'donut') {
            const labels = (t.dataPoints || []).map(dp => dp.label);
            const values = (t.dataPoints || []).map(dp => dp.value);

            htmlContent = `<div style="width:100%; height:100%; display:flex; flex-direction:row; gap:20px;">
                            <div style="flex: 2; display:flex; align-items:center; justify-content:center; min-height: 400px;">
                                <div id="${chartId}" style="width:100%; height:100%;"></div>
                            </div>
                            <div class="zoom-notes-section" style="flex: 1; padding:20px; border-left:1px solid #444; background:rgba(0,0,0,0.2); border-radius:8px; overflow-y:auto;">
                                ${t.notes ? `<h4 style="color:var(--accent); margin-bottom:10px;">Notes</h4><div>${parseMarkdown(t.notes)}</div>` : ''}
                            </div>
                           </div>`;

            const common = getCommonApexOptions(true);
            chartConfig = {
                ...common,
                chart: { ...common.chart, type: 'donut', height: '100%' },
                series: values,
                labels: labels,
                plotOptions: { pie: { donut: { size: '60%' } } },
                dataLabels: { enabled: true },
                legend: { position: 'right', fontSize: '14px', labels: { colors: '#fff' } }
            };

        } else if (renderType === 'counter') {
             htmlContent = `<div style="width:100%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center;">
                                <div style="font-size: 8rem; font-weight:300; color:${t.color1}; text-shadow:0 0 20px ${t.color1}">${t.value}</div>
                                <div style="font-size:2rem; color:#aaa; margin-top:1rem;">${t.subtitle}</div>
                            </div>`;
        } else if (renderType === 'rag' || renderType === 'ryg') {
            const status = t.status || 'grey';
            const icon = status === 'red' ? 'CRITICAL' : (status === 'amber' ? 'WARNING' : (status === 'green' ? 'GOOD' : 'UNKNOWN'));
            htmlContent = `<div style="width:100%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center;">
                            <div class="ryg-indicator ryg-${status}" style="background:${t.color1}; width:300px; height:300px; font-size:3rem;">${icon}</div>
                            <div style="margin-top:2rem; font-size:2rem;">${t.message || ''}</div>
                           </div>`;
        } else if (renderType === 'waffle') {
             htmlContent = `<div style="width:100%; height:100%; display:flex; align-items:center; justify-content:center;">${createWaffleHTML(t.total || 100, t.active || 0, t.colorVal || '#228B22', t.colorBg || '#696969')}</div>`;
        } else if (renderType === 'note') {
             htmlContent = `<div class="note-render-container zoomed-note" style="text-align:${t.align || 'left'}; font-size: 1.2rem; padding: 2rem;">${parseMarkdown(t.content || '')}</div>`;
        }

        // Add Notes Section for non-donut types if notes exist
        if (renderType !== 'donut' && (t.notes || (t.content && renderType !== 'note'))) {
            const notesHtml = parseMarkdown(t.notes || t.content || '');
             if (!htmlContent.includes('zoom-notes-section')) {
                 // Wrapper
                 const content = htmlContent;
                 htmlContent = `<div style="width:100%; height:100%; display:flex; flex-direction:column; padding:20px;">
                                    <div style="flex: 1; min-height: 300px; display:flex; align-items:center; justify-content:center;">${content}</div>
                                    <div class="zoom-notes-section" style="margin-top:20px; padding:20px; border-top:1px solid #444; background:rgba(0,0,0,0.2); border-radius:8px;">
                                        <h4 style="color:var(--accent); margin-bottom:10px; font-size:0.9rem; text-transform:uppercase;">Notes</h4>
                                        <div style="font-size:0.9rem; line-height:1.6; color:#ddd;">${notesHtml}</div>
                                    </div>
                                </div>`;
             }
        }

        bodyEl.innerHTML = htmlContent;

        // Render ApexChart if config exists
        if (chartConfig) {
             // Wait for DOM update
             setTimeout(() => {
                 const el = document.getElementById(chartId);
                 if (el) {
                     zoomedChartInstance = new ApexCharts(el, chartConfig);
                     zoomedChartInstance.render();
                 }
             }, 50);
        }

        ModalManager.openModal('zoomModal');
    }
};

export const TrackerManager = {
    openModal(index) {
        console.log("Opening Tracker Modal for index:", index);
        if (document.body.classList.contains('publishing')) return;

        State.editingTrackerIndex = index;
        const isEdit = index > -1;
        const titleEl = getEl('trackerModalTitle');
        if (titleEl) titleEl.innerText = isEdit ? 'Edit Progress Tracker' : 'Add Progress Tracker';
        
        ['gauge','bar','line','counter','rag','waffle'].forEach(type => {
            const div = getEl(`${type}Inputs`);
            if (div) div.style.display = 'none';
        });

        // Reset containers
        const tableContainer = getEl('lineTableContainer');
        if (tableContainer) tableContainer.innerHTML = '';
        const csvIn = getEl('csvInput');
        if (csvIn) {
            csvIn.value = '';
            csvIn.ondragover = (e) => { e.preventDefault(); csvIn.style.borderColor = 'var(--accent)'; csvIn.style.background = 'rgba(255,255,255,0.1)'; };
            csvIn.ondragleave = (e) => { e.preventDefault(); csvIn.style.borderColor = ''; csvIn.style.background = ''; };
            csvIn.ondrop = (e) => {
                e.preventDefault();
                csvIn.style.borderColor = '';
                csvIn.style.background = '';
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    const reader = new FileReader();
                    reader.onload = (ev) => { csvIn.value = ev.target.result; };
                    reader.readAsText(e.dataTransfer.files[0]);
                }
            };
        }

        const tracker = isEdit ? State.trackers[index] : null;
        let type = tracker ? tracker.type : 'gauge';
        
        // Migrate legacy bar to line
        let displayStyle = 'line';
        if (type === 'bar') {
            type = 'line';
            displayStyle = 'bar';
        } else if (type === 'line') {
            displayStyle = tracker.displayStyle || 'line';
        }

        this.setType(type);

        const descIn = getEl('tkDesc');
        if (descIn) descIn.value = tracker ? tracker.desc : '';
        
        const sizeVal = tracker ? (tracker.size || 'M') : 'M';
        const sizeRadio = document.querySelector(`input[name="tkSize"][value="${sizeVal}"]`);
        if (sizeRadio) sizeRadio.checked = true;

        if (type === 'line') {
             // Init Style Radio
             const dsRad = document.querySelector(`input[name="tkDisplayStyle"][value="${displayStyle}"]`);
             if(dsRad) dsRad.checked = true;

             const ctx = this.getContext();
             const unit = tracker ? (tracker.timeUnit || 'day') : 'day';
             const rad = document.querySelector(`input[name="${ctx.prefix}TimeUnit"][value="${unit}"]`);
             if(rad) rad.checked = true;
             
                           const d = new Date();
                           const defDate = d.toISOString().split('T')[0];
                           
                           const sdIn = getEl(`${ctx.prefix}StartDate`);
                           if (sdIn) {
                               sdIn.value = tracker ? (tracker.startDate || defDate) : defDate;
                               sdIn.dataset.prev = sdIn.value;
                           }
                           
                           const yIn = getEl(`${ctx.prefix}YLabel`);
                           if (yIn) yIn.value = tracker ? (tracker.yLabel || '') : '';
                           
                           const lnIn = getEl('tkLineNotes');
                           if (tracker && lnIn) lnIn.value = tracker.notes || '';
                           
                           this.updateTimeOptions();
                           const tcIn = getEl(`${ctx.prefix}TimeCount`);
                           
                           // Fix: Calculate count from labels length or timeCount, and ensure option exists
                           let countVal = 30;
                           if (tracker) {
                               if (tracker.labels && tracker.labels.length > 0) countVal = tracker.labels.length;
                               else if (tracker.timeCount) countVal = tracker.timeCount;
                           }
                           
                           if (tcIn) {
                               let exists = false;
                               for(let opt of tcIn.options) { if(parseInt(opt.value) === countVal) exists = true; }
                               if (!exists) {
                                   const opt = document.createElement('option');
                                   opt.value = countVal;
                                   opt.innerText = countVal;
                                   tcIn.appendChild(opt);
                               }
                               tcIn.value = countVal;
                           }
                           
             let series = [];
             if (tracker) {
                 if (tracker.series) series = tracker.series;
                 else if (tracker.data) {
                     // Legacy migration
                     series = [{name:'Series 1', color: tracker.color1||'#03dac6', values: tracker.data.map(d => d.val || 0)}];
                 }
             } else {
                 series = [{name:'Series 1', color: '#03dac6', values:[]}];
             }
             
             this.renderTimeTable(series);
        } else {
            // Reset Line inputs in background for new trackers so switching types shows defaults
            if (!isEdit) {
                const ctx = this.getContext('line');
                const d = new Date();
                const defDate = d.toISOString().split('T')[0];
                
                const sdIn = getEl(`${ctx.prefix}StartDate`);
                if(sdIn) { sdIn.value = defDate; sdIn.dataset.prev = defDate; }
                
                const rad = document.querySelector(`input[name="${ctx.prefix}TimeUnit"][value="day"]`);
                if(rad) rad.checked = true;
                
                // Manually trigger update options logic without render
                const histLabel = getEl(`${ctx.prefix}HistoricLabel`);
                if (histLabel) histLabel.innerText = "Historic Days";
                
                const countSel = getEl(`${ctx.prefix}TimeCount`);
                if (countSel) {
                    countSel.innerHTML = '';
                    [5, 7, 14, 30, 60, 90].forEach(o => {
                        const opt = document.createElement('option');
                        opt.value = o; opt.innerText = o;
                        countSel.appendChild(opt);
                    });
                    countSel.value = 30;
                }

                const yIn = getEl(`${ctx.prefix}YLabel`);
                if(yIn) yIn.value = '';

                // Clear table to ensure fresh start
                const tableContainer = getEl('lineTableContainer');
                if(tableContainer) tableContainer.innerHTML = '';
                
                const lnIn = getEl('tkLineNotes'); if(lnIn) lnIn.value = '';
            } else if (!isEdit && type === 'gauge') {
                // Reset Gauge defaults for new trackers
                const tmIn = getEl('tkMetric'); if(tmIn) tmIn.value = '';
                const tcIn = getEl('tkComp'); if(tcIn) tcIn.value = '';
                const ttIn = getEl('tkTotal'); if(ttIn) ttIn.value = '';
                const nIn = getEl('tkNotes'); if(nIn) nIn.value = '';
                
                // Set Size to S
                const sizeRad = document.querySelector('input[name="tkSize"][value="S"]');
                if(sizeRad) sizeRad.checked = true;
            } else if (!isEdit && type === 'waffle') {
                // Reset Waffle defaults for new trackers
                const twmIn = getEl('tkWaffleMetric'); if(twmIn) twmIn.value = '';
                const twtIn = getEl('tkWaffleTotal'); if(twtIn) twtIn.value = '';
                const twaIn = getEl('tkWaffleActive'); if(twaIn) twaIn.value = '';
                const twnIn = getEl('tkWaffleNotes'); if(twnIn) twnIn.value = '';
                
                // Set Size to S (will be re-inferred on submit)
                const sizeRad = document.querySelector('input[name="tkSize"][value="S"]');
                if(sizeRad) sizeRad.checked = true;
            } else if (!isEdit && type === 'rag') {
                // Reset RAG defaults for new trackers
                const trmIn = getEl('tkRagMsg'); if(trmIn) trmIn.value = '';
                const trnIn = getEl('tkRagNotes'); if(trnIn) trnIn.value = '';
                
                // Set Size to S
                const sizeRad = document.querySelector('input[name="tkSize"][value="S"]');
                if(sizeRad) sizeRad.checked = true;
            } else if (!isEdit && type === 'counter') {
                // Reset Counter defaults for new trackers
                const tcsIn = getEl('tkCounterSub'); if(tcsIn) tcsIn.value = '';
                const tcnIn = getEl('tkCounterNotes'); if(tcnIn) tcnIn.value = '';
                const tcvIn = getEl('tkCounterVal'); if(tcvIn) tcvIn.value = 0;
                
                // Set Size to S
                const sizeRad = document.querySelector('input[name="tkSize"][value="S"]');
                if(sizeRad) sizeRad.checked = true;
            } else if (!isEdit && type === 'note') {
                const tcnIn = getEl('tkNoteContent'); if(tcnIn) tcnIn.value = '';
                // Default Align Left
                const alignRad = document.querySelector('input[name="tkNoteAlign"][value="left"]');
                if(alignRad) alignRad.checked = true;
                // Set Size to M
                const sizeRad = document.querySelector('input[name="tkSize"][value="M"]');
                if(sizeRad) sizeRad.checked = true;
            } else if (!isEdit && type === 'donut') {
                const container = getEl('donutDataContainer');
                if(container) container.innerHTML = '';
                const notesIn = getEl('tkDonutNotes');
                if(notesIn) notesIn.value = '';
                // Default Size S
                const sizeRad = document.querySelector('input[name="tkSize"][value="S"]');
                if(sizeRad) sizeRad.checked = true;
            }

            if (type === 'gauge') {
                const tmIn = getEl('tkMetric');
                // Only populate if tracker exists, otherwise keep blank (from reset above)
                if (tracker && tmIn) tmIn.value = tracker.metric || '';
                
                const tcIn = getEl('tkComp');
                if (tracker && tcIn) tcIn.value = tracker.completed || '';
                
                const ttIn = getEl('tkTotal');
                if (tracker && ttIn) ttIn.value = tracker.total || '';

                const nIn = getEl('tkNotes');
                if (tracker && nIn) nIn.value = tracker.notes || '';
                
                const pcIn = getEl('tkPieColor');
                if (pcIn) pcIn.value = tracker ? (tracker.colorVal || tracker.color1 || '#696969') : '#696969';
                const pc2In = getEl('tkPieColor2');
                if (pc2In) pc2In.value = tracker ? (tracker.color2 || '#228B22') : '#228B22';
            } else if (type === 'counter') {
                const cvIn = getEl('tkCounterVal');
                if (tracker && cvIn) cvIn.value = tracker.value || 0;
                const csIn = getEl('tkCounterSub');
                if (tracker && csIn) csIn.value = tracker.subtitle || '';
                const cnIn = getEl('tkCounterNotes');
                if (tracker && cnIn) cnIn.value = tracker.notes || '';
                const ccIn = getEl('tkCounterColor');
                if (ccIn) ccIn.value = tracker ? (tracker.color1 || '#bb86fc') : '#bb86fc';
            } else if (type === 'rag') {
                this.selectRag(tracker ? (tracker.status || 'grey') : 'grey');
                const rmIn = getEl('tkRagMsg');
                if (tracker && rmIn) rmIn.value = tracker.message || '';
                const rnIn = getEl('tkRagNotes');
                if (tracker && rnIn) rnIn.value = tracker.notes || '';
            } else if (type === 'waffle') {
                const twmIn = getEl('tkWaffleMetric');
                if (tracker && twmIn) twmIn.value = tracker.metric || '';
                const twtIn = getEl('tkWaffleTotal');
                if (tracker && twtIn) twtIn.value = tracker.total || '';
                const twaIn = getEl('tkWaffleActive');
                if (tracker && twaIn) twaIn.value = tracker.active || '';
                const twnIn = getEl('tkWaffleNotes');
                if (tracker && twnIn) twnIn.value = tracker.notes || '';
                
                const wcIn = getEl('tkWaffleColorVal');
                if (wcIn) wcIn.value = tracker ? (tracker.colorVal || '#228B22') : '#228B22';
                const wbIn = getEl('tkWaffleColorBg');
                if (wbIn) wbIn.value = tracker ? (tracker.colorBg || '#696969') : '#696969';
            } else if (type === 'note') {
                const tcnIn = getEl('tkNoteContent');
                if (tracker && tcnIn) tcnIn.value = tracker.content || '';
                
                const align = tracker ? (tracker.align || 'left') : 'left';
                const alignRad = document.querySelector(`input[name="tkNoteAlign"][value="${align}"]`);
                if(alignRad) alignRad.checked = true;
            } else if (type === 'donut') {
                const container = getEl('donutDataContainer');
                if (container) container.innerHTML = '';
                if (tracker && tracker.dataPoints) {
                    tracker.dataPoints.forEach(dp => this.addDonutRow(dp.label, dp.value));
                }
                const notesIn = getEl('tkDonutNotes');
                if (tracker && notesIn) notesIn.value = tracker.notes || '';
            }
        }

        ModalManager.openModal('trackerModal');
    }
};

export const UserManager = {
    openUserModal: (index = -1) => {
        const isEdit = index > -1;
        getEl('modalTitle').innerText = isEdit ? 'Edit User' : 'Add User';
        getEl('editIndex').value = index;
        
        const m = isEdit ? State.members[index] : {
            name: '',
            lastWeek: { tasks: [{text:'', isTeamSuccess:false}, {text:'', isTeamSuccess:false}, {text:'', isTeamSuccess:false}] },
            thisWeek: { tasks: [{text:'', isTeamSuccess:false}, {text:'', isTeamSuccess:false}, {text:'', isTeamSuccess:false}], load: ['N','N','N','N','N','X','X'] },
            nextWeek: { tasks: [{text:'', isTeamActivity:false}, {text:'', isTeamActivity:false}, {text:'', isTeamActivity:false}], load: ['N','N','N','N','N','X','X'] }
        };

        getEl('mName').value = m.name || '';
        
        // Populate tasks
        for(let i=1; i<=3; i++) {
            getEl('lwTask'+i).value = m.lastWeek.tasks[i-1]?.text || '';
            getEl('nwTask'+i).value = m.thisWeek.tasks[i-1]?.text || '';
            getEl('fwTask'+i).value = m.nextWeek.tasks[i-1]?.text || '';
        }

        // Loads
        const defaultLoad = ['N','N','N','N','N','X','X'];
        const thisLoad = (m.thisWeek && m.thisWeek.load) ? [...m.thisWeek.load, ...defaultLoad.slice(m.thisWeek.load.length)] : defaultLoad;
        const nextLoad = (m.nextWeek && m.nextWeek.load) ? [...m.nextWeek.load, ...defaultLoad.slice(m.nextWeek.load.length)] : defaultLoad;
        
        thisLoad.forEach((v, i) => UserManager.setLoad(i, v));
        nextLoad.forEach((v, i) => UserManager.setFutureLoad(i, v));

        // On Call
        const defaultOnCall = [false, false, false, false, false, false, false];
        const thisOnCall = (m.thisWeek && m.thisWeek.onCall) ? [...m.thisWeek.onCall, ...defaultOnCall.slice(m.thisWeek.onCall.length)] : defaultOnCall;
        const nextOnCall = (m.nextWeek && m.nextWeek.onCall) ? [...m.nextWeek.onCall, ...defaultOnCall.slice(m.nextWeek.onCall.length)] : defaultOnCall;

        thisOnCall.forEach((v, i) => { const el = getEl('nwOc'+i); if(el) el.checked = v; });
        nextOnCall.forEach((v, i) => { const el = getEl('fwOc'+i); if(el) el.checked = v; });

        getEl('mNotes').value = m.notes || '';

        getEl('deleteBtn').style.display = isEdit ? 'block' : 'none';
        ModalManager.openModal('userModal');
    },
    setStatus: (status) => {
        getEl('lwStatus').value = status;
        document.querySelectorAll('.status-option').forEach(el => {
            el.classList.toggle('selected', el.classList.contains('so-' + status));
        });
    },
    setLoad: (day, val) => {
        getEl('nw' + day).value = val;
        // Search globally for all load select rows
        const rows = document.querySelectorAll('.load-select-row');
        if (rows.length > 0) {
            const boxes = rows[0].querySelectorAll('.ls-box');
            if (boxes[day]) {
                boxes[day].querySelectorAll('.w-pill').forEach(p => {
                    const text = p.innerText;
                    const expected = (val === 'N' ? 'M' : (val === 'L' ? 'L' : (val === 'R' ? 'H' : 'A')));
                    p.classList.toggle('selected', text === expected);
                });
            }
        }
    },
    setFutureLoad: (day, val) => {
        getEl('fw' + day).value = val;
        const rows = document.querySelectorAll('.load-select-row');
        if (rows.length > 1) {
            const boxes = rows[1].querySelectorAll('.ls-box');
            if (boxes[day]) {
                boxes[day].querySelectorAll('.w-pill').forEach(p => {
                    const text = p.innerText;
                    const expected = (val === 'N' ? 'M' : (val === 'L' ? 'L' : (val === 'R' ? 'H' : 'A')));
                    p.classList.toggle('selected', text === expected);
                });
            }
        }
    },
    submitUser: () => {
        const idx = parseInt(getEl('editIndex').value);
        const name = getEl('mName').value.trim();
        if(!name) return App.alert("Name is required");

        const member = {
            name,
            notes: getEl('mNotes').value.trim(),
            lastWeek: {
                onCall: (idx > -1 && State.members[idx].lastWeek?.onCall) ? State.members[idx].lastWeek.onCall : [],
                tasks: [
                    { text: getEl('lwTask1').value, isTeamSuccess: idx > -1 ? (State.members[idx].lastWeek?.tasks[0]?.isTeamSuccess || false) : false },
                    { text: getEl('lwTask2').value, isTeamSuccess: idx > -1 ? (State.members[idx].lastWeek?.tasks[1]?.isTeamSuccess || false) : false },
                    { text: getEl('lwTask3').value, isTeamSuccess: idx > -1 ? (State.members[idx].lastWeek?.tasks[2]?.isTeamSuccess || false) : false }
                ]
            },
            thisWeek: {
                load: [
                    getEl('nw0').value, getEl('nw1').value, getEl('nw2').value, getEl('nw3').value, getEl('nw4').value,
                    getEl('nw5').value, getEl('nw6').value
                ],
                onCall: [
                    getEl('nwOc0').checked, getEl('nwOc1').checked, getEl('nwOc2').checked, getEl('nwOc3').checked, getEl('nwOc4').checked,
                    getEl('nwOc5').checked, getEl('nwOc6').checked
                ],
                tasks: [
                    { text: getEl('nwTask1').value, isTeamSuccess: idx > -1 ? (State.members[idx].thisWeek?.tasks[0]?.isTeamSuccess || false) : false },
                    { text: getEl('nwTask2').value, isTeamSuccess: idx > -1 ? (State.members[idx].thisWeek?.tasks[1]?.isTeamSuccess || false) : false },
                    { text: getEl('nwTask3').value, isTeamSuccess: idx > -1 ? (State.members[idx].thisWeek?.tasks[2]?.isTeamSuccess || false) : false }
                ]
            },
            nextWeek: {
                load: [
                    getEl('fw0').value, getEl('fw1').value, getEl('fw2').value, getEl('fw3').value, getEl('fw4').value,
                    getEl('fw5').value, getEl('fw6').value
                ],
                onCall: [
                    getEl('fwOc0').checked, getEl('fwOc1').checked, getEl('fwOc2').checked, getEl('fwOc3').checked, getEl('fwOc4').checked,
                    getEl('fwOc5').checked, getEl('fwOc6').checked
                ],
                tasks: [
                    { text: getEl('fwTask1').value, isTeamActivity: idx > -1 ? (State.members[idx].nextWeek?.tasks[0]?.isTeamActivity || false) : false },
                    { text: getEl('fwTask2').value, isTeamActivity: idx > -1 ? (State.members[idx].nextWeek?.tasks[1]?.isTeamActivity || false) : false },
                    { text: getEl('fwTask3').value, isTeamActivity: idx > -1 ? (State.members[idx].nextWeek?.tasks[2]?.isTeamActivity || false) : false }
                ]
            }
        };

        if(idx === -1) State.members.push(member);
        else State.members[idx] = member;

        ModalManager.closeModal('userModal');
        renderBoard();
    },
    deleteUser: () => {
        const idx = parseInt(getEl('editIndex').value);
        App.confirm("Delete this user?", () => {
            State.members.splice(idx, 1);
            ModalManager.closeModal('userModal');
            renderBoard();
        });
    },
    toggleSuccess: (mIdx, tIdx) => {
        State.members[mIdx].lastWeek.tasks[tIdx].isTeamSuccess = !State.members[mIdx].lastWeek.tasks[tIdx].isTeamSuccess;
        renderBoard();
    },
    toggleActivity: (mIdx, tIdx) => {
        State.members[mIdx].thisWeek.tasks[tIdx].isTeamSuccess = !State.members[mIdx].thisWeek.tasks[tIdx].isTeamSuccess;
        renderBoard();
    },
    toggleFuture: (mIdx, tIdx) => {
        State.members[mIdx].nextWeek.tasks[tIdx].isTeamActivity = !State.members[mIdx].nextWeek.tasks[tIdx].isTeamActivity;
        renderBoard();
    },
    resetSelections: (type) => {
        State.members.forEach(m => {
            if(type === 'success') {
                m.lastWeek.tasks.forEach(t => t.isTeamSuccess = false);
                m.thisWeek.tasks.forEach(t => t.isTeamSuccess = false);
            } else {
                m.nextWeek.tasks.forEach(t => t.isTeamActivity = false);
            }
        });
        renderBoard();
    }
};

export const OverviewManager = {
    handleOverviewClick: (type) => {
        if(document.body.classList.contains('publishing')) {
            const list = type === 'success' ? getEl('teamSuccessList') : getEl('teamActivityList');
            const title = type === 'success' ? 'Team Achievements' : 'Activities Next Week';
            const body = `<div class="zoomed-content"><ul>${list.innerHTML}</ul></div>`;
            getEl('zoomTitle').innerText = title;
            getEl('zoomBody').innerHTML = body;
            ModalManager.openModal('zoomModal');
        }
    },
    handleInfoClick: () => {
        if(!document.body.classList.contains('publishing')) {
            const val = prompt("Enter Additional Info (Markdown supported):", State.additionalInfo);
            if(val !== null) {
                State.additionalInfo = val;
                renderBoard();
            }
        } else {
            getEl('zoomTitle').innerText = "Additional Info";
            getEl('zoomBody').innerHTML = `<div class="zoomed-content">${parseMarkdown(State.additionalInfo)}</div>`;
            ModalManager.openModal('zoomModal');
        }
    }
};

export const DataSaver = {
    saveData: () => {
        const today = new Date();
        const d = today.getDay();
        const diff = d === 0 ? -6 : 1 - d;
        const cm = new Date(today);
        cm.setDate(today.getDate() + diff);
        const savedDate = cm.toISOString().split('T')[0];

        const data = JSON.stringify({ ...State, savedDate }, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `team_tracker_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }
};

export const DataLoader = {
    loadFromFile: (input) => {
        const file = input.files[0];
        if(!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if(data.trackers && data.members) {
                    
                    // Migration Logic
                    const today = new Date();
                    const d = today.getDay();
                    const diff = d === 0 ? -6 : 1 - d;
                    const cm = new Date(today);
                    cm.setDate(today.getDate() + diff);
                    const currentMonday = new Date(cm.toISOString().split('T')[0]);
                    
                    const savedDateStr = data.savedDate || cm.toISOString().split('T')[0];
                    const savedDate = new Date(savedDateStr);
                    
                    // Diff in weeks (round to nearest integer)
                    const timeDiff = currentMonday - savedDate;
                    const diffWeeks = Math.round(timeDiff / (1000 * 60 * 60 * 24 * 7));
                    
                    if (diffWeeks > 0) {
                        console.log(`Migrating data: ${diffWeeks} weeks difference.`);
                        
                        const getStatusFromLoad = (load) => {
                            if(!load) return 'busy';
                            let score=0, count=0;
                            load.forEach(v => {
                                if(v==='L'){score+=1;count++}
                                else if(v==='N'){score+=2;count++}
                                else if(v==='R'){score+=3;count++}
                            });
                            if(count===0) return 'busy';
                            const avg = score/count;
                            if(avg < 1.6) return 'under';
                            if(avg > 2.4) return 'over';
                            return 'busy';
                        };

                        const emptyTasks = (isSuccess) => [
                            {text:'', [isSuccess?'isTeamSuccess':'isTeamActivity']:false},
                            {text:'', [isSuccess?'isTeamSuccess':'isTeamActivity']:false},
                            {text:'', [isSuccess?'isTeamSuccess':'isTeamActivity']:false}
                        ];
                        const emptyLoad = ['N','N','N','N','N','X','X'];
                        const emptyOnCall = [false, false, false, false, false, false, false];

                        data.members.forEach(m => {
                            if (diffWeeks === 1) {
                                // Move This -> Last
                                m.lastWeek = {
                                    status: getStatusFromLoad(m.thisWeek.load),
                                    onCall: m.thisWeek.onCall || [...emptyOnCall],
                                    tasks: m.thisWeek.tasks.map(t => ({ text: t.text, isTeamSuccess: t.isTeamSuccess }))
                                };
                                // Move Next -> This
                                m.thisWeek = {
                                    load: m.nextWeek.load,
                                    onCall: m.nextWeek.onCall || [...emptyOnCall],
                                    tasks: m.nextWeek.tasks.map(t => ({ text: t.text, isTeamSuccess: t.isTeamActivity }))
                                };
                                // Clear Next
                                m.nextWeek = { load: [...emptyLoad], onCall: [...emptyOnCall], tasks: emptyTasks(false) };
                            } else if (diffWeeks === 2) {
                                // Move Next -> Last
                                m.lastWeek = {
                                    status: getStatusFromLoad(m.nextWeek.load),
                                    onCall: m.nextWeek.onCall || [...emptyOnCall],
                                    tasks: m.nextWeek.tasks.map(t => ({ text: t.text, isTeamSuccess: t.isTeamActivity }))
                                };
                                // Clear This & Next
                                m.thisWeek = { load: [...emptyLoad], onCall: [...emptyOnCall], tasks: emptyTasks(true) };
                                m.nextWeek = { load: [...emptyLoad], onCall: [...emptyOnCall], tasks: emptyTasks(false) };
                            } else {
                                // Clear All (> 2 weeks)
                                m.lastWeek = { status: 'busy', onCall: [...emptyOnCall], tasks: emptyTasks(true) };
                                m.thisWeek = { load: [...emptyLoad], onCall: [...emptyOnCall], tasks: emptyTasks(true) };
                                m.nextWeek = { load: [...emptyLoad], onCall: [...emptyOnCall], tasks: emptyTasks(false) };
                            }
                        });
                        App.alert(`Data loaded and migrated (${diffWeeks} week(s) forward).`);
                    } else {
                        App.alert("Data loaded successfully.");
                    }

                    State = { ...State, ...data };
                    renderBoard();
                } else {
                    App.alert("Invalid data format.");
                }
            } catch(err) {
                console.error(err);
                App.alert("Error parsing file.");
            }
        };
        reader.readAsText(file);
        input.value = '';
    }
};

export const DataExporter = {
    exportCSV: () => {}
};
