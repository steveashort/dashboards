/**
 * SERVER PLATFORMS TRACKER v31
 * ES6 MODULE STRUCTURE
 */
export { createGaugeSVG, Visuals, renderChart, calculateTrackerSize, formatCountdown, getCountdownBarData } from './charts.js';
import { createGaugeSVG, Visuals, renderChart, calculateTrackerSize, formatCountdown, getCountdownBarData } from './charts.js';

// --- GLOBAL STATE ---
let State = {
    title: "Server Platforms",
    additionalInfo: "",
    // Multi-tab support
    trackerTabs: [
        { id: 'default', name: 'Tracker 1', trackers: [] }
    ],
    activeTabId: 'default',
    assignments: [],
    members: [],
    planners: [],
    skills: [],
    teams: [],
    counters: { cid: 0, uid: 0, rid: 0, tid: 0, eid: 0, aid: 0, sid: 0, tmid: 0 },
    settings: {
        fyStartMonth: 1, // Default Feb
        roles: [],
        absences: []
    },
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

const getPeriodLabel = (p, y) => {
    // P01 (Feb) ... P12 (Jan)
    const monthNames = ["Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec","Jan"];
    const idx = (p - 1) % 12;
    const name = monthNames[idx];
    const yearSuffix = y ? ` ${y}` : '';
    return `P${p.toString().padStart(2,'0')} (${name})${yearSuffix}`;
};

const getFiscalYear = (date = new Date()) => {
    const m = date.getMonth(); 
    const y = date.getFullYear();
    const start = State.settings ? State.settings.fyStartMonth : 1;
    // If current month is before start month, it's prev FY
    return m < start ? y - 1 : y;
};

const getCurrentPeriod = () => {
    const d = new Date();
    const m = d.getMonth(); 
    const start = State.settings ? State.settings.fyStartMonth : 1;
    // e.g. Start=1 (Feb). m=1 (Feb) -> P01. m=0 (Jan) -> P12.
    // Logic: ((m - start + 12) % 12) + 1
    return ((m - start + 12) % 12) + 1;
};

const setupDateValidation = (startId, endId) => {
    const s = getEl(startId);
    const e = getEl(endId);
    if (!s || !e) return;
    
    s.addEventListener('change', () => {
        e.min = s.value;
        e.value = s.value;
    });
    
    e.addEventListener('change', () => {
        if (s.value && e.value < s.value) {
            e.value = s.value;
        }
    });
};

const generateId = (type) => {
    if (!State.counters) State.counters = { cid: 0, uid: 0, rid: 0, tid: 0, eid: 0, aid: 0, sid: 0, tmid: 0 };
    if (State.counters[type] === undefined) State.counters[type] = 0;
    State.counters[type]++;
    const num = State.counters[type].toString().padStart(3, '0');
    return `${type.toUpperCase()}${num}`;
};

const syncIds = () => {
    if (!State.counters) State.counters = { cid: 0, uid: 0, rid: 0, tid: 0, eid: 0, aid: 0, sid: 0, tmid: 0 };
    if (State.counters.sid === undefined) State.counters.sid = 0;
    if (State.counters.tmid === undefined) State.counters.tmid = 0;

    // Trackers (Cards)
    if (State.trackerTabs) {
        State.trackerTabs.forEach(tab => {
            tab.trackers.forEach(t => {
                if (!t.id) {
                    t.id = generateId('cid');
                } else {
                    const num = parseInt(t.id.substring(3));
                    if (!isNaN(num) && num > State.counters.cid) State.counters.cid = num;
                }
            });
        });
    }

    // Members (Users)
    if (State.members) {
        State.members.forEach(m => {
            if (!m.id) {
                m.id = generateId('uid');
            } else {
                const num = parseInt(m.id.substring(3));
                if (!isNaN(num) && num > State.counters.uid) State.counters.uid = num;
            }
        });
    }

    // Assignments
    if (State.assignments) {
        State.assignments.forEach(a => {
            let type = 'aid';
            if (a.class === 'Role') type = 'rid';
            else if (a.class === 'Task') type = 'tid';
            else if (a.class === 'Event' || a.class === 'Project') type = 'eid';
            
            if (!a.id) {
                a.id = generateId(type);
            } else {
                const num = parseInt(a.id.substring(3));
                if (!isNaN(num) && num > State.counters[type]) State.counters[type] = num;
            }
        });
    }

    // Skills
    if (State.skills) {
        State.skills.forEach(s => {
            if (!s.id) {
                s.id = generateId('sid');
            } else {
                const num = parseInt(s.id.substring(3));
                if (!isNaN(num) && num > State.counters.sid) State.counters.sid = num;
            }
        });
    }

    // Teams
    if (State.teams) {
        State.teams.forEach(t => {
            if (!t.id) {
                t.id = generateId('tmid');
            } else {
                // TID is taken by Task (tid). User example uses TID001 for Team.
                // I used 'tmid' counter. I should parse 'TID' prefix but update 'tmid' counter?
                // Or user 'TMID'? User example says "TID001".
                // My tasks use 'TID'. This is a conflict if I use same prefix.
                // But `generateId` uses `type.toUpperCase()`.
                // `generateId('tid')` -> TID...
                // `generateId('tmid')` -> TMID...
                // If import has TID001 for Team, and I have TID001 for Task.
                // They are in different collections (`teams` vs `assignments`).
                // It is fine as long as I don't mix them up in a global lookup.
                // But `generateId('tid')` will conflict if I use it for both.
                // I will use `TMID` for Teams internally generated, but respect `TID` from import?
                // Or I should assume TID in import means Team ID.
                // If I generate, I'll use `TMID` to distinguish.
                // And for watermark, I'll check if ID starts with `TMID` or `TID`?
                // If I import TID001, and I have task TID001.
                // If I create new Team, `generateId('tmid')` -> TMID001. No conflict.
                // If I create new Task, `generateId('tid')` -> TID002 (if 001 exists).
                // So separate counters are fine.
                // I just need to update `tmid` counter if I encounter `TMID`.
                // If I encounter `TID` in teams, I shouldn't update `tmid` counter probably, or update `tmid` assuming it maps?
                // I'll stick to `TMID` for new teams.
                const num = parseInt(t.id.substring(4)); // TMID...
                if (!isNaN(num) && num > State.counters.tmid) State.counters.tmid = num;
            }
        });
    }
};

// --- CORE FUNCTIONS ---
export const initApp = () => {
    syncIds(); 

    // Init Settings
    if (!State.settings) State.settings = { fyStartMonth: 1, roles: [], absences: [], skills: [] };
    
    if (!State.settings.roles || State.settings.roles.length === 0) {
        State.settings.roles = [
            { id: 'RID001', name: 'Example Role 1' },
            { id: 'RID002', name: 'Example Role 2' },
            { id: 'RID003', name: 'Example Role 3' }
        ];
        if(State.counters.rid < 3) State.counters.rid = 3;
    }

    if (!State.settings.skills || State.settings.skills.length === 0) {
        State.settings.skills = [
            { id: 'SID001', name: 'ITIL' },
            { id: 'SID002', name: 'Microsoft 365' }
        ];
        if(State.counters.sid < 2) State.counters.sid = 2;
    }
    
    if (!State.settings.absences || State.settings.absences.length === 0) {
        State.settings.absences = [
            { id: 'AID001', name: 'Annual Leave' },
            { id: 'AID002', name: 'Sick Leave' },
            { id: 'AID003', name: 'Offsite Visit' }
        ];
        if(State.counters.aid < 3) State.counters.aid = 3;
    }

    // Migration: Move legacy trackers to default tab
    if (State.trackers && State.trackers.length > 0) {
        const defTab = State.trackerTabs.find(t => t.id === 'default');
        if(defTab) defTab.trackers = [...State.trackers];
        State.trackers = [];
    }

    // Assignments defaults
    if (!State.assignments) State.assignments = [];
    
    // Ensure Settings Roles exist in Assignments
    if (State.settings.roles && State.settings.roles.length > 0) {
        State.settings.roles.forEach(r => {
            const exists = State.assignments.some(a => a.id === r.id || a.name === r.name);
            if (!exists) {
                State.assignments.push({
                    id: r.id,
                    name: r.name,
                    description: '',
                    class: 'Role',
                    priority: 'Med',
                    color: '#03dac6',
                    startDate: '',
                    endDate: ''
                });
            }
        });
    }

    // Ensure Settings Skills exist in Skills
    if (!State.skills) State.skills = [];
    if (State.settings.skills && State.settings.skills.length > 0) {
        State.settings.skills.forEach(s => {
            const exists = State.skills.some(sk => sk.id === s.id || sk.name === s.name);
            if (!exists) {
                State.skills.push({
                    id: s.id,
                    name: s.name,
                    description: ''
                });
            }
        });
    }

    // Setup Date Validation
    setupDateValidation('asStart', 'asEnd');
    setupDateValidation('rlStart', 'rlEnd');
    setupDateValidation('evStart', 'evEnd');
    setupDateValidation('tskStart', 'tskEnd');

    App.updateDateUI();
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

export const ColorManager = {
    // 140 Standard CSS Colors
    colors: {
        "AliceBlue": "#F0F8FF", "AntiqueWhite": "#FAEBD7", "Aqua": "#00FFFF", "Aquamarine": "#7FFFD4", "Azure": "#F0FFFF",
        "Beige": "#F5F5DC", "Bisque": "#FFE4C4", "Black": "#000000", "BlanchedAlmond": "#FFEBCD", "Blue": "#0000FF",
        "BlueViolet": "#8A2BE2", "Brown": "#A52A2A", "BurlyWood": "#DEB887", "CadetBlue": "#5F9EA0", "Chartreuse": "#7FFF00",
        "Chocolate": "#D2691E", "Coral": "#FF7F50", "CornflowerBlue": "#6495ED", "Cornsilk": "#FFF8DC", "Crimson": "#DC143C",
        "Cyan": "#00FFFF", "DarkBlue": "#00008B", "DarkCyan": "#008B8B", "DarkGoldenRod": "#B8860B", "DarkGray": "#A9A9A9",
        "DarkGreen": "#006400", "DarkKhaki": "#BDB76B", "DarkMagenta": "#8B008B", "DarkOliveGreen": "#556B2F", "DarkOrange": "#FF8C00",
        "DarkOrchid": "#9932CC", "DarkRed": "#8B0000", "DarkSalmon": "#E9967A", "DarkSeaGreen": "#8FBC8F", "DarkSlateBlue": "#483D8B",
        "DarkSlateGray": "#2F4F4F", "DarkTurquoise": "#00CED1", "DarkViolet": "#9400D3", "DeepPink": "#FF1493", "DeepSkyBlue": "#00BFFF",
        "DimGray": "#696969", "DodgerBlue": "#1E90FF", "FireBrick": "#B22222", "FloralWhite": "#FFFAF0", "ForestGreen": "#228B22",
        "Fuchsia": "#FF00FF", "Gainsboro": "#DCDCDC", "GhostWhite": "#F8F8FF", "Gold": "#FFD700", "GoldenRod": "#DAA520",
        "Gray": "#808080", "Green": "#008000", "GreenYellow": "#ADFF2F", "HoneyDew": "#F0FFF0", "HotPink": "#FF69B4",
        "IndianRed": "#CD5C5C", "Indigo": "#4B0082", "Ivory": "#FFFFF0", "Khaki": "#F0E68C", "Lavender": "#E6E6FA",
        "LavenderBlush": "#FFF0F5", "LawnGreen": "#7CFC00", "LemonChiffon": "#FFFACD", "LightBlue": "#ADD8E6", "LightCoral": "#F08080",
        "LightCyan": "#E0FFFF", "LightGoldenRodYellow": "#FAFAD2", "LightGray": "#D3D3D3", "LightGreen": "#90EE90", "LightPink": "#FFB6C1",
        "LightSalmon": "#FFA07A", "LightSeaGreen": "#20B2AA", "LightSkyBlue": "#87CEFA", "LightSlateGray": "#778899", "LightSteelBlue": "#B0C4DE",
        "LightYellow": "#FFFFE0", "Lime": "#00FF00", "LimeGreen": "#32CD32", "Linen": "#FAF0E6", "Magenta": "#FF00FF",
        "Maroon": "#800000", "MediumAquaMarine": "#66CDAA", "MediumBlue": "#0000CD", "MediumOrchid": "#BA55D3", "MediumPurple": "#9370DB",
        "MediumSeaGreen": "#3CB371", "MediumSlateBlue": "#7B68EE", "MediumSpringGreen": "#00FA9A", "MediumTurquoise": "#48D1CC", "MediumVioletRed": "#C71585",
        "MidnightBlue": "#191970", "MintCream": "#F5FFFA", "MistyRose": "#FFE4E1", "Moccasin": "#FFE4B5", "NavajoWhite": "#FFDEAD",
        "Navy": "#000080", "OldLace": "#FDF5E6", "Olive": "#808000", "OliveDrab": "#6B8E23", "Orange": "#FFA500",
        "OrangeRed": "#FF4500", "Orchid": "#DA70D6", "PaleGoldenRod": "#EEE8AA", "PaleGreen": "#98FB98", "PaleTurquoise": "#AFEEEE",
        "PaleVioletRed": "#DB7093", "PapayaWhip": "#FFEFD5", "PeachPuff": "#FFDAB9", "Peru": "#CD853F", "Pink": "#FFC0CB",
        "Plum": "#DDA0DD", "PowderBlue": "#B0E0E6", "Purple": "#800080", "RebeccaPurple": "#663399", "Red": "#FF0000",
        "RosyBrown": "#BC8F8F", "RoyalBlue": "#4169E1", "SaddleBrown": "#8B4513", "Salmon": "#FA8072", "SandyBrown": "#F4A460",
        "SeaGreen": "#2E8B57", "SeaShell": "#FFF5EE", "Sienna": "#A0522D", "Silver": "#C0C0C0", "SkyBlue": "#87CEEB",
        "SlateBlue": "#6A5ACD", "SlateGray": "#708090", "Snow": "#FFFAFA", "SpringGreen": "#00FF7F", "SteelBlue": "#4682B4",
        "Tan": "#D2B48C", "Teal": "#008080", "Thistle": "#D8BFD8", "Tomato": "#FF6347", "Turquoise": "#40E0D0",
        "Violet": "#EE82EE", "Wheat": "#F5DEB3", "White": "#FFFFFF", "WhiteSmoke": "#F5F5F5", "Yellow": "#FFFF00",
        "YellowGreen": "#9ACD32"
    },
    currentTarget: null,
    
    init: () => {
        // Build the grid once
        const grid = getEl('colorPickerGrid');
        if (!grid) return;
        grid.innerHTML = '';
        
        Object.entries(ColorManager.colors).forEach(([name, hex]) => {
            const d = document.createElement('div');
            d.className = 'color-swatch';
            d.style.backgroundColor = hex;
            d.title = name;
            d.onclick = () => ColorManager.pick(hex);
            grid.appendChild(d);
        });

        // Global delegation for .color-input
        document.body.addEventListener('click', (e) => {
            if (e.target.classList.contains('color-input') || e.target.classList.contains('cr-color') || e.target.classList.contains('cr-bg-color') || e.target.classList.contains('ts-color')) {
                // Ensure it's not a native color input (we replaced them with text or custom handling)
                // But if I replaced them with type="text", fine.
                // If I have type="color" still lingering, we want to intercept? 
                // No, the user asked to replace them. 
                // So I will assume I've replaced them.
                if (e.target.tagName === 'INPUT' && (e.target.type === 'text' || e.target.type === 'button')) {
                    ColorManager.open(e.target);
                }
            }
        });
    },

    open: (target) => {
        if (target.disabled || target.readOnly === false) return; // Only for readonly inputs acting as buttons? 
        // Actually, let's force it for our class
        if (!target.classList.contains('color-input') && !target.classList.contains('cr-color') && !target.classList.contains('cr-bg-color') && !target.classList.contains('ts-color')) return;
        
        ColorManager.currentTarget = target;
        ModalManager.openModal('colorPickerModal');
    },

    pick: (hex) => {
        if (ColorManager.currentTarget) {
            const t = ColorManager.currentTarget;
            t.value = hex;
            t.style.backgroundColor = hex;
            
            // Special handling for transparency/opacity
            if (t.classList.contains('cr-bg-color')) {
                t.style.opacity = '1';
                // Find sibling checkbox
                const p = t.parentElement;
                if(p) {
                    const cb = p.querySelector('.cr-use-bg');
                    if(cb) cb.checked = true;
                }
            }
            
            // Trigger change event manually if needed
            const event = new Event('input', { bubbles: true });
            t.dispatchEvent(event);
        }
        ModalManager.closeModal('colorPickerModal');
    }
};

export const App = {
    init: () => {
        initApp();
        App.initDragAndDrop();
        ColorManager.init();
        App.switchView('trackers'); // Default view
    },
    switchView: (viewName) => {
        // Deprecated: Internal use only for Team Data vs Trackers high level switch logic
        // Handled by switchTrackerTab mostly now.
        if (viewName === 'team') App.switchTrackerTab('team');
    },
    switchTrackerTab: (tabId) => {
        State.activeTabId = tabId;
        renderBoard();
    },
    addTab: () => {
        const newId = 'tab_' + Date.now();
        const nextNum = State.trackerTabs.length + 1;
        State.trackerTabs.push({ id: newId, name: `Tracker ${nextNum}`, trackers: [] });
        App.switchTrackerTab(newId);
    },
    renameTab: (id, newName) => {
        const tab = State.trackerTabs.find(t => t.id === id);
        if (tab) {
            tab.name = newName;
            // No render needed immediately if triggered by blur, but good for sync
            // renderBoard(); // Optional, blur handles UI
        }
    },
    deleteTab: (id) => {
        App.confirm("Are you sure you want to delete this tab and all its cards?", () => {
            const idx = State.trackerTabs.findIndex(t => t.id === id);
            if (idx > -1) {
                State.trackerTabs.splice(idx, 1);
                // Switch to previous or first tab
                const newActive = State.trackerTabs[Math.max(0, idx - 1)];
                App.switchTrackerTab(newActive ? newActive.id : 'team');
            }
        });
    },
    toggleTheme: () => {
        document.body.classList.toggle('theme-day');
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
                
                const currentTab = State.trackerTabs.find(t => t.id === State.activeTabId);
                if (currentTab) {
                    const temp = currentTab.trackers[srcIdx];
                    currentTab.trackers.splice(srcIdx, 1);
                    currentTab.trackers.splice(tgtIdx, 0, temp);
                    renderBoard();
                }
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
        
        const sbBottom = document.querySelector('.sidebar-bottom');
        if(sbBottom) {
            Array.from(sbBottom.children).forEach(child => {
                if (child.id === 'btnPublish') {
                    child.innerText = isPub ? "Edit View" : "Publish View";
                    child.classList.toggle('btn-primary', !isPub);
                } else if (child.innerText.includes('Theme')) {
                    // Keep theme toggle
                } else {
                    child.style.display = isPub ? 'none' : 'block';
                }
            });
        }
        
        // App Title handling
        const appTitle = getEl('appTitleSidebar');
        if(appTitle) appTitle.contentEditable = !isPub;

        // Render board updates interactions
        renderBoard();
    },
    toggleTeamData: () => {
        // Legacy function, now handled by switchView('team') logic mostly.
        // But ganttSection is inside viewTeamData.
        // We can just ensure the view is active.
        App.switchView('team');
    },
    saveTitle: () => {
        const titleEl = getEl('appTitleSidebar');
        if (titleEl) State.title = titleEl.innerText;
        console.log("Title saved");
    },
    updateDateUI: () => {
        const r = getRanges();
        const drd = getEl('dateRangeDisplay');
        if (drd) drd.innerText = `Last: ${r.last} | Current: ${r.current} | Next: ${r.next}`;
        
        // Calculate FY/Q/P for ranges
        const today = new Date();
        const d = today.getDay();
        const diff = d === 0 ? -6 : 1 - d;
        const cm = new Date(today); cm.setDate(today.getDate() + diff);
        const nm = new Date(cm); nm.setDate(cm.getDate() + 7);
        const lm = new Date(cm); lm.setDate(cm.getDate() - 7);
        
        const getFYQP = (date) => {
            const m = date.getMonth();
            const y = date.getFullYear();
            const start = State.settings ? State.settings.fyStartMonth : 1;
            let fy = m < start ? y - 1 : y;
            let p = ((m - start + 12) % 12) + 1;
            let q = Math.ceil(p / 3);
            return `${fy} Q${q} P${p.toString().padStart(2,'0')}`;
        };
        
        const fyp = getEl('fyPeriodDisplay');
        if (fyp) fyp.innerText = `Last: ${getFYQP(lm)} | Current: ${getFYQP(cm)} | Next: ${getFYQP(nm)}`;
        
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

    const titleEl = getEl('appTitleSidebar');
    if (titleEl) titleEl.innerText = State.title || "Server Platforms";
    
    // --- SIDEBAR TABS RENDRING ---
    const navContainer = document.querySelector('.sidebar-nav');
    if (navContainer) {
        navContainer.innerHTML = '';
        const isPub = document.body.classList.contains('publishing');
        const activeTabId = State.activeTabId;

        // Render Tracker Tabs
        State.trackerTabs.forEach(tab => {
            const btn = document.createElement('div');
            btn.className = `nav-item ${activeTabId === tab.id ? 'active' : ''}`;
            btn.style.display = 'flex';
            btn.style.alignItems = 'center';
            btn.style.justifyContent = 'space-between';
            btn.style.padding = '0.5rem 1rem';
            
            const label = document.createElement('span');
            label.innerText = tab.name;
            label.style.cursor = 'pointer';
            label.style.flexGrow = '1';
            label.onclick = () => App.switchTrackerTab(tab.id);
            
            // Editable Name in Edit Mode
            if (!isPub && activeTabId === tab.id) {
                label.contentEditable = true;
                label.spellcheck = false;
                label.style.borderBottom = '1px dashed #666';
                label.onblur = () => App.renameTab(tab.id, label.innerText);
                label.onkeydown = (e) => { if(e.key==='Enter') { e.preventDefault(); label.blur(); }};
            }

            btn.appendChild(label);

            // Delete Button in Edit Mode (if not the only tab)
            if (!isPub && State.trackerTabs.length > 1) {
                const delBtn = document.createElement('span');
                delBtn.innerHTML = '&times;';
                delBtn.style.cursor = 'pointer';
                delBtn.style.color = '#ff1744';
                delBtn.style.marginLeft = '10px';
                delBtn.style.fontWeight = 'bold';
                delBtn.onclick = (e) => { e.stopPropagation(); App.deleteTab(tab.id); };
                btn.appendChild(delBtn);
            }

            navContainer.appendChild(btn);
        });

        // Add Tab Button
        if (!isPub) {
            const addBtn = document.createElement('button');
            addBtn.className = 'nav-item';
            addBtn.style.border = '1px dashed var(--text-muted)';
            addBtn.style.textAlign = 'center';
            addBtn.style.justifyContent = 'center';
            addBtn.innerText = "+ New Tab";
            addBtn.onclick = () => App.addTab();
            navContainer.appendChild(addBtn);
        }

        // Render Team Data Tab
        const teamBtn = document.createElement('button');
        teamBtn.className = `nav-item ${activeTabId === 'team' ? 'active' : ''}`;
        teamBtn.innerText = "Team Data";
        teamBtn.onclick = () => App.switchTrackerTab('team');
        navContainer.appendChild(teamBtn);

        // Render Roles, Events, Tasks, Skills Tabs
        ['Roles', 'Events', 'Tasks', 'Skills'].forEach(tabName => {
            const id = tabName.toLowerCase();
            const btn = document.createElement('button');
            btn.className = `nav-item ${activeTabId === id ? 'active' : ''}`;
            btn.innerText = tabName;
            btn.onclick = () => App.switchTrackerTab(id);
            navContainer.appendChild(btn);
        });
    }

    // --- VIEW SWITCHING LOGIC ---
    const viewTrackers = getEl('viewTrackers');
    const viewTeam = getEl('viewTeamData');
    const viewRoles = getEl('viewRoles');
    const viewEvents = getEl('viewEvents');
    const viewTasks = getEl('viewTasks');
    const viewSkills = getEl('viewSkills');
    
    const pageTitle = getEl('pageTitle');
    const isPub = document.body.classList.contains('publishing');
    
    // Hide all views first
    [viewTrackers, viewTeam, viewRoles, viewEvents, viewTasks, viewSkills].forEach(v => { if(v) v.style.display = 'none'; });

    if (State.activeTabId === 'team') {
        if(viewTeam) viewTeam.style.display = 'block';
        if(pageTitle) pageTitle.innerText = "Team Portfolio & Resource Allocation";
        
        AssignmentManager.renderAssignments();
        
        // Render Resource Planner (Gantt)
        const svg = Visuals.createGanttChartSVG(State.members, State.assignments, State.settings);
        const container = getEl('ganttContainer');
        if(container) container.innerHTML = svg;
        
        PlannerManager.renderPlanners();
    } else if (State.activeTabId === 'roles') {
        if(viewRoles) viewRoles.style.display = 'block';
        if(pageTitle) pageTitle.innerText = "Roles Management";
        RoleManager.render();
    } else if (State.activeTabId === 'events') {
        if(viewEvents) viewEvents.style.display = 'block';
        if(pageTitle) pageTitle.innerText = "Events Management";
        EventManager.render();
    } else if (State.activeTabId === 'tasks') {
        if(viewTasks) viewTasks.style.display = 'block';
        if(pageTitle) pageTitle.innerText = "Tasks Management";
        TaskManager.render();
    } else if (State.activeTabId === 'skills') {
        if(viewSkills) viewSkills.style.display = 'block';
        if(pageTitle) pageTitle.innerText = "Skills Management";
        SkillManager.render();
    } else {
        if(viewTrackers) viewTrackers.style.display = 'block';
        const currentTab = State.trackerTabs.find(t => t.id === State.activeTabId);
        if(pageTitle) {
            pageTitle.innerText = currentTab ? currentTab.name : "Cards";
            if (!isPub && currentTab) {
                pageTitle.contentEditable = "true";
                pageTitle.spellcheck = false;
                pageTitle.style.borderBottom = "1px dashed #666";
                pageTitle.style.cursor = "text";
                pageTitle.onblur = () => {
                    App.renameTab(currentTab.id, pageTitle.innerText);
                    renderBoard(); // Re-render sidebar to show new name
                };
                pageTitle.onkeydown = (e) => { 
                    if(e.key === 'Enter') { 
                        e.preventDefault(); 
                        pageTitle.blur(); 
                    } 
                };
            } else {
                pageTitle.contentEditable = "false";
                pageTitle.style.borderBottom = "none";
                pageTitle.style.cursor = "default";
            }
        }
    }

    // --- TRACKER GRID RENDERING ---
    const tGrid = getEl('trackerGrid');
    if (tGrid && !['team', 'roles', 'events', 'tasks'].includes(State.activeTabId)) {
        tGrid.innerHTML = '';
        const currentTab = State.trackerTabs.find(t => t.id === State.activeTabId);
        const trackers = currentTab ? currentTab.trackers : [];
        
        trackers.forEach((t, i) => {
            const card = document.createElement('div');
            const displaySize = calculateTrackerSize(t);
            card.className = `tracker-card size-${displaySize} type-${t.type}`;
            card.dataset.index = i;
            
            if (!document.body.classList.contains('publishing')) {
                card.draggable = true;
            }

            card.onclick = () => {
                 if (document.body.classList.contains('publishing')) {
                     const canZoom = ['line', 'bar', 'note', 'countdown', 'donut', 'planner'].includes(t.type);
                     if (canZoom) ZoomManager.openChartModal(i);
                 } else {
                     TrackerManager.openModal(i);
                 }
            };

            if (document.body.classList.contains('publishing') && ['line', 'bar', 'note', 'countdown', 'donut', 'planner'].includes(t.type)) {
                card.innerHTML += `<div class="zoom-icon" style="position:absolute; top:5px; right:5px; color:#666; font-size:14px; pointer-events:none;">&#128269;</div>`;
            }

            let timestampHTML = '';
            if (t.lastUpdated) {
                const date = new Date(t.lastUpdated);
                const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const dateStr = date.toLocaleDateString([], { day: 'numeric', month: 'short' });
                timestampHTML = `<div class="last-updated" style="position:absolute; top:10px; left:12px; color:#aaa; font-size:0.65rem; pointer-events:none; z-index:5;">${dateStr} ${timeStr}</div>`;
            }

            const noteText = (t.notes || t.content || '').replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/"/g, "&quot;").replace(/\n/g, "<br>");
            if (noteText && t.type !== 'note') {
                card.onmousemove = (e) => {
                    if (!document.body.classList.contains('publishing')) return;
                    if (e.target.closest('circle, rect, path')) return;
                    Visuals.showTooltip(e, noteText);
                };
                card.onmouseout = () => Visuals.hideTooltip();
            }

            let visualHTML = '';
            let statsHTML = '';
            
            let renderType = t.type;
            if (renderType === 'line' || renderType === 'bar' || renderType === 'line1' || renderType === 'line2') {
                let labels = t.labels || [];
                let series = t.series || [];
                if ((!t.labels || t.labels.length === 0) && t.data) {
                    labels = t.data.map(d => d.label);
                    series = [{ name: 'Series 1', color: t.color1 || '#03dac6', values: t.data.map(d => d.val) }];
                }
                const style = (t.displayStyle === 'bar' || t.type === 'bar') ? 'bar' : 'line';
                const chartId = `chart-viz-${i}`;
                visualHTML = `<div id="${chartId}" style="width:100%; height:100%; min-height:150px; margin-bottom:10px;"></div>`;
                setTimeout(() => {
                    const el = document.getElementById(chartId);
                    if(el) {
                        const apexSeries = series.map(s => ({ name: s.name, data: s.values }));
                        const colors = series.map(s => s.color);
                        renderChart(el, style, { labels, series: apexSeries }, { colors });
                    }
                }, 0);
            } else if (renderType === 'gauge') {
                const pct = t.total>0 ? Math.round((t.completed/t.total)*100) : 0;
                const c1 = t.colorVal || t.color1 || '#00e676'; 
                const c2 = t.color2 || '#ff1744';
                const grad = `conic-gradient(${c2} 0% ${pct}%, ${c1} ${pct}% 100%)`;
                visualHTML = `<div class="pie-chart" style="background:${grad}"><div class="pie-overlay"><div class="pie-pct">${pct}%</div></div></div>`;
                statsHTML = `<div class="tracker-stats">${t.completed} / ${t.total} ${t.metric}</div>`;
            } else if (renderType === 'counter') {
                if (t.counters && t.counters.length > 0) {
                    if (t.counters.length === 1) {
                        const c = t.counters[0];
                        const bgStyle = c.useBg ? `background-color:${c.bgColor}; padding:15px; border-radius:12px; display:inline-block; min-width:80px;` : '';
                        visualHTML = `<div style="${bgStyle}"><div class="counter-display" style="color:${c.color}">${c.value}</div></div>`;
                        statsHTML = `<div class="counter-sub">${c.label}</div>`;
                    } else {
                        visualHTML = '<div style="display:flex; flex-wrap:wrap; justify-content:center; gap:10px; width:100%; height:100%; align-items:center; align-content:center; overflow:hidden;">';
                        const fontSize = t.counters.length > 4 ? '1.5rem' : '2rem';
                        t.counters.forEach(c => {
                            const bgStyle = c.useBg ? `background-color:${c.bgColor}; border-radius:8px; padding:5px 10px; box-shadow:0 2px 5px rgba(0,0,0,0.2);` : '';
                            visualHTML += `<div style="text-align:center; flex: 1 0 30%;">
                                <div style="${bgStyle} display:inline-block; width:100%;">
                                    <div style="font-size:${fontSize}; font-weight:bold; color:${c.color}; line-height:1;">${c.value}</div>
                                    <div style="font-size:0.7rem; color:#aaa; margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${c.label}</div>
                                </div>
                            </div>`;
                        });
                        visualHTML += '</div>';
                        statsHTML = '';
                    }
                } else {
                    visualHTML = `<div class="counter-display" style="color:${t.color1 || '#e0e0e0'}">${t.value !== undefined ? t.value : 0}</div>`;
                    statsHTML = `<div class="counter-sub">${t.subtitle || ''}</div>`;
                }
            } else if (renderType === 'rag' || renderType === 'ryg') {
                const status = t.status || 'grey';
                const iconHTML = Visuals.createRAGIconHTML(status);
                visualHTML = `<div class="ryg-icon-wrapper">${iconHTML}</div>`;
                statsHTML = `<div class="counter-sub" style="margin-top:10px; font-weight:bold;">${t.message || ''}</div>`;
            } else if (renderType === 'note') {
                visualHTML = `<div class="note-render-container" style="text-align:${t.align || 'left'}">${parseMarkdown(t.content || '')}</div>`;
                statsHTML = '';
            } else if (renderType === 'donut') {
                const labels = (t.dataPoints || []).map(dp => dp.label);
                const values = (t.dataPoints || []).map(dp => dp.value);
                const colors = (t.dataPoints || []).map(dp => dp.color);
                const html = Visuals.createDonutChartSVG(labels, values, displaySize, colors);
                visualHTML = `<div class="donut-chart">${html}</div>`;
                statsHTML = '';
            } else if (renderType === 'countdown') {
                const items = t.items || [];
                items.sort((a,b) => new Date(a.date) - new Date(b.date));
                const style = t.displayStyle || 'list';
                if (style === 'bar') {
                    const chartId = `count-viz-${i}`;
                    visualHTML = `<div id="${chartId}" style="width:100%; height:100%; min-height:150px;"></div>`;
                    const itemsToRender = items.slice(0, 6);
                    setTimeout(() => {
                        const el = document.getElementById(chartId);
                        if(el) {
                            const barData = getCountdownBarData(itemsToRender);
                            if (barData.series[0].data.length > 0) {
                                renderChart(el, 'rangeBar', barData, {
                                    stroke: { width: 0 },
                                    plotOptions: { bar: { horizontal: true, distributed: true, barHeight: '50%', dataLabels: { hideOverflowingLabels: false } } },
                                    dataLabels: { enabled: true, formatter: function(val, opts) { const item = opts.w.config.series[opts.seriesIndex].data[opts.dataPointIndex]; return `${item.meta.diffDays} days`; }, style: { colors: ['#f3f4f5', '#fff'] } },
                                    xaxis: { type: 'numeric', min: 0, axisBorder: { show: false }, axisTicks: { show: false }, labels: { show: false } },
                                    annotations: { xaxis: [] },
                                    yaxis: { show: true, categories: barData.series[0].data.map(d => d.x), reversed: true, labels: { style: { colors: '#aaa' } } },
                                    grid: { show: false }, legend: { show: false },
                                    colors: barData.series[0].data.map(d => d.fillColor),
                                    tooltip: { enabled: true, custom: function({series, seriesIndex, dataPointIndex, w}) { const item = w.config.series[seriesIndex].data[dataPointIndex]; const eventLabel = item.x; const days = item.meta.diffDays; const originalDate = item.meta.originalDate; const eventDate = originalDate ? new Date(originalDate).toLocaleDateString('en-GB', {day: 'numeric', month: 'short', year: 'numeric'}) : ''; return `<div class="apexcharts-tooltip-box"><div class="tooltip-title">${eventLabel}</div><div class="tooltip-value">${eventDate}</div><div class="tooltip-value">${days} days from today</div></div>`; } }
                                });
                            } else { el.innerHTML = '<div style="color:var(--text-muted); text-align:center; padding:20px;">No upcoming events.</div>'; }
                        }
                    }, 0);
                    statsHTML = '';
                } else {
                    visualHTML = '<div class="countdown-list" style="width:100%; height:100%; overflow-y:auto; padding:5px;">';
                    items.forEach(item => {
                        const f = formatCountdown(item.date);
                        visualHTML += `<div style="display:flex; justify-content:space-between; margin-bottom:5px; border-bottom:1px solid #333; padding-bottom:2px;"><span style="font-size:0.9rem; color:#e0e0e0;"><span class="${f.flashClass}" style="margin-right:5px;">${f.icon}</span>${item.label}</span><span style="font-size:0.9rem; font-weight:bold; color:${f.color};">${f.text}</span></div>`;
                    });
                    visualHTML += '</div>';
                    statsHTML = '';
                }
            } else if (renderType === 'planner') {
                // Filter assignments based on type AND selected items (if any)
                const pType = t.plannerType || 'Role';
                let filteredAssignments = State.assignments.filter(a => a.class === pType || (pType === 'Event' && a.class === 'Project'));
                
                if (t.plannerItems && t.plannerItems.length > 0) {
                    filteredAssignments = filteredAssignments.filter(a => t.plannerItems.includes(a.name));
                }
                
                // Use new renderer with custom style
                const range = t.range || 3;
                const size = t.size || '2x2';
                const svg = Visuals.createResourcePlannerSVG(filteredAssignments, range, size);
                visualHTML = `<div style="width:100%; height:100%; overflow:hidden;">${svg}</div>`;
                statsHTML = `<div class="tracker-stats">Planner: ${pType} (${range} Months)</div>`;
            } else if (renderType === 'completionBar') {
                const completed = t.active || 0;
                const total = t.total || 100;
                const cVal = t.colorVal || '#228B22';
                const cBg = t.colorBg || '#696969';
                const orient = t.orientation || 'horizontal';
                visualHTML = Visuals.createCompletionBarSVG(completed, total, cVal, cBg, 60, orient);
                statsHTML = `<div class="tracker-stats">${completed} / ${total} ${t.metric || ''}</div>`;
            }

            card.innerHTML = timestampHTML;
            card.innerHTML += `<button class="btn-del-tracker" onclick="event.stopPropagation(); TrackerManager.deleteTracker(${i})">&times;</button>`;
            
            const descEl = document.createElement('div');
            descEl.className = 'tracker-desc';
            descEl.innerText = t.desc;
            if (!document.body.classList.contains('publishing')) {
                descEl.contentEditable = "true";
                descEl.spellcheck = false;
                descEl.style.cursor = "text";
                descEl.style.borderBottom = "1px dashed #444";
                descEl.style.zIndex = "10";
                descEl.style.position = "relative";
                
                descEl.onclick = (e) => e.stopPropagation();
                descEl.onblur = () => { t.desc = descEl.innerText; };
                descEl.onkeydown = (e) => { 
                    if(e.key === 'Enter') { 
                        e.preventDefault(); 
                        descEl.blur(); 
                    } 
                };
            }
            card.appendChild(descEl);

            card.innerHTML += `<div class="tracker-viz-container">${visualHTML}</div>`;
            card.innerHTML += `<div class="tracker-stats">${statsHTML}</div>`;
            tGrid.appendChild(card);
        });
    }

    // --- TEAM DATA RENDERING ---
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

    const teamGrid = getEl('teamGrid');
    if (teamGrid) {
        teamGrid.innerHTML = '';
        State.members.forEach((m, i) => {
            let lw = ''; if(m.lastWeek && m.lastWeek.tasks) { m.lastWeek.tasks.forEach((t,x) => { if(t.text.trim()) lw += `<li class="card-task-li" onclick="event.stopPropagation()"><input type="checkbox" ${t.isTeamSuccess?'checked':''} onchange="UserManager.toggleSuccess(${i},${x})"><span>${t.text}</span></li>`; }); }
            let tw = ''; if(m.thisWeek && m.thisWeek.tasks) { m.thisWeek.tasks.forEach((t,x) => { if(t.text.trim()) tw += `<li class="card-task-li" onclick="event.stopPropagation()"><input type="checkbox" ${t.isTeamSuccess?'checked':''} onchange="UserManager.toggleActivity(${i},${x})"><span>${t.text}</span></li>`; }); }
            let nw = ''; if(m.nextWeek && m.nextWeek.tasks) { m.nextWeek.tasks.forEach((t,x) => { if(t.text.trim()) nw += `<li class="card-task-li" onclick="event.stopPropagation()"><input type="checkbox" ${t.isTeamActivity?'checked':''} onchange="UserManager.toggleFuture(${i},${x})"><span>${t.text}</span></li>`; }); }
            const getAvgPill = (loadArr) => { let score = 0; let count = 0; (loadArr||[]).forEach(v => { if(v === 'L') { score += 1; count++; } else if(v === 'N') { score += 2; count++; } else if(v === 'R') { score += 3; count++; } else { count++; } }); const avg = count === 0 ? 0 : score / count; let text = 'Medium'; let cls = 'status-busy'; if(avg > 2.4) { text = 'High'; cls = 'status-over'; } else if(avg <= 1.4) { text = 'Low'; cls = 'status-under'; } return `<div class="status-pill ${cls}" style="font-size:0.75rem; padding:2px 8px; width:auto; display:inline-block;">${text}</div>`; };
            const c = document.createElement('div'); c.className = 'member-card'; c.onclick = () => UserManager.openUserModal(i);
            const mapDisplay = (v) => { if (v === 'R') return 'H'; if (v === 'N') return 'M'; if (v === 'L') return 'L'; if (v === 'X') return 'A'; return v; };
            const thisLoadRaw = (m.thisWeek && m.thisWeek.load) ? m.thisWeek.load : ['N','N','N','N','N','X','X']; const thisLoad = thisLoadRaw.length === 5 ? [...thisLoadRaw, 'X', 'X'] : thisLoadRaw; const thisOc = (m.thisWeek && m.thisWeek.onCall) ? m.thisWeek.onCall : [false,false,false,false,false,false,false];
            const mgThis = thisLoad.map((v,k) => { const isOc = thisOc[k] ? '<div style="font-size:0.5rem; position:absolute; bottom:1px; right:1px; color:#00FFFF;">☎</div>' : ''; return `<div class="dm-box" style="position:relative;"><span class="dm-day">${['M','T','W','T','F','S','S'][k]}</span><span class="dm-val val-${v}">${mapDisplay(v)}</span>${isOc}</div>`; }).join('');
            const nextLoadRaw = (m.nextWeek && m.nextWeek.load) ? m.nextWeek.load : ['N','N','N','N','N','X','X']; const nextLoad = nextLoadRaw.length === 5 ? [...nextLoadRaw, 'X', 'X'] : nextLoadRaw; const nextOc = (m.nextWeek && m.nextWeek.onCall) ? m.nextWeek.onCall : [false,false,false,false,false,false,false];
            const mgNext = nextLoad.map((v,k) => { const isOc = nextOc[k] ? '<div style="font-size:0.5rem; position:absolute; bottom:1px; right:1px; color:#00FFFF;">☎</div>' : ''; return `<div class="dm-box" style="position:relative;"><span class="dm-day">${['M','T','W','T','F','S','S'][k]}</span><span class="dm-val val-${v}">${mapDisplay(v)}</span>${isOc}</div>`; }).join('');
            c.innerHTML = `<div class="member-header">${m.name}</div>`;
            let content = `<div class="member-card-content">`; content += `<div class="card-col"><div class="col-header">Last Week <span style="font-weight:normal; font-size:0.65rem;">(${getRanges().last.split(' - ')[0]})</span></div><ul class="card-task-list" style="padding-left:10px; font-size:0.8rem;">${lw || '<li style="list-style:none; opacity:0.5;">No items</li>'}</ul></div>`;
            content += `<div class="card-col"><div class="col-header">Current Week <span style="font-weight:normal; font-size:0.65rem;">(${getRanges().current.split(' - ')[0]})</span></div><div style="text-align:center; margin-bottom:5px;">${getAvgPill(m.thisWeek ? m.thisWeek.load : [])}</div><ul class="card-task-list" style="padding-left:10px; font-size:0.8rem;">${tw || '<li style="list-style:none; opacity:0.5;">No items</li>'}</ul><div class="daily-mini-grid" style="margin-top:auto;">${mgThis}</div></div>`;
            content += `<div class="card-col"><div class="col-header">Next Week <span style="font-weight:normal; font-size:0.65rem;">(${getRanges().next.split(' - ')[0]})</span></div><div style="text-align:center; margin-bottom:5px;">${getAvgPill(m.nextWeek ? m.nextWeek.load : [])}</div><ul class="card-task-list" style="padding-left:10px; font-size:0.8rem;">${nw || '<li style="list-style:none; opacity:0.5;">No items</li>'}</ul><div class="daily-mini-grid" style="margin-top:auto;">${mgNext}</div></div>`;
            content += `</div>`;
                        if (m.notes) {
                            content += `<div style="padding: 10px 1.5rem; border-top: 1px solid #333; font-size: 0.85rem; color: #ccc;">${m.notes}</div>`;
                        }
            
                                    if (m.objectives && m.objectives.length > 0) {
                                        // Sort by Start Period (simple numeric sort for now)
                                        const sorted = [...m.objectives].sort((a,b) => a.start - b.start);
                                        content += `<div style="padding: 10px 1.5rem; border-top: 1px solid var(--border); display:flex; flex-direction:column; gap:4px;">`;
                                        content += `<div style="font-size:0.75rem; color:var(--accent); text-transform:uppercase; font-weight:bold; margin-bottom:2px;">Long Term Objectives</div>`;
                                                        sorted.forEach(o => {
                                                            const assign = State.assignments.find(a => a.name === o.assignment);
                                                            const color = assign ? assign.color : '#03dac6'; // Default color
                                                            
                                                            const startYShort = o.startYear ? o.startYear.toString().substring(2) : '';
                                                            const endYShort = o.endYear ? o.endYear.toString().substring(2) : '';
                                                            const pStart = `P${o.start.toString().padStart(2,'0')}${startYShort ? ' \''+startYShort : ''}`;
                                                            const pEnd = `P${o.end.toString().padStart(2,'0')}${endYShort ? ' \''+endYShort : ''}`;
                                        
                                                            content += `<div style="display:flex; align-items:center; gap:8px; font-size:0.8rem;">
                                                                <span style="background:${color}; color:#fff; padding:1px 6px; border-radius:4px; font-size:0.7rem; min-width:75px; text-align:center;">${pStart} - ${pEnd}</span>
                                                                <span style="color:var(--text-main); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; flex-grow:1;">${o.assignment}</span>
                                                                <span style="color:var(--text-muted); font-size:0.75rem; font-weight:bold;">${o.load}%</span>
                                                            </div>`;
                                                        });                                        content += `</div>`;
                                    }                        
                        c.innerHTML += content; teamGrid.appendChild(c);
        });
    }
};
export const ZoomManager = {
    currentTrackerIndex: -1,
    openGanttModal: () => {
        const titleEl = getEl('zoomTitle');
        if (titleEl) {
            titleEl.innerText = "Team Portfolio & Resource Allocation";
            titleEl.contentEditable = "false";
            titleEl.style.borderBottom = "none";
        }
        
        const content = Visuals.createGanttChartSVG(State.members, State.assignments, State.settings);
        
        const bodyEl = getEl('zoomBody');
        if (bodyEl) {
            bodyEl.className = 'zoom-body-chart';
            bodyEl.innerHTML = `<div style="width:100%; height:100%; display:flex; align-items:center; justify-content:center; overflow:auto;">${content}</div>`;
        }
        ModalManager.openModal('zoomModal');
    },

    openChartModal: (index) => {
        console.log("ZoomManager.openChartModal called for index:", index);
        const currentTab = State.trackerTabs.find(t => t.id === State.activeTabId);
        const t = currentTab ? currentTab.trackers[index] : null;
        if(!t) return;

        ZoomManager.currentTrackerIndex = index;
        const titleEl = getEl('zoomTitle');
        if (titleEl) {
            titleEl.innerText = t.desc;
            // Enable editing logic for the zoom modal title
            titleEl.contentEditable = "true";
            titleEl.spellcheck = false;
            titleEl.style.borderBottom = "1px dashed transparent";
            titleEl.style.cursor = "text";
            
            titleEl.onfocus = () => titleEl.style.borderBottom = "1px dashed var(--accent)";
            titleEl.onblur = () => {
                titleEl.style.borderBottom = "1px dashed transparent";
                ZoomManager.saveTitle(titleEl.innerText);
            };
            titleEl.onkeydown = (e) => { 
                if(e.key === 'Enter') { 
                    e.preventDefault(); 
                    titleEl.blur(); 
                } 
            };
        }

        let content = '';
        let renderAction = null;
        
        let renderType = t.type;
        if (renderType === 'line' || renderType === 'bar' || renderType === 'line1' || renderType === 'line2') {
            let labels = t.labels || [];
            let series = t.series || [];
            if ((!labels.length) && t.data) {
                labels = t.data.map(d => d.label);
                series = [{ name: 'Series 1', color: t.color1 || '#03dac6', values: t.data.map(d => d.val) }];
            }
            
            const style = (t.displayStyle === 'bar' || t.type === 'bar') ? 'bar' : 'line';
            content = '<div id="zoomChartContainer" style="width:100%; height:100%;"></div>';
            renderAction = () => {
                const el = document.getElementById('zoomChartContainer');
                if(el) {
                    const apexSeries = series.map(s => ({ name: s.name, data: s.values }));
                    const colors = series.map(s => s.color);
                    renderChart(el, style, { labels, series: apexSeries }, { colors, chart: { toolbar: { show: true }, zoom: { enabled: true } } });
                }
            };
        } else if (renderType === 'counter') {
            if (t.counters && t.counters.length > 0) {
                content = '<div style="display:flex; flex-wrap:wrap; justify-content:center; gap:40px; width:100%; height:100%; align-items:center; align-content:center;">';
                t.counters.forEach(c => {
                    const bgStyle = c.useBg ? `background-color:${c.bgColor}; padding:20px 40px; border-radius:20px; box-shadow:0 4px 10px rgba(0,0,0,0.3);` : '';
                    content += `<div style="text-align:center;">
                        <div style="${bgStyle} display:inline-block;">
                            <div style="font-size:5rem; font-weight:300; color:${c.color}; text-shadow:0 0 20px ${c.color}40;">${c.value}</div>
                        </div>
                        <div style="font-size:1.5rem; color:#aaa; margin-top:10px;">${c.label}</div>
                    </div>`;
                });
                content += '</div>';
            } else {
                content = `<div style="font-size: 6rem; font-weight:300; color:${t.color1 || '#e0e0e0'}; text-shadow:0 0 20px ${t.color1 || '#e0e0e0'}">${t.value !== undefined ? t.value : 0}</div><div style="font-size:1.5rem; color:#aaa; margin-top:1rem;">${t.subtitle || ''}</div>`;
            }
        } else if (renderType === 'rag' || renderType === 'ryg') {
            const status = t.status || 'grey';
            const icon = status === 'red' ? 'CRITICAL' : (status === 'amber' ? 'WARNING' : (status === 'green' ? 'GOOD' : 'UNKNOWN'));
            content = `<div class="ryg-indicator ryg-${status}" style="background:${t.color1}; width:200px; height:200px; font-size:2rem;">${icon}</div><div style="margin-top:2rem; font-size:1.5rem;">${t.message || ''}</div>`;
        } else if (renderType === 'note') {
            content = `<div class="note-render-container zoomed-note" style="text-align:${t.align || 'left'}">${parseMarkdown(t.content || '')}</div>`;
        } else if (renderType === 'countdown') {
            const style = t.displayStyle || 'list';
            const items = t.items || [];
            items.sort((a,b) => new Date(a.date) - new Date(b.date));

            if (style === 'bar') {
                content = '<div id="zoomChartContainer" style="width:100%; height:100%;"></div>';
                renderAction = () => {
                    const el = document.getElementById('zoomChartContainer');
                    if(el) {
                        const barData = getCountdownBarData(items);
                        if (barData.series[0].data.length > 0) {
                            renderChart(el, 'rangeBar', barData, {
                                stroke: { width: 0 },
                                plotOptions: { bar: { horizontal: true, distributed: true, barHeight: '50%', dataLabels: { hideOverflowingLabels: false } } },
                                dataLabels: {
                                    enabled: true,
                                    formatter: function(val, opts) {
                                        const item = opts.w.config.series[opts.seriesIndex].data[opts.dataPointIndex];
                                        return `${item.meta.diffDays} days`;
                                    },
                                    style: { colors: ['#f3f4f5', '#fff'] }
                                },
                                xaxis: {
                                    type: 'numeric',
                                    min: 0,
                                    axisBorder: { show: false },
                                    axisTicks: { show: false },
                                    labels: { show: false }
                                    },
                                    annotations: {
                                        xaxis: []
                                    },
                                    yaxis: {
                                        show: true,
                                        categories: barData.series[0].data.map(d => d.x),
                                        reversed: true,
                                        labels: { style: { colors: '#aaa' } }
                                    },
                                    grid: { show: false },
                                    legend: { show: false },
                                    colors: barData.series[0].data.map(d => d.fillColor),
                                    tooltip: {
                                        enabled: true,
                                        custom: function({series, seriesIndex, dataPointIndex, w}) {
                                            const item = w.config.series[seriesIndex].data[dataPointIndex];
                                            const eventLabel = item.x;
                                            const days = item.meta.diffDays;
                                            const originalDate = item.meta.originalDate;
                                            const eventDate = originalDate ? new Date(originalDate).toLocaleDateString('en-GB', {day: 'numeric', month: 'short', year: 'numeric'}) : '';
                                            return `<div class="apexcharts-tooltip-box">
                                                        <div class="tooltip-title">${eventLabel}</div>
                                                        <div class="tooltip-value">${eventDate}</div>
                                                        <div class="tooltip-value">${days} days from today</div>
                                                    </div>`;
                                        }
                                    }
                                });
                            } else {
                                el.innerHTML = '<div style="color:var(--text-muted); text-align:center; padding:20px;">No upcoming events.</div>';
                            }
                        }
                    };
                } else {
                    content = '<div style="width:100%; height:100%; overflow-y:auto; padding:20px;">';
                    items.forEach(item => {
                        const f = formatCountdown(item.date);
                        content += `<div style="display:flex; justify-content:space-between; margin-bottom:15px; border-bottom:1px solid #444; padding-bottom:10px;"><span style="font-size:1.5rem; color:#e0e0e0;"><span class="${f.flashClass}" style="margin-right:10px;">${f.icon}</span>${item.label}</span><span style="font-size:1.5rem; font-weight:bold; color:${f.color};">${f.text}</span></div>`;
                    });
                    content += '</div>';
                }
            } else if (renderType === 'donut') {
                const labels = (t.dataPoints || []).map(dp => dp.label);
                const values = (t.dataPoints || []).map(dp => dp.value);
                const colors = (t.dataPoints || []).map(dp => dp.color);
                content = Visuals.createDonutChartWithCalloutsSVG(labels, values, colors);
            } else if (renderType === 'completionBar') {
                const completed = t.active || 0;
                const total = t.total || 100;
                const cVal = t.colorVal || '#228B22';
                const cBg = t.colorBg || '#696969';
                const orient = t.orientation || 'horizontal';
                content = `<div style="width:100%; padding:40px;">${Visuals.createCompletionBarSVG(completed, total, cVal, cBg, 300, orient)}</div>`;
            } else if (renderType === 'planner') {
                const pType = t.plannerType || 'Role';
                let filteredAssignments = State.assignments.filter(a => a.class === pType || (pType === 'Event' && a.class === 'Project'));
                if (t.plannerItems && t.plannerItems.length > 0) {
                    filteredAssignments = filteredAssignments.filter(a => t.plannerItems.includes(a.name));
                }
                const range = t.range || 3;
                content = `<div style="width:100%; height:100%; overflow:auto; padding:20px;">${Visuals.createResourcePlannerSVG(filteredAssignments, range, '4x4')}</div>`;
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
            if(renderAction) setTimeout(renderAction, 100);
        },

        saveTitle: (newTitle) => {
            const idx = ZoomManager.currentTrackerIndex;
            if (idx > -1) {
                const currentTab = State.trackerTabs.find(t => t.id === State.activeTabId);
                if (currentTab && currentTab.trackers[idx]) {
                    currentTab.trackers[idx].desc = newTitle;
                    // Note: We don't need to re-render the whole board just for this if we don't want to lose scroll,
                    // but renderBoard() ensures consistency.
                    // To avoid closing modal/glitches, just update state. 
                    // But if we want the background grid to update:
                    const gridCard = document.querySelector(`.tracker-card[data-index="${idx}"] .tracker-desc`);
                    if (gridCard) gridCard.innerText = newTitle;
                }
            }
        }
};

export const TrackerManager = {
    renderPlannerMultiSelect: (selectedItems = []) => {
        const container = getEl('plannerMultiSelectContainer');
        if (!container) return;
        container.innerHTML = '';
        
        const typeRad = document.querySelector('input[name="tkPlannerType"]:checked');
        const type = typeRad ? typeRad.value : 'Role';
        
        // Filter assignments by type
        // Legacy: 'Project' class counts as 'Event'
        const items = State.assignments.filter(a => a.class === type || (type === 'Event' && a.class === 'Project'));
        
        if (items.length === 0) {
            container.innerHTML = `<div style="color:var(--text-muted); font-style:italic;">No ${type}s defined. Go to the ${type}s tab to add some.</div>`;
            return;
        }
        
        items.forEach(item => {
            const div = document.createElement('div');
            div.style.marginBottom = '5px';
            const isChecked = selectedItems.includes(item.name);
            
            div.innerHTML = `
                <label style="display:inline-flex; align-items:center; gap:8px; cursor:pointer;">
                    <input type="checkbox" class="planner-item-select" value="${item.name}" ${isChecked ? 'checked' : ''} style="accent-color:var(--accent);">
                    <span style="color:var(--text-main); font-size:0.9rem;">${item.name}</span>
                </label>
            `;
            container.appendChild(div);
        });
    },

    openModal(index) {
        console.log("Opening Tracker Modal for index:", index);
        if (document.body.classList.contains('publishing')) return;

        State.editingTrackerIndex = index;
        const isEdit = index > -1;
        const titleEl = getEl('trackerModalTitle');
        if (titleEl) titleEl.innerText = isEdit ? 'Edit Card' : 'Add Card';
        
        ['gauge','bar','line','counter','rag','countdown','completionBar','planner'].forEach(type => {
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
        const countdownContainer = getEl('countdownDataContainer');
        if (countdownContainer) countdownContainer.innerHTML = '';

        const currentTab = State.trackerTabs.find(t => t.id === State.activeTabId);
        const tracker = isEdit ? (currentTab ? currentTab.trackers[index] : null) : null;
        
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
        
        // Default Size: completionBar defaults to 1x1, others to 2x1
        let sizeVal = tracker ? (tracker.size || '2x1') : (type === 'completionBar' ? '1x1' : '2x1');
        // Map Legacy Sizes
        if (sizeVal === 'S') sizeVal = '1x1';
        if (sizeVal === 'M') sizeVal = '2x1';
        if (sizeVal === 'L') sizeVal = '3x2'; // Map L to 3x2 as best fit
        if (sizeVal === 'XL') sizeVal = '3x2';

        const sizeRadio = document.querySelector(`input[name="tkSize"][value="${sizeVal}"]`);
        if (sizeRadio) sizeRadio.checked = true;
        else {
            if (!isEdit) {
                setTimeout(() => {
                    const visible = Array.from(document.querySelectorAll('input[name="tkSize"]')).find(r => r.parentElement.style.display !== 'none');
                    if (visible) visible.checked = true;
                }, 0);
            }
        }

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
            } else if (!isEdit && type === 'rag') {
                // Reset RAG defaults for new trackers
                const trmIn = getEl('tkRagMsg'); if(trmIn) trmIn.value = '';
                const trnIn = getEl('tkRagNotes'); if(trnIn) trnIn.value = '';
            } else if (!isEdit && type === 'counter') {
                // Reset Counter defaults for new trackers
                const tcsIn = getEl('tkCounterSub'); if(tcsIn) tcsIn.value = '';
                const tcnIn = getEl('tkCounterNotes'); if(tcnIn) tcnIn.value = '';
                const tcvIn = getEl('tkCounterVal'); if(tcvIn) tcvIn.value = 0;
            } else if (!isEdit && type === 'note') {
                const tcnIn = getEl('tkNoteContent'); if(tcnIn) tcnIn.value = '';
                // Default Align Left
                const alignRad = document.querySelector('input[name="tkNoteAlign"][value="left"]');
                if(alignRad) alignRad.checked = true;
            } else if (!isEdit && type === 'donut') {
                const container = getEl('donutDataContainer');
                if(container) container.innerHTML = '';
                const notesIn = getEl('tkDonutNotes');
                if(notesIn) notesIn.value = '';
            } else if (!isEdit && type === 'completionBar') {
                const tmIn = getEl('tkCompBarMetric'); if(tmIn) tmIn.value = '';
                const ttIn = getEl('tkCompBarTotal'); if(ttIn) ttIn.value = '';
                const taIn = getEl('tkCompBarActive'); if(taIn) taIn.value = '';
                const tnIn = getEl('tkCompBarNotes'); if(tnIn) tnIn.value = '';
            } else if (!isEdit && type === 'planner') {
                const notesIn = getEl('tkPlannerNotes'); if(notesIn) notesIn.value = '';
                // Default Range 3, Type Role
                const rRange = document.querySelector(`input[name="tkPlannerRange"][value="3"]`);
                if(rRange) rRange.checked = true;
                const rType = document.querySelector(`input[name="tkPlannerType"][value="Role"]`);
                if(rType) rType.checked = true;
                this.renderPlannerMultiSelect();
            } else if (!isEdit && type === 'countdown') {
                const notesIn = getEl('tkCountdownNotes');
                if(notesIn) notesIn.value = '';
                const styleRad = document.querySelector('input[name="tkCountdownStyle"][value="list"]');
                if(styleRad) styleRad.checked = true;
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
                            if (pcIn) { pcIn.value = tracker ? (tracker.colorVal || tracker.color1 || '#696969') : '#696969'; pcIn.style.backgroundColor = pcIn.value; }
                            const pc2In = getEl('tkPieColor2');
                            if (pc2In) { pc2In.value = tracker ? (tracker.color2 || '#228B22') : '#228B22'; pc2In.style.backgroundColor = pc2In.value; }
                        } else if (type === 'counter') {                const container = getEl('counterDataContainer');
                if (container) container.innerHTML = '';
                
                if (tracker && tracker.counters) {
                    tracker.counters.forEach(c => this.addCounterRow(c.label, c.value, c.color, c.bgColor, c.useBg));
                } else if (tracker && tracker.value !== undefined) {
                    // Migration for single-value counters
                    this.addCounterRow(tracker.subtitle || 'Value', tracker.value, tracker.color1 || '#bb86fc');
                } else if (!tracker) {
                    this.addCounterRow('', 0, '#bb86fc');
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
                    tracker.dataPoints.forEach(dp => this.addDonutRow(dp.label, dp.value, dp.color));
                }
                const notesIn = getEl('tkDonutNotes');
                if (tracker && notesIn) notesIn.value = tracker.notes || '';
            } else if (type === 'countdown') {
                const container = getEl('countdownDataContainer');
                if (container) container.innerHTML = '';
                if (tracker && tracker.items) {
                    tracker.items.forEach(item => this.addCountdownRow(item.label, item.date));
                }
                
                const style = tracker ? (tracker.displayStyle || 'list') : 'list';
                const styleRad = document.querySelector(`input[name="tkCountdownStyle"][value="${style}"]`);
                if(styleRad) styleRad.checked = true;

                const notesIn = getEl('tkCountdownNotes');
                if (tracker && notesIn) notesIn.value = tracker.notes || '';
            } else if (type === 'completionBar') {
                const tmIn = getEl('tkCompBarMetric');
                if (tracker && tmIn) tmIn.value = tracker.metric || '';
                const ttIn = getEl('tkCompBarTotal');
                if (tracker && ttIn) ttIn.value = tracker.total || '';
                const taIn = getEl('tkCompBarActive');
                if (tracker && taIn) taIn.value = tracker.active || '';
                const tnIn = getEl('tkCompBarNotes');
                if (tracker && tnIn) tnIn.value = tracker.notes || '';
                            const cbIn = getEl('tkCompBarColorBg');
                            if (cbIn) { cbIn.value = tracker ? (tracker.colorBg || '#696969') : '#696969'; cbIn.style.backgroundColor = cbIn.value; }
                                        const cvIn = getEl('tkCompBarColorVal');
                                        if (cvIn) { cvIn.value = tracker ? (tracker.colorVal || '#228B22') : '#228B22'; cvIn.style.backgroundColor = cvIn.value; }
                                        
                                        const orient = tracker ? (tracker.orientation || 'vertical') : 'vertical';
                                        const orientRad = document.querySelector(`input[name="tkCompBarOrient"][value="${orient}"]`);
                                        if(orientRad) orientRad.checked = true;
                                    } else if (type === 'planner') {
                                        const notesIn = getEl('tkPlannerNotes');
                                        if (tracker && notesIn) notesIn.value = tracker.notes || '';
                                        
                                        const range = tracker ? (tracker.range || 3) : 3;
                                        const pType = tracker ? (tracker.plannerType || 'Role') : 'Role';
                                        
                                        const rRange = document.querySelector(`input[name="tkPlannerRange"][value="${range}"]`);
                                        if(rRange) rRange.checked = true;
                                        
                                        const rType = document.querySelector(`input[name="tkPlannerType"][value="${pType}"]`);
                                        if(rType) rType.checked = true;
                                        
                                        this.renderPlannerMultiSelect(tracker ? (tracker.plannerItems || []) : []);
                                    }
                                }        ModalManager.openModal('trackerModal');
    },

    updateSizeOptions(type) {
        const inputType = (type === 'bar') ? 'line' : type;
        const allSizes = ['1x1', '2x1', '1x2', '2x2', '3x2', '2x3', '2x4', '3x3', '4x4'];
        let allowed = allSizes;

        if (['gauge', 'rag'].includes(inputType)) allowed = ['1x1'];
        else if (inputType === 'donut') allowed = ['1x1', '2x2'];
        else if (inputType === 'completionBar') allowed = ['1x1', '2x1', '1x2'];
        else if (inputType === 'countdown') allowed = ['1x1', '2x1', '2x2'];
        else if (inputType === 'planner') allowed = ['2x2', '3x2', '2x3', '2x4', '3x3', '4x4'];
        // Time Series (line/bar) and Note allow all sizes.
        // Waffle allows all for now.

        allSizes.forEach(s => {
            const lbl = getEl(`lblSize${s}`);
            if (lbl) {
                lbl.style.display = allowed.includes(s) ? 'inline-flex' : 'none';
                // If currently checked option is hidden, select the first allowed one
                const rad = lbl.querySelector('input');
                if (rad && rad.checked && !allowed.includes(s)) {
                    rad.checked = false;
                    const first = getEl(`lblSize${allowed[0]}`).querySelector('input');
                    if(first) first.checked = true;
                }
            }
        });
    },

    setType(type) {
        State.currentTrackerType = type;
        // Map 'bar' to 'line' for input visibility
        const inputType = (type === 'bar') ? 'line' : type;
        ['Gauge','Bar','Line','Counter','Rag','Waffle','Note','Donut','Countdown','CompletionBar','Planner'].forEach(x => {
            const btn = getEl(`type${x}Btn`);
            if (btn) btn.className = (type.toLowerCase() === x.toLowerCase()) ? 'type-option active' : 'type-option';
            
            // Explicitly handle ID casing if needed, but lowercase should work if HTML is lowercase
            const divId = `${x.toLowerCase()}Inputs`;
            const div = getEl(divId);
            if (div) {
                const shouldShow = (inputType.toLowerCase() === x.toLowerCase());
                div.style.display = shouldShow ? 'block' : 'none';
            }
        });
        
        // Explicit fallback for Completion Bar (if ID casing mismatch)
        if (inputType === 'completionBar') {
            const cbDiv = getEl('completionbarInputs');
            if (cbDiv) cbDiv.style.display = 'block';
        }

        const sizeCont = getEl('sizeContainer');
        if(sizeCont) {
            sizeCont.style.display = 'block'; 
        }
        
        if (inputType === 'counter') this.updateSizeOptions('gauge'); // Treat as 1x1
        else this.updateSizeOptions(inputType);

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
                        <input type="text" readonly class="color-input ts-color" value="${s.color}" style="width:20px; height:20px; border:none; padding:0; cursor:pointer; background-color:${s.color};" data-idx="${si}">
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

    addDonutRow(label = '', value = '', color = '') {
        const container = getEl('donutDataContainer');
        if (!container) return;
        if (container.children.length >= 10) return App.alert("Max 10 data points allowed.");

        // Default colors if none provided (cyclic)
        if (!color) {
            const defaultPalette = ['#03dac6', '#ff4081', '#bb86fc', '#cf6679', '#00e676', '#ffb300', '#018786', '#3700b3', '#03a9f4', '#ffeb3b'];
            color = defaultPalette[container.children.length % defaultPalette.length];
        }

        const div = document.createElement('div');
        div.className = 'donut-row';
        div.style.display = 'flex';
        div.style.gap = '8px';
        div.style.marginBottom = '5px';
        div.style.alignItems = 'center';
        
        div.innerHTML = `
            <button class="btn btn-sm" style="color:var(--g-red); border-color:var(--g-red); padding: 0 10px; height:34px; flex: 0 0 34px;" title="Delete Segment" onclick="TrackerManager.removeDonutRow(this)">&times;</button>
            <input type="text" class="dr-label" maxlength="32" placeholder="Label" value="${label}" style="flex: 2; height:34px;">
            <input type="number" class="dr-value" placeholder="Value" value="${value}" style="flex: 1; height:34px;" oninput="if(this.value.length > 6) this.value = this.value.slice(0,6)">
            <input type="text" readonly class="color-input dr-color" value="${color}" style="width:34px; height:34px; border:none; padding:0; cursor:pointer; background-color:${color}; border-radius:4px;">
        `;
        container.appendChild(div);
    },

    removeDonutRow(btn) {
        btn.parentElement.remove();
    },

    addCountdownRow(label = '', date = '') {
        const container = getEl('countdownDataContainer');
        if (!container) return;
        if (container.children.length >= 128) return App.alert("Max 128 events allowed.");

        const div = document.createElement('div');
        div.className = 'countdown-row';
        div.style.display = 'flex';
        div.style.gap = '8px';
        div.style.marginBottom = '5px';
        div.style.alignItems = 'center';
        div.innerHTML = `
            <button class="btn btn-sm" style="color:var(--g-red); border-color:var(--g-red); padding: 0 10px; height:34px; flex: 0 0 34px;" title="Delete Event" onclick="TrackerManager.removeCountdownRow(this)">&times;</button>
            <input type="text" class="cd-label" maxlength="15" placeholder="Event Label" value="${label}" style="flex: 2; height:34px;">
            <input type="date" class="cd-date" value="${date}" style="flex: 1; background:var(--input-bg); color:#fff; color-scheme:dark; height:34px;">
        `;
        container.appendChild(div);
    },

    removeCountdownRow(btn) {
        btn.parentElement.remove();
    },

    addCounterRow(label = '', value = '', color = '#bb86fc', bgColor = '#333333', useBg = false) {
        const container = getEl('counterDataContainer');
        if (!container) return;
        if (container.children.length >= 6) return App.alert("Max 6 counters allowed.");

        const div = document.createElement('div');
        div.className = 'counter-row';
        div.style.display = 'flex';
        div.style.gap = '8px';
        div.style.marginBottom = '8px';
        div.style.alignItems = 'center';
        div.style.background = 'rgba(255,255,255,0.03)';
        div.style.padding = '8px';
        div.style.borderRadius = '4px';
        
        div.innerHTML = `
            <button class="btn btn-sm" style="color:var(--g-red); border-color:var(--g-red); padding: 0 10px; height:34px; flex: 0 0 34px;" title="Delete Counter" onclick="TrackerManager.removeCounterRow(this)">&times;</button>
            <input type="text" class="cr-label" maxlength="32" placeholder="Counter Name" value="${label}" style="flex: 1; min-width: 80px; height:34px;">
            <input type="number" class="cr-value" placeholder="Val" value="${value}" style="width: 80px; flex: 0 0 80px; height:34px;" oninput="if(this.value.length > 8) this.value = this.value.slice(0,8)">
            
            <div style="display:flex; flex-direction:column; align-items:center; flex: 0 0 40px;">
                <label style="font-size:0.6rem; color:#aaa; margin-bottom:2px;">Text</label>
                <input type="text" readonly class="color-input cr-color" value="${color}" style="width:30px; height:24px; border:none; padding:0; cursor:pointer; background-color:${color};">
            </div>

            <div style="display:flex; flex-direction:column; align-items:center; flex: 0 0 75px; border-left: 1px solid #444; padding-left: 8px;">
                <label style="font-size:0.6rem; color:#aaa; margin-bottom:2px;">Pill Bg</label>
                <div style="display:flex; align-items:center; gap:4px;">
                    <input type="checkbox" class="cr-use-bg" ${useBg ? 'checked' : ''} style="display:none;">
                    <input type="text" readonly class="color-input cr-bg-color" value="${bgColor}" 
                           style="width:30px; height:24px; border:none; padding:0; cursor:pointer; background-color:${bgColor}; opacity: ${useBg ? '1' : '0.2'}"
                           oninput="const p=this.parentElement; p.querySelector('.cr-use-bg').checked = true; this.style.opacity = '1';">
                    <button class="btn btn-sm" style="padding:0 4px; font-size:0.6rem; height:24px; border-color:#555; color:#888; min-width:30px;" 
                            onclick="const p=this.parentElement; p.querySelector('.cr-use-bg').checked=false; p.querySelector('.cr-bg-color').style.opacity='0.2'; event.stopPropagation();">None</button>
                </div>
            </div>
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
        // Find active tab
        const currentTab = State.trackerTabs.find(t => t.id === State.activeTabId);
        if (!currentTab) return;
        if(index < 0 || index >= currentTab.trackers.length) return;
        
        App.confirm("Are you sure you want to delete this card?", () => {
            currentTab.trackers.splice(index, 1);
            renderBoard();
        });
    },

    submitTracker() {
        const index = State.editingTrackerIndex;
        const descIn = getEl('tkDesc');
        const desc = descIn ? descIn.value : '';
        const sizeRadio = document.querySelector('input[name="tkSize"]:checked');
        const size = sizeRadio ? sizeRadio.value : '2x1';
        if (!desc) return App.alert("Title required");

        const type = State.currentTrackerType;
        let newTracker = { desc, type, size, lastUpdated: new Date().toISOString() };

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
            // Size is handled by radio
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
            const rows = document.querySelectorAll('.counter-row');
            const counters = [];
            rows.forEach(row => {
                const label = row.querySelector('.cr-label').value.trim();
                const value = parseFloat(row.querySelector('.cr-value').value) || 0;
                const color = row.querySelector('.cr-color').value;
                const useBg = row.querySelector('.cr-use-bg').checked;
                const bgColor = row.querySelector('.cr-bg-color').value;
                
                if (label || value !== 0) counters.push({ label, value, color, useBg, bgColor });
            });
            
            if (counters.length === 0) return App.alert("At least one counter is required.");
            newTracker.counters = counters;
            
            const cnIn = getEl('tkCounterNotes');
            newTracker.notes = cnIn ? cnIn.value : '';
            // Size is handled by radio
        } else if (type === 'rag') {
            newTracker.type = 'rag'; 
            const rsIn = getEl('tkRagStatus');
            newTracker.status = rsIn ? rsIn.value : 'grey';
            const rmIn = getEl('tkRagMsg');
            newTracker.message = rmIn ? rmIn.value : '';
            const rnIn = getEl('tkRagNotes');
            newTracker.notes = rnIn ? rnIn.value : '';
            // Size is handled by radio
            newTracker.color1 = (newTracker.status === 'green' ? '#00e676' : (newTracker.status === 'amber' ? '#ffb300' : (newTracker.status === 'red' ? '#ff1744' : '#666666')));
        } else if (type === 'note') {
            const contentIn = getEl('tkNoteContent');
            newTracker.content = contentIn ? contentIn.value : '';
            const alignRad = document.querySelector('input[name="tkNoteAlign"]:checked');
            newTracker.align = alignRad ? alignRad.value : 'left';
                        newTracker.notes = ''; // No notes for Note Tracker
                            } else if (type === 'planner') {
                                const rRange = document.querySelector('input[name="tkPlannerRange"]:checked');
                                const rType = document.querySelector('input[name="tkPlannerType"]:checked');
                                newTracker.range = rRange ? parseInt(rRange.value) : 3;
                                newTracker.plannerType = rType ? rType.value : 'Role';
                                
                                const selectedItems = [];
                                const checkboxes = document.querySelectorAll('.planner-item-select:checked');
                                checkboxes.forEach(cb => selectedItems.push(cb.value));
                                
                                if (selectedItems.length === 0) return App.alert(`Please select at least one ${newTracker.plannerType}.`);
                                newTracker.plannerItems = selectedItems;
                                
                                newTracker.notes = getEl('tkPlannerNotes').value.trim();
                            } else if (type === 'completionBar') {            const tmIn = getEl('tkCompBarMetric');
            const ttIn = getEl('tkCompBarTotal');
            const taIn = getEl('tkCompBarActive');
            const tnIn = getEl('tkCompBarNotes');

            const total = ttIn ? (parseInt(ttIn.value) || 100) : 100;
            const active = taIn ? (parseInt(taIn.value) || 0) : 0;

            if (total <= 0) return App.alert("Target must be a positive number.");
            if (active > total) return App.alert("Progress cannot exceed the Target.");

            newTracker.metric = tmIn ? tmIn.value : '';
            newTracker.total = total;
            newTracker.active = active;
            newTracker.notes = tnIn ? tnIn.value : '';
            const orientRad = document.querySelector('input[name="tkCompBarOrient"]:checked');
            newTracker.orientation = orientRad ? orientRad.value : 'horizontal';
            // Size is handled by radio

            const cvIn = getEl('tkCompBarColorVal');
            newTracker.colorVal = cvIn ? cvIn.value : '#228B22';
            const cbIn = getEl('tkCompBarColorBg');
            newTracker.colorBg = cbIn ? cbIn.value : '#696969';
        } else if (type === 'donut') {
            const rows = document.querySelectorAll('.donut-row');
            const dataPoints = [];
            rows.forEach(row => {
                const label = row.querySelector('.dr-label').value.trim();
                const value = parseFloat(row.querySelector('.dr-value').value) || 0;
                const color = row.querySelector('.dr-color').value;
                if (label) dataPoints.push({ label, value, color });
            });
            if (dataPoints.length === 0) return App.alert("At least one data point with a label is required.");
            newTracker.dataPoints = dataPoints;
            const notesIn = getEl('tkDonutNotes');
            newTracker.notes = notesIn ? notesIn.value : '';
            // Size is handled by radio
        } else if (type === 'countdown') {
            const rows = document.querySelectorAll('.countdown-row');
            const items = [];
            rows.forEach(row => {
                const label = row.querySelector('.cd-label').value.trim();
                const date = row.querySelector('.cd-date').value;
                if (label && date) items.push({ label, date });
            });
            if (items.length === 0) return App.alert("At least one event with a label and date is required.");
            newTracker.items = items;
            
            const styleRad = document.querySelector('input[name="tkCountdownStyle"]:checked');
            newTracker.displayStyle = styleRad ? styleRad.value : 'list';
            
            const notesIn = getEl('tkCountdownNotes');
            newTracker.notes = notesIn ? notesIn.value : '';
            // Size is handled by radio
        }

        const currentTab = State.trackerTabs.find(t => t.id === State.activeTabId);
        if (!currentTab) return App.alert("No active tab selected.");

        if(index === -1) {
            newTracker.id = generateId('cid');
            currentTab.trackers.push(newTracker);
        } else {
            newTracker.id = currentTab.trackers[index].id; // Preserve existing ID
            currentTab.trackers[index] = newTracker;
        }

        ModalManager.closeModal('trackerModal');
        renderBoard();
        console.log("Card saved:", type);
    }
};

export const UserManager = {
    addObjectiveRow: (data = null) => {
        const container = getEl('objectivesContainer');
        if (!container) return;
        if (container.children.length >= 24) return App.alert("Max 24 objectives.");

        const div = document.createElement('div');
        div.className = 'objective-row';
        div.style.display = 'flex';
        div.style.gap = '5px';
        div.style.alignItems = 'center';
        
        // Assignment Select
        const assignSel = document.createElement('select');
        assignSel.className = 'obj-assign';
        assignSel.style.flex = '3';
        assignSel.style.minWidth = '100px';
        assignSel.style.background = 'var(--input-bg)';
        assignSel.style.color = '#fff';
        assignSel.style.border = '1px solid var(--border)';
        assignSel.style.padding = '4px';
        
        const defOpt = document.createElement('option');
        defOpt.value = ""; defOpt.innerText = "Select Assignment...";
        assignSel.appendChild(defOpt);
        
        State.assignments.forEach(a => {
            const opt = document.createElement('option');
            opt.value = a.name;
            opt.innerText = a.name;
            if(data && data.assignment === a.name) opt.selected = true;
            assignSel.appendChild(opt);
        });

        // Allocation %
        const loadIn = document.createElement('input');
        loadIn.type = 'number';
        loadIn.className = 'obj-load';
        loadIn.placeholder = '%';
        loadIn.style.width = '50px';
        loadIn.style.background = 'var(--input-bg)';
        loadIn.style.color = '#fff';
        loadIn.style.border = '1px solid var(--border)';
        loadIn.style.padding = '4px';
        loadIn.style.textAlign = 'center';
        loadIn.value = data ? data.load : 100;

        // Year Helpers
        const createYearSel = (val) => {
            const s = document.createElement('select');
            s.style.width = '70px';
            s.style.background = 'var(--input-bg)';
            s.style.color = '#fff';
            s.style.border = '1px solid var(--border)';
            s.style.padding = '4px';
            const fy = getFiscalYear();
            for(let i=fy-1; i<=fy+2; i++) {
                const opt = document.createElement('option');
                opt.value = i; opt.innerText = i;
                if(val && parseInt(val) === i) opt.selected = true;
                else if(!val && i === fy) opt.selected = true;
                s.appendChild(opt);
            }
            return s;
        };

        // Period Selects
        const createPerSel = (val) => {
            const s = document.createElement('select');
            s.className = 'obj-period';
            s.style.flex = '1';
            s.style.background = 'var(--input-bg)';
            s.style.color = '#fff';
            s.style.border = '1px solid var(--border)';
            s.style.padding = '4px';
            for(let i=1; i<=12; i++) {
                const opt = document.createElement('option');
                opt.value = i;
                opt.innerText = getPeriodLabel(i).split(' ')[0]; // Just P01
                if(val && parseInt(val) === i) opt.selected = true;
                s.appendChild(opt);
            }
            return s;
        };

        const startYearSel = createYearSel(data ? data.startYear : null);
        startYearSel.classList.add('obj-start-year');
        const startSel = createPerSel(data ? data.start : getCurrentPeriod());
        startSel.classList.add('obj-start');

        const endYearSel = createYearSel(data ? data.endYear : null);
        endYearSel.classList.add('obj-end-year');
        const endSel = createPerSel(data ? data.end : getCurrentPeriod());
        endSel.classList.add('obj-end');

        const delBtn = document.createElement('button');
        delBtn.innerHTML = '&times;';
        delBtn.className = 'btn btn-sm';
        delBtn.style.color = 'var(--g-red)';
        delBtn.style.borderColor = 'var(--g-red)';
        delBtn.style.padding = '0 8px';
        delBtn.onclick = () => div.remove();

        div.appendChild(assignSel);
        div.appendChild(loadIn);
        div.appendChild(startYearSel);
        div.appendChild(startSel);
        div.appendChild(document.createTextNode(' - '));
        div.appendChild(endYearSel);
        div.appendChild(endSel);
        div.appendChild(delBtn);
        
        container.appendChild(div);
    },

    addAbsenceRow: (data = null) => {
        const container = getEl('mAbsencesContainer');
        if (!container) return;
        
        const div = document.createElement('div');
        div.className = 'absence-row';
        div.style.display = 'flex';
        div.style.gap = '5px';
        div.style.alignItems = 'center';
        
        const typeSel = document.createElement('select');
        typeSel.className = 'abs-type';
        typeSel.style.flex = '2';
        typeSel.style.background = 'var(--input-bg)';
        typeSel.style.color = '#fff';
        typeSel.style.border = '1px solid var(--border)';
        typeSel.style.padding = '4px';
        
        State.settings.absences.forEach(a => {
            const opt = document.createElement('option');
            opt.value = a.id;
            opt.innerText = a.name;
            if(data && data.type === a.id) opt.selected = true;
            typeSel.appendChild(opt);
        });
        
        const startIn = document.createElement('input');
        startIn.type = 'date';
        startIn.className = 'abs-start';
        startIn.style.flex = '1';
        startIn.style.background = 'var(--input-bg)';
        startIn.style.color = '#fff';
        startIn.style.colorScheme = 'dark';
        startIn.style.border = '1px solid var(--border)';
        startIn.style.padding = '4px';
        startIn.value = data ? data.startDate : '';
        
        const endIn = document.createElement('input');
        endIn.type = 'date';
        endIn.className = 'abs-end';
        endIn.style.flex = '1';
        endIn.style.background = 'var(--input-bg)';
        endIn.style.color = '#fff';
        endIn.style.colorScheme = 'dark';
        endIn.style.border = '1px solid var(--border)';
        endIn.style.padding = '4px';
        endIn.value = data ? data.endDate : '';
        
        // Date Validation: End >= Start
        startIn.onchange = () => {
            endIn.min = startIn.value;
            if(endIn.value && endIn.value < startIn.value) endIn.value = startIn.value;
        };
        endIn.onchange = () => {
            if(startIn.value && endIn.value < startIn.value) endIn.value = startIn.value;
        };

        const delBtn = document.createElement('button');
        delBtn.innerHTML = '&times;';
        delBtn.className = 'btn btn-sm';
        delBtn.style.color = 'var(--g-red)';
        delBtn.style.borderColor = 'var(--g-red)';
        delBtn.style.padding = '0 8px';
        delBtn.onclick = () => div.remove();
        
        div.appendChild(typeSel);
        div.appendChild(startIn);
        div.appendChild(endIn);
        div.appendChild(delBtn);
        
        container.appendChild(div);
    },

    openUserModal: (index = -1) => {
        const isEdit = index > -1;
        getEl('modalTitle').innerText = isEdit ? 'Edit Person' : 'Add Person';
        getEl('editIndex').value = index;
        
        const m = isEdit ? State.members[index] : {
            name: '', title: '', email: '', engagementType: '', startDate: '', endDate: '', skills: [],
            notes: '', absences: [],
            lastWeek: { tasks: [{text:'', isTeamSuccess:false}, {text:'', isTeamSuccess:false}, {text:'', isTeamSuccess:false}] },
            thisWeek: { tasks: [{text:'', isTeamSuccess:false}, {text:'', isTeamSuccess:false}, {text:'', isTeamSuccess:false}], load: ['N','N','N','N','N','X','X'] },
            nextWeek: { tasks: [{text:'', isTeamActivity:false}, {text:'', isTeamActivity:false}, {text:'', isTeamActivity:false}], load: ['N','N','N','N','N','X','X'] },
            objectives: []
        };

        getEl('mName').value = m.name || '';
        getEl('mTitle').value = m.title || '';
        getEl('mEmail').value = m.email || '';
        getEl('mEngagement').value = m.engagementType || '';
        
        const safeDate = (v) => {
            if(!v) return '';
            if(/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
            const d = new Date(v);
            return !isNaN(d.getTime()) ? d.toISOString().split('T')[0] : '';
        };
        getEl('mStartDate').value = safeDate(m.startDate);
        getEl('mEndDate').value = safeDate(m.endDate);

        // Populate Skills
        const skillsContainer = getEl('mSkillsContainer');
        if (skillsContainer) {
            skillsContainer.innerHTML = '';
            if (!State.skills || State.skills.length === 0) {
                skillsContainer.innerHTML = '<span style="color:var(--text-muted); font-style:italic; font-size:0.8rem;">No skills defined.</span>';
            } else {
                const assignedSkills = (m.skills || []).map(s => typeof s === 'object' ? s.skillId : s); // Handle legacy {skillId, level} format if needed, but simplistic check for now
                State.skills.forEach(s => {
                    const div = document.createElement('div');
                    // Check if skill is assigned. Handle simple ID array or object array.
                    const isChecked = assignedSkills.includes(s.id);
                    div.innerHTML = `
                        <label style="display:inline-flex; align-items:center; gap:5px; font-size:0.8rem; color:var(--text-main); cursor:pointer;">
                            <input type="checkbox" class="user-skill-check" value="${s.id}" ${isChecked ? 'checked' : ''} style="accent-color:var(--accent);">
                            ${s.name}
                        </label>
                    `;
                    skillsContainer.appendChild(div);
                });
            }
        }
        
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

        // Objectives
        const objContainer = getEl('objectivesContainer');
        if(objContainer) objContainer.innerHTML = '';
        if(m.objectives && m.objectives.length > 0) {
            m.objectives.forEach(o => UserManager.addObjectiveRow(o));
        }

        // Absences
        const absContainer = getEl('mAbsencesContainer');
        if(absContainer) absContainer.innerHTML = '';
        if(m.absences && m.absences.length > 0) {
            m.absences.forEach(a => UserManager.addAbsenceRow(a));
        }

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

        // Scrape Objectives
        const objectives = [];
        const objContainer = getEl('objectivesContainer');
        let dateError = false;
        if(objContainer) {
            objContainer.querySelectorAll('.objective-row').forEach(row => {
                const assign = row.querySelector('.obj-assign').value;
                const load = parseInt(row.querySelector('.obj-load').value) || 0;
                const startYear = parseInt(row.querySelector('.obj-start-year').value);
                const start = parseInt(row.querySelector('.obj-start').value);
                const endYear = parseInt(row.querySelector('.obj-end-year').value);
                const end = parseInt(row.querySelector('.obj-end').value);
                
                // Validate End >= Start
                const startScore = startYear * 100 + start;
                const endScore = endYear * 100 + end;
                if (endScore < startScore) {
                    dateError = true;
                }

                if (assign) objectives.push({ assignment: assign, load, start, startYear, end, endYear });
            });
        }

        if (dateError) return App.alert("Error: End period must be after Start period.");

        // Scrape Absences
        const absences = [];
        const absContainer = getEl('mAbsencesContainer');
        if(absContainer) {
            absContainer.querySelectorAll('.absence-row').forEach(row => {
                const type = row.querySelector('.abs-type').value;
                const startDate = row.querySelector('.abs-start').value;
                const endDate = row.querySelector('.abs-end').value;
                if(type && startDate) {
                    // Basic validation: End >= Start (already enforced by UI but good to double check)
                    if(endDate && endDate < startDate) return; // Skip invalid
                    absences.push({ type, startDate, endDate });
                }
            });
        }

        // Scrape Skills
        const selectedSkills = [];
        document.querySelectorAll('.user-skill-check:checked').forEach(cb => selectedSkills.push(cb.value));

        const member = {
            name,
            title: getEl('mTitle').value.trim(),
            email: getEl('mEmail').value.trim(),
            engagementType: getEl('mEngagement').value,
            startDate: getEl('mStartDate').value,
            endDate: getEl('mEndDate').value,
            skills: selectedSkills,
            notes: getEl('mNotes').value.trim(),
            absences: absences,
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
            },
            objectives: objectives
        };

        if(idx === -1) {
            member.id = generateId('uid');
            State.members.push(member);
        } else {
            member.id = State.members[idx].id;
            State.members[idx] = member;
        }

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

export const AssignmentManager = {
    renderAssignments: () => {
        const grid = getEl('assignmentsGrid');
        if (!grid) return;
        grid.innerHTML = '';
        
        // Map assignments to users
        const assignmentUsers = {};
        State.members.forEach(m => {
            if (m.objectives) {
                m.objectives.forEach(o => {
                    if (o.assignment) {
                        if(!assignmentUsers[o.assignment]) assignmentUsers[o.assignment] = [];
                        assignmentUsers[o.assignment].push(m.name);
                    }
                });
            }
        });

        State.assignments.forEach((a, i) => {
            if (!assignmentUsers[a.name] || assignmentUsers[a.name].length === 0) return; // Skip if no user is assigned

            const card = document.createElement('div');
            card.className = 'assignment-card';
            card.style.background = 'var(--card-bg)';
            card.style.border = '1px solid var(--border)';
            card.style.borderRadius = '8px';
            card.style.padding = '1rem';
            card.style.position = 'relative';
            card.style.cursor = 'pointer';
            card.style.borderLeft = `4px solid ${a.color || '#03dac6'}`;
            card.onclick = () => AssignmentManager.openModal(i);

            let html = `<div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:0.5rem;">
                            <h4 style="margin:0; font-size:1rem; color:var(--text-main);">${a.name}</h4>
                            <span style="font-size:0.7rem; background:rgba(255,255,255,0.1); padding:2px 6px; border-radius:4px;">${a.class}</span>
                        </div>`;
            
            if (a.description) {
                html += `<div style="font-size:0.8rem; color:var(--text-muted); margin-bottom:0.8rem; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">${a.description}</div>`;
            }

            // List Users
            const users = assignmentUsers[a.name];
            html += `<div style="margin-bottom:0.8rem; border-top:1px solid rgba(255,255,255,0.1); padding-top:5px;">
                        <div style="font-size:0.7rem; color:var(--text-muted); margin-bottom:2px;">Assigned:</div>
                        <div style="font-size:0.8rem; color:var(--text-main); line-height:1.2;">${users.join(', ')}</div>
                     </div>`;

            html += `<div style="display:flex; justify-content:space-between; align-items:center; font-size:0.75rem; color:#888;">`;
            
            let dateText = "Ongoing";
            if (a.startDate || a.endDate) {
                dateText = `${a.startDate ? formatDate(new Date(a.startDate)) : '...'} - ${a.endDate ? formatDate(new Date(a.endDate)) : '...'}`;
            }
            html += `<span>${dateText}</span>`;
            
            const pColor = a.priority === 'High' ? '#ff1744' : (a.priority === 'Med' ? '#ffb300' : '#00e676');
            html += `<span style="color:${pColor}; font-weight:bold;">${a.priority}</span>`;
            
            html += `</div>`;
            
            card.innerHTML = html;
            grid.appendChild(card);
        });
    },
    openModal: (index) => {
        if(document.body.classList.contains('publishing')) return;
        getEl('assignmentModalTitle').innerText = index === -1 ? 'Add Assignment' : 'Edit Assignment';
        getEl('editAssignmentIndex').value = index;
        
        const a = index > -1 ? State.assignments[index] : { name: '', description: '', class: 'Task', priority: 'Med', startDate: '', endDate: '', color: '#03dac6' };
        
        getEl('asName').value = a.name;
        getEl('asDesc').value = a.description;
        getEl('asClass').value = a.class;
        const safeDate = (v) => {
            if(!v) return '';
            if(/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
            const d = new Date(v);
            return !isNaN(d.getTime()) ? d.toISOString().split('T')[0] : '';
        };
        getEl('asStart').value = safeDate(a.startDate);
        getEl('asEnd').value = safeDate(a.endDate);
        const colIn = getEl('asColor');
        colIn.value = a.color;
        colIn.style.backgroundColor = a.color;
        
        const pRad = document.querySelector(`input[name="asPriority"][value="${a.priority}"]`);
        if(pRad) pRad.checked = true;
        
        getEl('btnDelAssignment').style.display = index === -1 ? 'none' : 'block';
        
        ModalManager.openModal('assignmentModal');
    },
    submitAssignment: () => {
        const index = parseInt(getEl('editAssignmentIndex').value);
        const name = getEl('asName').value.trim();
        if(!name) return App.alert("Name is required");
        
        const priorityRad = document.querySelector('input[name="asPriority"]:checked');
        
        const newAssignment = {
            name,
            description: getEl('asDesc').value.trim(),
            class: getEl('asClass').value,
            priority: priorityRad ? priorityRad.value : 'Med',
            startDate: getEl('asStart').value,
            endDate: getEl('asEnd').value,
            color: getEl('asColor').value
        };
        
        if(index === -1) {
            if(State.assignments.length >= 32) return App.alert("Max 32 assignments reached.");
            newAssignment.id = generateId('aid');
            State.assignments.push(newAssignment);
        } else {
            newAssignment.id = State.assignments[index].id;
            State.assignments[index] = newAssignment;
        }
        
        ModalManager.closeModal('assignmentModal');
        AssignmentManager.renderAssignments();
    },
    deleteAssignment: () => {
        const index = parseInt(getEl('editAssignmentIndex').value);
        if(index > -1) {
            App.confirm("Delete this assignment?", () => {
                State.assignments.splice(index, 1);
                ModalManager.closeModal('assignmentModal');
                AssignmentManager.renderAssignments();
            });
        }
    },
    openAssignModal: () => {
        // Populate Users
        const userSel = getEl('auUser');
        userSel.innerHTML = '<option value="">Select User...</option>';
        State.members.forEach((m, i) => {
            const opt = document.createElement('option');
            opt.value = i;
            opt.innerText = m.name;
            userSel.appendChild(opt);
        });

        // Populate Roles/Tasks
        const roleSel = getEl('auRole');
        roleSel.innerHTML = '<option value="">Select Assignment...</option>';
        State.assignments.forEach((a, i) => {
            const opt = document.createElement('option');
            opt.value = i;
            opt.innerText = `${a.name} (${a.class})`;
            roleSel.appendChild(opt);
        });

        // Populate Years
        const fy = getFiscalYear();
        const years = [fy-1, fy, fy+1, fy+2];
        const sySel = getEl('auStartYear'); sySel.innerHTML = '';
        const eySel = getEl('auEndYear'); eySel.innerHTML = '';
        years.forEach(y => {
            sySel.add(new Option(y, y, y===fy, y===fy));
            eySel.add(new Option(y, y, y===fy, y===fy));
        });

        // Populate Periods
        const spSel = getEl('auStartPeriod'); spSel.innerHTML = '';
        const epSel = getEl('auEndPeriod'); epSel.innerHTML = '';
        const cp = getCurrentPeriod();
        for(let i=1; i<=12; i++) {
            const label = getPeriodLabel(i).split(' ')[0];
            spSel.add(new Option(label, i, i===cp, i===cp));
            epSel.add(new Option(label, i, i===cp, i===cp));
        }

        ModalManager.openModal('assignUserModal');
    },
    submitUserAssignment: () => {
        const uIdx = getEl('auUser').value;
        const aIdx = getEl('auRole').value;
        if(uIdx === '' || aIdx === '') return App.alert("Please select User and Assignment.");

        const user = State.members[uIdx];
        const assignment = State.assignments[aIdx];

        const sYear = parseInt(getEl('auStartYear').value);
        const sPer = parseInt(getEl('auStartPeriod').value);
        const eYear = parseInt(getEl('auEndYear').value);
        const ePer = parseInt(getEl('auEndPeriod').value);
        const load = parseInt(getEl('auLoad').value) || 0;

        // Date Logic Helper
        const getDateFromPeriod = (y, p) => {
            const startMonth = State.settings.fyStartMonth;
            const monthIndex = (p - 1 + startMonth) % 12;
            const calcYear = monthIndex < startMonth ? y + 1 : y;
            return new Date(calcYear, monthIndex, 1);
        };

        const userStart = getDateFromPeriod(sYear, sPer);
        const userEnd = getDateFromPeriod(eYear, ePer);
        // Set userEnd to end of month for overlap check? 
        // Logic says "Cannot exceed range defined by role".
        // Role Start is YYYY-MM-DD.
        // If Role Start is Jan 15, and User Start is Jan 1 (P12), User start is BEFORE Role start.
        // Let's be strict: User Start Date must be >= Role Start Date.
        // User End Date (1st of month) must be <= Role End Date. 
        // Actually, if User Assigns "Jan", they mean the whole month.
        // If Role ends "Jan 10", and User assigned "Jan", is that valid? Yes, but technically it exceeds.
        // Let's check strict bounds of the *first day* of the period.

        if (userEnd < userStart) return App.alert("End Period must be after Start Period.");

        if (assignment.startDate) {
            const rStart = new Date(assignment.startDate);
            if (userStart < rStart) {
                // Allow if in same month?
                // If rStart is Jan 15, userStart is Jan 1.
                // Strict check:
                // return App.alert(`Assignment Start (${userStart.toLocaleDateString()}) is before Role Start (${assignment.startDate}).`);
                // Let's just warn about the period.
                const rStartPeriodYear = getFiscalYear(rStart);
                // This is getting complex. Simple check:
                if (userStart.getTime() < rStart.getTime()) {
                     // If same month/year, maybe OK?
                     if(userStart.getMonth() !== rStart.getMonth() || userStart.getFullYear() !== rStart.getFullYear()) {
                         return App.alert(`Start Period is before Role Start Date (${assignment.startDate}).`);
                     }
                }
            }
        }

        if (assignment.endDate) {
            const rEnd = new Date(assignment.endDate);
            // Check if User End (1st of month) is after Role End.
            // Actually we should check end of User End Month.
            const userEndMonthEnd = new Date(userEnd.getFullYear(), userEnd.getMonth() + 1, 0);
            if (userEndMonthEnd > rEnd) {
                 // Check if same month
                 if(userEnd.getMonth() !== rEnd.getMonth() || userEnd.getFullYear() !== rEnd.getFullYear()) {
                     return App.alert(`End Period is after Role End Date (${assignment.endDate}).`);
                 }
            }
        }

        // Add Objective
        if (!user.objectives) user.objectives = [];
        user.objectives.push({
            assignment: assignment.name,
            load: load,
            start: sPer,
            startYear: sYear,
            end: ePer,
            endYear: eYear
        });

        ModalManager.closeModal('assignUserModal');
        AssignmentManager.renderAssignments(); // Update view to show the card if it was hidden
        App.alert(`Assigned ${user.name} to ${assignment.name}.`);
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

export const PlannerManager = {
    openModal: (index) => {
        const isEdit = index > -1;
        const titleEl = getEl('plannerModalTitle');
        if (titleEl) titleEl.innerText = isEdit ? 'Edit Planner' : 'Add Planner';
        
        getEl('editPlannerIndex').value = index;
        
        if (isEdit) {
            const p = State.planners[index];
            getEl('plName').value = p.name;
            getEl('plDesc').value = p.description;
            
            // Set radios
            const rRange = document.querySelector(`input[name="plRange"][value="${p.range}"]`);
            if(rRange) rRange.checked = true;
            const rType = document.querySelector(`input[name="plType"][value="${p.type}"]`);
            if(rType) rType.checked = true;
            
            getEl('btnDelPlanner').style.display = 'inline-block';
        } else {
            getEl('plName').value = '';
            getEl('plDesc').value = '';
            // Defaults
            const rRange = document.querySelector(`input[name="plRange"][value="3"]`);
            if(rRange) rRange.checked = true;
            const rType = document.querySelector(`input[name="plType"][value="Role"]`);
            if(rType) rType.checked = true;
            
            getEl('btnDelPlanner').style.display = 'none';
        }
        
        ModalManager.openModal('plannerModal');
    },
    
    submitPlanner: () => {
        const name = getEl('plName').value.trim();
        const desc = getEl('plDesc').value.trim();
        const rRange = document.querySelector('input[name="plRange"]:checked');
        const rType = document.querySelector('input[name="plType"]:checked');
        
        const range = rRange ? rRange.value : "3";
        const type = rType ? rType.value : "Role";
        
        if (!name) return App.alert("Please enter a planner name.");
        
        const index = parseInt(getEl('editPlannerIndex').value);
        
        const planner = {
            name: name,
            description: desc,
            range: parseInt(range),
            type: type
        };
        
        if (index > -1) {
            State.planners[index] = planner;
        } else {
            if(!State.planners) State.planners = [];
            State.planners.push(planner);
        }
        
        ModalManager.closeModal('plannerModal');
        renderBoard(); // Re-render to show new planner
    },
    
    deletePlanner: () => {
        const index = parseInt(getEl('editPlannerIndex').value);
        if (index > -1) {
            App.confirm("Delete this planner?", () => {
                State.planners.splice(index, 1);
                ModalManager.closeModal('plannerModal');
                renderBoard();
            });
        }
    },
    
    renderPlanners: () => {
        const container = getEl('additionalPlannersContainer');
        if (!container) return;
        container.innerHTML = '';
        
        if (!State.planners) State.planners = [];
        
        State.planners.forEach((p, i) => {
            const div = document.createElement('div');
            div.className = 'planner-instance';
            div.style.background = 'var(--card-bg)';
            div.style.border = '1px solid var(--border)';
            div.style.borderRadius = '8px';
            div.style.padding = '1rem';
            div.style.marginBottom = '1rem';
            
            // Header
            const header = document.createElement('div');
            header.style.display = 'flex';
            header.style.justifyContent = 'space-between';
            header.style.alignItems = 'center';
            header.style.marginBottom = '1rem';
            
            header.innerHTML = `
                <div>
                    <h4 style="color:var(--accent); font-weight:300; margin:0; font-size:1.1rem;">${p.name}</h4>
                    <div style="font-size:0.8rem; color:var(--text-muted);">${p.description}</div>
                    <div style="font-size:0.75rem; color:#666; margin-top:2px;">Range: ${p.range} Months | Type: ${p.type}</div>
                </div>
                <button class="btn btn-sm" onclick="PlannerManager.openModal(${i})">Edit</button>
            `;
            
            div.appendChild(header);
            
            // Placeholder for visual content
            const viz = document.createElement('div');
            viz.style.height = '150px';
            viz.style.background = 'rgba(0,0,0,0.1)';
            viz.style.borderRadius = '4px';
            viz.style.display = 'flex';
            viz.style.alignItems = 'center';
            viz.style.justifyContent = 'center';
            viz.style.color = '#666';
            viz.innerText = `[Planner Visualization for ${p.type} - ${p.range} Months]`;
            
            div.appendChild(viz);
            container.appendChild(div);
        });
    }
};

export const RoleManager = {
    render: () => {
        const grid = getEl('rolesGrid');
        if (!grid) return;
        grid.innerHTML = '';
        
        State.assignments.forEach((a, index) => {
            if (a.class !== 'Role') return;
            
            const card = document.createElement('div');
            card.className = 'assignment-card';
            card.style.background = 'var(--card-bg)';
            card.style.border = '1px solid var(--border)';
            card.style.borderRadius = '8px';
            card.style.padding = '1rem';
            card.style.position = 'relative';
            card.style.cursor = 'pointer';
            card.style.borderLeft = `4px solid ${a.color || '#03dac6'}`;
            card.onclick = () => RoleManager.openModal(index);

            let html = `<div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:0.5rem;">
                            <h4 style="margin:0; font-size:1rem; color:var(--text-main);">${a.name}</h4>
                        </div>`;
            
            if (a.description) {
                html += `<div style="font-size:0.8rem; color:var(--text-muted); margin-bottom:0.8rem; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">${a.description}</div>`;
            }

            html += `<div style="display:flex; justify-content:space-between; align-items:center; font-size:0.75rem; color:#888;">`;
            
            let dateText = "Ongoing";
            if (a.startDate || a.endDate) {
                dateText = `${a.startDate ? formatDate(new Date(a.startDate)) : '...'} - ${a.endDate ? formatDate(new Date(a.endDate)) : '...'}`;
            }
            html += `<span>${dateText}</span>`;
            
            const pColor = a.priority === 'High' ? '#ff1744' : (a.priority === 'Med' ? '#ffb300' : '#00e676');
            html += `<span style="color:${pColor}; font-weight:bold;">${a.priority}</span>`;
            
            html += `</div>`;
            
            card.innerHTML = html;
            grid.appendChild(card);
        });
    },
    openModal: (index) => {
        getEl('roleModalTitle').innerText = index === -1 ? 'Add Role' : 'Edit Role';
        getEl('editRoleIndex').value = index;
        
        const a = index > -1 ? State.assignments[index] : { name: '', description: '', priority: 'Med', startDate: '', endDate: '', color: '#03dac6', id: '', skills: [] };
        
        const idContainer = getEl('rlIdContainer');
        const idInput = getEl('rlId');
        if (idContainer && idInput) {
            if (index > -1 && a.id) {
                idContainer.style.display = 'block';
                idInput.value = a.id;
            } else {
                idContainer.style.display = 'none';
                idInput.value = '';
            }
        }

        getEl('rlName').value = a.name;
        getEl('rlDesc').value = a.description;
        const safeDate = (v) => {
            if(!v) return '';
            if(/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
            const d = new Date(v);
            return !isNaN(d.getTime()) ? d.toISOString().split('T')[0] : '';
        };
        getEl('rlStart').value = safeDate(a.startDate);
        getEl('rlEnd').value = safeDate(a.endDate);
        
        const colIn = getEl('rlColor');
        colIn.value = a.color;
        colIn.style.backgroundColor = a.color;
        
        const pRad = document.querySelector(`input[name="rlPriority"][value="${a.priority}"]`);
        if(pRad) pRad.checked = true;
        
        // Populate Skills
        const skillsContainer = getEl('rlSkillsContainer');
        if (skillsContainer) {
            skillsContainer.innerHTML = '';
            if (!State.skills || State.skills.length === 0) {
                skillsContainer.innerHTML = '<span style="color:var(--text-muted); font-style:italic; font-size:0.8rem;">No skills defined.</span>';
            } else {
                const assignedSkills = a.skills || [];
                State.skills.forEach(s => {
                    const div = document.createElement('div');
                    const isChecked = assignedSkills.includes(s.id);
                    div.innerHTML = `
                        <label style="display:inline-flex; align-items:center; gap:5px; font-size:0.8rem; color:var(--text-main); cursor:pointer;">
                            <input type="checkbox" class="role-skill-check" value="${s.id}" ${isChecked ? 'checked' : ''} style="accent-color:var(--accent);">
                            ${s.name}
                        </label>
                    `;
                    skillsContainer.appendChild(div);
                });
            }
        }
        
        getEl('btnDelRole').style.display = index === -1 ? 'none' : 'block';
        
        ModalManager.openModal('roleModal');
    },
    submitRole: () => {
        const index = parseInt(getEl('editRoleIndex').value);
        const name = getEl('rlName').value.trim();
        if(!name) return App.alert("Role Name is required");
        
        const priorityRad = document.querySelector('input[name="rlPriority"]:checked');
        
        // Scrape Skills
        const selectedSkills = [];
        document.querySelectorAll('.role-skill-check:checked').forEach(cb => selectedSkills.push(cb.value));

        const newAssignment = {
            name,
            description: getEl('rlDesc').value.trim(),
            class: 'Role',
            priority: priorityRad ? priorityRad.value : 'Med',
            startDate: getEl('rlStart').value,
            endDate: getEl('rlEnd').value,
            color: getEl('rlColor').value,
            skills: selectedSkills
        };
        
        if(index === -1) {
            if(State.assignments.length >= 64) return App.alert("Max assignments reached.");
            newAssignment.id = generateId('rid');
            State.assignments.push(newAssignment);
        } else {
            newAssignment.id = State.assignments[index].id;
            State.assignments[index] = newAssignment;
        }
        
        ModalManager.closeModal('roleModal');
        RoleManager.render();
    },
    deleteRole: () => {
        const index = parseInt(getEl('editRoleIndex').value);
        if(index > -1) {
            App.confirm("Delete this role?", () => {
                State.assignments.splice(index, 1);
                ModalManager.closeModal('roleModal');
                RoleManager.render();
            });
        }
    }
};

export const EventManager = {
    render: () => {
        const grid = getEl('eventsGrid');
        if (!grid) return;
        grid.innerHTML = '';
        
        State.assignments.forEach((a, index) => {
            if (a.class !== 'Event' && a.class !== 'Project') return; // Support legacy Project class as Event
            
            const card = document.createElement('div');
            card.className = 'assignment-card';
            card.style.background = 'var(--card-bg)';
            card.style.border = '1px solid var(--border)';
            card.style.borderRadius = '8px';
            card.style.padding = '1rem';
            card.style.position = 'relative';
            card.style.cursor = 'pointer';
            card.style.borderLeft = `4px solid ${a.color || '#bb86fc'}`;
            card.onclick = () => EventManager.openModal(index);

            let html = `<div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:0.5rem;">
                            <h4 style="margin:0; font-size:1rem; color:var(--text-main);">${a.name}</h4>
                        </div>`;
            
            if (a.description) {
                html += `<div style="font-size:0.8rem; color:var(--text-muted); margin-bottom:0.8rem; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">${a.description}</div>`;
            }

            html += `<div style="display:flex; justify-content:space-between; align-items:center; font-size:0.75rem; color:#888;">`;
            
            let dateText = "Scheduled";
            if (a.startDate || a.endDate) {
                dateText = `${a.startDate ? formatDate(new Date(a.startDate)) : '...'} - ${a.endDate ? formatDate(new Date(a.endDate)) : '...'}`;
            }
            html += `<span>${dateText}</span>`;
            
            const pColor = a.priority === 'High' ? '#ff1744' : (a.priority === 'Med' ? '#ffb300' : '#00e676');
            html += `<span style="color:${pColor}; font-weight:bold;">${a.priority}</span>`;
            
            html += `</div>`;
            
            card.innerHTML = html;
            grid.appendChild(card);
        });
    },
    openModal: (index) => {
        getEl('eventModalTitle').innerText = index === -1 ? 'Add Event' : 'Edit Event';
        getEl('editEventIndex').value = index;
        
        const a = index > -1 ? State.assignments[index] : { name: '', description: '', priority: 'Med', startDate: '', endDate: '', color: '#bb86fc' };
        
        getEl('evName').value = a.name;
        getEl('evDesc').value = a.description;
        const safeDate = (v) => {
            if(!v) return '';
            if(/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
            const d = new Date(v);
            return !isNaN(d.getTime()) ? d.toISOString().split('T')[0] : '';
        };
        getEl('evStart').value = safeDate(a.startDate);
        getEl('evEnd').value = safeDate(a.endDate);
        
        const colIn = getEl('evColor');
        colIn.value = a.color;
        colIn.style.backgroundColor = a.color;
        
        const pRad = document.querySelector(`input[name="evPriority"][value="${a.priority}"]`);
        if(pRad) pRad.checked = true;
        
        getEl('btnDelEvent').style.display = index === -1 ? 'none' : 'block';
        
        const csvIn = getEl('evCsvInput');
        if(csvIn) csvIn.value = '';
        
        ModalManager.openModal('eventModal');
    },
    submitEvent: () => {
        const index = parseInt(getEl('editEventIndex').value);
        const name = getEl('evName').value.trim();
        if(!name) return App.alert("Event Name is required");
        
        const priorityRad = document.querySelector('input[name="evPriority"]:checked');
        
        const newAssignment = {
            name,
            description: getEl('evDesc').value.trim(),
            class: 'Event',
            priority: priorityRad ? priorityRad.value : 'Med',
            startDate: getEl('evStart').value,
            endDate: getEl('evEnd').value,
            color: getEl('evColor').value
        };
        
        if(index === -1) {
            if(State.assignments.length >= 64) return App.alert("Max assignments reached.");
            newAssignment.id = generateId('eid');
            State.assignments.push(newAssignment);
        } else {
            newAssignment.id = State.assignments[index].id;
            State.assignments[index] = newAssignment;
        }
        
        ModalManager.closeModal('eventModal');
        EventManager.render();
    },
    parseCSV: () => {
        const text = getEl('evCsvInput').value.trim();
        if (!text) return App.alert("Please paste CSV data.");
        
        const lines = text.split('\n');
        let count = 0;
        const colors = ['#03dac6', '#ff4081', '#bb86fc', '#cf6679', '#00e676', '#ffb300', '#018786', '#3700b3'];
        
        lines.forEach(line => {
            // Basic CSV parsing (not handling quoted commas for now)
            const parts = line.split(',').map(s => s.trim());
            if (parts.length < 4) return;
            
            const [name, desc, start, end, prio, col] = parts;
            
            if(!name || !start || !end) return;
            
            const newEvent = {
                id: generateId('eid'),
                name: name,
                description: desc || '',
                class: 'Event',
                startDate: start,
                endDate: end,
                priority: (prio && ['High','Med','Low'].includes(prio)) ? prio : 'Med',
                color: col || colors[Math.floor(Math.random() * colors.length)]
            };
            
            State.assignments.push(newEvent);
            count++;
        });
        
        if (count > 0) {
            App.alert(`Imported ${count} events.`);
            EventManager.render();
            ModalManager.closeModal('eventModal');
            getEl('evCsvInput').value = ''; // Reset
        } else {
            App.alert("No valid events found. Ensure format is: Name, Desc, Start, End");
        }
    },
    deleteEvent: () => {
        const index = parseInt(getEl('editEventIndex').value);
        if(index > -1) {
            App.confirm("Delete this event?", () => {
                State.assignments.splice(index, 1);
                ModalManager.closeModal('eventModal');
                EventManager.render();
            });
        }
    }
};

export const TaskManager = {
    render: () => {
        const grid = getEl('tasksGrid');
        if (!grid) return;
        grid.innerHTML = '';
        
        // Prepare data with indices for sorting
        let tasks = State.assignments
            .map((a, i) => ({ item: a, index: i }))
            .filter(obj => obj.item.class === 'Task');
            
        // Sorting Logic
        const sortMode = getEl('taskSortSelect') ? getEl('taskSortSelect').value : 'default';
        
        if (sortMode === 'priority') {
            const pMap = { 'High': 3, 'Med': 2, 'Low': 1 };
            tasks.sort((a, b) => (pMap[b.item.priority] || 0) - (pMap[a.item.priority] || 0));
        } else if (sortMode === 'start') {
            tasks.sort((a, b) => {
                const dA = a.item.startDate ? new Date(a.item.startDate) : new Date(8640000000000000); // Max date if null
                const dB = b.item.startDate ? new Date(b.item.startDate) : new Date(8640000000000000);
                return dA - dB;
            });
        } else if (sortMode === 'end') {
            tasks.sort((a, b) => {
                const dA = a.item.endDate ? new Date(a.item.endDate) : new Date(8640000000000000);
                const dB = b.item.endDate ? new Date(b.item.endDate) : new Date(8640000000000000);
                return dA - dB;
            });
        }
        
        tasks.forEach(obj => {
            const a = obj.item;
            const index = obj.index;
            
            const card = document.createElement('div');
            card.className = 'assignment-card';
            card.style.background = 'var(--card-bg)';
            card.style.border = '1px solid var(--border)';
            card.style.borderRadius = '8px';
            card.style.padding = '1rem';
            card.style.position = 'relative';
            card.style.cursor = 'pointer';
            card.style.borderLeft = `4px solid ${a.color || '#00e676'}`;
            card.onclick = () => TaskManager.openModal(index);

            let html = `<div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:0.5rem;">
                            <h4 style="margin:0; font-size:1rem; color:var(--text-main);">${a.name}</h4>
                        </div>`;
            
            if (a.description) {
                html += `<div style="font-size:0.8rem; color:var(--text-muted); margin-bottom:0.8rem; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">${a.description}</div>`;
            }

            html += `<div style="display:flex; justify-content:space-between; align-items:center; font-size:0.75rem; color:#888;">`;
            
            let dateText = "Active";
            if (a.startDate || a.endDate) {
                dateText = `${a.startDate ? formatDate(new Date(a.startDate)) : '...'} - ${a.endDate ? formatDate(new Date(a.endDate)) : '...'}`;
            }
            html += `<span>${dateText}</span>`;
            
            const pColor = a.priority === 'High' ? '#ff1744' : (a.priority === 'Med' ? '#ffb300' : '#00e676');
            html += `<span style="color:${pColor}; font-weight:bold;">${a.priority}</span>`;
            
            html += `</div>`;
            
            card.innerHTML = html;
            grid.appendChild(card);
        });
    },
    openModal: (index) => {
        getEl('taskModalTitle').innerText = index === -1 ? 'Add Task' : 'Edit Task';
        getEl('editTaskIndex').value = index;
        
        const a = index > -1 ? State.assignments[index] : { name: '', description: '', priority: 'Med', startDate: '', endDate: '', color: '#00e676' };
        
        getEl('tskName').value = a.name;
        getEl('tskDesc').value = a.description;
        const safeDate = (v) => {
            if(!v) return '';
            if(/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
            const d = new Date(v);
            return !isNaN(d.getTime()) ? d.toISOString().split('T')[0] : '';
        };
        getEl('tskStart').value = safeDate(a.startDate);
        getEl('tskEnd').value = safeDate(a.endDate);
        
        const colIn = getEl('tskColor');
        colIn.value = a.color;
        colIn.style.backgroundColor = a.color;
        
        const pRad = document.querySelector(`input[name="tskPriority"][value="${a.priority}"]`);
        if(pRad) pRad.checked = true;
        
        getEl('btnDelTask').style.display = index === -1 ? 'none' : 'block';
        
        ModalManager.openModal('taskModal');
    },
    submitTask: () => {
        const index = parseInt(getEl('editTaskIndex').value);
        const name = getEl('tskName').value.trim();
        if(!name) return App.alert("Task Name is required");
        
        const priorityRad = document.querySelector('input[name="tskPriority"]:checked');
        
        const newAssignment = {
            name,
            description: getEl('tskDesc').value.trim(),
            class: 'Task',
            priority: priorityRad ? priorityRad.value : 'Med',
            startDate: getEl('tskStart').value,
            endDate: getEl('tskEnd').value,
            color: getEl('tskColor').value
        };
        
        if(index === -1) {
            if(State.assignments.length >= 64) return App.alert("Max assignments reached.");
            newAssignment.id = generateId('tid');
            State.assignments.push(newAssignment);
        } else {
            newAssignment.id = State.assignments[index].id;
            State.assignments[index] = newAssignment;
        }
        
        ModalManager.closeModal('taskModal');
        TaskManager.render();
    },
    deleteTask: () => {
        const index = parseInt(getEl('editTaskIndex').value);
        if(index > -1) {
            App.confirm("Delete this task?", () => {
                State.assignments.splice(index, 1);
                ModalManager.closeModal('taskModal');
                TaskManager.render();
            });
        }
    }
};

export const SettingsManager = {
    openModal: () => {
        getEl('setFyStart').value = State.settings.fyStartMonth;
        SettingsManager.renderLists();
        ModalManager.openModal('settingsModal');
    },
    renderLists: () => {
        const rList = getEl('setRolesList');
        rList.innerHTML = '';
        State.settings.roles.forEach(r => {
            const div = document.createElement('div');
            div.style.display = 'flex'; div.style.justifyContent = 'space-between'; div.style.marginBottom = '5px';
            div.innerHTML = `<span><b>${r.id}</b>: ${r.name}</span> <span style="cursor:pointer;color:red;" onclick="SettingsManager.deleteRole('${r.id}')">&times;</span>`;
            rList.appendChild(div);
        });

        const aList = getEl('setAbsenceList');
        aList.innerHTML = '';
        State.settings.absences.forEach(a => {
            const div = document.createElement('div');
            div.style.display = 'flex'; div.style.justifyContent = 'space-between'; div.style.marginBottom = '5px';
            div.innerHTML = `<span><b>${a.id}</b>: ${a.name}</span> <span style="cursor:pointer;color:red;" onclick="SettingsManager.deleteAbsence('${a.id}')">&times;</span>`;
            aList.appendChild(div);
        });
    },
    addRole: () => {
        const name = getEl('setNewRole').value.trim();
        if(!name) return;
        const id = generateId('rid');
        State.settings.roles.push({ id, name });
        getEl('setNewRole').value = '';
        SettingsManager.renderLists();
    },
    deleteRole: (id) => {
        State.settings.roles = State.settings.roles.filter(r => r.id !== id);
        SettingsManager.renderLists();
    },
    addAbsence: () => {
        const name = getEl('setNewAbsence').value.trim();
        if(!name) return;
        const id = generateId('aid');
        State.settings.absences.push({ id, name });
        getEl('setNewAbsence').value = '';
        SettingsManager.renderLists();
    },
    deleteAbsence: (id) => {
        State.settings.absences = State.settings.absences.filter(a => a.id !== id);
        SettingsManager.renderLists();
    },
    save: () => {
        State.settings.fyStartMonth = parseInt(getEl('setFyStart').value);
        // Roles and Absences are updated in real-time in State, so just close
        ModalManager.closeModal('settingsModal');
        // Refresh UI if needed (dates might change)
        App.updateDateUI();
        renderBoard();
    }
};

export const SkillManager = {
    render: () => {
        const grid = getEl('skillsGrid');
        if (!grid) return;
        grid.innerHTML = '';
        
        State.skills.forEach((s, index) => {
            const card = document.createElement('div');
            card.className = 'assignment-card';
            card.style.background = 'var(--card-bg)';
            card.style.border = '1px solid var(--border)';
            card.style.borderRadius = '8px';
            card.style.padding = '1rem';
            card.style.position = 'relative';
            card.style.cursor = 'pointer';
            card.style.borderLeft = `4px solid #03a9f4`;
            card.onclick = () => SkillManager.openModal(index);

            let html = `<div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:0.5rem;">
                            <h4 style="margin:0; font-size:1rem; color:var(--text-main);">${s.name}</h4>
                        </div>`;
            
            if (s.description) {
                html += `<div style="font-size:0.8rem; color:var(--text-muted); margin-bottom:0.8rem; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">${s.description}</div>`;
            }
            
            card.innerHTML = html;
            grid.appendChild(card);
        });
    },
    openModal: (index) => {
        getEl('skillModalTitle').innerText = index === -1 ? 'Add Skill' : 'Edit Skill';
        getEl('editSkillIndex').value = index;
        
        const s = index > -1 ? State.skills[index] : { name: '', description: '' };
        
        getEl('skName').value = s.name;
        getEl('skDesc').value = s.description;
        
        getEl('btnDelSkill').style.display = index === -1 ? 'none' : 'block';
        ModalManager.openModal('skillModal');
    },
    submitSkill: () => {
        const index = parseInt(getEl('editSkillIndex').value);
        const name = getEl('skName').value.trim();
        if(!name) return App.alert("Skill Name is required");
        
        const newSkill = {
            name,
            description: getEl('skDesc').value.trim()
        };
        
        if(index === -1) {
            newSkill.id = generateId('sid');
            State.skills.push(newSkill);
        } else {
            newSkill.id = State.skills[index].id;
            State.skills[index] = newSkill;
        }
        
        ModalManager.closeModal('skillModal');
        SkillManager.render();
    },
    deleteSkill: () => {
        const index = parseInt(getEl('editSkillIndex').value);
        if(index > -1) {
            App.confirm("Delete this skill?", () => {
                State.skills.splice(index, 1);
                ModalManager.closeModal('skillModal');
                SkillManager.render();
            });
        }
    }
};

export const TeamDataManager = {
    openImportModal: () => {
        const fileIn = getEl('teamDataFileInput');
        if(fileIn) fileIn.value = '';
        ModalManager.openModal('importTeamDataModal');
    },
    importJSON: () => {
        const fileIn = getEl('teamDataFileInput');
        const file = fileIn.files[0];
        if(!file) return App.alert("Please select a JSON file.");
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if(!data.roles && !data.skills && !data.users && !data.teams) {
                    return App.alert("Invalid User Data JSON format.");
                }
                
                let imported = { r:0, s:0, u:0, t:0 };
                
                // Roles
                if(data.roles) {
                    data.roles.forEach(r => {
                        const exists = State.assignments.some(a => a.id === r.id);
                        if(!exists) {
                            State.assignments.push({
                                id: r.id,
                                name: r.name,
                                description: r.description,
                                class: 'Role',
                                color: '#03dac6',
                                priority: 'Med'
                            });
                            imported.r++;
                            const num = parseInt(r.id.substring(3));
                            if(!isNaN(num) && num > State.counters.rid) State.counters.rid = num;
                        }
                    });
                }
                
                // Skills
                if(data.skills) {
                    data.skills.forEach(s => {
                        const exists = State.skills.some(ex => ex.id === s.id);
                        if(!exists) {
                            State.skills.push({ id: s.id, name: s.name, description: s.description });
                            imported.s++;
                            const num = parseInt(s.id.substring(3));
                            if(!isNaN(num) && num > State.counters.sid) State.counters.sid = num;
                        }
                    });
                }
                
                // Users
                if(data.users) {
                    data.users.forEach(u => {
                        const exists = State.members.some(m => m.id === u.id);
                        if(!exists) {
                            State.members.push({
                                id: u.id,
                                name: u.name,
                                roleId: u.roleIds ? u.roleIds[0] : '',
                                roleIds: u.roleIds,
                                startDate: u.engagement?.startDate || '',
                                endDate: u.engagement?.endDate || '',
                                engagementType: u.engagement?.type || '',
                                skills: u.skills,
                                absences: u.absences,
                                lastWeek: { onCall: [], tasks: [] },
                                thisWeek: { load: [], onCall: [], tasks: [] },
                                nextWeek: { load: [], onCall: [], tasks: [] },
                                objectives: []
                            });
                            imported.u++;
                            const num = parseInt(u.id.substring(3));
                            if(!isNaN(num) && num > State.counters.uid) State.counters.uid = num;
                        }
                    });
                }
                
                // Teams
                if(data.teams) {
                    data.teams.forEach(t => {
                        const exists = State.teams.some(ex => ex.id === t.id);
                        if(!exists) {
                            State.teams.push(t);
                            imported.t++;
                            const num = parseInt(t.id.substring(4));
                            if(!isNaN(num) && num > State.counters.tmid) State.counters.tmid = num;
                        }
                    });
                }
                
                App.alert(`Imported: ${imported.r} Roles, ${imported.s} Skills, ${imported.u} Users, ${imported.t} Teams.`);
                ModalManager.closeModal('importTeamDataModal');
                renderBoard();
                
            } catch(err) {
                console.error(err);
                App.alert("Error parsing JSON.");
            }
        };
        reader.readAsText(file);
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
                console.log("Loaded keys:", Object.keys(data));
                
                if(data.trackers || data.members || data.settings) {
                    
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
