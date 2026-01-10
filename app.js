// --- STATE ---
        let teamData = { title: "Server Platforms", additionalInfo: "", trackers: [], members: [] };
        let currentTrackerType = 'gauge';
        let confirmCallback = null;

        // --- DATES ---
        const formatDate = (date) => date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
        const getRanges = () => {
            const today = new Date(); const d = today.getDay(); const diff = d === 0 ? -6 : 1 - d;
            const cm = new Date(today); cm.setDate(today.getDate() + diff); const cf = new Date(cm); cf.setDate(cm.getDate() + 4);
            const nm = new Date(cm); nm.setDate(cm.getDate() + 7); const nf = new Date(nm); nf.setDate(nm.getDate() + 4);
            return { current: `${formatDate(cm)} - ${formatDate(cf)}`, next: `${formatDate(nm)} - ${formatDate(nf)}` };
        };
        const initDates = () => {
            const r = getRanges();
            document.getElementById('dateRangeDisplay').innerText = `Current: ${r.current} | Next: ${r.next}`;
            document.getElementById('overviewTitleCurrent').innerHTML = `Top 5 Team Achievements <span class="date-suffix">${r.current}</span>`;
            document.getElementById('overviewTitleNext').innerHTML = `Top 5 Activities Next Week <span class="date-suffix">${r.next}</span>`;
        };
        initDates();

        // --- CUSTOM ALERTS ---
        const openAlert = (msg) => { document.getElementById('alertMessage').innerText = msg; document.getElementById('alertModal').classList.add('active'); };
        const openConfirm = (msg, callback) => { document.getElementById('confirmMessage').innerText = msg; confirmCallback = callback; document.getElementById('confirmModal').classList.add('active'); };
        document.getElementById('confirmYesBtn').addEventListener('click', () => { if (confirmCallback) confirmCallback(); closeModal('confirmModal'); });

        // --- TITLE & PUBLISH ---
        const saveTitle = () => { teamData.title = document.getElementById('appTitle').innerText; };
        function togglePublishMode() { document.body.classList.toggle('publishing'); }

        // --- TOOLTIP ---
        const tooltip = document.getElementById('globalTooltip');
        const showTooltip = (e, text) => { if(!text)return; tooltip.innerText=text; tooltip.style.display='block'; positionTooltip(e); };
        const hideTooltip = () => { tooltip.style.display='none'; };
        const positionTooltip = (e) => {
            const m = 15; let l = e.pageX + m; let t = e.pageY + m; const r = tooltip.getBoundingClientRect();
            if(l+r.width > window.innerWidth) l=e.pageX-r.width-m; if(t+r.height > window.innerHeight) t=e.pageY-r.height-m;
            tooltip.style.left=l+'px'; tooltip.style.top=t+'px';
        };
        document.body.addEventListener('mousemove', (e) => { if(e.target.classList.contains('help-icon')) showTooltip(e, e.target.getAttribute('data-text')); else hideTooltip(); });

