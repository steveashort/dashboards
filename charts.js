/**
 * SERVER PLATFORMS TRACKER - VISUALIZATIONS MODULE
 */
import { processTokens } from './app.js';

const sizeMap = { 
    'S': 300, 'M': 600, 'L': 900, 'XL': 1200,
    '1x1': 300, '2x1': 600, '3x1': 900, '4x1': 1200, '1x2': 300, '2x2': 600, '3x2': 900, '4x2': 1200,
    '2x3': 600, '2x4': 600, '3x3': 900, '4x4': 1200, 'full': 1200
};
const getWidth = (s) => sizeMap[s] || 600;

export const getColor = (s) => s >= 90 ? '#ff1744' : s >= 51 ? '#ffb300' : '#00e676';

export const createGaugeSVG = (loadArr) => {
    let t=0; let c=0; 
    loadArr.forEach(v => { 
        if(v==='H'){t+=100;c++}else if(v==='M'){t+=70;c++}else if(v==='L'){t+=30;c++} 
    });
    const s = c===0?0:Math.round(t/c); 
    const r=15, cx=30, cy=30; 
    // Ensure s is clamped 0-100 for path calculation
    const clampedS = Math.min(Math.max(s, 0), 100);
    const rad=(clampedS/100)*180*Math.PI/180;
    const bg=`M ${cx-r} ${cy} A ${r} ${r} 0 0 1 ${cx+r} ${cy}`;
    const val=s>0?`M ${cx-r} ${cy} A ${r} ${r} 0 0 1 ${cx+r*Math.cos(rad-Math.PI)} ${cy+r*Math.sin(rad-Math.PI)}`:'';
    const color = getColor(s);
    return `<svg width="60" height="35" viewBox="0 0 60 35"><path d="${bg}" fill="none" stroke="#333" stroke-width="4" stroke-linecap="round"/><path d="${val}" fill="none" stroke="${color}" stroke-width="4" stroke-linecap="round"/><circle cx="${cx}" cy="${cy}" r="2" fill="#fff"/></svg><div class="gauge-val" style="color:${color}">${s}%</div>`;
};



export const getApexConfig = (type, data, options = {}) => {
    const palette = ['#03dac6', '#ff4081', '#bb86fc', '#cf6679', '#00e676', '#ffb300', '#018786', '#3700b3', '#03a9f4', '#ffeb3b'];
    
    let xaxisConfig = {
        categories: (data.labels || []).map(l => processTokens(l)),
        labels: { style: { colors: '#aaa' } },
        axisBorder: { show: false },
        axisTicks: { show: false }
    };
    let yaxisConfig = {
        labels: { style: { colors: '#aaa' } }
    };

    // Special handling for rangeBar
    if (type === 'rangeBar') {
        xaxisConfig = {
            type: 'numeric',
            labels: { style: { colors: '#aaa' } }
        };
        yaxisConfig = {
            categories: data.series && data.series[0] && data.series[0].data ? data.series[0].data.map(d => processTokens(d.x)) : [],
            labels: { style: { colors: '#aaa' } }
        };
    }

    const processedSeries = (data.series || []).map(s => ({
        ...s,
        name: processTokens(s.name)
    }));

    return {
        chart: {
            type: type,
            background: 'transparent',
            toolbar: { show: false },
            zoom: { enabled: false },
            animations: { enabled: false },
            height: '100%',
            width: '100%'
        },
        theme: { mode: 'dark' },
        colors: palette,
        stroke: { curve: 'smooth', width: 2 },
        dataLabels: { enabled: false },
        grid: {
            borderColor: '#333',
            strokeDashArray: 2,
        },
        xaxis: xaxisConfig,
        yaxis: yaxisConfig,
        series: processedSeries,
        legend: { labels: { colors: '#aaa' } },
        tooltip: { theme: 'dark' },
        ...options
    };
};

