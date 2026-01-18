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
            const r = getRanges();
            const svg = Visuals.createGanttChartSVG(State.members, r.current, r.next);
            getEl('ganttContainer').innerHTML = svg;
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

export const renderBoard = () => {
    console.log("Rendering Board...");

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
                     // Zoom requested for: Time Series (line/bar), Note Tracker (note), Date Tracker (rag/ryg), Schedule Tracker (waffle)
                     const canZoom = ['line', 'bar', 'note', 'rag', 'ryg', 'waffle', 'donut'].includes(t.type);
                     if (canZoom) ZoomManager.openChartModal(i);
                 } else {
                     TrackerManager.openModal(i);
                 }
            };

            // Zoom Icon
            if (document.body.classList.contains('publishing') && ['line', 'bar', 'note', 'rag', 'ryg', 'waffle', 'donut'].includes(t.type)) {
                card.innerHTML += `<div class="zoom-icon" style="position:absolute; top:5px; right:5px; color:#666; font-size:14px; pointer-events:none;">&#128269;</div>`;
            }

            const noteText = (t.notes || t.content || '').replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/"/g, "&quot;").replace(/\n/g, "<br>");
            if (noteText && t.type !== 'note') {
                card.onmousemove = (e) => {
                    if (!document.body.classList.contains('publishing')) return;
                    // Prevent overwriting specific tooltips on chart points/bars/segments
                    if (e.target.closest('circle, rect, path')) return;
                    Visuals.showTooltip(e, noteText);
                };
                card.onmouseout = () => Visuals.hideTooltip();
            }

            let visualHTML = '';
            let statsHTML = '';
            
            let renderType = t.type;
            if (renderType === 'line' || renderType === 'bar' || renderType === 'line1' || renderType === 'line2') {
                // Unified Chart Logic
                let labels = t.labels || [];
                let series = t.series || [];
                
                // Legacy Data Migration (Bar or Line)
                if ((!t.labels || t.labels.length === 0) && t.data) {
                    labels = t.data.map(d => d.label);
                    series = [{ name: 'Series 1', color: t.color1 || '#03dac6', values: t.data.map(d => d.val) }];
                }

                // Render based on displayStyle
                const style = (t.displayStyle === 'bar' || t.type === 'bar') ? 'bar' : 'line';
                
                if (style === 'bar') {
                    visualHTML = `<div style="width:100%; height:120px; margin-bottom:10px;">${Visuals.createMultiBarChartSVG(labels, series, t.size)}</div>`;
                } else {
                    visualHTML = `<div style="width:100%; height:120px; margin-bottom:10px;">${Visuals.createLineChartSVG(labels, series, t.yLabel, t.size)}</div>`;
                }
            } else if (renderType === 'gauge') {
                const pct = t.total>0 ? Math.round((t.completed/t.total)*100) : 0;
                const c1 = t.colorVal || t.color1 || '#00e676'; 
                const c2 = t.color2 || '#ff1744';
                // c2 is Progress Colour, c1 is Target Colour
                const grad = `conic-gradient(${c2} 0% ${pct}%, ${c1} ${pct}% 100%)`;
                
                visualHTML = `<div class="pie-chart" style="background:${grad}"><div class="pie-overlay"><div class="pie-pct">${pct}%</div></div></div>`;
                statsHTML = `<div class="tracker-stats">${t.completed} / ${t.total} ${t.metric}</div>`;
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
                const html = Visuals.createDonutChartSVG(labels, values, displaySize);
                visualHTML = `<div class="donut-chart">${html}</div>`;
                statsHTML = '';
            }

            card.innerHTML = `<button class="btn-del-tracker" onclick="event.stopPropagation(); TrackerManager.deleteTracker(${i})">&times;</button>`;
            card.innerHTML += `<div class="tracker-desc">${t.desc}</div>`;
            card.innerHTML += `<div class="tracker-viz-container">${visualHTML}</div>`;
            card.innerHTML += `<div class="tracker-stats">${statsHTML}</div>`;
            
            tGrid.appendChild(card);
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
            
            const statusMap = { 'under': 'Low', 'busy': 'Medium', 'over': 'High', 'absent': 'Absent' };
            const statusVal = (m.lastWeek && m.lastWeek.status) ? m.lastWeek.status : 'busy';
            const statusText = statusMap[statusVal] || 'Medium';
            const statusCls = statusVal === 'absent' ? 'status-absent' : `status-${statusVal}`;
            const pillHTML = `<div class="status-pill ${statusCls}" style="font-size:0.75rem; padding:2px 8px; width:auto; display:inline-block;">${statusText}</div>`;

            const thisLoad = (m.thisWeek && m.thisWeek.load) ? m.thisWeek.load : ['N','N','N','N','N'];
            const mgThis = thisLoad.map((v,k) => `<div class="dm-box"><span class="dm-day">${['M','T','W','T','F'][k]}</span><span class="dm-val val-${v}">${v}</span></div>`).join('');

            const nextLoad = (m.nextWeek && m.nextWeek.load) ? m.nextWeek.load : ['N','N','N','N','N'];
            const mgNext = nextLoad.map((v,k) => `<div class="dm-box"><span class="dm-day">${['M','T','W','T','F'][k]}</span><span class="dm-val val-${v}">${v}</span></div>`).join('');

            c.innerHTML = `<div class="member-header">${m.name}</div>`;
            
            let content = `<div class="member-card-content">`;
            content += `<div class="card-col"><div class="col-header">Last Week <span style="font-weight:normal; font-size:0.65rem;">(${getRanges().last.split(' - ')[0]})</span></div>`;
            content += `<div style="text-align:center; margin-bottom:5px;">${pillHTML}</div>`;
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

        const titleEl = getEl('zoomTitle');
        if (titleEl) titleEl.innerText = t.desc;
        let content = '';
        
        let renderType = t.type;
        if (renderType === 'line' || renderType === 'bar') {
            let labels = t.labels || [];
            let series = t.series || [];
            if ((!labels.length) && t.data) {
                labels = t.data.map(d => d.label);
                series = [{ name: 'Series 1', color: t.color1 || '#03dac6', values: t.data.map(d => d.val) }];
            }
            
            const style = (t.displayStyle === 'bar' || t.type === 'bar') ? 'bar' : 'line';
            if (style === 'bar') content = Visuals.createMultiBarChartSVG(labels, series, 'XL');
            else content = Visuals.createLineChartSVG(labels, series, t.yLabel, 'XL');
        } else if (renderType === 'counter') {
            content = `<div style="font-size: 6rem; font-weight:300; color:${t.color1}; text-shadow:0 0 20px ${t.color1}">${t.value}</div><div style="font-size:1.5rem; color:#aaa; margin-top:1rem;">${t.subtitle}</div>`;
        } else if (renderType === 'rag' || renderType === 'ryg') {
            const status = t.status || 'grey';
            const icon = status === 'red' ? 'CRITICAL' : (status === 'amber' ? 'WARNING' : (status === 'green' ? 'GOOD' : 'UNKNOWN'));
            content = `<div class="ryg-indicator ryg-${status}" style="background:${t.color1}; width:200px; height:200px; font-size:2rem;">${icon}</div><div style="margin-top:2rem; font-size:1.5rem;">${t.message || ''}</div>`;
        } else if (renderType === 'waffle') {
            content = createWaffleHTML(t.total || 100, t.active || 0, t.colorVal || '#228B22', t.colorBg || '#696969');
        } else if (renderType === 'note') {
            content = `<div class="note-render-container zoomed-note" style="text-align:${t.align || 'left'}">${parseMarkdown(t.content || '')}</div>`;
        } else if (renderType === 'gauge') {
            const pct = t.total>0 ? Math.round((t.completed/t.total)*100) : 0;
            const c1 = t.colorVal || t.color1 || '#00e676'; 
            const c2 = t.color2 || '#ff1744';
            // c2 is Progress Colour, c1 is Target Colour
            const grad = `conic-gradient(${c2} 0% ${pct}%, ${c1} ${pct}% 100%)`;
            content = `<div class="pie-chart" style="width:300px; height:300px; background:${grad}"><div class="pie-overlay" style="width:260px; height:260px;"><div class="pie-pct" style="font-size:3rem;">${pct}%</div><div style="margin-top:10px; color:#aaa;">${t.completed} / ${t.total}</div></div></div>`;
        } else if (renderType === 'donut') {
            const labels = (t.dataPoints || []).map(dp => dp.label);
            const values = (t.dataPoints || []).map(dp => dp.value);
            content = Visuals.createDonutChartWithCalloutsSVG(labels, values);
        }

        const bodyEl = getEl('zoomBody');
        if (bodyEl) {
            bodyEl.className = 'zoom-body-chart';
            let html = '';
            
            if (renderType === 'donut') {
                 html = `<div style="width:100%; height:100%; display:flex; flex-direction:row; gap:20px;">`;
                 html += `<div style="flex: 2; display:flex; align-items:center; justify-content:center; min-height: 400px;">${content}</div>`;
                 
                 html += `<div class="zoom-notes-section" style="flex: 1; padding:20px; border-left:1px solid #444; background:rgba(0,0,0,0.2); border-radius:8px; overflow-y:auto; display:flex; flex-direction:column; gap:20px;">`;
                 
                 if (t.notes || t.content) {
                     const notesHtml = parseMarkdown(t.notes || t.content || '');
                     html += `<div>
                                 <h4 style="color:var(--accent); margin-bottom:10px; font-size:0.9rem; text-transform:uppercase;">Notes</h4>
                                 <div style="font-size:0.9rem; line-height:1.6; color:#ddd;">${notesHtml}</div>
                              </div>`;
                 }

                 // Data Table
                 const labels = (t.dataPoints || []).map(dp => dp.label);
                 const values = (t.dataPoints || []).map(dp => dp.value);
                 const total = values.reduce((a, b) => a + b, 0);
                 
                 if (labels.length > 0) {
                     let tableHtml = `<h4 style="color:var(--accent); margin-bottom:10px; font-size:0.9rem; text-transform:uppercase;">Data Details</h4>
                                      <table style="width:100%; border-collapse: collapse; font-size:0.9rem; color:#ddd;">
                                        <thead>
                                            <tr style="border-bottom: 1px solid #444;">
                                                <th style="text-align:left; padding:8px;">Label</th>
                                                <th style="text-align:right; padding:8px;">Value</th>
                                                <th style="text-align:right; padding:8px;">%</th>
                                            </tr>
                                        </thead>
                                        <tbody>`;
                     
                     labels.forEach((l, i) => {
                         const v = values[i];
                         const pct = total > 0 ? Math.round((v / total) * 100) : 0;
                         tableHtml += `<tr style="border-bottom: 1px solid #333;">
                                         <td style="padding:8px;">${l}</td>
                                         <td style="text-align:right; padding:8px;">${v}</td>
                                         <td style="text-align:right; padding:8px;">${pct}%</td>
                                       </tr>`;
                     });
                     
                     tableHtml += `<tr style="font-weight:bold; background:rgba(255,255,255,0.05);">
                                     <td style="padding:8px;">Total</td>
                                     <td style="text-align:right; padding:8px;">${total}</td>
                                     <td style="text-align:right; padding:8px;">100%</td>
                                   </tr>`;
                     
                     tableHtml += `</tbody></table>`;
                     html += `<div>${tableHtml}</div>`;
                 }
                 
                 html += `</div></div>`;
            } else {
                html = `<div style="width:100%; height:100%; display:flex; flex-direction:column; padding:20px;">`;
                html += `<div style="flex: 1; min-height: 300px; display:flex; align-items:center; justify-content:center;">${content}</div>`;
                
                if ((t.notes || t.content) && t.type !== 'note') {
                    const notesHtml = parseMarkdown(t.notes || t.content || '');
                    html += `<div class="zoom-notes-section" style="margin-top:20px; padding:20px; border-top:1px solid #444; background:rgba(0,0,0,0.2); border-radius:8px;">
                                <h4 style="color:var(--accent); margin-bottom:10px; font-size:0.9rem; text-transform:uppercase;">Notes</h4>
                                <div style="font-size:0.9rem; line-height:1.6; color:#ddd;">${notesHtml}</div>
                             </div>`;
                }
                html += `</div>`;
            }
            bodyEl.innerHTML = html;
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
    },

    setType(type) {
        State.currentTrackerType = type;
        // Map 'bar' to 'line' for input visibility
        const inputType = (type === 'bar') ? 'line' : type;
        ['Gauge','Bar','Line','Counter','Rag','Waffle','Note','Donut'].forEach(x => {
            const btn = getEl(`type${x}Btn`);
            if (btn) btn.className = (type === x.toLowerCase()) ? 'type-option active' : 'type-option';
            const div = getEl(`${x.toLowerCase()}Inputs`);
            if (div) div.style.display = (inputType === x.toLowerCase()) ? 'block' : 'none';
        });

        const sizeCont = getEl('sizeContainer');
        if(sizeCont) sizeCont.style.display = (type === 'gauge' || type === 'waffle' || type === 'rag' || type === 'counter' || type === 'donut') ? 'none' : 'block';

        if (inputType === 'line') {
             this.renderTimeTable();
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
            // But App.confirm is async-like in UI but sync in code if using standard confirm, 
            // but here App.confirm is custom modal.
            // So we must revert the radio button visually now.
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
                        <input type="color" class="ts-color" value="${s.color}" style="width:20px; height:20px; border:none; padding:0; cursor:pointer;" data-idx="${si}">
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

        if (series.length < 6) {
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
        if (series.length >= 6) return App.alert("Max 6 series allowed.");
        const colors = ['#03dac6', '#ff4081', '#bb86fc', '#cf6679', '#00e676', '#ffb300', '#018786', '#3700b3'];
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
        if (container.children.length >= 10) return App.alert("Max 10 data points allowed.");

        const div = document.createElement('div');
        div.className = 'donut-row';
        div.style.display = 'flex';
        div.style.gap = '10px';
        div.style.marginBottom = '5px';
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
        if (!desc) return App.alert("Title required");

        const type = State.currentTrackerType;
        let newTracker = { desc, type, size };

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
            const cvIn = getEl('tkCounterVal');
            const val = cvIn ? parseFloat(cvIn.value) || 0 : 0;
            if (val < 0 || val > 9999999) return App.alert("Counter value must be between 0 and 9,999,999.");
            newTracker.value = val;
            const csIn = getEl('tkCounterSub');
            newTracker.subtitle = csIn ? csIn.value : '';
            const cnIn = getEl('tkCounterNotes');
            newTracker.notes = cnIn ? cnIn.value : '';
            newTracker.size = 'S'; // Force Small Size
            const ccIn = getEl('tkCounterColor');
            newTracker.color1 = ccIn ? ccIn.value : '#bb86fc';
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
            
            if (total <= 0) return App.alert("Target must be a positive number.");
            if (total > 450) return App.alert("Target cannot exceed 450.");
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

export const UserManager = {
    openUserModal: (index = -1) => {
        const isEdit = index > -1;
        getEl('modalTitle').innerText = isEdit ? 'Edit User' : 'Add User';
        getEl('editIndex').value = index;
        
        const m = isEdit ? State.members[index] : {
            name: '',
            lastWeek: { tasks: [{text:'', isTeamSuccess:false}, {text:'', isTeamSuccess:false}, {text:'', isTeamSuccess:false}], status: 'busy' },
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

        // Status
        UserManager.setStatus(m.lastWeek.status || 'busy');

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
                status: getEl('lwStatus').value,
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
