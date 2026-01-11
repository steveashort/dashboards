/**
 * SERVER PLATFORMS TRACKER v31
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
    cf.setDate(cm.getDate() + 4);
    
    const nm = new Date(cm);
    nm.setDate(cm.getDate() + 7);
    const nf = new Date(nm);
    nf.setDate(nm.getDate() + 4);
    
    const lm = new Date(cm);
    lm.setDate(cm.getDate() - 7);
    const lf = new Date(lm);
    lf.setDate(lm.getDate() + 4);

    return { 
        current: `${formatDate(cm)} - ${formatDate(cf)}`, 
        next: `${formatDate(nm)} - ${formatDate(nf)}`,
        last: `${formatDate(lm)} - ${formatDate(lf)}`
    };
};

// --- CORE FUNCTIONS ---
export const initApp = () => {
    
    const updateDateUI = () => {
        const r = getRanges();
        getEl('dateRangeDisplay').innerText = `Current: ${r.current} | Next: ${r.next}`;
        getEl('overviewTitleCurrent').innerHTML = `Top 5 Team Achievements <span class="date-suffix">${r.current}</span>`;
        getEl('overviewTitleNext').innerHTML = `Top 5 Activities Next Week <span class="date-suffix">${r.next}</span>`;
        
        // Update Modal Headers
        if(getEl('lastWeekTitle')) getEl('lastWeekTitle').innerText = `Last Week (${r.last})`;
        if(getEl('thisWeekTitle')) getEl('thisWeekTitle').innerText = `This Week (${r.current})`;
        if(getEl('nextWeekTitle')) getEl('nextWeekTitle').innerText = `Next Week (${r.next})`;
    };

    updateDateUI();
    renderBoard();
    console.log("App Initialized");
};

// --- RENDER ---
const parseMarkdown = (t) => {
    if(!t) return '';
    let h = t.replace(/&/g,"&amp;").replace(/</g,"&lt;")
             .replace(/\*\*(.*?)\*\*/g,'<b>$1</b>')
             .replace(/\*(.*?)\*/g,'<i>$1</i>')
             .replace(/\[(.*?)\]\((.*?)\)/g, (match, text, url) => {
                 let finalUrl = url;
                 if(!/^https?:\/\//i.test(url)) finalUrl = 'https://' + url;
                 return `<a href="${finalUrl}" target="_blank">${text}</a>`;
             });
    return h.split('\n').map(l=>l.trim().startsWith('- ')?`<li>${l.substring(2)}</li>`:l+'<br>').join('').replace(/<\/li><br><li>/g,'</li><li>').replace(/<br><li>/g,'<ul><li>').replace(/<\/li><br>/g,'</li></ul>');
};

// --- MODULE: APP GLOBALS ---
export const App = {
    init: () => {
        initApp();
        App.initDragAndDrop();
    },
    initDragAndDrop: () => {
        const grid = getEl('trackerGrid');
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
                
                // Swap in State
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
        getEl('alertMessage').innerText = msg;
        getEl('alertModal').classList.add('active');
        console.log("Alert:", msg);
    },
    confirm: (msg, callback) => {
        getEl('confirmMessage').innerText = msg;
        const btn = getEl('confirmYesBtn');
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        newBtn.addEventListener('click', () => {
            if(callback) callback();
            ModalManager.closeModal('confirmModal');
        });
        getEl('confirmModal').classList.add('active');
    },
    togglePublishMode: () => {
        document.body.classList.toggle('publishing');
        renderBoard();
    },
    saveTitle: () => {
        State.title = getEl('appTitle').innerText;
        console.log("Title saved");
    }
};

// --- MODULE: MODAL MANAGER ---
export const ModalManager = {
    openModal: (id) => {
        console.log("Opening modal:", id);
        const el = document.getElementById(id);
        if (el) el.classList.add('active');
    },
    closeModal: (id) => {
        const el = document.getElementById(id);
        if (el) el.classList.remove('active');
    }
};