export const renderChart = (el, type, data, options) => {
    const config = getApexConfig(type, data, options);
    const chart = new ApexCharts(el, config);
    chart.render();
    return chart;
};

export const calculateTrackerSize = (tracker) => {
    if (tracker.size) return tracker.size;
    if (['gauge', 'rag', 'counter', 'ryg', 'donut', 'completionBar'].includes(tracker.type)) return 'S';
    if (tracker.type === 'countdown') {
        return tracker.displayStyle === 'bar' ? 'M' : 'S';
    }
    if (['line', 'bar', 'note', 'textParser'].includes(tracker.type)) return 'M'; 
    return 'M';
};



export const formatCountdown = (dateStr) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return { text: 'Invalid Date', diff: 0, color: 'grey', icon: '', flashClass: '' };
    
    const now = new Date();
    now.setHours(0,0,0,0);
    const dStart = new Date(d); dStart.setHours(0,0,0,0);
    
    const diffTime = dStart - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    
    const dateText = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' });
    let daysText = '';
    let color = '#00e676'; // Green
    let icon = '';
    let flashClass = '';
    
    // New Urgency Logic
    if (diffDays < 0) { // Overdue
        daysText = `${Math.abs(diffDays)} days ago`; color = '#ff1744'; icon = '⚠️'; flashClass = 'flash-red';
    } else if (diffDays === 0) { // Today
        daysText = 'Today'; color = '#ffb300'; icon = '🚨'; flashClass = 'flash-siren';
    } else if (diffDays === 1) { // Tomorrow
        daysText = 'Tomorrow'; color = '#ff1744'; icon = '🚨'; flashClass = 'flash-siren';
    } else if (diffDays <= 7) { // Very urgent (Red, Flashing Siren)
        daysText = `${diffDays} days`; color = '#ff1744'; icon = '🚨'; flashClass = 'flash-siren';
    } else if (diffDays <= 14) { // Urgent (Red)
        daysText = `${diffDays} days`; color = '#ff1744'; icon = '🚨'; // No flash
    } else if (diffDays <= 30) { // Soon (Flashing Yellow)
        daysText = `${diffDays} days`; color = '#ffb300'; icon = '🔔'; flashClass = 'flash-yellow';
    } else if (diffDays <= 60) { // Soon (Yellow)
        daysText = `${diffDays} days`; color = '#ffb300'; icon = '🔔'; // No flash
    } else { // Far future (Green)
        daysText = `${diffDays} days`; color = '#00e676'; icon = '✅'; // No flash
    }
    
    return {
        text: `${dateText} (${daysText})`,
        diff: diffDays,
        color,
        icon,
        flashClass
    };
};

export const getCountdownBarData = (items) => {
    const seriesData = [];
    const today = new Date();
    today.setHours(0,0,0,0);

    items.forEach(item => {
        const d = new Date(item.date);
        d.setHours(0,0,0,0);
        
        const diffTime = d.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // Filter out past events
        if (diffDays < 0) {
            return;
        }

        let color = '#00e676'; // Green
        if (diffDays === 0) { color = '#ffb300'; } // Today
        else if (diffDays === 1) { color = '#ff1744'; } // Tomorrow
        else if (diffDays <= 7) { color = '#ff1744'; } 
        else if (diffDays <= 14) { color = '#ff1744'; } 
        else if (diffDays <= 30) { color = '#ffb300'; } 
        else if (diffDays <= 60) { color = '#ffb300'; } 

        seriesData.push({
            x: item.label,
            y: [0, diffDays], // Restore positive values
            fillColor: color,
            meta: {
                originalDate: item.date,
                diffDays: diffDays
            }
        });
    });

    seriesData.sort((a,b) => a.meta.diffDays - b.meta.diffDays);

    return {
        series: [{
            data: seriesData
        }]
    };
};


