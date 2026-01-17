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
        const drd = getEl('dateRangeDisplay');
        if (drd) drd.innerText = `Current: ${r.current} | Next: ${r.next}`;
        
        const otc = getEl('overviewTitleCurrent');
        if (otc) otc.innerHTML = `Top 5 Team Achievements <span class="date-suffix">${r.current}</span>`;
        
        const otn = getEl('overviewTitleNext');
        if (otn) otn.innerHTML = `Top 5 Activities Next Week <span class="date-suffix">${r.next}</span>`;
        
        // Update Modal Headers
        const lwt = getEl('lastWeekTitle');
        if(lwt) lwt.innerText = `Last Week (${r.last})`;
        
        const twt = getEl('thisWeekTitle');
        if(twt) twt.innerText = `This Week (${r.current})`;
        
        const nwt = getEl('nextWeekTitle');
        if(nwt) nwt.innerText = `Next Week (${r.next})`;
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
             .replace(/\((.*?)\)\((\s*.*?\s*)\)/g, (match, text, url) => {
                 let finalUrl = url.trim();
                 if(!/^https?:\/\//i.test(finalUrl)) finalUrl = 'https://' + finalUrl;
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
        renderBoard();
    },
    saveTitle: () => {
        const titleEl = getEl('appTitle');
        if (titleEl) State.title = titleEl.innerText;
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
    const titleEl = getEl('appTitle');
    if (titleEl) titleEl.innerText = State.title || "Server Platforms";
    
    // Render Overview
    const sL = getEl('teamSuccessList'); 
    const aL = getEl('teamActivityList');
    if (sL) sL.innerHTML = ''; 
    if (aL) aL.innerHTML = ''; 
    let sc = 0, ac = 0;

    State.members.forEach(m => {
        // Achievements: Last Week + This Week
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
        // Activities: Next Week
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

    // Render Trackers
    const tGrid = getEl('trackerGrid');
    if (tGrid) {
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
                // Use 2-color gradient
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
    }

    // Render Users
    const grid = getEl('teamGrid');
    if (grid) {
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
            const statusMap = { 'under': 'Low', 'busy': 'Medium', 'over': 'High', 'absent': 'Absent' };
            const statusVal = (m.lastWeek && m.lastWeek.status) ? m.lastWeek.status : 'busy';
            const statusText = statusMap[statusVal] || 'Medium';
            const statusCls = statusVal === 'absent' ? 'status-absent' : `status-${statusVal}`;
            const pillHTML = `<div class="status-pill ${statusCls}" style="font-size:0.75rem; padding:2px 8px; width:auto; display:inline-block;">${statusText}</div>`;

            // This Week Grid
            const thisLoad = (m.thisWeek && m.thisWeek.load) ? m.thisWeek.load : ['N','N','N','N','N'];
            const mgThis = thisLoad.map((v,k) => `<div class="dm-box"><span class="dm-day">${['M','T','W','T','F'][k]}</span><span class="dm-val val-${v}">${v}</span></div>`).join('');

            // Next Week Grid
            const nextLoad = (m.nextWeek && m.nextWeek.load) ? m.nextWeek.load : ['N','N','N','N','N'];
            const mgNext = nextLoad.map((v,k) => `<div class="dm-box"><span class="dm-day">${['M','T','W','T','F'][k]}</span><span class="dm-val val-${v}">${v}</span></div>`).join('');

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
            content += `<div class="daily-mini-grid" style="margin-top:auto;">${mgThis}</div>`;
            content += `</div>`;

            // Col 3: Next Week
            content += `<div class="card-col"><div class="col-header">Next Week <span style="font-weight:normal; font-size:0.65rem;">(${getRanges().next.split(' - ')[0]})</span></div>`;
            content += `<div style="text-align:center; margin-bottom:5px;">${getAvgPill(m.nextWeek ? m.nextWeek.load : [])}</div>`;
            content += `<ul class="card-task-list" style="padding-left:10px; font-size:0.8rem;">${nw || '<li style="list-style:none; opacity:0.5;">No items</li>'}</ul>`;
            content += `<div class="daily-mini-grid" style="margin-top:auto;">${mgNext}</div>`;
            content += `</div>`;

            content += `</div>`; // End content
            c.innerHTML += content;

            grid.appendChild(c);
        });
    }
};

// --- MODULE: ZOOM MANAGER ---
export const ZoomManager = {
    openChartModal: (index) => {
        const t = State.trackers[index];
        if(!t) return;

        const titleEl = getEl('zoomTitle');
        if (titleEl) titleEl.innerText = t.desc;
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
            content = Visuals.createLineChartSVG(labels, series, t.yLabel);
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

        const bodyEl = getEl('zoomBody');
        if (bodyEl) {
            bodyEl.className = 'zoom-body-chart';
            bodyEl.innerHTML = `<div style="width:100%; height:100%;">${content}</div>`;
        }
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
        const titleEl = getEl('trackerModalTitle');
        if (titleEl) titleEl.innerText = isEdit ? 'Edit Progress Tracker' : 'Add Progress Tracker';
        
        // Hide all input sections first
        ['gauge','bar','line','counter','rag','waffle'].forEach(type => {
            const div = getEl(`${type}Inputs`);
            if (div) div.style.display = 'none';
        });

        // Reset containers
        const bsc = getEl('barSeriesContainer');
        if (bsc) bsc.innerHTML = '';
        
        const blc = getEl('barLabelsContainer');
        if (blc) {
            blc.innerHTML = '';
            // Fill 24 inputs for bar
            for(let k=0; k<24; k++) {
                blc.innerHTML += `<input type="text" id="bLbl${k}" placeholder="L${k+1}" style="text-align:center;">`;
            }
        }

        const ltc = getEl('lineTableContainer');
        if (ltc) ltc.innerHTML = '';

        const csvIn = getEl('csvInput');
        if (csvIn) csvIn.value = '';

        const csvInBar = getEl('csvInputBar');
        if (csvInBar) csvInBar.value = '';

        const tracker = isEdit ? State.trackers[index] : null;
        
        let type = tracker ? tracker.type : 'gauge';
        this.setType(type);

        const descIn = getEl('tkDesc');
        if (descIn) descIn.value = tracker ? tracker.desc : '';
        
        const sizeVal = tracker ? (tracker.size || 'M') : 'M';
        const sizeRadio = document.querySelector(`input[name="tkSize"][value="${sizeVal}"]`);
        if (sizeRadio) sizeRadio.checked = true;

        // Load Specific Data
        if (type === 'line') {
             const unit = tracker ? (tracker.timeUnit || 'day') : 'day';
             const rad = document.querySelector(`input[name="tkTimeUnit"][value="${unit}"]`);
             if(rad) rad.checked = true;
             
             // Default Start Date to this Monday
             const d = new Date();
             const day = d.getDay(), diff = d.getDate() - day + (day == 0 ? -6 : 1); 
             const monday = new Date(d.setDate(diff));
             const defDate = monday.toISOString().split('T')[0];
             
             const sdIn = getEl('tkStartDate');
             if (sdIn) sdIn.value = tracker ? (tracker.startDate || defDate) : defDate;
             
             const lyIn = getEl('tkLineYLabel');
             if (lyIn) lyIn.value = tracker ? (tracker.yLabel || '') : '';
             
             this.updateTimeOptions();
             const tcIn = getEl('tkTimeCount');
             if (tcIn && tracker) tcIn.value = tracker.timeCount || 7;
             
             // Reconstruct series structure if needed
             let series = [];
             if (tracker) {
                 if (tracker.series) series = tracker.series;
                 else if (tracker.data) { // Legacy migration
                     series = [{name:'Series 1', color: tracker.color1||'#03dac6', values: tracker.data.map(d=>d.val)}];
                 }
             } else {
                 series = [{name:'Series 1', color: '#03dac6', values:[]}];
             }
             
             this.renderTimeTable(series);
        } else {
             // Reset Time controls defaults just in case
             const radDay = document.querySelector(`input[name="tkTimeUnit"][value="day"]`);
             if (radDay) radDay.checked = true;
             this.updateTimeOptions();
        }

        // Load Data for other types
        if (tracker) {
            if (type === 'bar') {
                const byIn = getEl('tkBarYLabel');
                if (byIn) byIn.value = tracker.yLabel || '';
                
                if (tracker.series) {
                    (tracker.labels||[]).forEach((l, k) => { 
                        const lbl = getEl(`bLbl${k}`);
                        if(lbl) lbl.value = l; 
                    });
                    tracker.series.forEach(s => this.addBarSeries(s.name, s.color, s.values));
                } else {
                    (tracker.data||[]).forEach((d,k)=>{
                        const lbl = getEl(`bLbl${k}`);
                        if(lbl) lbl.value=d.label;
                    });
                    if (tracker.data && tracker.data.length > 0) {
                        const vals = tracker.data.map(d => d.val);
                        this.addBarSeries('Series 1', tracker.color1 || '#03dac6', vals);
                    }
                }
            } else if (type === 'gauge') {
                const tmIn = getEl('tkMetric');
                if (tmIn) tmIn.value = tracker.metric || '';
                const tcIn = getEl('tkComp');
                if (tcIn) tcIn.value = tracker.completed || '';
                const ttIn = getEl('tkTotal');
                if (ttIn) ttIn.value = tracker.total || '';
                const pcIn = getEl('tkPieColor');
                if (pcIn) pcIn.value = tracker.colorVal || tracker.color1 || '#00e676';
                const pc2In = getEl('tkPieColor2');
                if (pc2In) pc2In.value = tracker.color2 || '#ff1744';
            } else if (type === 'counter') {
                const cvIn = getEl('tkCounterVal');
                if (cvIn) cvIn.value = tracker.value || 0;
                const csIn = getEl('tkCounterSub');
                if (csIn) csIn.value = tracker.subtitle || '';
                const ccIn = getEl('tkCounterColor');
                if (ccIn) ccIn.value = tracker.color1 || '#bb86fc';
            } else if (type === 'rag') {
                this.selectRag(tracker.status || 'grey');
                const rmIn = getEl('tkRagMsg');
                if (rmIn) rmIn.value = tracker.message || '';
            } else if (type === 'waffle') {
                const wtIn = getEl('tkWaffleTotal');
                if (wtIn) wtIn.value = tracker.total || 100;
                const waIn = getEl('tkWaffleActive');
                if (waIn) waIn.value = tracker.active || 0;
                const wcIn = getEl('tkWaffleColorVal');
                if (wcIn) wcIn.value = tracker.colorVal || '#03dac6';
                const wbIn = getEl('tkWaffleColorBg');
                if (wbIn) wbIn.value = tracker.colorBg || '#333333';
                this.updateWafflePreview();
            }
        } else {
            // New defaults
            if (type === 'bar') this.addBarSeries('Series 1', '#03dac6');
            if (type === 'gauge') { 
                const pcIn = getEl('tkPieColor');
                if (pcIn) pcIn.value = '#00e676'; 
                const pc2In = getEl('tkPieColor2');
                if (pc2In) pc2In.value = '#ff1744'; 
            }
            if (type === 'rag') this.selectRag('green');
            if (type === 'counter') {
                const ccIn = getEl('tkCounterColor');
                if (ccIn) ccIn.value = '#bb86fc';
            }
            if (type === 'waffle') {
                const wcIn = getEl('tkWaffleColorVal');
                if (wcIn) wcIn.value = '#03dac6';
                const wbIn = getEl('tkWaffleColorBg');
                if (wbIn) wbIn.value = '#333333';
                this.updateWafflePreview();
            }
        }

        ModalManager.openModal('trackerModal');
    },

    setType(type) {
        State.currentTrackerType = type;
        ['Gauge','Bar','Line','Counter','Rag','Waffle'].forEach(x => {
            const btn = getEl(`type${x}Btn`);
            if (btn) btn.className = (type === x.toLowerCase()) ? 'type-option active' : 'type-option';
            const div = getEl(`${x.toLowerCase()}Inputs`);
            if (div) div.style.display = (type === x.toLowerCase()) ? 'block' : 'none';
        });
    },

    updateTimeOptions() {
        const unitRad = document.querySelector('input[name="tkTimeUnit"]:checked');
        const unit = unitRad ? unitRad.value : 'day';
        
        const histLabel = getEl('tkHistoricLabel');
        if (histLabel) histLabel.innerText = `Historic ${unit.charAt(0).toUpperCase() + unit.slice(1)}s`;

        const countSel = getEl('tkTimeCount');
        if (!countSel) return;
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
        // Default selection logic if needed, otherwise first is selected
        this.renderTimeTable();
    },

    renderTimeTable(seriesOverride = null) {
        const unitRad = document.querySelector('input[name="tkTimeUnit"]:checked');
        const unit = unitRad ? unitRad.value : 'day';
        const tcIn = getEl('tkTimeCount');
        const count = tcIn ? (parseInt(tcIn.value) || 5) : 5;
        const sdIn = getEl('tkStartDate');
        let startDateVal = sdIn ? sdIn.value : '';
        if(!startDateVal) {
             const d = new Date();
             const day = d.getDay(), diff = d.getDate() - day + (day == 0 ? -6 : 1); 
             const monday = new Date(d.setDate(diff));
             startDateVal = monday.toISOString().split('T')[0];
             if(sdIn) sdIn.value = startDateVal;
        }

        // Scrape existing series data if not overridden
        let series = seriesOverride;
        if (!series) series = this.scrapeTimeSeries();
        if (series.length === 0) series = [{name:'Series 1', color: '#03dac6', values:[]}];

        const start = new Date(startDateVal);
        const labels = [];
        
        for(let i=0; i<count; i++) {
            let label = '';
            // Calculate backwards from End Date so the last one is the selected date
            // Order is chronological: 2024, 2025, 2026 (if 2026 is end)
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

        const container = getEl('lineTableContainer');
        if (!container) return;
        
        // Transposed Layout: Columns are Time, Rows are Series
        let html = '<div style="overflow-x:auto;"><table style="width:100%; border-collapse: separate; border-spacing: 0;">';
        
        // Header: Series Name Column + Date Columns
        html += '<thead><tr><th style="padding:8px; text-align:left; border-bottom:1px solid #444; position:sticky; left:0; top:0; background:var(--modal-bg); z-index:20; min-width:160px;">Series Name</th>';
        
        labels.forEach(l => {
            html += `<th style="padding:8px; border-bottom:1px solid #444; position:sticky; top:0; background:var(--modal-bg); z-index:10; min-width:80px; text-align:center; font-size:0.7rem; white-space:nowrap;">${l}</th>`;
        });
        html += '</tr></thead><tbody>';

        series.forEach((s, si) => {
            html += `<tr>
                <td style="padding:8px; border-bottom:1px solid #333; position:sticky; left:0; background:var(--modal-bg); z-index:10;">
                    <div style="display:flex; align-items:center; gap:5px;">
                        <input type="checkbox" class="ts-select" data-idx="${si}" style="accent-color:var(--accent);">
                        <input type="color" class="ts-color" value="${s.color}" style="width:20px; height:20px; border:none; padding:0; cursor:pointer;" data-idx="${si}">
                        <input type="text" class="ts-name" value="${s.name}" style="width:100px; font-size:0.8rem; background:#222; border:1px solid #444; color:#fff; padding:2px;" data-idx="${si}">
                    </div>
                </td>`;
            
            labels.forEach((l, li) => {
                const val = (s.values && s.values[li] !== undefined) ? s.values[li] : '';
                html += `<td style="padding:2px; border-bottom:1px solid #333;">
                    <input type="number" class="ts-val" data-s="${si}" data-r="${li}" value="${val}" style="width:100%; background:transparent; border:none; color:#fff; text-align:center;">
                </td>`;
            });
            html += '</tr>';
        });
        html += '</tbody></table></div>';
        
        container.innerHTML = html;
        container.dataset.labels = JSON.stringify(labels);
    },

    scrapeTimeSeries() {
        const container = getEl('lineTableContainer');
        if (!container) return [];
        // Rows are now Series (tr in tbody)
        const rows = container.querySelectorAll('tbody tr');
        if (rows.length === 0) return [];

        const series = [];
        rows.forEach((row, si) => {
            const nameIn = row.querySelector('.ts-name');
            const colorIn = row.querySelector('.ts-color');
            const name = nameIn ? nameIn.value : `Series ${si+1}`;
            const color = colorIn ? colorIn.value : '#03dac6';
            
            const values = [];
            // Find values for this series row
            const valInputs = row.querySelectorAll('.ts-val');
            valInputs.forEach(inp => values.push(parseFloat(inp.value) || 0));
            
            series.push({ name, color, values });
        });
        
        return series;
    },

    addTimeSeriesColumn() {
        const series = this.scrapeTimeSeries();
        const colors = ['#03dac6', '#ff4081', '#bb86fc', '#cf6679', '#00e676', '#ffb300', '#018786', '#3700b3'];
        const color = colors[series.length % colors.length];
        series.push({ name: `Series ${series.length+1}`, color: color, values: [] });
        this.renderTimeTable(series);
    },

    deleteSelectedSeries() {
        const container = getEl('lineTableContainer');
        if (!container) return;
        const checks = container.querySelectorAll('.ts-select:checked');
        if (checks.length === 0) return App.alert("No series selected.");
        
        const indicesToDelete = new Set();
        checks.forEach(c => indicesToDelete.add(parseInt(c.dataset.idx)));
        
        const currentSeries = this.scrapeTimeSeries();
        const newSeries = currentSeries.filter((_, i) => !indicesToDelete.has(i));
        
        this.renderTimeTable(newSeries);
    },

    selectRag(val) {
        const ragIn = getEl('tkRagStatus');
        if (ragIn) ragIn.value = val;
        document.querySelectorAll('.rag-pill').forEach(p => p.classList.remove('selected'));
        const selected = document.querySelector(`.rag-pill[data-val="${val}"]`);
        if (selected) selected.classList.add('selected');
    },

    addBarSeries(name, color, vals = []) {
        const c = getEl('barSeriesContainer');
        if (!c) return;
        if (c.children.length >= 10) return App.alert("Max 10 series.");
        c.appendChild(this.createSeriesInputRow('bar', name, color, vals));
    },

    createSeriesInputRow(type, name, color, vals) {
        const div = document.createElement('div');
        div.style.marginBottom = '1rem';
        div.style.border = '1px solid #444';
        div.style.padding = '0.5rem';
        div.style.borderRadius = '4px';

        // 24 inputs for Bar
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
        const wtIn = getEl('tkWaffleTotal');
        const total = wtIn ? (parseInt(wtIn.value) || 0) : 0;
        const waIn = getEl('tkWaffleActive');
        const active = waIn ? (parseInt(waIn.value) || 0) : 0;
        const wcIn = getEl('tkWaffleColorVal');
        const colorVal = wcIn ? wcIn.value : '#03dac6';
        const wbIn = getEl('tkWaffleColorBg');
        const colorBg = wbIn ? wbIn.value : '#333333';
        
        const preview = getEl('wafflePreview');
        if (preview) preview.innerHTML = createWaffleHTML(100, active, colorVal, colorBg);
    },

    parseCSV(type) {
        // Simplified CSV parser for Time Series Table if type is 'line'
        if (type === 'line') {
            const csvIn = getEl('csvInput');
            const raw = csvIn ? csvIn.value : '';
            if (!raw.trim()) return App.alert("Please paste CSV data.");
            const lines = raw.trim().split(/\r?\n/).filter(l => l.trim());
            if (lines.length < 2) return App.alert("CSV must have header + data.");
            
            const headers = lines[0].split(/[\,\t]+/).map(s => s.trim());
            const seriesNames = headers.slice(1);
            if (seriesNames.length === 0) return App.alert("No series columns.");

            const seriesData = seriesNames.map((n, i) => ({
                name: n, 
                color: ['#03dac6', '#ff4081', '#bb86fc'][i%3], 
                values: []
            }));
            
            const tcIn = getEl('tkTimeCount');
            const count = tcIn ? parseInt(tcIn.value) : 7;
            const dataRows = lines.slice(1).slice(0, count);
            
            dataRows.forEach(line => {
                const cols = line.split(/[\,\t]+/).map(s => s.trim());
                seriesData.forEach((s, idx) => {
                    s.values.push(parseFloat(cols[idx+1]) || 0);
                });
            });
            
            this.renderTimeTable(seriesData);
            App.alert("Data imported into table.");
            return;
        }

        // Original logic for Bar
        const csvInBar = getEl('csvInputBar');
        const raw = csvInBar ? csvInBar.value : '';
        if (!raw.trim()) return App.alert("Please paste CSV data.");
        
        const lines = raw.trim().split(/\r?\n/).filter(l => l.trim());
        if (lines.length < 2) return App.alert("CSV must have at least 2 lines (Header + Data).");

        const headers = lines[0].split(/[\,\t]+/).map(s => s.trim());
        const seriesNames = headers.slice(1); 
        
        if (seriesNames.length === 0) return App.alert("No series columns found.");
        
        const lblContainerId = 'barLabelsContainer';
        const seriesContainerId = 'barSeriesContainer';

        const blc = getEl(lblContainerId);
        const bsc = getEl(seriesContainerId);
        if (blc) blc.innerHTML = '';
        if (bsc) bsc.innerHTML = '';
        
        if (blc) {
            for(let k=0; k<24; k++) {
                blc.innerHTML += `<input type="text" id="bLbl${k}" placeholder="L${k+1}" style="text-align:center;">`;
            }
        }

        const labels = [];
        const seriesData = seriesNames.map(() => []);
        
        const dataRows = lines.slice(1).slice(0, 24);
        
        dataRows.forEach((line) => {
            const cols = line.split(/[\,\t]+/).map(s => s.trim());
            labels.push(cols[0] || ""); 
            
            seriesNames.forEach((_, sIdx) => {
                const val = parseFloat(cols[sIdx + 1]) || 0;
                seriesData[sIdx].push(val);
            });
        });

        // Fill X-Axis Labels
        labels.forEach((l, k) => { 
            const lbl = getEl(`bLbl${k}`);
            if (lbl) lbl.value = l; 
        });

        // Create Series
        const colors = ['#03dac6', '#ff4081', '#bb86fc', '#cf6679', '#00e676', '#ffb300', '#018786', '#3700b3'];
        
        seriesNames.forEach((name, sIdx) => {
            if (sIdx < 10) {
                this.addBarSeries(name, colors[sIdx] || '#ffffff', seriesData[sIdx]);
            }
        });
        
        App.alert(`Parsed ${labels.length} rows and ${seriesNames.length} series.`);
    },

    submitTracker() {
        const index = State.editingTrackerIndex;
        const descIn = getEl('tkDesc');
        const desc = descIn ? descIn.value : '';
        const sizeRadio = document.querySelector('input[name="tkSize"]:checked');
        const size = sizeRadio ? sizeRadio.value : 'M';
        if (!desc) return App.alert("Title required");

        const type = State.currentTrackerType;
        let newTracker = { desc, type, size };

        if (type === 'gauge') {
            const mIn = getEl('tkMetric');
            const cIn = getEl('tkComp');
            const tIn = getEl('tkTotal');
            const m = mIn ? mIn.value : '';
            const c = cIn ? parseFloat(cIn.value) || 0 : 0;
            const t = tIn ? parseFloat(tIn.value) || 0 : 0;
            if(t<=0) return App.alert("Total > 0 required");
            if(c>t) return App.alert("Completed value cannot exceed Total value.");
            newTracker.metric = m;
            newTracker.completed = c;
            newTracker.total = t;
            const pcIn = getEl('tkPieColor');
            newTracker.colorVal = pcIn ? pcIn.value : '#00e676'; 
            const pc2In = getEl('tkPieColor2');
            newTracker.color2 = pc2In ? pc2In.value : '#ff1744';
        } else if (type === 'bar') {
            const byIn = getEl('tkBarYLabel');
            const y = byIn ? byIn.value : '';
            const labels = [];
            for(let k=0; k<24; k++) {
                const lIn = getEl(`bLbl${k}`);
                const l = lIn ? lIn.value : '';
                if(l) labels.push(l);
            }
            const series = [];
            const bsc = getEl('barSeriesContainer');
            if (bsc) {
                const sDivs = bsc.children;
                for(let s of sDivs) {
                    const snIn = s.querySelector('.s-name');
                    const name = snIn ? snIn.value : 'Series';
                    const scIn = s.querySelector('.s-color');
                    const color = scIn ? scIn.value : '#03dac6';
                    const vals = [];
                    s.querySelectorAll('.sv-input').forEach((inp, k) => {
                        if(k < labels.length) vals.push(parseFloat(inp.value)||0);
                    });
                    series.push({name, color, values: vals});
                }
            }
            if(series.length === 0) return App.alert("Add at least one series");
            newTracker.yLabel = y;
            newTracker.labels = labels;
            newTracker.series = series;
        } else if (type === 'line') {
            const lyIn = getEl('tkLineYLabel');
            const y = lyIn ? lyIn.value : '';
            // Get data from Table
            const series = this.scrapeTimeSeries();
            const container = getEl('lineTableContainer');
            const labels = container ? JSON.parse(container.dataset.labels || '[]') : [];
            
            if(series.length === 0) return App.alert("Add at least one series");
            
            // Save config too
            const urIn = document.querySelector('input[name="tkTimeUnit"]:checked');
            newTracker.timeUnit = urIn ? urIn.value : 'day';
            const sdIn = getEl('tkStartDate');
            newTracker.startDate = sdIn ? sdIn.value : '';
            const tcIn = getEl('tkTimeCount');
            newTracker.timeCount = tcIn ? parseInt(tcIn.value) : 7;
            
            newTracker.labels = labels;
            newTracker.series = series;
            newTracker.yLabel = y;
        } else if (type === 'counter') {
            const cvIn = getEl('tkCounterVal');
            newTracker.value = cvIn ? parseFloat(cvIn.value) || 0 : 0;
            const csIn = getEl('tkCounterSub');
            newTracker.subtitle = csIn ? csIn.value : '';
            const ccIn = getEl('tkCounterColor');
            newTracker.color1 = ccIn ? ccIn.value : '#bb86fc';
        } else if (type === 'rag') {
            newTracker.type = 'rag'; 
            const rsIn = getEl('tkRagStatus');
            newTracker.status = rsIn ? rsIn.value : 'grey';
            const rmIn = getEl('tkRagMsg');
            newTracker.message = rmIn ? rmIn.value : '';
            newTracker.color1 = (newTracker.status === 'green' ? '#00e676' : (newTracker.status === 'amber' ? '#ffb300' : (newTracker.status === 'red' ? '#ff1744' : '#666666')));
        } else if (type === 'waffle') {
            const wtIn = getEl('tkWaffleTotal');
            newTracker.total = wtIn ? (parseInt(wtIn.value) || 100) : 100;
            const waIn = getEl('tkWaffleActive');
            newTracker.active = waIn ? (parseInt(waIn.value) || 0) : 0;
            const wcIn = getEl('tkWaffleColorVal');
            newTracker.colorVal = wcIn ? wcIn.value : '#03dac6';
            const wbIn = getEl('tkWaffleColorBg');
            newTracker.colorBg = wbIn ? wbIn.value : '#333333';
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
    editingUserIndex: -1,
    
    openUserModal: (index = -1) => {
        UserManager.editingUserIndex = index;
        const isEdit = index > -1;
        const mt = getEl('modalTitle');
        if (mt) mt.innerText = isEdit ? 'Edit Team Member' : 'Add Team Member';
        const db = getEl('deleteBtn');
        if (db) db.style.display = isEdit ? 'block' : 'none';
        
        const m = isEdit ? State.members[index] : null;
        const mn = getEl('mName');
        if (mn) mn.value = m ? m.name : '';
        
        // Last Week
        const ls = getEl('lwStatus');
        if (ls) ls.value = (m && m.lastWeek) ? m.lastWeek.status : 'busy';
        UserManager.setStatus((m && m.lastWeek) ? m.lastWeek.status : 'busy');
        
        const lwTasks = (m && m.lastWeek && m.lastWeek.tasks) ? m.lastWeek.tasks : [];
        [1,2,3].forEach((n, i) => {
            const taskIn = getEl(`lwTask${n}`);
            if (taskIn) taskIn.value = lwTasks[i] ? lwTasks[i].text : '';
        });
        
        // This Week
        const nwTasks = (m && m.thisWeek && m.thisWeek.tasks) ? m.thisWeek.tasks : [];
        [1,2,3].forEach((n, i) => {
            const taskIn = getEl(`nwTask${n}`);
            if (taskIn) taskIn.value = nwTasks[i] ? nwTasks[i].text : '';
        });
        
        const nwLoad = (m && m.thisWeek && m.thisWeek.load) ? m.thisWeek.load : ['N','N','N','N','N'];
        nwLoad.forEach((v, i) => UserManager.setLoad(i, v));

        // Next Week
        const fwTasks = (m && m.nextWeek && m.nextWeek.tasks) ? m.nextWeek.tasks : [];
        [1,2,3].forEach((n, i) => {
            const taskIn = getEl(`fwTask${n}`);
            if (taskIn) taskIn.value = fwTasks[i] ? fwTasks[i].text : '';
        });

        const fwLoad = (m && m.nextWeek && m.nextWeek.load) ? m.nextWeek.load : ['N','N','N','N','N'];
        fwLoad.forEach((v, i) => UserManager.setFutureLoad(i, v));

        ModalManager.openModal('userModal');
    },

    submitUser: () => {
        const mn = getEl('mName');
        const name = mn ? mn.value : '';
        if(!name) return App.alert("Name required");
        
        const getTasks = (prefix) => {
            return [1,2,3].map(n => {
                const taskIn = getEl(`${prefix}Task${n}`);
                return { 
                    text: taskIn ? taskIn.value : '', 
                    isTeamSuccess: false, 
                    isTeamActivity: false
                };
            });
        };

        // Preserve existing checkboxes state if editing
        const idx = UserManager.editingUserIndex;
        const oldM = idx > -1 ? State.members[idx] : null;
        
        const lwTasks = getTasks('lw');
        if(oldM && oldM.lastWeek) {
            lwTasks.forEach((t, i) => { if(oldM.lastWeek.tasks[i]) t.isTeamSuccess = oldM.lastWeek.tasks[i].isTeamSuccess; });
        }
        
        const nwTasks = getTasks('nw'); // This week
        if(oldM && oldM.thisWeek) {
            nwTasks.forEach((t, i) => { if(oldM.thisWeek.tasks[i]) t.isTeamSuccess = oldM.thisWeek.tasks[i].isTeamSuccess; });
        }

        const fwTasks = getTasks('fw'); // Next week
        if(oldM && oldM.nextWeek) {
            fwTasks.forEach((t, i) => { if(oldM.nextWeek.tasks[i]) t.isTeamActivity = oldM.nextWeek.tasks[i].isTeamActivity; });
        }

        const newUser = {
            name,
            lastWeek: {
                status: getEl('lwStatus') ? getEl('lwStatus').value : 'busy',
                tasks: lwTasks
            },
            thisWeek: {
                load: [0,1,2,3,4].map(i => getEl(`nw${i}`) ? getEl(`nw${i}`).value : 'N'),
                tasks: nwTasks
            },
            nextWeek: {
                load: [0,1,2,3,4].map(i => getEl(`fw${i}`) ? getEl(`fw${i}`).value : 'N'),
                tasks: fwTasks
            }
        };

        if(idx === -1) State.members.push(newUser);
        else State.members[idx] = newUser;

        ModalManager.closeModal('userModal');
        renderBoard();
    },

    deleteUser: () => {
        if(UserManager.editingUserIndex === -1) return;
        App.confirm("Delete this user?", () => {
            State.members.splice(UserManager.editingUserIndex, 1);
            ModalManager.closeModal('userModal');
            renderBoard();
        });
    },
    
    setStatus: (val) => {
        const ls = getEl('lwStatus');
        if (ls) ls.value = val;
        document.querySelectorAll('.status-option').forEach(el => el.classList.remove('selected'));
        const sel = document.querySelector(`.so-${val}`);
        if(sel) sel.classList.add('selected');
    },

    setLoad: (idx, val) => {
        const loadIn = getEl(`nw${idx}`);
        if (!loadIn) return;
        loadIn.value = val;
        const box = loadIn.parentNode;
        box.querySelectorAll('.w-pill').forEach(el => el.classList.remove('selected'));
        const map = { 'L': 'wp-l', 'N': 'wp-n', 'R': 'wp-r', 'X': 'wp-x' };
        const sel = box.querySelector(`.${map[val]}`);
        if(sel) sel.classList.add('selected');
    },

    setFutureLoad: (idx, val) => {
        const loadIn = getEl(`fw${idx}`);
        if (!loadIn) return;
        loadIn.value = val;
        const box = loadIn.parentNode;
        box.querySelectorAll('.w-pill').forEach(el => el.classList.remove('selected'));
        const map = { 'L': 'wp-l', 'N': 'wp-n', 'R': 'wp-r', 'X': 'wp-x' };
        const sel = box.querySelector(`.${map[val]}`);
        if(sel) sel.classList.add('selected');
    },

    toggleSuccess: (mIdx, tIdx) => {
        const m = State.members[mIdx];
        if (m && m.lastWeek && m.lastWeek.tasks[tIdx]) {
            const t = m.lastWeek.tasks[tIdx];
            t.isTeamSuccess = !t.isTeamSuccess;
            renderBoard();
        }
    },

    toggleActivity: (mIdx, tIdx) => {
        const m = State.members[mIdx];
        if (m && m.thisWeek && m.thisWeek.tasks[tIdx]) {
            const t = m.thisWeek.tasks[tIdx];
            t.isTeamSuccess = !t.isTeamSuccess; 
            renderBoard();
        }
    },

    toggleFuture: (mIdx, tIdx) => {
        const m = State.members[mIdx];
        if (m && m.nextWeek && m.nextWeek.tasks[tIdx]) {
            const t = m.nextWeek.tasks[tIdx];
            t.isTeamActivity = !t.isTeamActivity;
            renderBoard();
        }
    },
    
    saveAdditionalInfo: () => {
        const aii = getEl('additionalInfoInput');
        if (aii) State.additionalInfo = aii.value;
        ModalManager.closeModal('infoModal');
        renderBoard();
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
    }
};

// --- MODULE: OVERVIEW MANAGER ---
export const OverviewManager = {
    handleOverviewClick: (type) => {
       // Just visual feedback or hint? 
    },
    handleInfoClick: () => {
        if(document.body.classList.contains('publishing')) return;
        const aii = getEl('additionalInfoInput');
        if (aii) aii.value = State.additionalInfo;
        ModalManager.openModal('infoModal');
    }
};

// --- MODULE: DATA HANDLING ---
export const DataSaver = {
    saveData: () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(State));
        const dlAnchorElem = document.createElement('a');
        dlAnchorElem.setAttribute("href", dataStr);
        dlAnchorElem.setAttribute("download", "tracker_data.json");
        dlAnchorElem.click();
    }
};

export const DataLoader = {
    loadFromFile: (input) => {
        const file = input.files[0];
        if(!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const json = JSON.parse(e.target.result);
                if(json.title) State = json; // Basic validation
                else App.alert("Invalid JSON format");
                renderBoard();
                App.alert("Data loaded successfully");
            } catch(ex) {
                App.alert("Error parsing JSON");
            }
        };
        reader.readAsText(file);
        input.value = ''; // Reset
    }
};

export const DataExporter = {
    exportCSV: () => {
        let csv = "Member,Type,Text\n";
        State.members.forEach(m => {
            if(m.lastWeek) m.lastWeek.tasks.forEach(t => csv += `"${m.name}","Last Week","${t.text}"\n`);
            if(m.thisWeek) m.thisWeek.tasks.forEach(t => csv += `"${m.name}","This Week","${t.text}"\n`);
            if(m.nextWeek) m.nextWeek.tasks.forEach(t => csv += `"${m.name}","Next Week","${t.text}"\n`);
        });
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", "team_report.csv");
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }
};