// --- MODULE: RENDER BOARD ---
export const renderBoard = () => {
    console.log("Rendering Board...");

    // Render Header
    getEl('appTitle').innerText = State.title || "Server Platforms";
    
    // Render Overview
    const sL = getEl('teamSuccessList'); 
    const aL = getEl('teamActivityList');
    sL.innerHTML = ''; 
    aL.innerHTML = ''; 
    let sc = 0, ac = 0;

    State.members.forEach(m => {
        if(m.lastWeek && m.lastWeek.tasks) {
            m.lastWeek.tasks.forEach(t => {
                if(t.isTeamSuccess && t.text.trim()) { 
                    sc++; sL.innerHTML += `<li class="auto-item"><b>${m.name}:</b> ${t.text}</li>`; 
                }
            });
        }
        if(m.thisWeek && m.thisWeek.tasks) {
            m.thisWeek.tasks.forEach(t => {
                if(t.isTeamActivity && t.text.trim()) { 
                    ac++; aL.innerHTML += `<li class="auto-item"><b>${m.name}:</b> ${t.text}</li>`; 
                }
            });
        }
    });

    if(sc===0) sL.innerHTML = '<li>No items selected.</li>'; 
    if(ac===0) aL.innerHTML = '<li>No items selected.</li>';
    
    getEl('additionalInfoPreview').innerHTML = parseMarkdown(State.additionalInfo) || "No additional info.";

    // Render Trackers
    const tGrid = getEl('trackerGrid');
    tGrid.innerHTML = '';
    
    State.trackers.forEach((t, i) => {
        const card = document.createElement('div');
        card.className = `tracker-card size-${t.size || 'M'}`;
        card.dataset.index = i;
        
        if (!document.body.classList.contains('publishing')) {
            card.draggable = true;
        }

        card.onclick = () => {
             if (document.body.classList.contains('publishing')) {
                 ZoomManager.openChartModal(i);
             } else {
                 TrackerManager.openModal(i);
             }
        };

        let visualHTML = '';
        let statsHTML = '';
        
        let renderType = t.type;
        if (renderType === 'line1' || renderType === 'line2') renderType = 'line';
        if (renderType === 'ryg') renderType = 'rag';

        if (renderType === 'counter') {
            visualHTML = `<div class="counter-display" style="color:${t.color1}">${t.value}</div>`;
            statsHTML = `<div class="counter-sub">${t.subtitle || ''}</div>`;
        } else if (renderType === 'rag' || renderType === 'ryg') {
            const status = (renderType === 'ryg') ? t.status : (t.color1 === '#ff1744' ? 'red' : (t.color1 === '#ffb300' ? 'amber' : 'green'));
            const icon = status === 'red' ? '!' : (status === 'amber' ? '⚠' : (status === 'green' ? '✓' : '?'));
            visualHTML = `<div class="ryg-indicator ryg-${status}" style="background:${t.color1}; box-shadow: 0 0 15px ${t.color1}">${icon}</div>`;
            statsHTML = `<div class="counter-sub" style="margin-top:10px; font-weight:bold;">${t.message || ''}</div>`;
        } else if (renderType === 'waffle') {
            const html = createWaffleHTML(100, t.active || 0, t.colorVal || '#03dac6', t.colorBg || '#333333');
            visualHTML = html;
            statsHTML = `<div class="tracker-stats">${t.active} / ${t.total}</div>`;
        } else if (renderType === 'line' || renderType === 'line1' || renderType === 'line2') {
            let labels = []; let series = [];
            if (renderType === 'line1' || renderType === 'line2') {
                labels = t.data.map(d => d.label);
                series.push({ name: t.y1Leg || 'Series 1', color: t.color1 || '#03dac6', values: t.data.map(d => d.y1 || 0) });
                if (renderType === 'line2') series.push({ name: t.y2Leg || 'Series 2', color: t.color2 || '#ff4081', values: t.data.map(d => d.y2 || 0) });
            } else {
                labels = t.labels; series = t.series;
            }
            visualHTML = `<div style="width:100%; height:120px; margin-bottom:10px;">${Visuals.createLineChartSVG(labels, series, t.yLabel)}</div>`;
        } else if (renderType === 'bar') {
            if (t.series) {
                visualHTML = `<div style="width:100%; height:120px; margin-bottom:10px;">${Visuals.createMultiBarChartSVG(t.labels, t.series)}</div>`;
            } else {
                // Legacy Simple Bar
                const svg = Visuals.createBarChartSVG(t.data, t.yLabel, t.color1);
                visualHTML = `<div style="width:100%; height:120px; margin-bottom:10px;">${svg}</div>`;
            }
        } else {
            const pct = t.total>0 ? Math.round((t.completed/t.total)*100) : 0;
            const c1 = t.colorVal || t.color1 || '#00e676'; 
            const c2 = t.color2 || '#ff1744';
            const grad = `conic-gradient(${c1} 0% ${pct}%, ${c2} ${pct}% 100%)`;
            visualHTML = `<div class="pie-chart" style="background:${grad}"><div class="pie-overlay"><div class="pie-pct">${pct}%</div></div></div>`;
            statsHTML = `<div class="tracker-stats">${t.completed} / ${t.total} ${t.metric}</div>`;
        }

        card.innerHTML = `<button class="btn-del-tracker" onclick="event.stopPropagation(); TrackerManager.deleteTracker(${i})">&times;</button>`;
        card.innerHTML += `<div class="tracker-desc">${t.desc}</div>`;
        card.innerHTML += `<div class="tracker-viz-container">${visualHTML}</div>`;
        card.innerHTML += `<div class="tracker-stats">${statsHTML}</div>`;
        
        tGrid.appendChild(card);
    });

    // Render Users
    const grid = getEl('teamGrid');
    grid.innerHTML = '';
    State.members.forEach((m, i) => {
        // Last Week Tasks
        let lw = ''; 
        if(m.lastWeek && m.lastWeek.tasks) {
            m.lastWeek.tasks.forEach((t,x) => {
                if(t.text.trim()) lw += `<li class="card-task-li" onclick="event.stopPropagation()"><input type="checkbox" ${t.isTeamSuccess?'checked':''} onchange="UserManager.toggleSuccess(${i},${x})"><span>${t.text}</span></li>`;
            });
        }

        // This Week Tasks (Priorities)
        let tw = ''; 
        if(m.thisWeek && m.thisWeek.tasks) {
            m.thisWeek.tasks.forEach((t,x) => {
                // Fixed: Check isTeamSuccess because toggleActivity toggles isTeamSuccess now
                if(t.text.trim()) tw += `<li class="card-task-li" onclick="event.stopPropagation()"><input type="checkbox" ${t.isTeamSuccess?'checked':''} onchange="UserManager.toggleActivity(${i},${x})"><span>${t.text}</span></li>`;
            });
        }

        // Next Week Tasks (Future)
        let nw = '';
        if(m.nextWeek && m.nextWeek.tasks) {
            m.nextWeek.tasks.forEach((t,x) => {
                // Added: Checkbox input calling toggleFuture
                if(t.text.trim()) nw += `<li class="card-task-li" onclick="event.stopPropagation()"><input type="checkbox" ${t.isTeamActivity?'checked':''} onchange="UserManager.toggleFuture(${i},${x})"><span>${t.text}</span></li>`;
            });
        }
        
        // Helper to calc average load pill
        const getAvgPill = (loadArr) => {
            let score = 0; let count = 0;
            (loadArr||[]).forEach(v => {
                if(v === 'L') { score += 1; count++; }
                else if(v === 'N') { score += 2; count++; }
                else if(v === 'R') { score += 3; count++; }
            });
            const avg = count === 0 ? 0 : score / count;
            let text = 'Medium'; let cls = 'status-busy';
            if(avg > 0 && avg < 1.6) { text = 'Low'; cls = 'status-under'; }
            else if(avg > 2.4) { text = 'High'; cls = 'status-over'; }
            else if(avg === 0) { text = 'None'; cls = 'status-under'; } 
            return `<div class="status-pill ${cls}" style="font-size:0.75rem; padding:2px 8px; width:auto; display:inline-block;">${text}</div>`;
        };

        const c = document.createElement('div');
        c.className = 'member-card';
        c.onclick = () => UserManager.openUserModal(i);
        
        // Status Pill Logic (Last Week)
        const statusMap = { 'under': 'Low', 'busy': 'Medium', 'over': 'High' };
        const statusVal = (m.lastWeek && m.lastWeek.status) ? m.lastWeek.status : 'busy';
        const statusText = statusMap[statusVal] || 'Medium';
        const pillHTML = `<div class="status-pill status-${statusVal}" style="font-size:0.75rem; padding:2px 8px; width:auto; display:inline-block;">${statusText}</div>`;

        // This Week Grid
        const thisLoad = (m.thisWeek && m.thisWeek.load) ? m.thisWeek.load : ['N','N','N','N','N'];
        const mg = thisLoad.map((v,k) => `<div class="dm-box"><span class="dm-day">${['M','T','W','T','F'][k]}</span><span class="dm-val val-${v}">${v}</span></div>`).join('');

        c.innerHTML = `<div class="member-header">${m.name}</div>`;
        
        let content = `<div class="member-card-content">`;
        
        // Col 1: Last Week
        content += `<div class="card-col"><div class="col-header">Last Week <span style="font-weight:normal; font-size:0.65rem;">(${getRanges().last.split(' - ')[0]})</span></div>`;
        content += `<div style="text-align:center; margin-bottom:5px;">${pillHTML}</div>`;
        content += `<ul class="card-task-list" style="padding-left:10px; font-size:0.8rem;">${lw || '<li style="list-style:none; opacity:0.5;">No items</li>'}</ul>`;
        content += `</div>`;

        // Col 2: This Week
        content += `<div class="card-col"><div class="col-header">This Week <span style="font-weight:normal; font-size:0.65rem;">(${getRanges().current.split(' - ')[0]})</span></div>`;
        content += `<div style="text-align:center; margin-bottom:5px;">${getAvgPill(m.thisWeek ? m.thisWeek.load : [])}</div>`;
        content += `<ul class="card-task-list" style="padding-left:10px; font-size:0.8rem;">${tw || '<li style="list-style:none; opacity:0.5;">No items</li>'}</ul>`;
        content += `<div class="daily-mini-grid" style="margin-top:auto;">${mg}</div>`;
        content += `</div>`;

        // Col 3: Next Week
        const nextLoad = (m.nextWeek && m.nextWeek.load) ? m.nextWeek.load : ['N','N','N','N','N'];
        const mgNext = nextLoad.map((v,k) => `<div class="dm-box"><span class="dm-day">${['M','T','W','T','F'][k]}</span><span class="dm-val val-${v}">${v}</span></div>`).join('');

        content += `<div class="card-col"><div class="col-header">Next Week <span style="font-weight:normal; font-size:0.65rem;">(${getRanges().next.split(' - ')[0]})</span></div>`;
        content += `<div style="text-align:center; margin-bottom:5px;">${getAvgPill(m.nextWeek ? m.nextWeek.load : [])}</div>`;
        content += `<ul class="card-task-list" style="padding-left:10px; font-size:0.8rem;">${nw || '<li style="list-style:none; opacity:0.5;">No items</li>'}</ul>`;
        content += `<div class="daily-mini-grid" style="margin-top:auto;">${mgNext}</div>`;
        content += `</div>`;

        content += `</div>`; // End content
        c.innerHTML += content;

        grid.appendChild(c);
    });
};