export const Visuals = {
    showTooltip: (evt, text) => {
        const tt = document.getElementById('globalTooltip');
        if (tt) {
            tt.innerHTML = text;
            tt.style.display = 'block';
            tt.style.left = (evt.clientX + 15) + 'px';
            tt.style.top = (evt.clientY + 15) + 'px';
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
        const w=getWidth(size); const h=180; const pTop=15; const pBot=45; const pSide=40; 
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

        const w=getWidth(size); const h=180; const pTop=15; const pBot=45; const pSide=40; 
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

    createDonutChartSVG: (labels, values, size = 'M', customColors = []) => {
        const w = getWidth(size);
        const h = 180;
        const centerX = w / 2;
        const centerY = h / 2;
        const radius = 80;
        const thickness = 30;
        const innerRadius = radius - thickness;
        const rEnd = radius + 15;

        const total = values.reduce((a, b) => a + b, 0);
        if (total === 0) return `<svg width="${w}" height="${h}"><circle cx="${centerX}" cy="${centerY}" r="${radius}" fill="none" stroke="#333" stroke-width="${thickness}"/><text x="${centerX}" y="${centerY}" text-anchor="middle" dominant-baseline="middle" fill="#666" font-size="12">No Data</text></svg>`;

        let startAngle = 0;
        let paths = '';
        let annotations = '';
        const defaultPalette = ['#03dac6', '#ff4081', '#bb86fc', '#cf6679', '#00e676', '#ffb300', '#018786', '#3700b3', '#03a9f4', '#ffeb3b'];

        values.forEach((v, i) => {
            const percentage = (v / total);
            const angle = percentage * 360;
            const endAngle = startAngle + angle;
            const midAngle = startAngle + (angle / 2);

            // Use custom color if available and valid, else fallback
            const color = (customColors && customColors[i]) ? customColors[i] : defaultPalette[i % defaultPalette.length];

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

            const tooltipText = `${labels[i]}: ${v}`;
            paths += `<path d="${d}" fill="${color}" stroke="#1e1e1e" stroke-width="1" style="cursor:pointer;" onmousemove="Visuals.showTooltip(event, '${tooltipText}')" onmouseout="Visuals.hideTooltip()"></path>`;

            // Callout
            if (percentage > 0.05) {
                const radMid = (midAngle - 90) * Math.PI / 180;
                const lx1 = centerX + radius * Math.cos(radMid);
                const ly1 = centerY + radius * Math.sin(radMid);
                const lx2 = centerX + rEnd * Math.cos(radMid);
                const ly2 = centerY + rEnd * Math.sin(radMid);

                const isLeft = midAngle > 180;
                const lx3 = isLeft ? lx2 - 10 : lx2 + 10;

                annotations += `<polyline points="${lx1},${ly1} ${lx2},${ly2} ${lx3},${ly2}" fill="none" stroke="${color}" stroke-width="1"/>`;

                const tx = isLeft ? lx3 - 4 : lx3 + 4;
                const anchor = isLeft ? 'end' : 'start';

                annotations += `<text x="${tx}" y="${ly2}" dy="3" text-anchor="${anchor}" fill="#eee" font-size="10" font-weight="bold">${labels[i]}</text>`;
            }

            startAngle = endAngle;
        });

        const totalText = `<text x="${centerX}" y="${centerY}" text-anchor="middle" dominant-baseline="middle" fill="#fff" font-size="24" font-weight="bold">${total}</text>`;

        return `<svg width="100%" height="100%" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid meet">${paths}${annotations}<circle cx="${centerX}" cy="${centerY}" r="${innerRadius}" fill="transparent"/>${totalText}</svg>`;
    },

    createDonutChartWithCalloutsSVG: (labels, values, customColors = []) => {
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
        const defaultPalette = ['#03dac6', '#ff4081', '#bb86fc', '#cf6679', '#00e676', '#ffb300', '#018786', '#3700b3', '#03a9f4', '#ffeb3b'];

        values.forEach((v, i) => {
            const val = v;
            const pct = val / total;
            const angle = pct * 360;
            const endAngle = startAngle + angle;
            const midAngle = startAngle + (angle / 2);

            const color = (customColors && customColors[i]) ? customColors[i] : defaultPalette[i % defaultPalette.length];

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
            paths += `<path d="${d}" fill="${color}" stroke="#1e1e1e" stroke-width="2" style="cursor:pointer;" onmousemove="Visuals.showTooltip(event, '${tooltipText}')" onmouseout="Visuals.hideTooltip()"/>`;

            // Callout
            if (pct > 0.05) {
                const radMid = (midAngle - 90) * Math.PI / 180;
                const lx1 = cx + r * Math.cos(radMid);
                const ly1 = cy + r * Math.sin(radMid);
                const lx2 = cx + rEnd * Math.cos(radMid);
                const ly2 = cy + rEnd * Math.sin(radMid);

                const isLeft = midAngle > 180;
                const lx3 = isLeft ? lx2 - 30 : lx2 + 30;

                annotations += `<polyline points="${lx1},${ly1} ${lx2},${ly2} ${lx3},${ly2}" fill="none" stroke="${color}" stroke-width="1.5"/>`;

                const tx = isLeft ? lx3 - 8 : lx3 + 8;
                const anchor = isLeft ? 'end' : 'start';

                annotations += `<text x="${tx}" y="${ly2}" dy="4" text-anchor="${anchor}" fill="#eee" font-size="14" font-weight="bold">${labels[i]}</text>`;
                annotations += `<text x="${tx}" y="${ly2 + 18}" dy="4" text-anchor="${anchor}" fill="#aaa" font-size="12">${val} (${Math.round(pct * 100)}%)</text>`;
            }

            startAngle = endAngle;
        });

        const totalText = `<text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="middle" fill="#fff" font-size="24" font-weight="bold">${total}</text>`;

        return `<svg width="100%" height="100%" viewBox="0 0 ${w} ${h}">${paths}${annotations}<circle cx="${cx}" cy="${cy}" r="${r - thickness}" fill="transparent"/>${totalText}</svg>`;
    },

    createCompletionBarSVG: (completed, total, activeColor, remainingColor, height = 40, orientation = 'horizontal') => {
        const safeTotal = total > 0 ? total : 1;
        const pct = Math.min(100, Math.max(0, (completed / safeTotal) * 100));
        const remPct = 100 - pct;
        
        // Consistent Font Styles
        const valStyle = 'font-size:16px; font-weight:bold; color:#fff; line-height:1.1;';
        const labelStyle = 'font-size:10px; font-weight:normal; color:rgba(255,255,255,0.9); text-transform:uppercase; letter-spacing:0.5px;';
        const containerStyle = 'display:flex; flex-direction:column; align-items:center; justify-content:center; text-shadow:0 1px 2px rgba(0,0,0,0.8); overflow:hidden;';
        
        if (orientation === 'vertical') {
            return `
                <div style="display:flex; flex-direction:column-reverse; width:50%; max-width:70px; height:100%; margin:0 auto; border-radius:6px; overflow:hidden; background:${remainingColor}; border:1px solid rgba(255,255,255,0.1);">
                    <div style="height:${pct}%; background:${activeColor}; ${containerStyle} transition:height 0.3s;">
                        ${pct > 20 ? `<div style="${valStyle}">${completed}</div><div style="${labelStyle}">Progress</div>` : ''}
                    </div>
                    <div style="height:${remPct}%; background:${remainingColor}; ${containerStyle} transition:height 0.3s;">
                        ${remPct > 20 ? `<div style="${valStyle}">${total}</div><div style="${labelStyle}">Target</div>` : ''}
                    </div>
                </div>
            `;
        } else {
            return `
                <div style="display:flex; width:90%; max-width:300px; height:${height}px; margin:0 auto; border-radius:6px; overflow:hidden; background:${remainingColor}; border:1px solid rgba(255,255,255,0.1);">
                    <div style="width:${pct}%; background:${activeColor}; ${containerStyle} transition:width 0.3s;">
                        ${pct > 15 ? `<div style="${valStyle}">${completed}</div><div style="${labelStyle}">Progress</div>` : ''}
                    </div>
                    <div style="width:${remPct}%; background:${remainingColor}; ${containerStyle} transition:width 0.3s;">
                        ${remPct > 15 ? `<div style="${valStyle}">${total}</div><div style="${labelStyle}">Target</div>` : ''}
                    </div>
                </div>
            `;
        }
    },

    createGanttChartSVG: (members, allAssignments, settings) => {
        const rowHeight = 35;
        const groupHeaderHeight = 40;
        const timelineHeaderHeight = 40;
        const width = 1200;
        const nameColWidth = 250;
        const chartWidth = width - nameColWidth;
        const colWidth = chartWidth / 6;
        const fyStart = (settings && settings.fyStartMonth !== undefined) ? settings.fyStartMonth : 1;
        
        // --- 1. Timeline Calculation (Date-Based) ---
        const getCurrentPeriod = () => {
            const d = new Date();
            const m = d.getMonth(); 
            return ((m - fyStart + 12) % 12) + 1;
        };
        const getFiscalYear = (date = new Date()) => {
            const m = date.getMonth(); 
            const y = date.getFullYear();
            return m < fyStart ? y - 1 : y;
        };
        
        // Helper to get actual Date object for start of a Period/Year
        const getDateFromPeriod = (p, fy) => {
            // p=1, fy=2026, fyStart=1 (Feb) -> Feb 2026
            // monthIndex = (p - 1 + fyStart) % 12
            // if monthIndex < fyStart, year is fy + 1. 
            // e.g. fyStart=1 (Feb). P12 (Jan). mIdx=0. 0 < 1. Year = 2027.
            const mIdx = (p - 1 + fyStart) % 12;
            const y = mIdx < fyStart ? fy + 1 : fy;
            return new Date(y, mIdx, 1);
        };

        const currentP = getCurrentPeriod();
        const currentY = getFiscalYear();
        
        // Define Timeline Range
        // Start: 1st day of Current Period
        const timelineStart = getDateFromPeriod(currentP, currentY);
        
        // End: Last day of 6th Period
        // Calculate start of 7th period, subtract 1 day
        // 6th period index: (currentP + 5). 
        // We want end of that. Easier to get start of (currentP + 6)
        let endP_raw = currentP + 6;
        let endP = ((endP_raw - 1) % 12) + 1;
        let endY_offset = Math.floor((endP_raw - 1) / 12);
        let endY = currentY + endY_offset;
        const timelineEnd = getDateFromPeriod(endP, endY); // Exclusive end date (start of next)
        
        const totalDuration = timelineEnd.getTime() - timelineStart.getTime();

        // Generate Grid Columns (Periods)
        const rollingTimeline = [];
        for(let i=0; i<6; i++) {
            let pRaw = currentP + i;
            let p = ((pRaw - 1) % 12) + 1;
            let yOffset = Math.floor((pRaw - 1) / 12);
            let y = currentY + yOffset;
            rollingTimeline.push({ p, y });
        }

        const getPeriodLabelShort = (p, y) => {
            const standardMonths = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
            const mIdx = (p - 1 + fyStart) % 12;
            const name = standardMonths[mIdx];
            const yr = y ? ` ${y.toString().substring(2)}` : '';
            return `P${p.toString().padStart(2,'0')} (${name})${yr}`;
        };

        // --- 2. Data Aggregation & Date Conversion ---
        const groups = {};

        // Helper: Convert Obj/Absence to Start/End Dates
        const getDatesForObj = (obj) => {
            if (obj.isAbsence || obj.startDate || obj.endDate) {
                // Specific dates provided (Absence or Task-inherited)
                const s = obj.startDate ? new Date(obj.startDate) : new Date(0);
                const e = obj.endDate ? new Date(obj.endDate) : new Date(8640000000000000);
                return { start: s, end: e };
            } else {
                // Objective uses Period/Year. Convert to Date range.
                // Start: 1st of Start Period
                const s = getDateFromPeriod(obj.start || 1, obj.startYear || currentY);
                // End: Last day of End Period
                let endP = obj.end || 12;
                let endY = obj.endYear || currentY;
                let nextP_raw = endP + 1;
                let nextP = ((nextP_raw - 1) % 12) + 1;
                let nextY_offset = Math.floor((nextP_raw - 1) / 12);
                let nextY = endY + nextY_offset;
                const e = getDateFromPeriod(nextP, nextY); // Exclusive end
                return { start: s, end: e };
            }
        };

        const processItem = (item, memberName, assignmentName, assignmentId = null) => {
            const dates = getDatesForObj(item);
            // Check overlap with timeline
            if (dates.end <= timelineStart || dates.start >= timelineEnd) return; // No overlap

            // Clamp dates to visible timeline for rendering
            const visibleStart = dates.start < timelineStart ? timelineStart : dates.start;
            const visibleEnd = dates.end > timelineEnd ? timelineEnd : dates.end;
            
            if (!groups[assignmentName]) groups[assignmentName] = [];
            
            groups[assignmentName].push({
                memberName: memberName,
                obj: item,
                render: {
                    start: visibleStart,
                    end: visibleEnd,
                    originalStart: dates.start,
                    originalEnd: dates.end
                }
            });
        };

        // 1. Assignments (Tasks)
        members.forEach(m => {
            const userAss = m.assignments || m.objectives || [];
            userAss.forEach(ass => {
                const taskId = ass.taskId || ass.assignment;
                const task = (allAssignments || []).find(a => a.id === taskId || a.name === taskId);
                if (task) {
                    // Inject task dates and onCall state into the assignment item for processing
                    const itemWithDates = { 
                        ...ass, 
                        startDate: task.startDate, 
                        endDate: task.endDate,
                        dateMode: task.dateMode,
                        start: task.startPeriod,
                        startYear: task.startYear,
                        end: task.endPeriod,
                        endYear: task.endYear,
                        onCall: !!task.onCall
                    };
                    processItem(itemWithDates, m.name, task.name);
                }
            });
        });

        // 2. Absences
        const absMap = new Map();
        if (settings && settings.absences) settings.absences.forEach(a => absMap.set(a.id, a.name));
        
        members.forEach(m => {
            if (m.absences && m.absences.length > 0) {
                m.absences.forEach(abs => {
                    const absName = absMap.get(abs.type) || 'Unknown Absence';
                    const item = { ...abs, isAbsence: true, load: 'ABS' };
                    processItem(item, m.name, absName);
                });
            }
        });

        // --- 3. Rendering ---
        
        const groupKeys = Object.keys(groups).sort();
        let totalRows = 0;
        groupKeys.forEach(k => totalRows += groups[k].length);
        const totalHeight = timelineHeaderHeight + (groupKeys.length * groupHeaderHeight) + (totalRows * rowHeight) + 40;

        let svg = `<svg width="100%" height="${totalHeight}" viewBox="0 0 ${width} ${totalHeight}" xmlns="http://www.w3.org/2000/svg">`;
        svg += `<rect x="0" y="0" width="${width}" height="${totalHeight}" fill="var(--card-bg)" rx="8"/>`;

        // Timeline Header (Periods)
        rollingTimeline.forEach((item, i) => {
            const x = nameColWidth + (i * colWidth);
            svg += `<text x="${x + colWidth/2}" y="${timelineHeaderHeight - 15}" fill="var(--text-main)" font-size="12" text-anchor="middle" font-weight="bold">${getPeriodLabelShort(item.p, item.y)}</text>`;
            svg += `<line x1="${x}" y1="${timelineHeaderHeight}" x2="${x}" y2="${totalHeight}" stroke="var(--border)" stroke-width="1"/>`;
        });
        svg += `<line x1="${width}" y1="${timelineHeaderHeight}" x2="${width}" y2="${totalHeight}" stroke="var(--border)" stroke-width="1"/>`;
        svg += `<line x1="0" y1="${timelineHeaderHeight}" x2="${width}" y2="${timelineHeaderHeight}" stroke="var(--border)" stroke-width="1"/>`;

        let currentYPos = timelineHeaderHeight;
        
        groupKeys.forEach(assignmentName => {
            const rows = groups[assignmentName];
            
            // Group Header
            svg += `<rect x="0" y="${currentYPos}" width="${width}" height="${groupHeaderHeight}" fill="rgba(255,255,255,0.05)" opacity="0.5"/>`;
            
            let headerColor = 'var(--accent)';
            const assignmentDef = (allAssignments || []).find(a => a.name === assignmentName);
            if (assignmentDef) {
                headerColor = assignmentDef.color;
            } else {
                if (rows.length > 0 && rows[0].obj.isAbsence) headerColor = '#ffb74d';
            }
            
            svg += `<text x="15" y="${currentYPos + groupHeaderHeight/2 + 6}" fill="${headerColor}" font-size="14" font-weight="bold">${assignmentName}</text>`;
            currentYPos += groupHeaderHeight;

            rows.forEach((row, ri) => {
                const y = currentYPos + (ri * rowHeight);
                // Sub-heading (Member Name)
                svg += `<text x="25" y="${y + rowHeight/2 + 5}" fill="var(--text-main)" font-size="12" font-weight="500">${row.memberName}</text>`;

                // Calculate Bar Position using Exact Dates
                const r = row.render;
                const startOffsetMs = r.start.getTime() - timelineStart.getTime();
                const durationMs = r.end.getTime() - r.start.getTime();
                
                const x = nameColWidth + (startOffsetMs / totalDuration) * chartWidth;
                const w = (durationMs / totalDuration) * chartWidth;
                
                // Ensure min width for visibility
                const barWidth = Math.max(2, w);
                
                let barColor = headerColor;
                if (row.obj.isAbsence) barColor = '#ef5350';
                if (row.obj.onCall) barColor = '#00FFFF';

                // Format Tooltip Dates
                const fmt = (d) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
                const dateRangeStr = `${fmt(r.originalStart)} - ${fmt(r.originalEnd)}`; // Use original dates for tooltip

                const labelText = row.obj.onCall ? 'OC' : `${row.obj.load}%`;
                const tooltipType = row.obj.onCall ? 'On Call' : (row.obj.load || 'Assigned');

                svg += `<rect x="${x}" y="${y + 6}" width="${barWidth}" height="${rowHeight - 12}" fill="${barColor}" rx="${(rowHeight - 12)/2}" opacity="0.8">
                            <title>${row.memberName}: ${assignmentName} (${tooltipType})\n${dateRangeStr}</title>
                        </rect>`;
                
                // Label (Load % or OC) - Only if bar is wide enough
                if (barWidth > 25) {
                    const textColor = row.obj.onCall ? '#000' : '#fff';
                    svg += `<text x="${x + barWidth/2}" y="${y + rowHeight/2 + 4}" fill="${textColor}" font-size="11" text-anchor="middle" font-weight="bold" pointer-events="none">${labelText}</text>`;
                }
                
                svg += `<line x1="0" y1="${y + rowHeight}" x2="${width}" y2="${y + rowHeight}" stroke="var(--border)" stroke-width="0.5" opacity="0.5"/>`;
            });
            currentYPos += (rows.length * rowHeight);
        });

        svg += `</svg>`;
        return svg;
    },

    createResourcePlannerSVG: (items, rangeMonths = 6, size = 'M') => {
        const rowHeight = 40;
        const headerHeight = 50;
        const width = getWidth(size) || 800; 
        const nameColWidth = 200;
        const timelineWidth = width - nameColWidth;
        
        const today = new Date();
        today.setDate(1); 
        const endDate = new Date(today);
        endDate.setMonth(today.getMonth() + rangeMonths);
        
        const totalMillis = endDate - today;
        
        const months = [];
        let curr = new Date(today);
        while (curr < endDate) {
            months.push(new Date(curr));
            curr.setMonth(curr.getMonth() + 1);
        }
        
        const colWidth = timelineWidth / months.length;
        const totalHeight = headerHeight + (items.length * rowHeight) + 20;
        
        let svg = `<svg width="100%" height="100%" viewBox="0 0 ${width} ${totalHeight}" preserveAspectRatio="xMinYMin meet">`;
        svg += `<rect x="0" y="0" width="${width}" height="${totalHeight}" fill="var(--card-bg)" rx="8"/>`;
        
        // Vertical Grid & Headers
        months.forEach((m, i) => {
            const x = nameColWidth + (i * colWidth);
            const label = m.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });
            svg += `<text x="${x + colWidth/2}" y="${headerHeight/2}" fill="var(--text-muted)" font-size="10" text-anchor="middle">${label}</text>`;
            svg += `<line x1="${x}" y1="${headerHeight}" x2="${x}" y2="${totalHeight}" stroke="var(--border)" stroke-dasharray="2,2" stroke-width="0.5"/>`;
        });
        
        // Rows
        items.forEach((item, i) => {
            const y = headerHeight + (i * rowHeight);
            
            // Horizontal Line
            svg += `<line x1="0" y1="${y}" x2="${width}" y2="${y}" stroke="var(--border)" stroke-width="0.5" opacity="0.3"/>`;
            
            // Tooltip Content
            const typeLabel = item.onCall ? ' (On Call)' : '';
            const tooltip = `${item.name}${typeLabel}<br/>${item.description || ''}<br/>${item.startDate ? new Date(item.startDate).toLocaleDateString() : 'No start'} - ${item.endDate ? new Date(item.endDate).toLocaleDateString() : 'No end'}<br/>Priority: ${item.priority || 'N/A'}`;
            const safeTooltip = tooltip.replace(/'/g, "\\'").replace(/"/g, "&quot;");

            // Label with Tooltip
            svg += `<text x="10" y="${y + rowHeight/2 + 4}" fill="var(--text-main)" font-size="11" font-weight="bold" 
                    onmousemove="Visuals.showTooltip(event, '${safeTooltip}')" 
                    onmouseout="Visuals.hideTooltip()" style="cursor:pointer;">${item.name.substring(0,25)}</text>`;
            
            // Bar
            if (item.startDate || item.endDate) {
                const sDate = item.startDate ? new Date(item.startDate) : today;
                const eDate = item.endDate ? new Date(item.endDate) : endDate;
                const effStart = sDate < today ? today : sDate;
                const effEnd = eDate > endDate ? endDate : eDate;
                
                if (effEnd > effStart) {
                    const startPct = (effStart - today) / totalMillis;
                    const endPct = (effEnd - today) / totalMillis;
                    
                    const barX = nameColWidth + (startPct * timelineWidth);
                    const barW = (endPct - startPct) * timelineWidth;
                    let color = item.color || '#009688';
                    if (item.onCall) color = '#00FFFF';
                    
                    svg += `<rect x="${barX}" y="${y + 8}" width="${Math.max(barW, 5)}" height="${rowHeight - 16}" fill="${color}" rx="6" 
                            onmousemove="Visuals.showTooltip(event, '${safeTooltip}')" 
                            onmouseout="Visuals.hideTooltip()"
                            style="cursor:pointer; filter: drop-shadow(0 2px 3px rgba(0,0,0,0.2));"/>`;
                }
            }
        });
        
        svg += `</svg>`;
        return svg;
    }
};