// --- RENDER ---
        const parseMd = (t) => { if(!t)return'';
            let h = t.replace(/&/g,"&amp;").replace(/</g,"&lt;")
                     .replace(/\*\*(.*?)\*\*/g,'<b>$1</b>')
                     .replace(/\*(.*?)\*/g,'<i>$1</i>')
                     // Fix: Ensure link has https if missing
                     .replace(/\[(.*?)\]\((.*?)\)/g, (match, text, url) => {
                         let finalUrl = url;
                         if(!/^https?:\/\//i.test(url)) finalUrl = 'https://' + url;
                         return `<a href="${finalUrl}" target="_blank">${text}</a>`;
                     });
            return h.split('\n').map(l=>l.trim().startsWith('- ')?`<li>${l.substring(2)}</li>`:l+'<br>').join('').replace(/<\/li><br><li>/g,'</li><li>').replace(/<br><li>/g,'<ul><li>').replace(/<\/li><br>/g,'</li></ul>');
        };

        const renderBoard = () => {
            document.getElementById('appTitle').innerText = teamData.title || "Server Platforms";
            const sL = document.getElementById('teamSuccessList'); const aL = document.getElementById('teamActivityList');
            sL.innerHTML=''; aL.innerHTML=''; let sc=0, ac=0;
            teamData.members.forEach(m => {
                m.lastWeek.tasks.forEach(t=>{if(t.isTeamSuccess&&t.text.trim()){sc++;sL.innerHTML+=`<li class="auto-item"><b>${m.name}:</b> ${t.text}</li>`}});
                m.nextWeek.tasks.forEach(t=>{if(t.isTeamActivity&&t.text.trim()){ac++;aL.innerHTML+=`<li class="auto-item"><b>${m.name}:</b> ${t.text}</li>`}});
            });
            if(sc===0) sL.innerHTML='<li>No items selected.</li>'; if(ac===0) aL.innerHTML='<li>No items selected.</li>';
            document.getElementById('additionalInfoPreview').innerHTML = parseMd(teamData.additionalInfo) || "No additional info.";

            const tGrid = document.getElementById('trackerGrid'); tGrid.innerHTML='';
            (teamData.trackers || []).forEach((t, i) => {
                const card = document.createElement('div'); card.className='tracker-card';
                card.onclick = () => handleTrackerClick(i);

                let visualHTML = '', statsHTML = '';

                // Convert legacy line types to new format for rendering
                if(t.type === 'line1' || t.type === 'line2') {
                    const labels = t.data.map(d => d.label);
                    const series = [];
                    // Series 1
                    series.push({
                        name: t.y1Leg || 'Series 1',
                        color: t.color1 || 'var(--chart-1)',
                        values: t.data.map(d => d.y1 || 0)
                    });
                    // Series 2 (only if line2)
                    if(t.type === 'line2') {
                        series.push({
                            name: t.y2Leg || 'Series 2',
                            color: t.color2 || 'var(--chart-2)',
                            values: t.data.map(d => d.y2 || 0)
                        });
                    }
                    visualHTML = `<div style="width:100%; height:120px; margin-bottom:10px;">${createLineChartSVG(labels, series)}</div>`;
                }
                else if(t.type === 'line') {
                    visualHTML = `<div style="width:100%; height:120px; margin-bottom:10px;">${createLineChartSVG(t.labels, t.series)}</div>`;
                }
                else if(t.type === 'bar') visualHTML = `<div style="width:100%; height:120px; margin-bottom:10px;">${createBarChartSVG(t.data, t.yLabel, t.color1)}</div>`;
                else {
                    const pct=t.total>0?Math.round((t.completed/t.total)*100):0;
                    const c1 = t.color1 || '#00e676'; const c2 = t.color2 || '#ff1744';
                    const grad = `conic-gradient(${c1} 0% ${pct}%, ${c2} ${pct}% 100%)`;
                    visualHTML = `<div class="pie-chart" style="background:${grad}"><div class="pie-overlay"><div class="pie-pct">${pct}%</div></div></div>`;
                    statsHTML = `<div class="tracker-stats">${t.completed} / ${t.total} ${t.metric}</div>`;
                }
                card.innerHTML = `<button class="btn-del-tracker" onclick="event.stopPropagation(); deleteTracker(${i})">&times;</button><div class="tracker-desc">${t.desc}</div><div class="tracker-viz-container">${visualHTML}</div>${statsHTML}`;
                tGrid.appendChild(card);
            });

            const grid = document.getElementById('teamGrid'); grid.innerHTML='';
            teamData.members.forEach((m, i) => {
                let lw=''; m.lastWeek.tasks.forEach((t,x)=>{if(t.text.trim())lw+=`<li class="card-task-li" onclick="event.stopPropagation()"><input type="checkbox" ${t.isTeamSuccess?'checked':''} onchange="toggleSuccess(${i},${x})"><span>${t.text}</span></li>`});
                let nw=''; m.nextWeek.tasks.forEach((t,x)=>{if(t.text.trim())nw+=`<li class="card-task-li" onclick="event.stopPropagation()"><input type="checkbox" ${t.isTeamActivity?'checked':''} onchange="toggleActivity(${i},${x})"><span>${t.text}</span></li>`});
                const mg=(a)=>a.map((v,k)=>`<div class="dm-box"><span class="dm-day">${['M','T','W','T','F'][k]}</span><span class="dm-val val-${v}">${v}</span></div>`).join('');
                const c = document.createElement('div'); c.className='member-card'; c.onclick=()=>openUserModal(i);
                c.innerHTML=`<div class="member-name-row">${m.name}</div><div class="card-half card-top"><div class="half-header"><span class="half-label">Last Week (Successes)</span><div class="gauge-container">${createGauge(m.lastWeek.load)}</div></div><ul class="card-task-list">${lw||'<li>No tasks</li>'}</ul><div class="daily-mini-grid">${mg(m.lastWeek.load)}</div></div><div class="card-half card-bottom"><div class="half-header"><span class="half-label">Next Week (Priorities)</span><div class="gauge-container">${createGauge(m.nextWeek.load)}</div></div><ul class="card-task-list">${nw||'<li>No tasks</li>'}</ul><div class="daily-mini-grid">${mg(m.nextWeek.load)}</div></div>`;
                grid.appendChild(c);
            });
        };

        // --- ACTIONS ---
        function countSelected(type) { let c=0; teamData.members.forEach(m=>{ (type==='success'?m.lastWeek.tasks:m.nextWeek.tasks).forEach(t=>{if(type==='success'?t.isTeamSuccess:t.isTeamActivity)c++}) }); return c; }
        function toggleSuccess(i,x) { const t=teamData.members[i].lastWeek.tasks[x]; if(!t.isTeamSuccess&&countSelected('success')>=5){openAlert('Max 5 items.');renderBoard();return;} t.isTeamSuccess=!t.isTeamSuccess; renderBoard(); }
        function toggleActivity(i,x) { const t=teamData.members[i].nextWeek.tasks[x]; if(!t.isTeamActivity&&countSelected('activity')>=5){openAlert('Max 5 items.');renderBoard();return;} t.isTeamActivity=!t.isTeamActivity; renderBoard(); }
        function resetSelections(type) { openConfirm(`Reset all ${type==='success'?'Achievement':'Activity'} selections?`, () => { teamData.members.forEach(m => { (type==='success'?m.lastWeek.tasks:m.nextWeek.tasks).forEach(t => t[type==='success'?'isTeamSuccess':'isTeamActivity'] = false); }); renderBoard(); }); }

        function handleTrackerClick(i) {
            if(document.body.classList.contains('publishing')) openChartViewModal(i);
            else openTrackerModal(i);
        }

        function handleOverviewClick(type) {
            if(!document.body.classList.contains('publishing')) return;
            let title = '', content = '';
            if(type === 'success') { title = "Top 5 Achievements"; content = document.getElementById('teamSuccessList').innerHTML; }
            if(type === 'activity') { title = "Top 5 Activities"; content = document.getElementById('teamActivityList').innerHTML; }
            document.getElementById('zoomTitle').innerText = title;
            document.getElementById('zoomBody').className = 'zoom-body-text';
            document.getElementById('zoomBody').innerHTML = `<div class="zoomed-content"><ul>${content}</ul></div>`;
            document.getElementById('zoomModal').classList.add('active');
        }

        function handleInfoClick() {
            if(document.body.classList.contains('publishing')) {
                document.getElementById('zoomTitle').innerText = "Additional Info";
                document.getElementById('zoomBody').className = 'zoom-body-text';
                document.getElementById('zoomBody').innerHTML = `<div class="zoomed-content">${document.getElementById('additionalInfoPreview').innerHTML}</div>`;
                document.getElementById('zoomModal').classList.add('active');
            } else {
                openInfoModal();
            }
        }

        // --- MODALS ---
        function closeModal(id){document.getElementById(id).classList.remove('active');}

        function openChartViewModal(i) {
            const t = teamData.trackers[i];
            document.getElementById('zoomTitle').innerText = t.desc;
            let content = '';
            // NATIVE SCALING IN MODAL
            if(t.type === 'line1' || t.type === 'line2') {
                 const labels = t.data.map(d => d.label);
                 const series = [];
                 series.push({ name: t.y1Leg||'Series 1', color: t.color1||'#03dac6', values: t.data.map(d=>d.y1||0) });
                 if(t.type === 'line2') series.push({ name: t.y2Leg||'Series 2', color: t.color2||'#ff4081', values: t.data.map(d=>d.y2||0) });
                 content = createLineChartSVG(labels, series);
            }
            else if(t.type === 'line') content = createLineChartSVG(t.labels, t.series);
            else if(t.type === 'bar') content = createBarChartSVG(t.data, t.yLabel, t.color1);
            else {
                const pct=t.total>0?Math.round((t.completed/t.total)*100):0;
                const c1 = t.color1 || '#00e676'; const c2 = t.color2 || '#ff1744';
                const grad = `conic-gradient(${c1} 0% ${pct}%, ${c2} ${pct}% 100%)`;
                content = `<div class="pie-chart" style="width:300px; height:300px; background:${grad}"><div class="pie-overlay" style="width:260px; height:260px;"><div class="pie-pct" style="font-size:3rem;">${pct}%</div><div style="margin-top:10px; color:#aaa;">${t.completed} / ${t.total}</div></div></div>`;
            }
            document.getElementById('zoomBody').className = 'zoom-body-chart';
            document.getElementById('zoomBody').innerHTML = `<div style="width:100%; height:100%;">${content}</div>`;
            document.getElementById('zoomModal').classList.add('active');
        }

        function openUserModal(i=-1){
            if(document.body.classList.contains('publishing')) return;
            document.getElementById('editIndex').value=i; document.getElementById('deleteBtn').style.display=i===-1?'none':'block'; document.getElementById('modalTitle').innerText=i===-1?'Add New User':'Edit User';
            const m=i>-1?teamData.members[i]:null;
            document.getElementById('mName').value=m?m.name:'';
            ['lwTask1','lwTask2','lwTask3','nwTask1','nwTask2','nwTask3'].forEach((id,k)=>document.getElementById(id).value=m?(k<3?m.lastWeek.tasks[k]?.text||'':m.nextWeek.tasks[k-3]?.text||''):'');
            for(let j=0;j<5;j++){document.getElementById(`lw${j}`).value=m?m.lastWeek.load[j]:'L';document.getElementById(`nw${j}`).value=m?m.nextWeek.load[j]:'L';}
            document.getElementById('userModal').classList.add('active');
        }
        function submitUser(){
            const i=parseInt(document.getElementById('editIndex').value); const n=document.getElementById('mName').value; if(!n)return openAlert('Name required');
            const gl=(p)=>[0,1,2,3,4].map(x=>document.getElementById(`${p}${x}`).value);
            const bt=(p,t,old)=>{const txts=[1,2,3].map(x=>document.getElementById(`${p}Task${x}`).value); return txts.map((txt,k)=>{const k2=t==='lw'?'isTeamSuccess':'isTeamActivity';return{text:txt,[k2]:old&&old[k]?old[k][k2]:false}})};
            const old=i>-1?teamData.members[i]:null;
            const u={id:old?old.id:Date.now(),name:n,lastWeek:{tasks:bt('lw','lw',old?old.lastWeek.tasks:null),load:gl('lw')},nextWeek:{tasks:bt('nw','nw',old?old.nextWeek.tasks:null),load:gl('nw')}};
            if(i>-1)teamData.members[i]=u; else teamData.members.push(u); closeModal('userModal'); renderBoard();
        }
        function deleteUser(){openConfirm('Delete user?', () => {teamData.members.splice(document.getElementById('editIndex').value,1);closeModal('userModal');renderBoard();});}
        function openInfoModal(){document.getElementById('additionalInfoInput').value=teamData.additionalInfo||'';document.getElementById('infoModal').classList.add('active');}
        function saveAdditionalInfo(){teamData.additionalInfo=document.getElementById('additionalInfoInput').value;closeModal('infoModal');renderBoard();}

// --- TRACKER MODAL ---
        function setTrackerType(t) {
            currentTrackerType = t;
            ['Gauge','Bar','Line'].forEach(x => {
                const btn = document.getElementById(`type${x}Btn`);
                if(btn) btn.className = t === x.toLowerCase() ? 'type-option active' : 'type-option';
                const div = document.getElementById(`${x.toLowerCase()}Inputs`);
                if(div) div.style.display = t === x.toLowerCase() ? 'block' : 'none';
            });
            // Show secondary color ONLY for gauge (Line uses individual series colors)
            const showSec = (t === 'gauge');
            document.getElementById('tkColor2Container').style.display = showSec ? 'block' : 'none';
            // Hide main colors for Line (handled in series)
            document.getElementById('tkColor1').closest('.input-group').style.display = (t === 'line') ? 'none' : 'block';
        }

        // Helper to add series inputs
        function addSeries(name='', color='#03dac6', vals=[]) {
            const c = document.getElementById('seriesContainer');
            if(c.children.length >= 10) return openAlert("Max 10 series.");
            const idx = c.children.length;
            const div = document.createElement('div');
            div.style.marginBottom = '1rem';
            div.style.border = '1px solid #444';
            div.style.padding = '0.5rem';
            div.style.borderRadius = '4px';

            let valInputs = '';
            for(let k=0; k<10; k++) {
                valInputs += `<input type="number" class="sv-input" data-idx="${k}" value="${vals[k]||''}" placeholder="${k+1}" style="width:100%; text-align:center;">`;
            }

            div.innerHTML = `
                <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                    <input type="text" class="s-name" value="${name}" placeholder="Series Name" style="width:60%;">
                    <input type="color" class="s-color" value="${color}" style="width:30px; height:30px; padding:0; border:none; cursor:pointer;">
                    <button class="btn-reset" style="color:red; border-color:red;" onclick="this.parentElement.parentElement.remove()">Del</button>
                </div>
                <div style="display:grid; grid-template-columns:repeat(10, 1fr); gap:2px;">${valInputs}</div>
            `;
            c.appendChild(div);
        }

        function openTrackerModal(i=-1){
            document.getElementById('editTrackerIndex').value=i; document.getElementById('trackerModalTitle').innerText=i===-1?'Add Progress Tracker':'Edit Tracker';

            // Bar inputs reset
            const bc=document.getElementById('barPointsContainer'); bc.innerHTML=''; for(let k=0;k<10;k++)bc.innerHTML+=`<div class="graph-input-grid"><input type="text" id="bLbl${k}"><input type="number" id="bVal${k}"></div>`;

            // Line inputs reset
            const lLbls = document.getElementById('lineLabelsContainer'); lLbls.innerHTML = '';
            for(let k=0; k<10; k++) lLbls.innerHTML += `<input type="text" id="axLbl${k}" placeholder="L${k+1}" style="text-align:center;">`;
            document.getElementById('seriesContainer').innerHTML = '';

            const t=i>-1?teamData.trackers[i]:null;

            // Determine type (convert legacy line1/line2 to line)
            let type = t ? t.type : 'gauge';
            if(type === 'line1' || type === 'line2') type = 'line';
            setTrackerType(type);

            // Set global colors (Gauge/Bar)
            const defC1 = (t && t.type === 'gauge') ? '#00e676' : '#03dac6';
            const defC2 = (t && t.type === 'gauge') ? '#ff1744' : '#ff4081';
            document.getElementById('tkColor1').value = t ? (t.color1 || defC1) : '#03dac6';
            document.getElementById('tkColor2').value = t ? (t.color2 || defC2) : '#ff4081';

            document.getElementById('tkDesc').value=t?t.desc:'';

            if(t && (t.type === 'line1' || t.type === 'line2')) {
                // Convert legacy data to inputs
                const labels = t.data.map(d => d.label);
                labels.forEach((l, k) => { if(k<10) document.getElementById(`axLbl${k}`).value = l; });

                // Add Series 1
                addSeries(t.y1Leg || 'Series 1', t.color1 || '#03dac6', t.data.map(d => d.y1));

                // Add Series 2 if exists
                if(t.type === 'line2') {
                    addSeries(t.y2Leg || 'Series 2', t.color2 || '#ff4081', t.data.map(d => d.y2));
                }
            } else if(t && t.type === 'line') {
                (t.labels||[]).forEach((l, k) => { if(k<10) document.getElementById(`axLbl${k}`).value = l; });
                (t.series||[]).forEach(s => addSeries(s.name, s.color, s.values));
            } else if(t && t.type === 'bar'){
                document.getElementById('tkBarYLabel').value=t.yLabel||'';
                (t.data||[]).forEach((d,k)=>{if(k<10){document.getElementById(`bLbl${k}`).value=d.label;document.getElementById(`bVal${k}`).value=d.val;}});
            } else {
                // Gauge defaults
                document.getElementById('tkMetric').value=t?t.metric:''; document.getElementById('tkComp').value=t?t.completed:''; document.getElementById('tkTotal').value=t?t.total:'';
            }

            // If new line chart, add 1 default series
            if((!t || type !== 'line') && currentTrackerType === 'line' && document.getElementById('seriesContainer').children.length === 0) {
                 addSeries('Series 1', '#03dac6');
            }

            document.getElementById('trackerModal').classList.add('active');
        }

        function submitTracker(){
            const i=parseInt(document.getElementById('editTrackerIndex').value); const desc=document.getElementById('tkDesc').value; if(!desc)return openAlert("Title required");
            const c1 = document.getElementById('tkColor1').value;
            const c2 = document.getElementById('tkColor2').value;
            let nt={desc,type:currentTrackerType,color1:c1,color2:c2};

            if(currentTrackerType==='gauge'){
                const m=document.getElementById('tkMetric').value, c=parseFloat(document.getElementById('tkComp').value)||0, t=parseFloat(document.getElementById('tkTotal').value)||0;
                if(t<=0)return openAlert("Total > 0 required"); if(c>t)return openAlert("Completed value cannot exceed Total value.");
                nt.metric=m;nt.completed=c;nt.total=t;
            } else if(currentTrackerType==='bar'){
                const y=document.getElementById('tkBarYLabel').value, d=[]; for(let k=0;k<10;k++){const l=document.getElementById(`bLbl${k}`).value, v=document.getElementById(`bVal${k}`).value;if(l&&v)d.push({label:l,val:parseFloat(v)})}
                if(d.length===0)return openAlert("Add data"); nt.yLabel=y;nt.data=d;
            } else if(currentTrackerType==='line') {
                // Collect labels
                const labels = [];
                for(let k=0; k<10; k++) {
                    const l = document.getElementById(`axLbl${k}`).value;
                    if(l) labels.push(l);
                }
                if(labels.length < 2) return openAlert("Add at least 2 X-Axis labels");

                // Collect series
                const series = [];
                const sDivs = document.getElementById('seriesContainer').children;
                for(let s of sDivs) {
                    const name = s.querySelector('.s-name').value;
                    const color = s.querySelector('.s-color').value;
                    const vals = [];
                    s.querySelectorAll('.sv-input').forEach((inp, k) => {
                        if(k < labels.length) vals.push(parseFloat(inp.value)||0);
                    });
                    series.push({name, color, values: vals});
                }
                if(series.length === 0) return openAlert("Add at least one series");

                nt.labels = labels;
                nt.series = series;
            }

            if(!teamData.trackers)teamData.trackers=[]; if(i>-1)teamData.trackers[i]=nt;else teamData.trackers.push(nt); closeModal('trackerModal'); renderBoard();
        }
                function deleteTracker(i){openConfirm("Delete tracker?",()=>{teamData.trackers.splice(i,1);renderBoard();});}

        function saveData(){const d="data:text/json;charset=utf-8,"+encodeURIComponent(JSON.stringify(teamData));const a=document.createElement('a');a.href=d;a.download="team_tracker.json";document.body.appendChild(a);a.click();a.remove();}
        function loadFromFile(inp){const f=inp.files[0];if(!f)return;const r=new FileReader();r.onload=e=>{try{
            const l=JSON.parse(e.target.result); if(l.members){l.members.forEach(m=>{if(typeof m.nextWeek.tasks[0]==='string')m.nextWeek.tasks=m.nextWeek.tasks.map(t=>({text:t,isTeamActivity:false}))})}
            teamData=l;renderBoard();openAlert('Data loaded!');}catch(x){openAlert('Error reading file');}};r.readAsText(f);inp.value='';}

        renderBoard();