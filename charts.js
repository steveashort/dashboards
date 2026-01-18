/**
 * SERVER PLATFORMS TRACKER - VISUALIZATIONS MODULE
 */

const sizeMap = { 'S': 200, 'M': 300, 'L': 600, 'XL': 1000 };
const getWidth = (s) => sizeMap[s] || 300;

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
    const maxCells = Math.min(total, 450);
    const cols = total > 200 ? 25 : 15;
    const cellSize = total > 200 ? 5 : 7;
    const gap = 2;
    // Calculate exact width to force wrap at 'cols'
    const gridWidth = (cols * (cellSize + gap)) - gap;
    
    let html = `<div style="display:flex; flex-wrap: wrap-reverse; gap: ${gap}px; width: ${gridWidth}px; margin: 0 auto;">`;
    for(let i=0; i<maxCells; i++) {
        // With wrap-reverse, index 0 is at the bottom row.
        // As i increases, it fills left-to-right, then moves to the row ABOVE.
        const isActive = i < active;
        html += `<div class="waffle-cell" style="width:${cellSize}px; height:${cellSize}px; flex: 0 0 ${cellSize}px; ${isActive ? `background-color:${colorVal}; box-shadow: 0 0 5px ${colorVal}` : `background-color:${colorBg}`}"></div>`;
    }
    html += '</div>';
    return html;
};

