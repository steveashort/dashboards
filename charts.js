/**
 * SERVER PLATFORMS TRACKER - VISUALIZATIONS MODULE
 */

export const getColor = (s) => s >= 90 ? '#ff1744' : s >= 51 ? '#ffb300' : '#00e676';

export const createGaugeSVG = (loadArr) => {
    let t=0; let c=0; 
    loadArr.forEach(v => { 
        if(v==='H'){t+=100;c++}else if(v==='M'){t+=70;c++}else if(v==='L'){t+=30;c++} 
    });
    const s = c===0?0:Math.round(t/c); 
    const r=15, cx=30, cy=30; 
    const rad=(Math.min(s,100)/100)*180*Math.PI/180;
    const bg=`M ${cx-r} ${cy} A ${r} ${r} 0 0 1 ${cx+r} ${cy}`;
    const val=s>0?`M ${cx-r} ${cy} A ${r} ${r} 0 0 1 ${cx+r*Math.cos(rad-Math.PI)} ${cy+r*Math.sin(rad-Math.PI)}`:'';
    const color = getColor(s);
    return `<svg width="60" height="35" viewBox="0 0 60 35"><path d="${bg}" fill="none" stroke="#333" stroke-width="4" stroke-linecap="round"/><path d="${val}" fill="none" stroke="${color}" stroke-width="4" stroke-linecap="round"/><circle cx="${cx}" cy="${cy}" r="2" fill="#fff"/></svg><div class="gauge-val" style="color:${color}">${s}%</div>`;
};

export const createWaffleHTML = (total, active, colorVal, colorBg) => {
    const maxCells = 100;
    let html = '<div style="display:grid; grid-template-columns: repeat(10, 1fr); gap: 2px; width: 140px; margin: 0 auto;">';
    for(let i=0; i<maxCells; i++) {
        const row = Math.floor(i / 10);
        const col = i % 10;
        const logicalIndex = ((9 - row) * 10) + col;
        const isActive = logicalIndex < active;
        html += `<div class="waffle-cell" style="${isActive ? `background-color:${colorVal}; box-shadow: 0 0 5px ${colorVal}` : `background-color:${colorBg}`}"></div>`;
    }
    html += '</div>';
    return html;
};