// --- MODULE: ZOOM MANAGER ---
export const ZoomManager = {
    openChartModal: (index) => {
        const t = State.trackers[index];
        if(!t) return;

        getEl('zoomTitle').innerText = t.desc;
        let content = '';
        
        let renderType = t.type;
        if (renderType === 'line1' || renderType === 'line2') renderType = 'line';
        if (renderType === 'ryg') renderType = 'rag';

        if (renderType === 'counter') {
            content = `<div style="font-size: 6rem; font-weight:300; color:${t.color1}; text-shadow:0 0 20px ${t.color1}">${t.value}</div><div style="font-size:1.5rem; color:#aaa; margin-top:1rem;">${t.subtitle}</div>`;
        } else if (renderType === 'rag' || renderType === 'ryg') {
            const status = t.status || 'grey';
            const icon = status === 'red' ? 'CRITICAL' : (status === 'amber' ? 'WARNING' : (status === 'green' ? 'GOOD' : 'UNKNOWN'));
            content = `<div class="ryg-indicator ryg-${status}" style="background:${t.color1}; width:200px; height:200px; font-size:2rem;">${icon}</div><div style="margin-top:2rem; font-size:1.5rem;">${t.message || ''}</div>`;
        } else if (renderType === 'waffle') {
            content = createWaffleHTML(100, t.active || 0, t.colorVal || '#03dac6', t.colorBg || '#333333');
        } else if (renderType === 'line' || renderType === 'line1' || renderType === 'line2') {
            let labels = []; let series = [];
            if (renderType === 'line1' || renderType === 'line2') {
                labels = t.data.map(d => d.label);
                series.push({ name: t.y1Leg || 'Series 1', color: t.color1 || '#03dac6', values: t.data.map(d => d.y1 || 0) });
                if (renderType === 'line2') series.push({ name: t.y2Leg || 'Series 2', color: t.color2 || '#ff4081', values: t.data.map(d => d.y2 || 0) });
            } else {
                labels = t.labels; series = t.series;
            }
            content = Visuals.createLineChartSVG(labels, series);
        } else if (renderType === 'bar') {
            if (t.series) content = Visuals.createMultiBarChartSVG(t.labels, t.series);
            else content = Visuals.createBarChartSVG(t.data, t.yLabel, t.color1);
        } else {
            const pct = t.total>0 ? Math.round((t.completed/t.total)*100) : 0;
            const c1 = t.colorVal || t.color1 || '#00e676'; 
            const c2 = t.color2 || '#ff1744';
            const grad = `conic-gradient(${c1} 0% ${pct}%, ${c2} ${pct}% 100%)`;
            content = `<div class="pie-chart" style="width:300px; height:300px; background:${grad}"><div class="pie-overlay" style="width:260px; height:260px;"><div class="pie-pct" style="font-size:3rem;">${pct}%</div><div style="margin-top:10px; color:#aaa;">${t.completed} / ${t.total}</div></div></div>`;
        }

        getEl('zoomBody').className = 'zoom-body-chart';
        getEl('zoomBody').innerHTML = `<div style="width:100%; height:100%;">${content}</div>`;
        ModalManager.openModal('zoomModal');
    }
};

