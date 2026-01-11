// --- VISUALIZATIONS ---
        const getColor = (s) => s >= 90 ? '#ff1744' : s >= 51 ? '#ffea00' : '#00e676';
        const createGauge = (loadArr) => {
            let t=0; let c=0; loadArr.forEach(v => { if(v==='H'){t+=100;c++}else if(v==='M'){t+=70;c++}else if(v==='L'){t+=30;c++} });
            const s = c===0?0:Math.round(t/c); const r=15, cx=30, cy=30; const rad=(Math.min(s,100)/100)*180*Math.PI/180;
            const bg=`M ${cx-r} ${cy} A ${r} ${r} 0 0 1 ${cx+r} ${cy}`;
            const val=s>0?`M ${cx-r} ${cy} A ${r} ${r} 0 0 1 ${cx+r*Math.cos(rad-Math.PI)} ${cy+r*Math.sin(rad-Math.PI)}`:'';
            return `<svg width="60" height="35" viewBox="0 0 60 35"><path d="${bg}" fill="none" stroke="#333" stroke-width="4" stroke-linecap="round"/><path d="${val}" fill="none" stroke="${getColor(s)}" stroke-width="4" stroke-linecap="round"/><circle cx="${cx}" cy="${cy}" r="2" fill="#fff"/></svg><div class="gauge-val" style="color:${getColor(s)}">${s}%</div>`;
        };

        const createBarChartSVG = (data, yLabel, color) => {
            let max = 0; data.forEach(d => { if(d.val > max) max = d.val; }); if(max === 0) max = 10;
            // INCREASED HEIGHT AND PADDING
            const w=300, h=180, pTop=20, pBot=50, pSide=25;
            const bw=(w-(pSide*2))/data.length, uh=h-pTop-pBot;
            let bars='';
            const fill = color || 'var(--chart-1)';
            data.forEach((d, i) => {
                const bh=(d.val/max)*uh; const x=pSide+(i*bw)+5; const y=h-pBot-bh;
                bars+=`<rect x="${x}" y="${y}" width="${bw-10}" height="${bh}" fill="${fill}" rx="2"/><text x="${x+(bw-10)/2}" y="${y-5}" text-anchor="middle" fill="#fff" font-size="10">${d.val}</text><text x="${x+(bw-10)/2}" y="${h-15}" text-anchor="middle" fill="#aaa" font-size="10">${d.label.substring(0,6)}</text>`;
            });
            // Native scaling via viewBox
            return `<svg width="100%" height="100%" viewBox="0 0 ${w} ${h}"><line x1="${pSide}" y1="${h-pBot}" x2="${w-pSide}" y2="${h-pBot}" stroke="#444"/><text transform="rotate(-90 ${pSide/2},${h/2})" x="${pSide/2}" y="${h/2}" text-anchor="middle" fill="#aaa" font-size="10">${yLabel}</text>${bars}</svg>`;
        };

        const createLineChartSVG = (labels, series) => {
            let max = 0;
            series.forEach(s => s.values.forEach(v => { if(v > max) max = v; }));
            if(max===0) max=10;

            const w=300, h=180, pTop=30, pBot=50, pSide=30;
            const gw=(w-(pSide*2))/(labels.length-1||1), uh=h-pTop-pBot;

            let paths = '';
            let points = '';

            series.forEach((s, si) => {
                let p = '';
                s.values.forEach((v, i) => {
                    const x = pSide + (i*gw);
                    const y = h-pBot - (v/max)*uh;
                    p += (i===0?'M':'L') + `${x},${y} `;
                    points += `<circle cx="${x}" cy="${y}" r="3" fill="${s.color}"/>`;
                });
                paths += `<path d="${p}" fill="none" stroke="${s.color}" stroke-width="2"/>`;
            });

            let lbls = '';
            labels.forEach((l, i) => {
                const x = pSide + (i*gw);
                lbls += `<text x="${x}" y="${h-35}" text-anchor="middle" fill="#aaa" font-size="10">${l.substring(0,5)}</text>`;
            });

            // Legend
            let legHTML = '';
            const legY = h - 10;
            const legItemW = 60;
            const totalLegW = series.length * legItemW;
            const startX = (w - totalLegW) / 2;

            series.forEach((s, i) => {
                const lx = startX + (i * legItemW);
                legHTML += `<circle cx="${lx}" cy="${legY}" r="3" fill="${s.color}"/><text x="${lx+10}" y="${legY+3}" fill="#aaa" font-size="9" text-anchor="start">${s.name.substring(0,8)}</text>`;
            });

            return `<svg width="100%" height="100%" viewBox="0 0 ${w} ${h}"><line x1="${pSide}" y1="${h-pBot}" x2="${w-pSide}" y2="${h-pBot}" stroke="#444"/>${paths}${points}${lbls}${legHTML}<text x="${pSide-5}" y="${pTop+10}" text-anchor="end" fill="#aaa" font-size="10">${max}</text><text x="${pSide-5}" y="${h-pBot}" text-anchor="end" fill="#aaa" font-size="10">0</text></svg>`;
        };