export const Visuals = {
    createLineChartSVG: (labels, series, yLabel) => {
        let max = 0;
        series.forEach(s => s.values.forEach(v => { if(v > max) max = v; }));
        if(max===0) max=10;
        const w=300; const h=180; const pTop=30; const pBot=45; const pSide=20; 
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
        const rotate = labels.some(l => l.length > 4);
        labels.forEach((l, i) => {
            const x = pSide + (i*gw);
            if (rotate) {
                lbls += `<text transform="translate(${x}, ${h-35}) rotate(45)" text-anchor="start" fill="#aaa" font-size="9">${l.substring(0,8)}</text>`;
            } else {
                lbls += `<text x="${x}" y="${h-25}" text-anchor="middle" fill="#aaa" font-size="9">${l.substring(0,5)}</text>`;
            }
        });

        let legHTML = '';
        const legY = h - 5;
        const legItemW = 50;
        const totalLegW = series.length * legItemW;
        const startX = (w - totalLegW) / 2;

        series.forEach((s, i) => {
            const lx = startX + (i * legItemW);
            legHTML += `<circle cx="${lx}" cy="${legY}" r="3" fill="${s.color}"/><text x="${lx+10}" y="${legY+3}" fill="#aaa" font-size="8" text-anchor="start">${s.name.substring(0,8)}</text>`;
        });
        
        const yAxisLabel = yLabel ? `<text transform="rotate(-90 10,${h/2})" x="10" y="${h/2}" text-anchor="middle" fill="#aaa" font-size="10">${yLabel}</text>` : '';

        return `<svg width="100%" height="100%" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><line x1="${pSide}" y1="${h-pBot}" x2="${w-pSide}" y2="${h-pBot}" stroke="#444"/>${yAxisLabel}${paths}${points}${lbls}${legHTML}<text x="${pSide-2}" y="${pTop+10}" text-anchor="end" fill="#aaa" font-size="10">${max}</text><text x="${pSide-2}" y="${h-pBot}" text-anchor="end" fill="#aaa" font-size="10">0</text></svg>`;
    },

    createMultiBarChartSVG: (labels, series) => {
        let max = 0;
        series.forEach(s => s.values.forEach(v => { if(v > max) max = v; }));
        if(max === 0) max = 10;

        const w=300; const h=180; const pTop=20; const pBot=45; const pSide=20;
        const groupWidth = (w-(pSide*2)) / labels.length;
        const barWidth = (groupWidth * 0.8) / series.length; 
        const uh = h-pTop-pBot;

        let rects = '';
        series.forEach((s, si) => {
            s.values.forEach((v, i) => {
                const bh = (v/max) * uh;
                const x = pSide + (i * groupWidth) + (groupWidth * 0.1) + (si * barWidth); 
                const y = h-pBot-bh;
                rects += `<rect x="${x}" y="${y}" width="${barWidth-1}" height="${bh}" fill="${s.color}" rx="1"/>`;
            });
        });

        let lbls = '';
        const rotate = labels.some(l => l.length > 4);
        labels.forEach((l, i) => {
            const x = pSide + (i * groupWidth) + (groupWidth/2);
            if (rotate) {
                lbls += `<text transform="translate(${x}, ${h-35}) rotate(45)" text-anchor="start" fill="#aaa" font-size="9">${l.substring(0,8)}</text>`;
            } else {
                lbls += `<text x="${x}" y="${h-25}" text-anchor="middle" fill="#aaa" font-size="9">${l.substring(0,5)}</text>`;
            }
        });

        let legHTML = '';
        const legY = h - 5;
        const legItemW = 50;
        const totalLegW = series.length * legItemW;
        const startX = (w - totalLegW) / 2;

        series.forEach((s, i) => {
            const lx = startX + (i * legItemW);
            legHTML += `<circle cx="${lx}" cy="${legY}" r="3" fill="${s.color}"/><text x="${lx+10}" y="${legY+3}" fill="#aaa" font-size="8" text-anchor="start">${s.name.substring(0,8)}</text>`;
        });

        return `<svg width="100%" height="100%" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><line x1="${pSide}" y1="${h-pBot}" x2="${w-pSide}" y2="${h-pBot}" stroke="#444"/>${rects}${lbls}${legHTML}<text x="${pSide-2}" y="${pTop+10}" text-anchor="end" fill="#aaa" font-size="10">${max}</text><text x="${pSide-2}" y="${h-pBot}" text-anchor="end" fill="#aaa" font-size="10">0</text></svg>`;
    },

    createBarChartSVG: (data, yLabel, color) => {
        let max = 0; 
        data.forEach(d => { if(d.val > max) max = d.val; }); 
        if(max === 0) max = 10;
        const w=300; const h=180; const pTop=20; const pBot=45; const pSide=25; 
        const bw=(w-(pSide*2))/data.length, uh=h-pTop-pBot;
        let bars='';
        const fill = color || 'var(--chart-1)';
        data.forEach((d, i) => {
            const bh=(d.val/max)*uh; 
            const x=pSide+(i*bw)+5; 
            const y=h-pBot-bh;
            bars+=`<rect x="${x}" y="${y}" width="${bw-10}" height="${bh}" fill="${fill}" rx="2"/><text x="${x+(bw-10)/2}" y="${y-5}" text-anchor="middle" fill="#fff" font-size="10">${d.val}</text>`;
            
            const rotate = d.label.length > 4;
            if (rotate) {
                bars+=`<text transform="translate(${x+(bw-10)/2}, ${h-35}) rotate(45)" text-anchor="start" fill="#aaa" font-size="10">${d.label.substring(0,8)}</text>`;
            } else {
                bars+=`<text x="${x+(bw-10)/2}" y="${h-15}" text-anchor="middle" fill="#aaa" font-size="10">${d.label.substring(0,5)}</text>`;
            }
        });
        return `<svg width="100%" height="100%" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><line x1="${pSide}" y1="${h-pBot}" x2="${w-pSide}" y2="${h-pBot}" stroke="#444"/><text transform="rotate(-90 10,${h/2})" x="10" y="${h/2}" text-anchor="middle" fill="#aaa" font-size="10">${yLabel}</text>${bars}</svg>`;
    }
};
