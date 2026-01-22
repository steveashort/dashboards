/**
 * SERVER PLATFORMS TRACKER v36
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
    currentTrackerType: 'gauge',
    config: {
        showTopSection: true,
        maxSeries: 6,
        maxEvents: 20,
        maxDonut: 10,
        maxWaffle: 450,
        githubRepo: "",
        colors: [
            '#e6194b', '#3cb44b', '#ffe119', '#4363d8', '#f58231', '#911eb4', '#46f0f0', '#f032e6', '#bcf60c', '#fabebe', '#008080', '#e6beff', '#9a6324', '#fffac8', '#800000', '#aaffc3', '#808000', '#ffd8b1', '#000075', '#808080', '#ffffff', '#000000'
        ]
    }
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

const createColorPickerHTML = (inputId, initialColor) => {
    let html = '';
    State.config.colors.forEach(c => {
        const selected = (c.toLowerCase() === (initialColor || '').toLowerCase()) ? 'selected' : '';
        html += `<div class="color-swatch ${selected}" style="background:${c}" onclick="SettingsManager.selectColor('${inputId}', '${c}', this)"></div>`;
    });
    return html;
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

    const btn = document.getElementById('expandTeamBtn');
    if(btn) {
        btn.style.display = 'inline-block';
        btn.innerText = "Show Resource Planner";
    }

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
            btn.style.display = 'inline-block';
            btn.innerText = isPub ? "Expand Team Data" : "Show Resource Planner";
        }
        
        const editBtn = getEl('publishToggleBtn');
        if (editBtn) editBtn.style.display = isPub ? 'block' : 'none';

        const ganttSec = getEl('ganttSection');
        const teamHead = getEl('teamSectionHeader');
        const teamGrid = getEl('teamGrid');
        const overviewPanel = getEl('teamOverviewPanel');
        
        if (ganttSec) ganttSec.style.display = 'none';
        if (teamHead) teamHead.style.display = isPub ? 'none' : 'flex';
        if (teamGrid) teamGrid.style.display = isPub ? 'none' : 'grid';
        
        // Handle Top Section Config
        if (overviewPanel) {
            if (isPub) {
                // If publishing, respect the config setting
                const showTop = (State.config && State.config.showTopSection !== undefined) ? State.config.showTopSection : true;
                overviewPanel.style.display = showTop ? 'grid' : 'none';
            } else {
                // Always show in edit mode
                overviewPanel.style.display = 'grid';
            }
        }

        renderBoard();
    },
    toggleTeamData: () => {
        const ganttSec = getEl('ganttSection');
        const teamHead = getEl('teamSectionHeader');
        const teamGrid = getEl('teamGrid');
        const btn = getEl('expandTeamBtn');
        const ghBtn = getEl('githubSyncBtn');
        
        const isHidden = ganttSec.style.display === 'none';
        const isPub = document.body.classList.contains('publishing');
        
        if (isHidden) {
            ganttSec.style.display = 'block';
            if (teamHead) teamHead.style.display = 'flex';
            if (teamGrid) teamGrid.style.display = 'grid';

            if (btn) btn.innerText = isPub ? "Collapse Team Data" : "Hide Resource Planner";

            if (ghBtn && State.config.githubRepo) ghBtn.style.display = 'inline-block';
            
            // Render Gantt
            Visuals.renderResourcePlanner(State.members);
        } else {
            ganttSec.style.display = 'none';

            if (isPub) {
                if (teamHead) teamHead.style.display = 'none';
                if (teamGrid) teamGrid.style.display = 'none';
            }

            if (btn) btn.innerText = isPub ? "Expand Team Data" : "Show Resource Planner";
            if (ghBtn) ghBtn.style.display = 'none';
        }
    },
    saveTitle: () => {
        const titleEl = getEl('appTitle');
        if (titleEl) State.title = titleEl.innerText;
        console.log("Title saved");
    }
};

// Override Visuals.renderResourcePlanner to use ApexCharts
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

        if (id === 'settingsModal') {
            const cfg = State.config || {};
            const stsIn = getEl('cfgShowTopSection'); if(stsIn) stsIn.checked = (cfg.showTopSection !== undefined) ? cfg.showTopSection : true;
            const msIn = getEl('cfgMaxSeries'); if(msIn) msIn.value = cfg.maxSeries || 6;
            const meIn = getEl('cfgMaxEvents'); if(meIn) meIn.value = cfg.maxEvents || 20;
            const mdIn = getEl('cfgMaxDonut'); if(mdIn) mdIn.value = cfg.maxDonut || 10;
            const mwIn = getEl('cfgMaxWaffle'); if(mwIn) mwIn.value = cfg.maxWaffle || 450;
            const grIn = getEl('cfgGithubRepo'); if(grIn) grIn.value = cfg.githubRepo || "";
        }
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

export const SettingsManager = {
    saveSettings: () => {
        const sts = getEl('cfgShowTopSection').checked;
        const ms = parseInt(getEl('cfgMaxSeries').value) || 6;
        const me = parseInt(getEl('cfgMaxEvents').value) || 20;
        const md = parseInt(getEl('cfgMaxDonut').value) || 10;
        const mw = parseInt(getEl('cfgMaxWaffle').value) || 450;
        const gr = getEl('cfgGithubRepo').value.trim();

        State.config = {
            ...State.config,
            showTopSection: sts,
            maxSeries: ms,
            maxEvents: me,
            maxDonut: md,
            maxWaffle: mw,
            githubRepo: gr
        };

        ModalManager.closeModal('settingsModal');
        // If currently published, toggle logic will pick up new setting
        if (document.body.classList.contains('publishing')) {
            const overviewPanel = getEl('teamOverviewPanel');
            if (overviewPanel) overviewPanel.style.display = sts ? 'grid' : 'none';
        }

        // Show/Hide Sync Button if opened
        const ghBtn = getEl('githubSyncBtn');
        if (ghBtn) ghBtn.style.display = (State.config.githubRepo && getEl('ganttSection').style.display !== 'none') ? 'inline-block' : 'none';

        App.alert("Settings saved.");
    },
    selectColor: (inputId, color, element) => {
        const input = getEl(inputId);
        if(input) input.value = color;

        // Update visual selection
        if(element && element.parentNode) {
            Array.from(element.parentNode.children).forEach(c => c.classList.remove('selected'));
            element.classList.add('selected');
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
            const heightClass = (t.height === 'tall' && (t.size === 'L' || t.size === 'XL')) ? 'height-2x' : '';

            card.className = `tracker-card size-${displaySize} type-${t.type} ${heightClass}`;
            card.dataset.index = i;
            
            if (!document.body.classList.contains('publishing')) {
                card.draggable = true;
            }

            card.onclick = () => {
                 console.log("Card clicked. Type:", t.type, "Publishing:", document.body.classList.contains('publishing'));
                 if (document.body.classList.contains('publishing')) {
                     // Zoom requested
                     const canZoom = ['line', 'bar', 'note', 'rag', 'ryg', 'waffle', 'donut', 'gauge', 'event', 'gantt'].includes(t.type);
                     if (canZoom) ZoomManager.openChartModal(i);
                 } else {
                     TrackerManager.openModal(i);
                 }
            };

            // Zoom Icon
            if (document.body.classList.contains('publishing') && ['line', 'bar', 'note', 'rag', 'ryg', 'waffle', 'donut', 'gauge', 'event', 'gantt'].includes(t.type)) {
                card.innerHTML += `<div class="zoom-icon" style="position:absolute; top:5px; right:5px; color:#666; font-size:14px; pointer-events:none;">&#128269;</div>`;
            }

            // Last Updated
            if (document.body.classList.contains('publishing') && t.lastUpdated) {
                const dateStr = new Date(t.lastUpdated).toLocaleDateString('en-GB', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' });
                card.innerHTML += `<div class="last-updated">Updated - ${dateStr}</div>`;
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
            const chartHeight = heightClass ? 440 : 160;
            
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
                
                visualHTML = `<div id="${chartId}" style="width:100%; height:${chartHeight}px;"></div>`;

                // Build Apex Options
                const common = getCommonApexOptions();
                chartConfig = {
                    ...common,
                    chart: { ...common.chart, type: style, height: chartHeight },
                    series: series.map(s => ({ name: s.name, data: s.values, color: s.color })),
                    xaxis: { ...common.xaxis, categories: labels },
                    yaxis: { ...common.yaxis, title: { text: t.yLabel || '' } },
                    stroke: { width: style === 'line' ? 2 : 0, curve: 'smooth' }
                };

            } else if (renderType === 'gauge') {
                const pct = t.total>0 ? Math.round((t.completed/t.total)*100) : 0;
                visualHTML = `<div id="${chartId}" style="width:100%; height:${chartHeight}px; display:flex; justify-content:center;"></div>`;
                statsHTML = `<div class="tracker-stats">${t.completed} / ${t.total} ${t.metric}</div>`;

                // Apex Radial Bar
                const c1 = t.colorVal || t.color1 || '#00e676';
                const common = getCommonApexOptions();
                chartConfig = {
                    ...common,
                    chart: { ...common.chart, type: 'radialBar', height: chartHeight + 20 },
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
                // Support Multiple Counters
                const counters = t.counters || [{ label: t.subtitle, value: t.value, color: t.color1 }];

                visualHTML = `<div style="display:flex; flex-wrap:wrap; justify-content:space-around; align-items:center; width:100%; height:100%; gap:10px;">`;

                counters.forEach(c => {
                    visualHTML += `<div style="text-align:center;">
                                    <div class="counter-display" style="color:${c.color}">${c.value}</div>
                                    <div class="counter-sub">${c.label || ''}</div>
                                   </div>`;
                });

                visualHTML += `</div>`;
                statsHTML = ''; // Stats moved inside visual for multi-counter

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
                visualHTML = `<div id="${chartId}" style="width:100%; height:${chartHeight}px;"></div>`;
                statsHTML = '';

                const common = getCommonApexOptions();
                chartConfig = {
                    ...common,
                    chart: { ...common.chart, type: 'donut', height: chartHeight },
                    series: values,
                    labels: labels,
                    plotOptions: { pie: { donut: { size: '60%' } } },
                    dataLabels: { enabled: false },
                    legend: { show: false }
                };
            } else if (renderType === 'event') {
                const events = (t.events || []).map(ev => {
                    const evDate = new Date(ev.date);
                    const utcDate = new Date(evDate.valueOf() + evDate.getTimezoneOffset() * 60000);
                    return { name: ev.name, date: utcDate.getTime() };
                });

                events.sort((a, b) => a.date - b.date);

                const data = events.map((e, i) => ({
                    x: e.date,
                    y: i % 2 === 0 ? 1 : -1,
                    meta: e.name
                }));

                visualHTML = `<div id="${chartId}" style="width:100%; height:${chartHeight}px;"></div>`;

                const common = getCommonApexOptions();
                chartConfig = {
                    ...common,
                    chart: { ...common.chart, type: 'bar', height: chartHeight, toolbar: { show: false } },
                    series: [{ name: 'Timeline', data: data }],
                    xaxis: {
                        ...common.xaxis,
                        type: 'datetime',
                        labels: { show: true, format: 'dd MMM', style: { colors: '#aaa', fontSize: '10px' } },
                        axisBorder: { show: false },
                        axisTicks: { show: false },
                        tooltip: { enabled: false }
                    },
                    yaxis: {
                        min: -2, max: 2,
                        show: false,
                    },
                    grid: {
                        show: true,
                        yaxis: { lines: { show: false } },
                        xaxis: { lines: { show: false } },
                        padding: { top: 0, bottom: 0 }
                    },
                    plotOptions: {
                        bar: {
                            columnWidth: '2%',
                            borderRadius: 0,
                            colors: {
                                ranges: [{ from: -10, to: 10, color: '#03dac6' }]
                            },
                            dataLabels: {
                                position: 'top'
                            }
                        }
                    },
                    annotations: {
                        yaxis: [{
                            y: 0,
                            strokeDashArray: 0,
                            borderColor: '#666',
                            borderWidth: 1,
                            width: '100%',
                            opacity: 0.5
                        }]
                    },
                    dataLabels: {
                        enabled: true,
                        formatter: function(val, opts) {
                            try {
                                return opts.w.config.series[0].data[opts.dataPointIndex].meta;
                            } catch(e) { return ''; }
                        },
                        style: {
                            fontSize: '9px',
                            colors: ['#e0e0e0']
                        },
                        background: {
                            enabled: true,
                            foreColor: '#000',
                            padding: 2,
                            borderRadius: 2,
                            opacity: 0.7,
                            borderColor: '#333'
                        }
                    },
                    tooltip: {
                        custom: function({series, seriesIndex, dataPointIndex, w}) {
                            const d = w.config.series[seriesIndex].data[dataPointIndex];
                            if (!d) return '';
                            const date = new Date(d.x).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
                            return `<div style="padding:8px; background:#222; border:1px solid #444; font-size:12px;">
                                <div style="font-weight:bold; color:#fff; margin-bottom:4px;">${d.meta}</div>
                                <div style="color:#aaa;">${date}</div>
                            </div>`;
                        }
                    }
                };
            } else if (renderType === 'gantt') {
                const tasks = t.tasks || [];
                // Sort by Start Date
                tasks.sort((a, b) => new Date(a.start) - new Date(b.start));

                const data = tasks.map(tk => ({
                    x: tk.name,
                    y: [new Date(tk.start).getTime(), new Date(tk.end).getTime()],
                    fillColor: tk.status === 'done' ? '#00e676' : (tk.status === 'wip' ? '#ffb300' : '#666')
                }));

                visualHTML = `<div id="${chartId}" style="width:100%; height:${chartHeight}px;"></div>`;

                const common = getCommonApexOptions();
                chartConfig = {
                    ...common,
                    chart: { ...common.chart, type: 'rangeBar', height: chartHeight },
                    series: [{ data: data }],
                    plotOptions: {
                        bar: { horizontal: true, barHeight: '50%', borderRadius: 4 }
                    },
                    xaxis: { type: 'datetime' }
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
             // Multi-Counter Zoom
             const counters = t.counters || [{ label: t.subtitle, value: t.value, color: t.color1 }];
             htmlContent = `<div style="width:100%; height:100%; display:flex; flex-direction:row; flex-wrap:wrap; justify-content:center; align-items:center; gap:20px;">`;
             counters.forEach(c => {
                 htmlContent += `<div style="display:flex; flex-direction:column; align-items:center;">
                                    <div style="font-size: 6rem; font-weight:300; color:${c.color}; text-shadow:0 0 20px ${c.color}">${c.value}</div>
                                    <div style="font-size:1.5rem; color:#aaa; margin-top:1rem;">${c.label || ''}</div>
                                </div>`;
             });
             htmlContent += `</div>`;

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
        } else if (renderType === 'event') {
            const events = t.events || [];
            events.sort((a, b) => new Date(a.date) - new Date(b.date));
            const data = events.map((e, i) => ({
                x: e.date,
                y: i % 2 === 0 ? 1 : -1,
                meta: e.name
            }));

            htmlContent = `<div id="${chartId}" style="width:100%; height:100%;"></div>`;

            const common = getCommonApexOptions(true);
            chartConfig = {
                ...common,
                chart: { ...common.chart, type: 'bar', height: '100%' },
                series: [{ name: 'Timeline', data: data }],
                xaxis: {
                    ...common.xaxis,
                    type: 'datetime',
                    labels: { show: true, format: 'dd MMM yyyy', style: { colors: '#aaa', fontSize: '14px' } },
                    axisBorder: { show: false },
                    axisTicks: { show: false }
                },
                yaxis: {
                    min: -2, max: 2,
                    show: false,
                },
                grid: {
                    show: true,
                    yaxis: { lines: { show: false } },
                    xaxis: { lines: { show: false } },
                    padding: { top: 0, bottom: 0 }
                },
                plotOptions: {
                    bar: {
                        columnWidth: '1%', // Very thin lines for zoomed view
                        borderRadius: 0,
                        colors: {
                            ranges: [{ from: -10, to: 10, color: '#03dac6' }]
                        },
                        dataLabels: {
                            position: 'top'
                        }
                    }
                },
                annotations: {
                    yaxis: [{
                        y: 0,
                        strokeDashArray: 0,
                        borderColor: '#666',
                        borderWidth: 2,
                        width: '100%',
                        opacity: 0.5
                    }]
                },
                dataLabels: {
                    enabled: true,
                    formatter: function(val, opts) {
                        try {
                            return opts.w.config.series[0].data[opts.dataPointIndex].meta;
                        } catch(e) { return ''; }
                    },
                    style: {
                        fontSize: '14px',
                        colors: ['#e0e0e0']
                    },
                    background: {
                        enabled: true,
                        foreColor: '#000',
                        padding: 6,
                        borderRadius: 4,
                        opacity: 0.8,
                        borderColor: '#333'
                    }
                },
                tooltip: {
                    custom: function({series, seriesIndex, dataPointIndex, w}) {
                        const d = w.config.series[seriesIndex].data[dataPointIndex];
                        if (!d) return '';
                        const date = new Date(d.x).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
                        return `<div style="padding:15px; background:#222; border:1px solid #444; font-size:16px;">
                            <div style="font-weight:bold; color:#fff; margin-bottom:8px;">${d.meta}</div>
                            <div style="color:#aaa;">${date}</div>
                        </div>`;
                    }
                }
            };
        } else if (renderType === 'gantt') {
            const tasks = t.tasks || [];
            tasks.sort((a, b) => new Date(a.start) - new Date(b.start));
            const data = tasks.map(tk => ({
                x: tk.name,
                y: [new Date(tk.start).getTime(), new Date(tk.end).getTime()],
                fillColor: tk.status === 'done' ? '#00e676' : (tk.status === 'wip' ? '#ffb300' : '#666')
            }));

            htmlContent = `<div id="${chartId}" style="width:100%; height:100%;"></div>`;
            const common = getCommonApexOptions(true);
            chartConfig = {
                ...common,
                chart: { ...common.chart, type: 'rangeBar', height: '100%' },
                series: [{ data: data }],
                plotOptions: {
                    bar: { horizontal: true, barHeight: '50%', borderRadius: 4 }
                },
                xaxis: { type: 'datetime', labels: { style: { colors: '#aaa', fontSize:'14px' } } },
                tooltip: { theme: 'dark' }
            };
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

export const OverviewManager = {
    handleOverviewClick: (type) => {},
    handleInfoClick: () => {
        const current = State.additionalInfo || "";
        const newVal = prompt("Edit Additional Info (Markdown supported):", current);
        if (newVal !== null) {
            State.additionalInfo = newVal;
            renderBoard();
        }
    }
};

export const UserManager = {
    openUserModal: (index = -1) => {
        const modal = document.getElementById('userModal');
        const title = document.getElementById('modalTitle');
        const nameIn = document.getElementById('mName');
        const notesIn = document.getElementById('mNotes');
        const editIdx = document.getElementById('editIndex');
        const delBtn = document.getElementById('deleteBtn');

        if(title) title.innerText = index === -1 ? "Add User" : "Edit User";
        if(editIdx) editIdx.value = index;
        if(delBtn) delBtn.style.display = index === -1 ? 'none' : 'inline-block';

        if(nameIn) nameIn.value = '';
        if(notesIn) notesIn.value = '';

        ['lw','nw','fw'].forEach(p => {
            for(let i=1; i<=3; i++) {
                const el = document.getElementById(`${p}Task${i}`);
                if(el) el.value = '';
            }
        });

        const defLoad = ['N','N','N','N','N','X','X'];
        for(let i=0; i<7; i++) {
            UserManager.setLoad(i, defLoad[i]);
            UserManager.setFutureLoad(i, defLoad[i]);
            const oc1 = document.getElementById(`nwOc${i}`); if(oc1) oc1.checked = false;
            const oc2 = document.getElementById(`fwOc${i}`); if(oc2) oc2.checked = false;
        }

        if (index > -1) {
            const m = State.members[index];
            if(nameIn) nameIn.value = m.name;
            if(notesIn) notesIn.value = m.notes || '';

            if(m.lastWeek && m.lastWeek.tasks) {
                m.lastWeek.tasks.forEach((t, i) => { const el = document.getElementById(`lwTask${i+1}`); if(el) el.value = t.text; });
            }
            if(m.thisWeek && m.thisWeek.tasks) {
                m.thisWeek.tasks.forEach((t, i) => { const el = document.getElementById(`nwTask${i+1}`); if(el) el.value = t.text; });
            }
            if(m.nextWeek && m.nextWeek.tasks) {
                m.nextWeek.tasks.forEach((t, i) => { const el = document.getElementById(`fwTask${i+1}`); if(el) el.value = t.text; });
            }

            const tLoad = (m.thisWeek && m.thisWeek.load) ? m.thisWeek.load : defLoad;
            tLoad.forEach((v, i) => UserManager.setLoad(i, v));
            const tOc = (m.thisWeek && m.thisWeek.onCall) ? m.thisWeek.onCall : [];
            tOc.forEach((v, i) => { const el = document.getElementById(`nwOc${i}`); if(el) el.checked = v; });

            const nLoad = (m.nextWeek && m.nextWeek.load) ? m.nextWeek.load : defLoad;
            nLoad.forEach((v, i) => UserManager.setFutureLoad(i, v));
            const nOc = (m.nextWeek && m.nextWeek.onCall) ? m.nextWeek.onCall : [];
            nOc.forEach((v, i) => { const el = document.getElementById(`fwOc${i}`); if(el) el.checked = v; });
        }

        ModalManager.openModal('userModal');
    },

    setLoad: (dayIdx, val) => {
        const inp = document.getElementById(`nw${dayIdx}`);
        if(inp) inp.value = val;
        const container = inp ? inp.parentNode : null;
        if(container) {
            const pills = container.querySelectorAll('.w-pill');
            pills.forEach(p => p.classList.remove('active'));
            const map = {'L':'.wp-l', 'N':'.wp-n', 'R':'.wp-r', 'X':'.wp-x'};
            const activePill = container.querySelector(map[val]);
            if(activePill) activePill.classList.add('active');
        }
    },

    setFutureLoad: (dayIdx, val) => {
        const inp = document.getElementById(`fw${dayIdx}`);
        if(inp) inp.value = val;
        const container = inp ? inp.parentNode : null;
        if(container) {
            const pills = container.querySelectorAll('.w-pill');
            pills.forEach(p => p.classList.remove('active'));
            const map = {'L':'.wp-l', 'N':'.wp-n', 'R':'.wp-r', 'X':'.wp-x'};
            const activePill = container.querySelector(map[val]);
            if(activePill) activePill.classList.add('active');
        }
    },

    submitUser: () => {
        const name = document.getElementById('mName').value.trim();
        if(!name) return App.alert("Name required");

        const idx = parseInt(document.getElementById('editIndex').value);
        const notes = document.getElementById('mNotes').value;

        const getTasks = (prefix) => {
            const tasks = [];
            for(let i=1; i<=3; i++) {
                const val = document.getElementById(`${prefix}Task${i}`).value.trim();
                let isChecked = false;
                if(idx > -1) {
                    const m = State.members[idx];
                    let oldTasks = [];
                    if(prefix==='lw') oldTasks = m.lastWeek.tasks;
                    if(prefix==='nw') oldTasks = m.thisWeek.tasks;
                    if(prefix==='fw') oldTasks = m.nextWeek.tasks;

                    if(oldTasks && oldTasks[i-1] && oldTasks[i-1].text === val) {
                         isChecked = (prefix==='lw') ? oldTasks[i-1].isTeamSuccess : ((prefix==='nw') ? oldTasks[i-1].isTeamSuccess : oldTasks[i-1].isTeamActivity);
                    }
                }

                const taskObj = { text: val };
                if (prefix === 'lw') taskObj.isTeamSuccess = isChecked;
                else if (prefix === 'nw') taskObj.isTeamSuccess = isChecked;
                else taskObj.isTeamActivity = isChecked;
                tasks.push(taskObj);
            }
            return tasks;
        };

        const getLoad = (prefix) => {
            const load = [];
            const oc = [];
            for(let i=0; i<7; i++) {
                load.push(document.getElementById(`${prefix}${i}`).value);
                const cb = document.getElementById(`${prefix}Oc${i}`);
                oc.push(cb ? cb.checked : false);
            }
            return { load, oc };
        };

        const lwTasks = getTasks('lw');
        const nwTasks = getTasks('nw');
        const fwTasks = getTasks('fw');

        const thisLoad = getLoad('nw');
        const nextLoad = getLoad('fw');

        const user = {
            name,
            notes,
            lastWeek: { tasks: lwTasks, status: 'busy', onCall: [] },
            thisWeek: { tasks: nwTasks, load: thisLoad.load, onCall: thisLoad.oc },
            nextWeek: { tasks: fwTasks, load: nextLoad.load, onCall: nextLoad.oc }
        };

        if(idx === -1) {
            State.members.push(user);
        } else {
            State.members[idx] = user;
        }

        ModalManager.closeModal('userModal');
        renderBoard();
        const gs = document.getElementById('ganttSection');
        if(gs && gs.style.display !== 'none') {
             Visuals.renderResourcePlanner(State.members);
        }
    },

    deleteUser: () => {
        const idx = parseInt(document.getElementById('editIndex').value);
        if(idx === -1) return;
        App.confirm("Delete this user?", () => {
            State.members.splice(idx, 1);
            ModalManager.closeModal('userModal');
            renderBoard();
            const gs = document.getElementById('ganttSection');
            if(gs && gs.style.display !== 'none') {
                 Visuals.renderResourcePlanner(State.members);
            }
        });
    },

    resetSelections: (type) => {
        State.members.forEach(m => {
            if (type === 'success') {
                if(m.lastWeek) m.lastWeek.tasks.forEach(t => t.isTeamSuccess = false);
                if(m.thisWeek) m.thisWeek.tasks.forEach(t => t.isTeamSuccess = false);
            } else {
                if(m.nextWeek) m.nextWeek.tasks.forEach(t => t.isTeamActivity = false);
            }
        });
        renderBoard();
    },

    toggleSuccess: (mIdx, tIdx) => {
        const t = State.members[mIdx].lastWeek.tasks[tIdx];
        if(!t.isTeamSuccess) {
            let count = 0;
            State.members.forEach(m => {
                if(m.lastWeek) m.lastWeek.tasks.forEach(x => { if(x.isTeamSuccess) count++; });
                if(m.thisWeek) m.thisWeek.tasks.forEach(x => { if(x.isTeamSuccess) count++; });
            });
            if(count >= 5) {
                renderBoard(); // Revert UI
                return App.alert("Max 5 Team Achievements allowed.");
            }
            t.isTeamSuccess = true;
        } else {
            t.isTeamSuccess = false;
        }
        renderBoard();
    },

    toggleActivity: (mIdx, tIdx) => {
        const t = State.members[mIdx].thisWeek.tasks[tIdx];
        if(!t.isTeamSuccess) {
             let count = 0;
             State.members.forEach(m => {
                if(m.lastWeek) m.lastWeek.tasks.forEach(x => { if(x.isTeamSuccess) count++; });
                if(m.thisWeek) m.thisWeek.tasks.forEach(x => { if(x.isTeamSuccess) count++; });
            });
            if(count >= 5) {
                renderBoard();
                return App.alert("Max 5 Team Achievements allowed.");
            }
            t.isTeamSuccess = true;
        } else {
            t.isTeamSuccess = false;
        }
        renderBoard();
    },

    toggleFuture: (mIdx, tIdx) => {
        const t = State.members[mIdx].nextWeek.tasks[tIdx];
        if(!t.isTeamActivity) {
            let count = 0;
            State.members.forEach(m => {
                if(m.nextWeek) m.nextWeek.tasks.forEach(x => { if(x.isTeamActivity) count++; });
            });
            if(count >= 5) {
                renderBoard();
                return App.alert("Max 5 Future Activities allowed.");
            }
            t.isTeamActivity = true;
        } else {
            t.isTeamActivity = false;
        }
        renderBoard();
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
        
        ['gauge','bar','line','counter','rag','waffle','note','donut','event','gantt'].forEach(type => {
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

        // Height
        const heightVal = tracker ? (tracker.height || 'standard') : 'standard';
        const heightRadio = document.querySelector(`input[name="tkHeight"][value="${heightVal}"]`);
        if (heightRadio) heightRadio.checked = true;

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
                const container = getEl('counterDataContainer');
                if(container) container.innerHTML = '';

                const tcnIn = getEl('tkCounterNotes'); if(tcnIn) tcnIn.value = '';
                
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
            } else if (!isEdit && type === 'event') {
                const container = getEl('eventDataContainer');
                if(container) container.innerHTML = '';
                const notesIn = getEl('tkEventNotes');
                if(notesIn) notesIn.value = '';
                const sizeRad = document.querySelector('input[name="tkSize"][value="L"]');
                if(sizeRad) sizeRad.checked = true;
            } else if (!isEdit && type === 'gantt') {
                const container = getEl('ganttDataContainer');
                if(container) container.innerHTML = '';
                const notesIn = getEl('tkGanttNotes');
                if(notesIn) notesIn.value = '';
                // Default Size XL
                const sizeRad = document.querySelector('input[name="tkSize"][value="XL"]');
                if(sizeRad) sizeRad.checked = true;
                const hRad = document.querySelector('input[name="tkHeight"][value="standard"]');
                if(hRad) hRad.checked = true;
            }

            // Populate Color Pickers dynamically
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
                
                const c1 = tracker ? (tracker.colorVal || tracker.color1 || '#696969') : '#696969';
                getEl('tkPieColor').value = c1;
                getEl('tkPieColorPicker').innerHTML = createColorPickerHTML('tkPieColor', c1);

                const c2 = tracker ? (tracker.color2 || '#228B22') : '#228B22';
                getEl('tkPieColor2').value = c2;
                getEl('tkPieColor2Picker').innerHTML = createColorPickerHTML('tkPieColor2', c2);

            } else if (type === 'counter') {
                const container = getEl('counterDataContainer');
                if (container) container.innerHTML = '';

                if (tracker && tracker.counters) {
                    tracker.counters.forEach(c => this.addCounterRow(c.label, c.value, c.color));
                } else if (tracker && tracker.value !== undefined) {
                    // Backwards compatibility for single counter
                    this.addCounterRow(tracker.subtitle, tracker.value, tracker.color1);
                } else {
                    // Default row for new counter
                    this.addCounterRow();
                }

                const cnIn = getEl('tkCounterNotes');
                if (tracker && cnIn) cnIn.value = tracker.notes || '';

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
                
                // Set MAX limit on input based on config
                if (twtIn) twtIn.max = (State.config && State.config.maxWaffle) ? State.config.maxWaffle : 450;

                const cVal = tracker ? (tracker.colorVal || '#228B22') : '#228B22';
                getEl('tkWaffleColorVal').value = cVal;
                getEl('tkWaffleColorValPicker').innerHTML = createColorPickerHTML('tkWaffleColorVal', cVal);

                const cBg = tracker ? (tracker.colorBg || '#696969') : '#696969';
                getEl('tkWaffleColorBg').value = cBg;
                getEl('tkWaffleColorBgPicker').innerHTML = createColorPickerHTML('tkWaffleColorBg', cBg);

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
            } else if (type === 'event') {
                const container = getEl('eventDataContainer');
                if (container) container.innerHTML = '';
                if (tracker && tracker.events) {
                    tracker.events.forEach(ev => this.addEventRow(ev.name, ev.date));
                }
                const notesIn = getEl('tkEventNotes');
                if (tracker && notesIn) notesIn.value = tracker.notes || '';
            } else if (type === 'gantt') {
                const container = getEl('ganttDataContainer');
                if (container) container.innerHTML = '';
                if (tracker && tracker.tasks) {
                    tracker.tasks.forEach(t => this.addGanttRow(t.name, t.start, t.end, t.status));
                }
                const notesIn = getEl('tkGanttNotes');
                if (tracker && notesIn) notesIn.value = tracker.notes || '';
            }
        }

        ModalManager.openModal('trackerModal');
    },

    setType(type) {
        State.currentTrackerType = type;
        // Map 'bar' to 'line' for input visibility
        const inputType = (type === 'bar') ? 'line' : type;
        ['Gauge','Bar','Line','Counter','Rag','Waffle','Note','Donut','Event','Gantt'].forEach(x => {
            const btn = getEl(`type${x}Btn`);
            if (btn) btn.className = (type === x.toLowerCase()) ? 'type-option active' : 'type-option';
            const div = getEl(`${x.toLowerCase()}Inputs`);
            if (div) div.style.display = (inputType === x.toLowerCase()) ? 'block' : 'none';
        });

        const sizeCont = getEl('sizeContainer');
        if(sizeCont) sizeCont.style.display = (type === 'gauge' || type === 'waffle' || type === 'rag' || type === 'counter' || type === 'donut' || type === 'event' || type === 'gantt') ? 'none' : 'block';

        if (inputType === 'line') {
             this.renderTimeTable();
        }

        // Initialize default row for list types if empty and creating new
        if (State.editingTrackerIndex === -1) {
            if (type === 'counter') {
                const c = getEl('counterDataContainer');
                if(c && c.children.length === 0) this.addCounterRow();
            } else if (type === 'donut') {
                const c = getEl('donutDataContainer');
                if(c && c.children.length === 0) this.addDonutRow();
            } else if (type === 'event') {
                const c = getEl('eventDataContainer');
                if(c && c.children.length === 0) this.addEventRow();
            } else if (type === 'gantt') {
                const c = getEl('ganttDataContainer');
                if(c && c.children.length === 0) this.addGanttRow();
            }
        }
    },

    getContext(typeOverride) {
        const type = typeOverride || State.currentTrackerType;
        // Always use 'tk' (Line) inputs now, as Bar inputs are removed
        return {
            prefix: 'tk',
            tableId: 'lineTableContainer',
            btnAddId: 'btnAddSeries'
        };
    },

    handleTimeUnitChange(input) {
        const ctx = this.getContext();
        const container = document.getElementById('tkTimeUnitContainer');
        const prevUnit = container ? container.dataset.currentUnit : 'day';
        const newUnit = input.value;

        if (prevUnit === newUnit) return;

        const series = this.scrapeTimeSeries();
        let hasData = false;
        series.forEach(s => { if (s.values.some(v => v !== 0)) hasData = true; });

        if (hasData) {
            App.confirm("Changing the Time Unit will clear existing data. Proceed?", () => {
                if(container) container.dataset.currentUnit = newUnit;
                this.updateTimeOptions(true);
            });
            // Revert immediately, will be re-checked if confirmed
            const prevRad = document.querySelector(`input[name="${ctx.prefix}TimeUnit"][value="${prevUnit}"]`);
            if (prevRad) prevRad.checked = true;
        } else {
            if(container) container.dataset.currentUnit = newUnit;
            this.updateTimeOptions();
        }
    },

    updateTimeOptions(clearData = false) {
        const ctx = this.getContext();
        const unitRad = document.querySelector(`input[name="${ctx.prefix}TimeUnit"]:checked`);
        const unit = unitRad ? unitRad.value : 'day';

        // Ensure dataset is synced if updateTimeOptions called directly (e.g. from openModal)
        const container = document.getElementById('tkTimeUnitContainer');
        if(container) container.dataset.currentUnit = unit;

        const histLabel = getEl(`${ctx.prefix}HistoricLabel`);
        if (histLabel) histLabel.innerText = `Historic ${unit.charAt(0).toUpperCase() + unit.slice(1)}s`;

        const countSel = getEl(`${ctx.prefix}TimeCount`);
        if (!countSel) return;
        const currentVal = countSel.value;
        countSel.innerHTML = '';
        let opts = [];
        if (unit === 'year') opts = [3, 5, 10];
        else if (unit === 'month') opts = [3, 6, 12, 24];
        else opts = [5, 7, 14, 30, 60, 90];
        
        opts.forEach(o => {
            const opt = document.createElement('option');
            opt.value = o;
            opt.innerText = o;
            countSel.appendChild(opt);
        });
        if (currentVal && opts.includes(parseInt(currentVal))) {
            countSel.value = currentVal;
        } else if (unit === 'day') {
            countSel.value = 30;
        }

        // When changing unit, we must reset the table to match the new unit's dates
        if (clearData) {
             const currentSeries = this.scrapeTimeSeries();
             const clearedSeries = currentSeries.map(s => ({ ...s, values: [] }));
             this.renderTimeTable(clearedSeries);
        } else {
             this.renderTimeTable();
        }
    },

    renderTimeTable(seriesOverride = null, labelsOverride = null) {
        const ctx = this.getContext();
        const unitRad = document.querySelector(`input[name="${ctx.prefix}TimeUnit"]:checked`);
        const unit = unitRad ? unitRad.value : 'day';
        const tcIn = getEl(`${ctx.prefix}TimeCount`);
        const count = tcIn ? (parseInt(tcIn.value) || 5) : 5;
        const sdIn = getEl(`${ctx.prefix}StartDate`);
        let startDateVal = sdIn ? sdIn.value : '';
        if(!startDateVal) {
             const d = new Date();
             const day = d.getDay(), diff = d.getDate() - day + (day == 0 ? -6 : 1);
             const monday = new Date(d.setDate(diff));
             startDateVal = monday.toISOString().split('T')[0];
             if(sdIn) sdIn.value = startDateVal;
        }

        let series = seriesOverride;
        if (!series) series = this.scrapeTimeSeries();
        
        let labels = [];
        if (labelsOverride) {
            labels = labelsOverride;
        } else {
            const start = new Date(startDateVal);
            for(let i=0; i<count; i++) {
                let label = '';
                const offset = (count - 1) - i;
                if (unit === 'year') {
                    label = (start.getFullYear() - offset).toString();
                } else if (unit === 'month') {
                    let d = new Date(start.getFullYear(), start.getMonth() - offset, 1);
                    let m = d.getMonth() + 1;
                    label = `${d.getFullYear()}-${m.toString().padStart(2, '0')}`;
                } else {
                    let d = new Date(start);
                    d.setDate(d.getDate() - offset);
                    label = d.toISOString().split('T')[0];
                }
                labels.push(label);
            }
        }

        const container = getEl(ctx.tableId);
        if (!container) return;

        let html = '<table style="width:100%; border-collapse: separate; border-spacing: 0;">';

        html += '<thead><tr><th style="padding:8px; text-align:left; border-bottom:1px solid #444; position:sticky; left:0; top:0; background:var(--modal-bg); z-index:20; min-width:160px;">Series Name</th>';

        labels.forEach((l, li) => {
            html += `<th style="padding:8px; border-bottom:1px solid #444; position:sticky; top:0; background:var(--modal-bg); z-index:10; min-width:80px; text-align:center; font-size:0.7rem; white-space:nowrap;">
                ${l} <span onclick="TrackerManager.removeDateColumn(${li})" style="color:var(--g-red); cursor:pointer; margin-left:2px; font-weight:bold;">&times;</span>
            </th>`;
        });

        html += `<th style="padding:8px; text-align:center; min-width:40px; cursor:pointer; background:var(--modal-bg); border-bottom:1px solid #444; position:sticky; top:0; z-index:10;" onclick="TrackerManager.addDateColumn()" title="Add Historic Date">+</th>`;
        html += '</tr></thead><tbody>';

        series.forEach((s, si) => {
            html += `<tr>
                <td style="padding:8px; border-bottom:1px solid #333; position:sticky; left:0; background:var(--modal-bg); z-index:10;">
                    <div style="display:flex; align-items:center; gap:5px;">
                        <input type="checkbox" class="ts-select" data-idx="${si}" style="accent-color:var(--accent);" onchange="TrackerManager.updateDeleteSeriesButtonVisibility()">
                        <div class="ts-color-swatch" style="width:20px; height:20px; background:${s.color}; border:1px solid #fff; cursor:pointer;" onclick="this.nextElementSibling.click()"></div>
                        <input type="color" class="ts-color" value="${s.color}" style="width:0; height:0; visibility:hidden; padding:0; border:0;" data-idx="${si}" onchange="this.previousElementSibling.style.background=this.value">
                        <input type="text" class="ts-name" value="${s.name}" style="width:100px; font-size:0.8rem; background:#222; border:1px solid #444; color:#fff; padding:2px;" data-idx="${si}">
                    </div>
                </td>`;

            labels.forEach((l, li) => {
                const val = (s.values && s.values[li] !== undefined) ? s.values[li] : 0;
                html += `<td style="padding:2px; border-bottom:1px solid #333;">
                    <input type="number" class="ts-val" data-s="${si}" data-r="${li}" value="${val}" style="width:100%; background:transparent; border:none; color:#fff; text-align:center;">
                </td>`;
            });
            html += `<td style="border-bottom:1px solid #333;"></td>`;
            html += '</tr>';
        });

        // Use Config for limits
        const maxSeries = (State.config && State.config.maxSeries) ? State.config.maxSeries : 6;

        if (series.length < maxSeries) {
            html += `<tr class="add-series-row">
                <td colspan="${labels.length + 2}" style="padding: 10px; border-top: 1px dashed #444; text-align: left;">
                    <div onclick="TrackerManager.addTimeSeriesColumn()" style="width: 30px; height: 30px; background: #444; color: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: bold; cursor: pointer; margin: 0; box-shadow: 0 2px 5px rgba(0,0,0,0.5);">+</div>
                </td>
            </tr>`;
        }

        html += '</tbody></table>';

        container.innerHTML = html;
        container.dataset.labels = JSON.stringify(labels);
        this.updateDeleteSeriesButtonVisibility();
    },

    updateDeleteSeriesButtonVisibility() {
        const btnDelete = document.querySelector('button[onclick="TrackerManager.deleteSelectedSeries()"]');
        if (!btnDelete) return;
        const checks = document.querySelectorAll('.ts-select:checked');
        btnDelete.style.display = checks.length > 0 ? 'inline-block' : 'none';
    },

    scrapeTimeSeries() {
        const ctx = this.getContext();
        const container = getEl(ctx.tableId);
        if (!container) return [];
        const rows = container.querySelectorAll('tbody tr');
        if (rows.length === 0) return [];

        const series = [];
        rows.forEach((row, si) => {
            if (row.classList.contains('add-series-row')) return;
            const nameIn = row.querySelector('.ts-name');
            const colorIn = row.querySelector('.ts-color');
            const name = nameIn ? nameIn.value : `Series ${si+1}`;
            const color = colorIn ? colorIn.value : '#03dac6';

            const values = [];
            const valInputs = row.querySelectorAll('.ts-val');
            valInputs.forEach(inp => values.push(parseFloat(inp.value) || 0));

            series.push({ name, color, values });
        });

        return series;
    },

    addTimeSeriesColumn() {
        const series = this.scrapeTimeSeries();
        const maxSeries = (State.config && State.config.maxSeries) ? State.config.maxSeries : 6;
        if (series.length >= maxSeries) return App.alert(`Max ${maxSeries} series allowed.`);
        const colors = State.config.colors || ['#03dac6'];
        const color = colors[series.length % colors.length];
        series.push({ name: `Series ${series.length+1}`, color: color, values: [] });
        this.renderTimeTable(series);
    },

    handleCountChange(selectEl) {
        const newCount = parseInt(selectEl.value);
        const series = this.scrapeTimeSeries();
        if (series.length === 0) {
             this.renderTimeTable();
             return;
        }

        const oldCount = series[0].values.length;
        const delta = newCount - oldCount;

        if (delta === 0) return;

        series.forEach(s => {
            if (delta > 0) {
                for(let i=0; i<delta; i++) s.values.unshift(0);
            } else {
                for(let i=0; i<Math.abs(delta); i++) s.values.shift();
            }
        });

        this.renderTimeTable(series);
    },

    handleEndDateChange(input) {
        const series = this.scrapeTimeSeries();
        let hasData = false;
        series.forEach(s => {
            if (s.values.some(v => v !== 0)) hasData = true;
        });

        const newVal = input.value;
        const prevVal = input.dataset.prev;

        if (!hasData) {
            input.dataset.prev = newVal;
            this.renderTimeTable();
            return;
        }

        input.value = prevVal;

        App.confirm("Changing the End Date will clear existing manual data. Proceed?", () => {
            input.value = newVal;
            input.dataset.prev = newVal;
            const clearedSeries = series.map(s => ({ name: s.name, color: s.color, values: [] }));
            this.renderTimeTable(clearedSeries);
        });
    },

    exportTimeSeriesCSV() {
        const series = this.scrapeTimeSeries();
        if (series.length === 0) return App.alert("No data to export.");

        const ctx = this.getContext();
        const container = getEl(ctx.tableId);
        const labels = JSON.parse(container.dataset.labels || '[]');

        let csv = "Date";
        series.forEach(s => csv += `,${s.name}`);
        csv += "\n";

        labels.forEach((date, dateIdx) => {
            csv += `${date}`;
            series.forEach(s => {
                const val = (s.values && s.values[dateIdx] !== undefined) ? s.values[dateIdx] : 0;
                csv += `,${val}`;
            });
            csv += "\n";
        });

        const title = getEl('tkDesc').value || "chart_data";
        const filename = title.replace(/[^a-z0-9]/gi, '_').toLowerCase() + ".csv";

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    },

    deleteSelectedSeries() {
        const ctx = this.getContext();
        const container = getEl(ctx.tableId);
        if (!container) return;
        const checks = container.querySelectorAll('.ts-select:checked');
        if (checks.length === 0) return App.alert("No series selected.");

        const indicesToDelete = new Set();
        checks.forEach(c => indicesToDelete.add(parseInt(c.dataset.idx)));

        const currentSeries = this.scrapeTimeSeries();
        const newSeries = currentSeries.filter((_, i) => !indicesToDelete.has(i));

        this.renderTimeTable(newSeries);
    },

    addDateColumn() {
        const ctx = this.getContext();
        const tcIn = getEl(`${ctx.prefix}TimeCount`);
        const sdIn = getEl(`${ctx.prefix}StartDate`);
        if (tcIn && sdIn) {
             const series = this.scrapeTimeSeries();

             const d = new Date(sdIn.value);
             const unitRad = document.querySelector(`input[name="${ctx.prefix}TimeUnit"]:checked`);
             const unit = unitRad ? unitRad.value : 'day';

             if (unit === 'year') d.setFullYear(d.getFullYear() + 1);
             else if (unit === 'month') d.setMonth(d.getMonth() + 1);
             else d.setDate(d.getDate() + 1);

             sdIn.value = d.toISOString().split('T')[0];
             sdIn.dataset.prev = sdIn.value;

             series.forEach(s => {
                 s.values.shift();
                 s.values.push(0);
             });

             this.renderTimeTable(series);
        }
    },

    removeDateColumn(index) {
        const ctx = this.getContext();
        const tcIn = getEl(`${ctx.prefix}TimeCount`);
        const count = parseInt(tcIn.value);
        if (count <= 1) return App.alert("Cannot remove the last date.");

        const series = this.scrapeTimeSeries();

        if (index === 0) {
            series.forEach(s => s.values.shift());

            let exists = false;
            for(let opt of tcIn.options) { if(parseInt(opt.value) === count - 1) exists = true; }
            if (!exists) {
                 const opt = document.createElement('option');
                 opt.value = count - 1;
                 opt.innerText = count - 1;
                 tcIn.appendChild(opt);
            }

            tcIn.value = count - 1;
            this.renderTimeTable(series);
        } else if (index === count - 1) {
            series.forEach(s => s.values.pop());
            const sdIn = getEl(`${ctx.prefix}StartDate`);
            if (sdIn) {
                 const d = new Date(sdIn.value);
                 const unitRad = document.querySelector(`input[name="${ctx.prefix}TimeUnit"]:checked`);
                 const unit = unitRad ? unitRad.value : 'day';
                 if (unit === 'year') d.setFullYear(d.getFullYear() - 1);
                 else if (unit === 'month') d.setMonth(d.getMonth() - 1);
                 else d.setDate(d.getDate() - 1);
                 sdIn.value = d.toISOString().split('T')[0];
                 sdIn.dataset.prev = sdIn.value;
            }

            let exists = false;
            for(let opt of tcIn.options) { if(parseInt(opt.value) === count - 1) exists = true; }
            if (!exists) {
                 const opt = document.createElement('option');
                 opt.value = count - 1;
                 opt.innerText = count - 1;
                 tcIn.appendChild(opt);
            }

            tcIn.value = count - 1;
            this.renderTimeTable(series);
        } else {
            App.alert("Please remove dates from the start or end of the series.");
        }
    },

    selectRag(val) {
        const pills = document.querySelectorAll('.rag-pill');
        pills.forEach(p => {
            if(p.dataset.val === val) p.classList.add('active');
            else p.classList.remove('active');
        });
        const rs = getEl('tkRagStatus');
        if(rs) rs.value = val;
    },

    addDonutRow(label = '', value = '') {
        const container = getEl('donutDataContainer');
        if (!container) return;
        const max = State.config.maxDonut || 10;
        if (container.children.length >= max) return App.alert(`Max ${max} data points allowed.`);

        const div = document.createElement('div');
        div.className = 'donut-row';
        div.innerHTML = `
            <input type="text" class="dr-label" maxlength="15" placeholder="Label" value="${label}" style="flex: 2;">
            <input type="number" class="dr-value" placeholder="Value" value="${value}" style="flex: 1;">
            <button class="btn btn-sm" style="color:var(--g-red); border-color:var(--g-red); padding: 0 10px;" onclick="TrackerManager.removeDonutRow(this)">&times;</button>
        `;
        container.appendChild(div);
    },

    removeDonutRow(btn) {
        btn.parentElement.remove();
    },

    addEventRow(name = '', date = '') {
        const container = getEl('eventDataContainer');
        if (!container) return;
        const max = State.config.maxEvents || 20;
        if (container.children.length >= max) return App.alert(`Max ${max} events allowed.`);

        const div = document.createElement('div');
        div.className = 'event-row';
        div.innerHTML = `
            <input type="text" class="er-name" maxlength="30" placeholder="Event Name" value="${name}" style="flex: 2;">
            <input type="date" class="er-date" value="${date}" style="flex: 1; background:var(--input-bg); color:#fff; color-scheme:dark;">
            <button class="btn btn-sm" style="color:var(--g-red); border-color:var(--g-red); padding: 0 10px;" onclick="TrackerManager.removeEventRow(this)">&times;</button>
        `;
        container.appendChild(div);
    },

    removeEventRow(btn) {
        btn.parentElement.remove();
    },

    addGanttRow(name = '', start = '', end = '', status = 'wip') {
        const container = getEl('ganttDataContainer');
        if (!container) return;
        // Limit Gantt tasks? Reuse max events or define new? Let's use maxEvents for now
        const max = State.config.maxEvents || 20;
        if (container.children.length >= max) return App.alert(`Max ${max} tasks allowed.`);

        const div = document.createElement('div');
        div.className = 'gantt-row';
        div.innerHTML = `
            <div style="display:flex; gap:5px; margin-bottom:5px;">
                <input type="text" class="gr-name" maxlength="30" placeholder="Task Name" value="${name}" style="flex: 2;">
                <select class="gr-status" style="flex:1;">
                    <option value="wip" ${status==='wip'?'selected':''}>WIP</option>
                    <option value="done" ${status==='done'?'selected':''}>Done</option>
                    <option value="blocked" ${status==='blocked'?'selected':''}>Blocked</option>
                </select>
                <button class="btn btn-sm" style="color:var(--g-red); border-color:var(--g-red); padding: 0 10px;" onclick="TrackerManager.removeGanttRow(this)">&times;</button>
            </div>
            <div style="display:flex; gap:5px;">
                <input type="date" class="gr-start" value="${start}" style="flex:1; background:var(--input-bg); color:#fff; color-scheme:dark;">
                <input type="date" class="gr-end" value="${end}" style="flex:1; background:var(--input-bg); color:#fff; color-scheme:dark;">
            </div>
        `;
        container.appendChild(div);
    },

    removeGanttRow(btn) {
        btn.parentElement.parentElement.remove();
    },

    addCounterRow(label = '', value = '', color = '#bb86fc') {
        const container = getEl('counterDataContainer');
        if (!container) return;
        const max = State.config.maxDonut || 10;
        if (container.children.length >= max) return App.alert(`Max ${max} counters allowed.`);

        const div = document.createElement('div');
        div.className = 'counter-row';
        div.style.display = 'flex';
        div.style.gap = '10px';
        div.style.marginBottom = '5px';
        div.style.alignItems = 'center';

        const uniqueId = 'cp_' + Math.random().toString(36).substr(2, 9);

        div.innerHTML = `
            <input type="text" class="cr-label" maxlength="15" placeholder="Label" value="${label}" style="flex: 2;">
            <input type="number" class="cr-value" placeholder="Value" value="${value}" style="flex: 1;">
            <input type="color" class="cr-color" value="${color}" style="width:30px; height:30px; padding:0; border:none;" id="${uniqueId}">
            <button class="btn btn-sm" style="color:var(--g-red); border-color:var(--g-red); padding: 0 10px;" onclick="TrackerManager.removeCounterRow(this)">&times;</button>
        `;
        container.appendChild(div);
    },

    removeCounterRow(btn) {
        btn.parentElement.remove();
    },

    parseCSV(type) {
        const ctx = this.getContext();
        const txtArea = getEl('csvInput');
        if (!txtArea) return;

        const text = txtArea.value.trim();
        if (!text) return App.alert("Please paste CSV data.");

        // Check for existing data
        const series = this.scrapeTimeSeries();
        let hasData = false;
        series.forEach(s => { if (s.values.some(v => v !== 0)) hasData = true; });

        const processCSV = () => {
            const lines = text.split('\n').map(l => l.trim()).filter(l => l);
            if (lines.length < 2) return App.alert("Invalid CSV format.");

            const headers = lines[0].split(',').map(h => h.trim());
            const seriesNames = headers.slice(1);

            const labels = [];
            const seriesData = seriesNames.map(name => ({ name: name, values: [] }));

            for(let i=1; i<lines.length; i++) {
                const cols = lines[i].split(',').map(c => c.trim());
                labels.push(cols[0]);

                for(let j=0; j<seriesNames.length; j++) {
                    const val = parseFloat(cols[j+1]) || 0;
                    seriesData[j].values.push(val);
                }
            }

            // Infer Unit
            let unit = 'day';
            if (labels.length > 0) {
                const sample = labels.slice(0, 5);
                if (sample.every(d => /^\d{4}$/.test(d))) {
                    unit = 'year';
                } else if (sample.every(d => /^\d{4}-\d{2}$/.test(d))) {
                    unit = 'month';
                } else if (sample.every(d => /^\d{4}-\d{2}-\d{2}$/.test(d))) {
                     if (labels.length > 1) {
                         const d1 = new Date(labels[0]);
                         const d2 = new Date(labels[1]);
                         const diff = Math.abs((d2 - d1) / (1000 * 60 * 60 * 24));
                         if (diff >= 28 && diff <= 32) unit = 'month';
                     }
                }
            }

            // Set Unit Radio
            const rad = document.querySelector(`input[name="${ctx.prefix}TimeUnit"][value="${unit}"]`);
            if(rad) rad.checked = true;

            // Sync current unit dataset
            const container = document.getElementById('tkTimeUnitContainer');
            if(container) container.dataset.currentUnit = unit;

            // Reset Options based on new unit
            this.updateTimeOptions();

            // Update Start Date (End Date in UI)
            const sdIn = getEl(`${ctx.prefix}StartDate`);
            if(sdIn && labels.length > 0) {
                 const lastLbl = labels[labels.length-1];
                 let dateStr = lastLbl;
                 // Normalize to YYYY-MM-DD
                 if (unit === 'year' && /^\d{4}$/.test(lastLbl)) dateStr = `${lastLbl}-01-01`;
                 if (unit === 'month' && /^\d{4}-\d{2}$/.test(lastLbl)) dateStr = `${lastLbl}-01`;

                 // Ensure valid date object
                 const d = new Date(dateStr);
                 if(!isNaN(d.getTime())) {
                     sdIn.value = d.toISOString().split('T')[0];
                     sdIn.dataset.prev = sdIn.value;
                 }
            }

            // Update Time Count
            const tcIn = getEl(`${ctx.prefix}TimeCount`);
            if(tcIn) {
                const count = labels.length;
                let exists = false;
                for(let opt of tcIn.options) if(parseInt(opt.value) === count) exists = true;
                if(!exists) {
                    const opt = document.createElement('option');
                    opt.value = count;
                    opt.innerText = count;
                    tcIn.appendChild(opt);
                }
                tcIn.value = count;
            }

            const colors = ['#03dac6', '#ff4081', '#bb86fc', '#cf6679', '#00e676', '#ffb300', '#018786', '#3700b3'];
            seriesData.forEach((s, i) => s.color = colors[i % colors.length]);

            this.renderTimeTable(seriesData, labels);
            App.alert("CSV Parsed Successfully!");
        };

        if (hasData) {
            App.confirm("Importing CSV will overwrite existing data. Proceed?", () => {
                processCSV();
            });
        } else {
            processCSV();
        }
    },

    deleteTracker(index) {
        if(index < 0 || index >= State.trackers.length) return;
        App.confirm("Are you sure you want to delete this tracker?", () => {
            State.trackers.splice(index, 1);
            renderBoard();
        });
    },

    submitTracker() {
        const index = State.editingTrackerIndex;
        const descIn = getEl('tkDesc');
        const desc = descIn ? descIn.value : '';
        const sizeRadio = document.querySelector('input[name="tkSize"]:checked');
        const size = sizeRadio ? sizeRadio.value : 'M';
        const heightRadio = document.querySelector('input[name="tkHeight"]:checked');
        const height = heightRadio ? heightRadio.value : 'standard';

        if (!desc) return App.alert("Title required");

        const type = State.currentTrackerType;
        let newTracker = { desc, type, size, height };

        // Capture Timestamp
        newTracker.lastUpdated = new Date().toISOString();

        if (type === 'gauge') {
            const mIn = getEl('tkMetric');
            const cIn = getEl('tkComp');
            const tIn = getEl('tkTotal');
            const nIn = getEl('tkNotes'); // Capture Notes
            const m = mIn ? mIn.value : '';
            const c = cIn ? parseFloat(cIn.value) || 0 : 0;
            const t = tIn ? parseFloat(tIn.value) || 0 : 0;
            if(t<=0) return App.alert("Target must be a positive number.");
            if(c>t) return App.alert("Progress cannot exceed the Target.");
            newTracker.metric = m;
            newTracker.completed = c;
            newTracker.total = t;
            newTracker.notes = nIn ? nIn.value : '';
            newTracker.size = 'S'; // Force Small Size
            const pcIn = getEl('tkPieColor');
            newTracker.colorVal = pcIn ? pcIn.value : '#00e676';
            const pc2In = getEl('tkPieColor2');
            newTracker.color2 = pc2In ? pc2In.value : '#ff1744';
        } else if (type === 'line' || type === 'bar') {
            const ctx = this.getContext();
            const yIn = getEl(`${ctx.prefix}YLabel`);
            newTracker.yLabel = yIn ? yIn.value : '';

            const series = this.scrapeTimeSeries();
            const container = getEl(ctx.tableId);
            const labels = container ? JSON.parse(container.dataset.labels || '[]') : [];

            if (series.length === 0) return App.alert("Add at least one series");

            const urIn = document.querySelector(`input[name="${ctx.prefix}TimeUnit"]:checked`);
            newTracker.timeUnit = urIn ? urIn.value : 'day';
            const sdIn = getEl(`${ctx.prefix}StartDate`);
            newTracker.startDate = sdIn ? sdIn.value : '';
            const tcIn = getEl(`${ctx.prefix}TimeCount`);
            newTracker.timeCount = tcIn ? parseInt(tcIn.value) : 7;

            newTracker.labels = labels;
            newTracker.series = series;

            const styleRad = document.querySelector('input[name="tkDisplayStyle"]:checked');
            newTracker.displayStyle = styleRad ? styleRad.value : 'line';

            const lnIn = getEl('tkLineNotes');
            newTracker.notes = lnIn ? lnIn.value : '';
        } else if (type === 'counter') {
            // New logic: scrape multiple counters
            const rows = document.querySelectorAll('.counter-row');
            const counters = [];
            rows.forEach(row => {
                const label = row.querySelector('.cr-label').value.trim();
                const value = parseFloat(row.querySelector('.cr-value').value) || 0;
                const color = row.querySelector('.cr-color').value;
                counters.push({ label, value, color });
            });

            if (counters.length === 0) {
                // Fallback or alert? Let's just create one default if empty
                counters.push({ label: '', value: 0, color: '#bb86fc' });
            }

            newTracker.counters = counters;
            newTracker.value = counters[0].value;
            newTracker.subtitle = counters[0].label;
            newTracker.color1 = counters[0].color;

            const cnIn = getEl('tkCounterNotes');
            newTracker.notes = cnIn ? cnIn.value : '';
            newTracker.size = 'S'; // Force Small Size

        } else if (type === 'rag') {
            newTracker.type = 'rag';
            const rsIn = getEl('tkRagStatus');
            newTracker.status = rsIn ? rsIn.value : 'grey';
            const rmIn = getEl('tkRagMsg');
            newTracker.message = rmIn ? rmIn.value : '';
            const rnIn = getEl('tkRagNotes');
            newTracker.notes = rnIn ? rnIn.value : '';
            newTracker.size = 'S'; // Force Small Size
            newTracker.color1 = (newTracker.status === 'green' ? '#00e676' : (newTracker.status === 'amber' ? '#ffb300' : (newTracker.status === 'red' ? '#ff1744' : '#666666')));
        } else if (type === 'note') {
            const contentIn = getEl('tkNoteContent');
            newTracker.content = contentIn ? contentIn.value : '';
            const alignRad = document.querySelector('input[name="tkNoteAlign"]:checked');
            newTracker.align = alignRad ? alignRad.value : 'left';
            newTracker.notes = ''; // No notes for Note Tracker
        } else if (type === 'waffle') {
            const wmIn = getEl('tkWaffleMetric');
            const wtIn = getEl('tkWaffleTotal');
            const waIn = getEl('tkWaffleActive');
            const wnIn = getEl('tkWaffleNotes');

            const total = wtIn ? (parseInt(wtIn.value) || 100) : 100;
            const active = waIn ? (parseInt(waIn.value) || 0) : 0;
            const maxWaffle = (State.config && State.config.maxWaffle) ? State.config.maxWaffle : 450;

            if (total <= 0) return App.alert("Target must be a positive number.");
            if (total > maxWaffle) return App.alert(`Target cannot exceed ${maxWaffle}.`);
            if (active > total) return App.alert("Progress cannot exceed the Target.");

            newTracker.metric = wmIn ? wmIn.value : '';
            newTracker.total = total;
            newTracker.active = active;
            newTracker.notes = wnIn ? wnIn.value : '';
            newTracker.size = total < 201 ? 'S' : 'M'; // Inferred size

            const wcIn = getEl('tkWaffleColorVal');
            newTracker.colorVal = wcIn ? wcIn.value : '#228B22';
            const wbIn = getEl('tkWaffleColorBg');
            newTracker.colorBg = wbIn ? wbIn.value : '#696969';
        } else if (type === 'donut') {
            const rows = document.querySelectorAll('.donut-row');
            const dataPoints = [];
            rows.forEach(row => {
                const label = row.querySelector('.dr-label').value.trim();
                const value = parseFloat(row.querySelector('.dr-value').value) || 0;
                if (label) dataPoints.push({ label, value });
            });
            if (dataPoints.length === 0) return App.alert("At least one data point with a label is required.");
            newTracker.dataPoints = dataPoints;
            const notesIn = getEl('tkDonutNotes');
            newTracker.notes = notesIn ? notesIn.value : '';
            newTracker.size = size; // Use selected size
        } else if (type === 'event') {
            const rows = document.querySelectorAll('.event-row');
            const events = [];
            rows.forEach(row => {
                const name = row.querySelector('.er-name').value.trim();
                const date = row.querySelector('.er-date').value;
                if (name && date) events.push({ name, date });
            });
            if (events.length === 0) return App.alert("At least one event with a name and date is required.");
            newTracker.events = events;
            const notesIn = getEl('tkEventNotes');
            newTracker.notes = notesIn ? notesIn.value : '';
            newTracker.size = size; // Explicitly set size
        } else if (type === 'gantt') {
            const rows = document.querySelectorAll('.gantt-row');
            const tasks = [];
            rows.forEach(row => {
                const name = row.querySelector('.gr-name').value.trim();
                const start = row.querySelector('.gr-start').value;
                const end = row.querySelector('.gr-end').value;
                const status = row.querySelector('.gr-status').value;
                if (name && start && end) tasks.push({ name, start, end, status });
            });
            if (tasks.length === 0) return App.alert("At least one task with name and dates is required.");
            newTracker.tasks = tasks;
            const notesIn = getEl('tkGanttNotes');
            newTracker.notes = notesIn ? notesIn.value : '';
            newTracker.size = size;
        }

        if(index === -1) {
            State.trackers.push(newTracker);
        } else {
            State.trackers[index] = newTracker;
        }

        ModalManager.closeModal('trackerModal');
        renderBoard();
        console.log("Tracker saved:", type);
    }
};

export const DataSaver = {
    saveData: async () => {
        const today = new Date();
        const d = today.getDay();
        const diff = d === 0 ? -6 : 1 - d;
        const cm = new Date(today);
        cm.setDate(today.getDate() + diff);
        const savedDate = cm.toISOString().split('T')[0];

        const data = JSON.stringify({ ...State, savedDate }, null, 2);
        const filename = `team_tracker_${new Date().toISOString().split('T')[0]}.json`;

        if ('showSaveFilePicker' in window) {
            try {
                const handle = await window.showSaveFilePicker({
                    suggestedName: filename,
                    types: [{
                        description: 'JSON File',
                        accept: { 'application/json': ['.json'] }
                    }]
                });
                const writable = await handle.createWritable();
                await writable.write(data);
                await writable.close();
                App.alert("File saved successfully.");
            } catch (err) {
                if (err.name !== 'AbortError') {
                    console.error('File save failed:', err);
                    App.alert("Failed to save file.");
                }
            }
        } else {
            // Fallback for browsers not supporting File System Access API
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            URL.revokeObjectURL(url);
        }
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
    },
    syncFromGitHub: async () => {
        const repo = State.config.githubRepo;
        if (!repo) return App.alert("Please configure a GitHub Repo in Settings.");

        App.alert("Syncing data from GitHub...");
        let updatedCount = 0;

        // Iterate through existing members and try to fetch their data
        for (let i = 0; i < State.members.length; i++) {
            const member = State.members[i];
            // Assume filename is Name.json (spaces replaced? let's try direct first)
            // Or "Steve-short.json" per prompt example.
            // Simple strategy: Try "Name.json"
            const filename = member.name.replace(/\s+/g, '-') + ".json";
            const url = `https://raw.githubusercontent.com/${repo}/main/user/${filename}`;

            try {
                const response = await fetch(url);
                if (response.ok) {
                    const userData = await response.json();
                    // Merge logic: Update tasks/availability if present in JSON
                    // Expecting JSON structure similar to member object
                    State.members[i] = { ...member, ...userData };
                    updatedCount++;
                }
            } catch (e) {
                console.warn(`Failed to fetch for ${member.name}:`, e);
            }
        }

        renderBoard();
        App.alert(`Sync complete. Updated ${updatedCount} users.`);
    }
};

export const DataExporter = {
    exportCSV: () => {}
};