export const Visuals = {
    showTooltip: (evt, text) => {
        const tt = document.getElementById('globalTooltip');
        if (tt) {
            tt.innerHTML = text;
            tt.style.display = 'block';
            tt.style.left = (evt.pageX + 15) + 'px';
            tt.style.top = (evt.pageY + 15) + 'px';
        }
    },
    hideTooltip: () => {
        const tt = document.getElementById('globalTooltip');
        if (tt) tt.style.display = 'none';
    },

    createLineChartSVG: (labels, series, yLabel, size = 'M') => {
        let max = 0;
        series.forEach(s => s.values.forEach(v => { if(v > max) max = v; }));
        if(max===0) max=10;
        const w=getWidth(size); const h=180; const pTop=30; const pBot=45; const pSide=30; 
        const gw=(w-(pSide*2))/(labels.length-1||1), uh=h-pTop-pBot;

        let yGrid = '';
        [0, 0.25, 0.5, 0.75, 1].forEach(p => {
            const y = h - pBot - (p * uh);
            const val = Math.round(max * p);
            yGrid += `<line x1="${pSide}" y1="${y}" x2="${w-pSide}" y2="${y}" stroke="#333" stroke-dasharray="2,2" /><text x="${pSide-5}" y="${y+3}" text-anchor="end" fill="#666" font-size="9">${val}</text>`;
        });

        let paths = '';
        let points = '';

        series.forEach((s, si) => {
            let p = '';
            s.values.forEach((v, i) => {
                const x = pSide + (i*gw);
                const y = h-pBot - (v/max)*uh;
                p += (i===0?'M':'L') + `${x},${y} `;
                
                const tooltipText = `${s.name} • ${labels[i]}: ${v}`;
                points += `<circle cx="${x}" cy="${y}" r="4" fill="${s.color}" style="cursor:pointer;" onmousemove="Visuals.showTooltip(event, '${tooltipText}')" onmouseout="Visuals.hideTooltip()"></circle>`;
            });
            paths += `<path d="${p}" fill="none" stroke="${s.color}" stroke-width="2"/>`;
        });

        // Date Formatter
        const fmt = (s) => {
            if (/^\d{4}$/.test(s)) return "'" + s.substring(2); 
            if (/^\d{4}-\d{2}$/.test(s)) { 
                const d = new Date(s + "-01");
                return d.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' }); 
            }
            if (/^\d{4}-\d{2}-\d{2}$/.test(s)) { 
                const d = new Date(s);
                return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
            }
            return s; 
        };

        let lbls = '';
        const skip = labels.length > 30 ? Math.ceil(labels.length / 20) : 1;
        labels.forEach((l, i) => {
            if (i % skip !== 0) return;
            const x = pSide + (i*gw);
            const txt = fmt(l);
            lbls += `<text transform="translate(${x}, ${h-35}) rotate(45)" text-anchor="start" fill="#aaa" font-size="9">${txt}</text>`;
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

        return `<svg width="100%" height="100%" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><line x1="${pSide}" y1="${h-pBot}" x2="${w-pSide}" y2="${h-pBot}" stroke="#444"/>${yGrid}${yAxisLabel}${paths}${points}${lbls}${legHTML}</svg>`;
    },

    createMultiBarChartSVG: (labels, series, yLabel, size = 'M') => {
        let max = 0;
        series.forEach(s => s.values.forEach(v => { if(v > max) max = v; }));
        if(max === 0) max = 10;

        const w=getWidth(size); const h=180; const pTop=20; const pBot=45; const pSide=30; 
        const groupWidth = (w-(pSide*2)) / labels.length;
        const barWidth = (groupWidth * 0.8) / series.length; 
        const uh = h-pTop-pBot;

        let yGrid = '';
        [0, 0.25, 0.5, 0.75, 1].forEach(p => {
            const y = h - pBot - (p * uh);
            const val = Math.round(max * p);
            yGrid += `<line x1="${pSide}" y1="${y}" x2="${w-pSide}" y2="${y}" stroke="#333" stroke-dasharray="2,2" /><text x="${pSide-5}" y="${y+3}" text-anchor="end" fill="#666" font-size="9">${val}</text>`;
        });

        let rects = '';
        series.forEach((s, si) => {
            s.values.forEach((v, i) => {
                const bh = (v/max) * uh;
                const x = pSide + (i * groupWidth) + (groupWidth * 0.1) + (si * barWidth); 
                const y = h-pBot-bh;
                const tooltipText = `${s.name} • ${labels[i]}: ${v}`;
                rects += `<rect x="${x}" y="${y}" width="${barWidth-1}" height="${bh}" fill="${s.color}" rx="1" style="cursor:pointer;" onmousemove="Visuals.showTooltip(event, '${tooltipText}')" onmouseout="Visuals.hideTooltip()"></rect>`;
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

        const yAxisLabel = yLabel ? `<text transform="rotate(-90 10,${h/2})" x="10" y="${h/2}" text-anchor="middle" fill="#aaa" font-size="10">${yLabel}</text>` : '';

        return `<svg width="100%" height="100%" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><line x1="${pSide}" y1="${h-pBot}" x2="${w-pSide}" y2="${h-pBot}" stroke="#444"/>${yGrid}${yAxisLabel}${rects}${lbls}${legHTML}</svg>`;
    },

    createBarChartSVG: (data, yLabel, color, size = 'M') => {
        let max = 0; 
        data.forEach(d => { if(d.val > max) max = d.val; }); 
        if(max === 0) max = 10;
        const w=getWidth(size); const h=180; const pTop=20; const pBot=45; const pSide=30; 
        const bw=(w-(pSide*2))/data.length, uh=h-pTop-pBot;

        let yGrid = '';
        [0, 0.25, 0.5, 0.75, 1].forEach(p => {
            const y = h - pBot - (p * uh);
            const val = Math.round(max * p);
            yGrid += `<line x1="${pSide}" y1="${y}" x2="${w-pSide}" y2="${y}" stroke="#333" stroke-dasharray="2,2" /><text x="${pSide-5}" y="${y+3}" text-anchor="end" fill="#666" font-size="9">${val}</text>`;
        });

        let bars='';
        const fill = color || 'var(--chart-1)';
        data.forEach((d, i) => {
            const bh=(d.val/max)*uh; 
            const x=pSide+(i*bw)+5; 
            const y=h-pBot-bh;
            const tooltipText = `${d.label}: ${d.val}`;
            bars+=`<rect x="${x}" y="${y}" width="${bw-10}" height="${bh}" fill="${fill}" rx="2" style="cursor:pointer;" onmousemove="Visuals.showTooltip(event, '${tooltipText}')" onmouseout="Visuals.hideTooltip()"></rect><text x="${x+(bw-10)/2}" y="${y-5}" text-anchor="middle" fill="#fff" font-size="10">${d.val}</text>`;
            
            const rotate = d.label.length > 4;
            if (rotate) {
                bars+=`<text transform="translate(${x+(bw-10)/2}, ${h-35}) rotate(45)" text-anchor="start" fill="#aaa" font-size="10">${d.label.substring(0,8)}</text>`;
            } else {
                bars+=`<text x="${x+(bw-10)/2}" y="${h-15}" text-anchor="middle" fill="#aaa" font-size="10">${d.label.substring(0,5)}</text>`;
            }
        });
        return `<svg width="100%" height="100%" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><line x1="${pSide}" y1="${h-pBot}" x2="${w-pSide}" y2="${h-pBot}" stroke="#444"/>${yGrid}<text transform="rotate(-90 10,${h/2})" x="10" y="${h/2}" text-anchor="middle" fill="#aaa" font-size="10">${yLabel}</text>${bars}</svg>`;
    },

    createRAGIconHTML: (status) => {
        const size = 80;
        let svg = '';
        if (status === 'red') {
            svg = `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M7.86 2H16.14L22 7.86V16.14L16.14 22H7.86L2 16.14V7.86L7.86 2Z" fill="#DC2626" stroke="#DC2626" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M15 9L9 15" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M9 9L15 15" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>`;
        } else if (status === 'amber') {
            svg = `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10.29 3.86L1.82 18C1.64556 18.3024 1.55293 18.6453 1.55196 18.9945C1.55098 19.3437 1.64171 19.6871 1.81506 19.991C1.98841 20.2949 2.23846 20.5487 2.54076 20.7275C2.84306 20.9063 3.18721 21.0041 3.54 21H20.46C20.8128 21.0041 21.1569 20.9063 21.4592 20.7275C21.7615 20.5487 22.0116 20.2949 22.1849 19.991C22.3583 19.6871 22.449 19.3437 22.448 18.9945C22.4471 18.6453 22.3544 18.3024 22.18 18L13.71 3.86C13.5317 3.56613 13.2807 3.32314 12.9812 3.15449C12.6817 2.98585 12.3437 2.89722 12 2.89722C11.6563 2.89722 11.3183 2.98585 11.0188 3.15449C10.7193 3.32314 10.4683 3.56613 10.29 3.86V3.86Z" fill="#D97706" stroke="#D97706" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M12 9V13" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M12 17H12.01" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>`;
        } else if (status === 'green') {
            svg = `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22 11.08V12C21.9988 14.1564 21.3005 16.2547 20.0093 17.9818C18.7182 19.709 16.9033 20.9725 14.8354 21.5839C12.7674 22.1953 10.5573 22.1219 8.53447 21.3746C6.51168 20.6273 4.78465 19.2461 3.61096 17.4371C2.43727 15.628 1.87979 13.4881 2.02168 11.3363C2.16356 9.18455 2.99721 7.13631 4.39828 5.49706C5.79935 3.85781 7.69279 2.71537 9.79619 2.24013C11.8996 1.7649 14.1003 1.98232 16.07 2.85999" stroke="#16A34A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M22 4L12 14.01L9 11.01" stroke="#16A34A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>`;
        } else {
            svg = `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" fill="#9CA3AF" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>`;
        }
        return `<div style="display:flex; justify-content:center; align-items:center;">${svg}</div>`;
    },

    createDonutChartSVG: (labels, values, size = 'M') => {
        const w = getWidth(size);
        const h = 180;
        const centerX = w / 2;
        const centerY = h / 2;
        const radius = 80;
        const thickness = 30;
        const innerRadius = radius - thickness;

        const total = values.reduce((a, b) => a + b, 0);
        if (total === 0) return `<svg width="${w}" height="${h}"><circle cx="${centerX}" cy="${centerY}" r="${radius}" fill="none" stroke="#333" stroke-width="${thickness}"/><text x="${centerX}" y="${centerY}" text-anchor="middle" dominant-baseline="middle" fill="#666" font-size="12">No Data</text></svg>`;

        let startAngle = 0;
        let paths = '';
        const colors = ['#03dac6', '#ff4081', '#bb86fc', '#cf6679', '#00e676', '#ffb300', '#018786', '#3700b3', '#03a9f4', '#ffeb3b'];

        values.forEach((v, i) => {
            const percentage = (v / total);
            const angle = percentage * 360;
            const endAngle = startAngle + angle;

            const x1 = centerX + radius * Math.cos((startAngle - 90) * Math.PI / 180);
            const y1 = centerY + radius * Math.sin((startAngle - 90) * Math.PI / 180);
            const x2 = centerX + radius * Math.cos((endAngle - 90) * Math.PI / 180);
            const y2 = centerY + radius * Math.sin((endAngle - 90) * Math.PI / 180);

            const ix1 = centerX + innerRadius * Math.cos((startAngle - 90) * Math.PI / 180);
            const iy1 = centerY + innerRadius * Math.sin((startAngle - 90) * Math.PI / 180);
            const ix2 = centerX + innerRadius * Math.cos((endAngle - 90) * Math.PI / 180);
            const iy2 = centerY + innerRadius * Math.sin((endAngle - 90) * Math.PI / 180);

            const largeArcFlag = angle > 180 ? 1 : 0;

            const d = `
                M ${x1} ${y1}
                A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}
                L ${ix2} ${iy2}
                A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${ix1} ${iy1}
                Z
            `;

            const color = colors[i % colors.length];
            const tooltipText = `${labels[i]}: ${v}`;
            paths += `<path d="${d}" fill="${color}" stroke="#1e1e1e" stroke-width="1" style="cursor:pointer;" onmousemove="Visuals.showTooltip(event, '${tooltipText}')" onmouseout="Visuals.hideTooltip()"></path>`;

            startAngle = endAngle;
        });

        const totalText = `<text x="${centerX}" y="${centerY}" text-anchor="middle" dominant-baseline="middle" fill="#fff" font-size="24" font-weight="bold">${total}</text>`;

        return `<svg width="100%" height="100%" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid meet">${paths}<circle cx="${centerX}" cy="${centerY}" r="${innerRadius}" fill="transparent"/>${totalText}</svg>`;
    },

    createDonutChartWithCalloutsSVG: (labels, values) => {
        const w = 800;
        const h = 500;
        const cx = w / 2;
        const cy = 250;
        const r = 110;
        const thickness = 40;
        const rLabel = r + 25;
        const rEnd = r + 60;

        const total = values.reduce((a, b) => a + b, 0);
        if (total === 0) return `<svg width="${w}" height="${h}"><text x="${cx}" y="${cy}" text-anchor="middle" fill="#aaa">No Data</text></svg>`;

        let startAngle = 0;
        let paths = '';
        let annotations = '';
        const colors = ['#03dac6', '#ff4081', '#bb86fc', '#cf6679', '#00e676', '#ffb300', '#018786', '#3700b3', '#03a9f4', '#ffeb3b'];

        values.forEach((v, i) => {
            const val = v;
            const pct = val / total;
            const angle = pct * 360;
            const endAngle = startAngle + angle;
            const midAngle = startAngle + (angle / 2);

            const radStart = (startAngle - 90) * Math.PI / 180;
            const radEnd = (endAngle - 90) * Math.PI / 180;

            const x1 = cx + r * Math.cos(radStart);
            const y1 = cy + r * Math.sin(radStart);
            const x2 = cx + r * Math.cos(radEnd);
            const y2 = cy + r * Math.sin(radEnd);

            const ix1 = cx + (r - thickness) * Math.cos(radStart);
            const iy1 = cy + (r - thickness) * Math.sin(radStart);
            const ix2 = cx + (r - thickness) * Math.cos(radEnd);
            const iy2 = cy + (r - thickness) * Math.sin(radEnd);

            const largeArc = angle > 180 ? 1 : 0;

            const d = `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} L ${ix2} ${iy2} A ${r - thickness} ${r - thickness} 0 ${largeArc} 0 ${ix1} ${iy1} Z`;

            const tooltipText = `${labels[i]} • ${val} (${Math.round(pct * 100)}%)`;
            paths += `<path d="${d}" fill="${colors[i % colors.length]}" stroke="#1e1e1e" stroke-width="2" style="cursor:pointer;" onmousemove="Visuals.showTooltip(event, '${tooltipText}')" onmouseout="Visuals.hideTooltip()"/>`;

            // Callout
            const radMid = (midAngle - 90) * Math.PI / 180;
            const lx1 = cx + r * Math.cos(radMid);
            const ly1 = cy + r * Math.sin(radMid);
            const lx2 = cx + rEnd * Math.cos(radMid);
            const ly2 = cy + rEnd * Math.sin(radMid);

            const isLeft = midAngle > 180;
            const lx3 = isLeft ? lx2 - 30 : lx2 + 30;

            annotations += `<polyline points="${lx1},${ly1} ${lx2},${ly2} ${lx3},${ly2}" fill="none" stroke="${colors[i % colors.length]}" stroke-width="1.5"/>`;

            const tx = isLeft ? lx3 - 8 : lx3 + 8;
            const anchor = isLeft ? 'end' : 'start';

            annotations += `<text x="${tx}" y="${ly2}" dy="4" text-anchor="${anchor}" fill="#eee" font-size="14" font-weight="bold">${labels[i]}</text>`;
            annotations += `<text x="${tx}" y="${ly2 + 18}" dy="4" text-anchor="${anchor}" fill="#aaa" font-size="12">${val} (${Math.round(pct * 100)}%)</text>`;

            startAngle = endAngle;
        });

        const totalText = `<text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="middle" fill="#fff" font-size="24" font-weight="bold">${total}</text>`;

        return `<svg width="100%" height="100%" viewBox="0 0 ${w} ${h}">${paths}${annotations}<circle cx="${cx}" cy="${cy}" r="${r - thickness}" fill="transparent"/>${totalText}</svg>`;
    }
};