// --- MODULE: TRACKER MANAGER ---
export const TrackerManager = {
    openModal(index) {
        console.log("Opening Tracker Modal for index:", index);
        if (document.body.classList.contains('publishing')) return;

        State.editingTrackerIndex = index;
        const isEdit = index > -1;
        getEl('trackerModalTitle').innerText = isEdit ? 'Edit Progress Tracker' : 'Add Progress Tracker';
        
        // Hide all input sections first
        ['gauge','bar','line','counter','rag','waffle'].forEach(type => {
            const div = getEl(`${type}Inputs`);
            if (div) div.style.display = 'none';
        });

        // Reset containers
        getEl('barSeriesContainer').innerHTML = '';
        getEl('lineSeriesContainer').innerHTML = '';
        getEl('barLabelsContainer').innerHTML = ''; 
        getEl('lineLabelsContainer').innerHTML = '';
        getEl('csvInput').value = ''; 
        getEl('csvInputBar').value = '';
        
        // Fill 24 inputs
        for(let k=0; k<24; k++) {
            getEl('barLabelsContainer').innerHTML += `<input type="text" id="bLbl${k}" placeholder="L${k+1}" style="text-align:center;">`;
            getEl('lineLabelsContainer').innerHTML += `<input type="text" id="lLbl${k}" placeholder="L${k+1}" style="text-align:center;">`;
        }

        const tracker = isEdit ? State.trackers[index] : null;
        
        let type = tracker ? tracker.type : 'gauge';
        if (type === 'line1' || type === 'line2') type = 'line';
        if (type === 'ryg') type = 'rag'; 
        
        this.setType(type);

        getEl('tkDesc').value = tracker ? tracker.desc : '';
        getEl('tkSize').value = tracker ? (tracker.size || 'M') : 'M';

        // Load Specific Data
        if (tracker) {
            if (type === 'line1' || type === 'line2') {
                getEl('tkLineYLabel').value = tracker.yLabel || '';
                const labels = tracker.data.map(d => d.label);
                labels.forEach((l, k) => { if(k<24) getEl(`lLbl${k}`).value = l; });
                this.addLineSeries(tracker.y1Leg || 'Series 1', tracker.color1 || '#03dac6', tracker.data.map(d => d.y1));
                if (type === 'line2') this.addLineSeries(tracker.y2Leg || 'Series 2', tracker.color2 || '#ff4081', tracker.data.map(d => d.y2));
            } else if (type === 'line') {
                getEl('tkLineYLabel').value = tracker.yLabel || '';
                tracker.labels.forEach((l, k) => { if(k<24) getEl(`lLbl${k}`).value = l; });
                tracker.series.forEach(s => this.addLineSeries(s.name, s.color, s.values));
            } else if (type === 'bar') {
                getEl('tkBarYLabel').value = tracker.yLabel || '';
                const labels = tracker.labels || tracker.data.map(d => d.label);
                if (tracker.series) {
                    (tracker.labels||[]).forEach((l, k) => { if(k<24) getEl(`bLbl${k}`).value = l; });
                    tracker.series.forEach(s => this.addBarSeries(s.name, s.color, s.values));
                } else {
                    (tracker.data||[]).forEach((d,k)=>{if(k<24)getEl(`bLbl${k}`).value=d.label;});
                    if (tracker.data && tracker.data.length > 0) {
                        const vals = tracker.data.map(d => d.val);
                        this.addBarSeries('Series 1', tracker.color1 || '#03dac6', vals);
                    }
                }
            } else if (type === 'gauge') {
                getEl('tkMetric').value = tracker.metric || '';
                getEl('tkComp').value = tracker.completed || '';
                getEl('tkTotal').value = tracker.total || '';
                getEl('tkPieColor').value = tracker.colorVal || tracker.color1 || '#00e676';
                getEl('tkPieColor2').value = tracker.color2 || '#ff1744';
            } else if (type === 'counter') {
                getEl('tkCounterVal').value = tracker.value || 0;
                getEl('tkCounterSub').value = tracker.subtitle || '';
                getEl('tkCounterColor').value = tracker.color1 || '#bb86fc';
            } else if (type === 'rag' || type === 'ryg') {
                this.selectRag(tracker.status || 'grey');
                getEl('tkRagMsg').value = tracker.message || '';
            } else if (type === 'waffle') {
                getEl('tkWaffleTotal').value = tracker.total || 100;
                getEl('tkWaffleActive').value = tracker.active || 0;
                getEl('tkWaffleColorVal').value = tracker.colorVal || '#03dac6';
                getEl('tkWaffleColorBg').value = tracker.colorBg || '#333333';
                this.updateWafflePreview();
            }
        }

        // Defaults for NEW tracker
        if (!tracker) {
            if (type === 'line') this.addLineSeries('Series 1', '#03dac6');
            if (type === 'bar') this.addBarSeries('Series 1', '#03dac6');
            if (type === 'gauge') { getEl('tkPieColor').value = '#00e676'; getEl('tkPieColor2').value = '#ff1744'; }
            if (type === 'rag') this.selectRag('green');
            if (type === 'counter') getEl('tkCounterColor').value = '#bb86fc';
            if (type === 'waffle') {
                getEl('tkWaffleColorVal').value = '#03dac6';
                getEl('tkWaffleColorBg').value = '#333333';
                this.updateWafflePreview();
            }
        }

        ModalManager.openModal('trackerModal');
    },

    setType(type) {
        State.currentTrackerType = type;
        
        // Map all types to data-attr
        const types = ['Gauge','Bar','Line','Counter','Rag','Waffle'];
        types.forEach(x => {
            const btn = getEl(`type${x}Btn`);
            if (btn) btn.className = (type === x.toLowerCase()) ? 'type-option active' : 'type-option';
            const div = getEl(`${x.toLowerCase()}Inputs`);
            if (div) div.style.display = (type === x.toLowerCase()) ? 'block' : 'none';
        });
    },

    selectRag(val) {
        getEl('tkRagStatus').value = val;
        document.querySelectorAll('.rag-pill').forEach(p => p.classList.remove('selected'));
        const selected = document.querySelector(`.rag-pill[data-val="${val}"]`);
        if (selected) selected.classList.add('selected');
    },

    addBarSeries(name, color, vals = []) {
        const c = getEl('barSeriesContainer');
        if (c.children.length >= 10) return App.alert("Max 10 series.");
        c.appendChild(this.createSeriesInputRow('bar', name, color, vals));
    },

    addLineSeries(name, color, vals = []) {
        const c = getEl('lineSeriesContainer');
        if (c.children.length >= 10) return App.alert("Max 10 series.");
        c.appendChild(this.createSeriesInputRow('line', name, color, vals));
    },

    createSeriesInputRow(type, name, color, vals) {
        const div = document.createElement('div');
        div.style.marginBottom = '1rem';
        div.style.border = '1px solid #444';
        div.style.padding = '0.5rem';
        div.style.borderRadius = '4px';

        // 24 inputs
        let valInputs = '';
        for(let k=0; k<24; k++) {
            valInputs += `<input type="number" class="sv-input" data-idx="${k}" value="${vals[k]||''}" placeholder="${k+1}" style="width:100%; text-align:center;">`;
        }

        div.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:5px;">
                <input type="text" class="s-name" value="${name}" placeholder="Series Name" style="width:50%;">
                <div style="display:flex; gap:5px; align-items:center;">
                    <label style="font-size:0.7rem; color:#aaa;">Color:</label>
                    <input type="color" class="s-color" value="${color}" style="width:30px; height:30px; padding:0; border:none; cursor:pointer;">
                </div>
                <button class="btn-reset" style="color:red; border-color:red;" onclick="this.parentElement.parentElement.remove()">Del</button>
            </div>
            <div style="display:grid; grid-template-columns:repeat(6, 1fr); gap:2px;">${valInputs}</div>
        `;
        return div;
    },

    updateWafflePreview() {
        const total = parseInt(getEl('tkWaffleTotal').value) || 0;
        const active = parseInt(getEl('tkWaffleActive').value) || 0;
        const colorVal = getEl('tkWaffleColorVal').value;
        const colorBg = getEl('tkWaffleColorBg').value;
        
        getEl('wafflePreview').innerHTML = createWaffleHTML(100, active, colorVal, colorBg);
    },

    parseCSV(type) {
        const inputId = type === 'bar' ? 'csvInputBar' : 'csvInput';
        const raw = getEl(inputId).value;
        if (!raw.trim()) return App.alert("Please paste CSV data.");
        
        const lines = raw.trim().split(/\r?\n/).filter(l => l.trim());
        if (lines.length < 2) return App.alert("CSV must have at least 2 lines (Header + Data).");

        const headers = lines[0].split(/[,\t]+/).map(s => s.trim());
        const seriesNames = headers.slice(1); 
        
        if (seriesNames.length === 0) return App.alert("No series columns found (columns 2-9).");
        
        const lblContainerId = type === 'bar' ? 'barLabelsContainer' : 'lineLabelsContainer';
        const seriesContainerId = type === 'bar' ? 'barSeriesContainer' : 'lineSeriesContainer';

        // Clear existing inputs
        getEl(lblContainerId).innerHTML = '';
        getEl(seriesContainerId).innerHTML = '';
        for(let k=0; k<24; k++) {
            const prefix = type === 'bar' ? 'bLbl' : 'lLbl';
            getEl(lblContainerId).innerHTML += `<input type="text" id="${prefix}${k}" placeholder="L${k+1}" style="text-align:center;">`;
        }

        const labels = [];
        const seriesData = seriesNames.map(() => []);
        
        const dataRows = lines.slice(1).slice(0, 24);
        
        dataRows.forEach((line) => {
            const cols = line.split(/[,\t]+/).map(s => s.trim());
            labels.push(cols[0] || ""); 
            
            seriesNames.forEach((_, sIdx) => {
                const val = parseFloat(cols[sIdx + 1]) || 0;
                seriesData[sIdx].push(val);
            });
        });

        // Fill X-Axis Labels
        labels.forEach((l, k) => { 
            const prefix = type === 'bar' ? 'bLbl' : 'lLbl';
            getEl(`${prefix}${k}`).value = l; 
        });

        // Create Series (Up to 8)
        const colors = ['#03dac6', '#ff4081', '#bb86fc', '#cf6679', '#00e676', '#ffb300', '#018786', '#3700b3'];
        
        seriesNames.forEach((name, sIdx) => {
            if (sIdx < 8) {
                if (type === 'bar') this.addBarSeries(name, colors[sIdx] || '#ffffff', seriesData[sIdx]);
                else this.addLineSeries(name, colors[sIdx] || '#ffffff', seriesData[sIdx]);
            }
        });
        
        App.alert(`Parsed ${labels.length} rows and ${Math.min(seriesNames.length, 8)} series.`);
    },

    submitTracker() {
        const index = State.editingTrackerIndex;
        const desc = getEl('tkDesc').value;
        const size = getEl('tkSize').value;
        if (!desc) return App.alert("Title required");

        const type = State.currentTrackerType;
        let newTracker = { desc, type, size };

        if (type === 'gauge') {
            const m = getEl('tkMetric').value;
            const c = parseFloat(getEl('tkComp').value) || 0;
            const t = parseFloat(getEl('tkTotal').value) || 0;
            if(t<=0) return App.alert("Total > 0 required");
            if(c>t) return App.alert("Completed value cannot exceed Total value.");
            newTracker.metric = m;
            newTracker.completed = c;
            newTracker.total = t;
            newTracker.colorVal = getEl('tkPieColor').value; 
            newTracker.color2 = getEl('tkPieColor2').value;
        } else if (type === 'bar') {
            const y = getEl('tkBarYLabel').value;
            const labels = [];
            for(let k=0; k<24; k++) {
                const l = getEl(`bLbl${k}`).value;
                if(l) labels.push(l);
            }
            const series = [];
            const sDivs = getEl('barSeriesContainer').children;
            for(let s of sDivs) {
                const name = s.querySelector('.s-name').value;
                const color = s.querySelector('.s-color').value;
                const vals = [];
                s.querySelectorAll('.sv-input').forEach((inp, k) => {
                    if(k < labels.length) vals.push(parseFloat(inp.value)||0);
                });
                series.push({name, color, values: vals});
            }
            if(series.length === 0) return App.alert("Add at least one series");
            newTracker.yLabel = y;
            newTracker.labels = labels;
            newTracker.series = series;
        } else if (type === 'line') {
            const y = getEl('tkLineYLabel').value;
            const labels = [];
            for(let k=0; k<24; k++) {
                const l = getEl(`lLbl${k}`).value;
                if(l) labels.push(l);
            }
            if(labels.length < 2) return App.alert("Add at least 2 X-Axis labels");

            const series = [];
            const sDivs = getEl('lineSeriesContainer').children;
            for(let s of sDivs) {
                const name = s.querySelector('.s-name').value;
                const color = s.querySelector('.s-color').value;
                const vals = [];
                s.querySelectorAll('.sv-input').forEach((inp, k) => {
                    if(k < labels.length) vals.push(parseFloat(inp.value)||0);
                });
                series.push({name, color, values: vals});
            }
            if(series.length === 0) return App.alert("Add at least one series");
            newTracker.yLabel = y;
            newTracker.labels = labels;
            newTracker.series = series;
        } else if (type === 'counter') {
            newTracker.value = parseFloat(getEl('tkCounterVal').value) || 0;
            newTracker.subtitle = getEl('tkCounterSub').value;
            newTracker.color1 = getEl('tkCounterColor').value;
        } else if (type === 'rag') {
            newTracker.type = 'rag'; 
            newTracker.status = getEl('tkRagStatus').value;
            newTracker.message = getEl('tkRagMsg').value;
            newTracker.color1 = (newTracker.status === 'green' ? '#00e676' : (newTracker.status === 'amber' ? '#ffb300' : (newTracker.status === 'red' ? '#ff1744' : '#666666')));
        } else if (type === 'waffle') {
            newTracker.total = parseInt(getEl('tkWaffleTotal').value) || 100;
            newTracker.active = parseInt(getEl('tkWaffleActive').value) || 0;
            newTracker.colorVal = getEl('tkWaffleColorVal').value;
            newTracker.colorBg = getEl('tkWaffleColorBg').value;
        }

        if(index === -1) {
            State.trackers.push(newTracker);
        } else {
            State.trackers[index] = newTracker;
        }

        ModalManager.closeModal('trackerModal');
        renderBoard();
        console.log("Tracker saved:", type);
    },

    deleteTracker: (index) => {
        App.confirm("Delete tracker?", () => {
            State.trackers.splice(index, 1);
            renderBoard();
        });
    }
};

// --- MODULE: USER MANAGER ---
export const UserManager = {
    openUserModal(index) {
        if (document.body.classList.contains('publishing')) return;

        const isEdit = index > -1;
        getEl('editIndex').value = index;
        getEl('modalTitle').innerText = isEdit ? 'Edit User' : 'Add New User';
        getEl('deleteBtn').style.display = isEdit ? 'block' : 'none';

        const member = isEdit ? State.members[index] : null;
        getEl('mName').value = member ? member.name : '';
        
        // Tasks
        ['lwTask1','lwTask2','lwTask3'].forEach((id, k) => {
            getEl(id).value = (member && member.lastWeek && member.lastWeek.tasks[k]) ? member.lastWeek.tasks[k].text : '';
        });
        ['nwTask1','nwTask2','nwTask3'].forEach((id, k) => {
            getEl(id).value = (member && member.thisWeek && member.thisWeek.tasks[k]) ? member.thisWeek.tasks[k].text : '';
        });
        ['fwTask1','fwTask2','fwTask3'].forEach((id, k) => {
            getEl(id).value = (member && member.nextWeek && member.nextWeek.tasks[k]) ? member.nextWeek.tasks[k].text : '';
        });

        // Last Week Status
        const status = member ? (member.lastWeek.status || 'busy') : 'busy';
        this.setStatus(status);

        // This Week Load
        for(let j=0; j<5; j++) {
            const val = (member && member.thisWeek) ? member.thisWeek.load[j] : 'N';
            this.setLoad(j, val);
        }

        // Next Week Load
        for(let j=0; j<5; j++) {
            const val = (member && member.nextWeek) ? member.nextWeek.load[j] : 'N';
            this.setFutureLoad(j, val);
        }

        ModalManager.openModal('userModal');
    },

    setStatus(val) {
        getEl('lwStatus').value = val;
        document.querySelectorAll('.status-option').forEach(el => el.classList.remove('selected'));
        const target = document.querySelector(`.status-option.so-${val}`);
        if(target) target.classList.add('selected');
    },

    setLoad(dayIdx, val) {
        getEl(`nw${dayIdx}`).value = val;
        const boxes = document.querySelectorAll('#nw0, #nw1, #nw2, #nw3, #nw4').length ? document.querySelectorAll('.ls-box') : []; 
        // Need to target specific column? 
        // The modal structure has multiple .load-select-row. 
        // I'll target via ID parent to be safe or just use the structure.
        // The "This Week" row is the first .load-select-row inside .col-form (middle)
        // Actually, easier to search relative to the hidden input
        const input = getEl(`nw${dayIdx}`);
        if(input) {
            const container = input.parentElement;
            container.querySelectorAll('.w-pill').forEach(p => p.classList.remove('selected'));
            const target = container.querySelector(`.wp-${val.toLowerCase()}`);
            if(target) target.classList.add('selected');
        }
    },

    setFutureLoad(dayIdx, val) {
        getEl(`fw${dayIdx}`).value = val;
        const input = getEl(`fw${dayIdx}`);
        if(input) {
            const container = input.parentElement;
            container.querySelectorAll('.w-pill').forEach(p => p.classList.remove('selected'));
            const target = container.querySelector(`.wp-${val.toLowerCase()}`);
            if(target) target.classList.add('selected');
        }
    },

    submitUser() {
        const i = parseInt(getEl('editIndex').value);
        const n = getEl('mName').value;
        if (!n) return App.alert("Name required");

        const getTasks = (prefix) => [1,2,3].map(x => ({ text: getEl(`${prefix}Task${x}`).value }));
        const getLoad = (prefix) => [0,1,2,3,4].map(x => getEl(`${prefix}${x}`).value);

        const newUser = {
            id: Date.now(),
            name: n,
            lastWeek: { tasks: getTasks('lw'), status: getEl('lwStatus').value },
            thisWeek: { tasks: getTasks('nw'), load: getLoad('nw') },
            nextWeek: { tasks: getTasks('fw'), load: getLoad('fw') }
        };

        if (i > -1) {
            const old = State.members[i];
            newUser.id = old.id;
            // Preserve flags
            newUser.lastWeek.tasks.forEach((t, k) => { if(old.lastWeek && old.lastWeek.tasks[k]) t.isTeamSuccess = old.lastWeek.tasks[k].isTeamSuccess; });
            newUser.thisWeek.tasks.forEach((t, k) => { if(old.thisWeek && old.thisWeek.tasks[k]) t.isTeamActivity = old.thisWeek.tasks[k].isTeamActivity; });
            // Next week future flags? Not used yet but safe to ignore
            State.members[i] = newUser;
        } else {
            State.members.push(newUser);
        }

        ModalManager.closeModal('userModal');
        renderBoard();
    },

    deleteUser() {
        App.confirm('Delete user?', () => {
            const index = parseInt(getEl('editIndex').value);
            if(index > -1) {
                State.members.splice(index, 1);
                ModalManager.closeModal('userModal');
                renderBoard();
            }
        });
    },

    toggleSuccess(i, x) {
        const t = State.members[i].lastWeek.tasks[x];
        t.isTeamSuccess = !t.isTeamSuccess;
        renderBoard();
    },

    toggleActivity(i, x) {
        const t = State.members[i].thisWeek.tasks[x];
        t.isTeamSuccess = !t.isTeamSuccess; // Now contributes to Achievements
        renderBoard();
    },

    toggleFuture(i, x) {
        const t = State.members[i].nextWeek.tasks[x];
        t.isTeamActivity = !t.isTeamActivity; // Contributes to Next Week Activities
        renderBoard();
    },

    resetSelections(type) {
        App.confirm(`Reset selections?`, () => {
            State.members.forEach(m => {
                if (type === 'success') {
                    if (m.lastWeek) m.lastWeek.tasks.forEach(t => t.isTeamSuccess = false);
                    if (m.thisWeek) m.thisWeek.tasks.forEach(t => t.isTeamSuccess = false);
                }
                else if (m.nextWeek) m.nextWeek.tasks.forEach(t => t.isTeamActivity = false);
            });
            renderBoard();
        });
    },

    saveAdditionalInfo() {
        State.additionalInfo = getEl('additionalInfoInput').value;
        ModalManager.closeModal('infoModal');
        renderBoard();
    }
};

// --- MODULE: OVERVIEW MANAGER ---
export const OverviewManager = {
    handleOverviewClick: (type) => {
        if (!document.body.classList.contains('publishing')) {
            const r = getRanges();
            const title = type === 'success' ? `Top 5 Achievements (${r.current})` : `Top 5 Activities Next Week (${r.next})`;
            const containerId = type === 'success' ? 'teamSuccessList' : 'teamActivityList';
            
            getEl('zoomTitle').innerText = State.title;
            getEl('zoomBody').className = 'zoom-body-text';
            const content = getEl(containerId).innerHTML;
            getEl('zoomBody').innerHTML = `<div class="zoomed-content"><h3>${title}</h3><ul>${content}</ul></div>`;
            ModalManager.openModal('zoomModal');
        }
    },

    handleInfoClick: () => {
        if (document.body.classList.contains('publishing')) {
            getEl('zoomTitle').innerText = "Additional Info";
            getEl('zoomBody').className = 'zoom-body-text';
            const content = getEl('additionalInfoPreview').innerHTML;
            getEl('zoomBody').innerHTML = `<div class="zoomed-content">${content}</div>`;
            ModalManager.openModal('zoomModal');
        } else {
            getEl('additionalInfoInput').value = State.additionalInfo || '';
            ModalManager.openModal('infoModal');
        }
    }
};

// --- MODULE: DATA MANAGERS ---
export const DataSaver = {
    saveData: () => {
        const d = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(State));
        const a = document.createElement('a');
        a.href = d;
        a.download = "team_tracker.json";
        document.body.appendChild(a);
        a.click();
        a.remove();
    }
};

export const DataLoader = {
    loadFromFile: (input) => {
        const file = input.files[0];
        if(!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target.result;
            try {
                const l = JSON.parse(content);
                // Migration
                if(l.members) {
                    l.members.forEach(m => {
                        if(typeof m.nextWeek.tasks[0] === 'string') {
                                    m.nextWeek.tasks = m.nextWeek.tasks.map(t => ({text:t, isTeamActivity:false}));
                                }
                                if(typeof m.lastWeek.tasks[0] === 'string') {
                                    m.lastWeek.tasks = m.lastWeek.tasks.map(t => ({text:t, isTeamSuccess:false}));
                                }
                            });
                }
                State = l;
                renderBoard();
                App.alert('Data loaded!');
            } catch(x) {
                console.error(x);
                App.alert('Error reading file (Not a valid JSON)');
            }
        };
        reader.readAsText(file);
        input.value = '';
    }
};

export const DataExporter = {
    exportCSV: () => {
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "Section,Title,Data1,Data2\n";
        State.trackers.forEach(t => {
            let row = `Tracker,"${t.desc}",`;
            if(t.type === 'counter') row += `${t.value},"${t.subtitle}"`;
            else if(t.type === 'waffle') row += `${t.active},${t.total}`;
            else if(t.type === 'gauge') row += `${t.completed},${t.total}`;
            else row += "Complex Data,See JSON";
            csvContent += row + "\n";
        });
        State.members.forEach(m => {
            let status = m.lastWeek.status || 'busy';
            let row = `Member,"${m.name}","Status: ${status}","Successes: ${m.lastWeek.tasks.filter(t=>t.isTeamSuccess).length}"`;
            csvContent += row + "\n";
        });
        const a = document.createElement('a');
        a.href = encodeURI(csvContent);
        a.download = "team_data_export.csv";
        document.body.appendChild(a);
        a.click();
        a.remove();
    }
};
