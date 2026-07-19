document.addEventListener('DOMContentLoaded', () => {
    const user = typeof getUser === 'function' ? getUser() : null;
    if (user) {
        document.getElementById('lblStationName').textContent =
            `${user.name || 'UNKNOWN'} (${user.stationId || ''})`;
    }

    // Default to current month
    const today = new Date();
    const currentMonth = (today.getMonth() + 1).toString().padStart(2, '0');
    const currentYear = today.getFullYear();
    const monthPicker = document.getElementById('monthPicker');
    if (monthPicker) {
        monthPicker.value = `${currentYear}-${currentMonth}`;
    }

    // Set today's date on the document
    const dateStr = today.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
        .replace(/\//g, '/');
    document.getElementById('lblDate').textContent = dateStr;

    document.getElementById('btnGenerate').addEventListener('click', generateForm);
    document.getElementById('btnPrint').addEventListener('click', () => window.print());
    document.getElementById('btnPdf').addEventListener('click', exportPDF);
    document.getElementById('btnWord').addEventListener('click', exportWord);

    generateForm();
});

function showLoading(show) {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) overlay.style.display = show ? 'flex' : 'none';
}

function getNum(val) {
    const n = parseFloat(val);
    return isNaN(n) ? null : n;
}

function fmtC(val) {
    if (val === null || val === undefined || val === '') return '///';
    return `${parseFloat(val).toFixed(1)}&deg;C`;
}

function fmtMM(val) {
    if (val === null || val === undefined || val === '') return '/// mm';
    return `${parseFloat(val).toFixed(1)} mm`;
}

function fmtHpa(val) {
    if (val === null || val === undefined || val === '') return '/// Hpa';
    return `${parseFloat(val).toFixed(1)} Hpa`;
}

function getObsForDateAndTime(obsData, dateStr, timePrefix) {
    return obsData.find(obs => {
        if (!obs.date || !obs.time) return false;
        return obs.date === dateStr && obs.time.startsWith(timePrefix);
    }) || {};
}

async function generateForm() {
    showLoading(true);
    try {
        const monthPicker = document.getElementById('monthPicker').value;
        if (!monthPicker) {
            alert("Please select a month and year.");
            return;
        }

        const [yearStr, monthStr] = monthPicker.split('-');
        const year = parseInt(yearStr, 10);
        const month = parseInt(monthStr, 10);
        const daysInMonth = new Date(year, month, 0).getDate();

        const monthNames = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
                            "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
        document.getElementById('lblMonthYear').textContent = `${monthNames[month - 1]}, ${yearStr}`;

        const user = typeof getUser === 'function' ? getUser() : null;
        let allObs = [];
        if (user && typeof authenticatedFetch === 'function') {
            try {
                const res = await authenticatedFetch(`${API_BASE_URL}/station/${user.name}/observations`);
                allObs = await res.json();
            } catch (err) {
                console.error("Error fetching observations:", err);
            }
        }

        // Filter to just this month
        const monthPrefix = `${yearStr}-${monthStr}`;
        const monthObs = allObs.filter(o => o.date && o.date.startsWith(monthPrefix));

        computeAndPopulate(year, month, daysInMonth, monthStr, yearStr, allObs, monthObs);

    } catch (error) {
        console.error("Error generating form:", error);
        alert("An error occurred while generating the summary.");
    } finally {
        showLoading(false);
    }
}

function computeAndPopulate(year, month, daysInMonth, monthStr, yearStr, allObs, monthObs) {

    // Accumulators
    let maxTemps = [], minTemps = [], lgmVals = [];
    let dew06Vals = [], dew09Vals = [], dew12Vals = [];
    let evapTots = [], evapPiche = [];
    let rainTotal = 0;
    let rainDays = 0, hailDays = 0, frostDays = 0, thunderDays = 0;
    let sunshineVals = [], radVals = [];
    let pres06Vals = [], pres12Vals = [];
    let rh06Vals = [], rh12Vals = [];

    let lowestLgm = null;
    let lowestLgmDate = '';

    for (let day = 1; day <= daysInMonth; day++) {
        const dayStr = day.toString().padStart(2, '0');
        const dateStr = `${yearStr}-${monthStr}-${dayStr}`;
        const nextDate = (() => {
            const d = new Date(year, month - 1, day + 1);
            return `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2,'0')}-${d.getDate().toString().padStart(2,'0')}`;
        })();

        const obs06 = getObsForDateAndTime(allObs, dateStr, '06');
        const obs09 = getObsForDateAndTime(allObs, dateStr, '09');
        const obs12 = getObsForDateAndTime(allObs, dateStr, '12');
        const obs18 = getObsForDateAndTime(allObs, dateStr, '18');
        const nextObs06 = getObsForDateAndTime(allObs, nextDate, '06');

        // TEMP
        const maxT = getNum(obs18.max_temp); // max temp is recorded at 1800Z
        if (maxT !== null) maxTemps.push(maxT);

        const minT = getNum(obs06.min_temp);
        if (minT !== null) minTemps.push(minT);

        const lgm = getNum(obs06.g_min);
        if (lgm !== null) {
            lgmVals.push(lgm);
            if (lowestLgm === null || lgm < lowestLgm) {
                lowestLgm = lgm;
                lowestLgmDate = `${dayStr}/${monthStr}/${yearStr}`;
            }
            // Count ground frost days (lgm < 0)
            if (lgm < 0) frostDays++;
        }

        // Dew Points
        const d06 = getNum(obs06.dew_point);
        if (d06 !== null) dew06Vals.push(d06);
        const d09 = getNum(obs09.dew_point);
        if (d09 !== null) dew09Vals.push(d09);
        const d12 = getNum(obs12.dew_point);
        if (d12 !== null) dew12Vals.push(d12);

        // Evaporation (evap_1 = total, evap_2 = PICHE)
        const ev1 = getNum(obs12.evap_1 || obs06.evap_1);
        if (ev1 !== null) evapTots.push(ev1);
        const ev2 = getNum(obs12.evap_2 || obs06.evap_2);
        if (ev2 !== null) evapPiche.push(ev2);

        // Rainfall: next day's 0600Z is the total for this day
        const rain = getNum(nextObs06.rainfall);
        if (rain !== null) {
            rainTotal += rain;
            if (rain >= 1.0) rainDays++;
        }

        // Hail
        const hail = getNum(obs12.hail || obs06.hail);
        if (hail !== null && hail > 0) hailDays++;

        // Thunder
        const thunder = getNum(obs12.thunder || obs06.thunder);
        if (thunder !== null && thunder > 0) thunderDays++;

        // Sunshine
        const sun = getNum(obs12.sunshine || obs06.sunshine);
        if (sun !== null) sunshineVals.push(sun);

        // Radiation
        const rad = getNum(obs12.radiation || obs06.radiation);
        if (rad !== null) radVals.push(rad);

        // Pressure (read minus 1)
        const p06 = obs06.pr_read ? parseFloat(obs06.pr_read) - 1 : null;
        if (p06 !== null) pres06Vals.push(p06);
        const p12 = obs12.pr_read ? parseFloat(obs12.pr_read) - 1 : null;
        if (p12 !== null) pres12Vals.push(p12);

        // RH
        const rh06 = getNum(obs06.r_h || obs06.rh);
        if (rh06 !== null) rh06Vals.push(rh06);
        const rh12 = getNum(obs12.r_h || obs12.rh);
        if (rh12 !== null) rh12Vals.push(rh12);
    }

    const mean = arr => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null;
    const sum  = arr => arr.length ? arr.reduce((a, b) => a + b, 0) : null;

    // Populate DOM
    const set = (id, html) => { document.getElementById(id).innerHTML = html; };

    set('valMax',   fmtC(mean(maxTemps)));
    set('valMin',   fmtC(mean(minTemps)));

    const lgmText = lowestLgm !== null
        ? `${parseFloat(lowestLgm).toFixed(1)}&deg;C on ${lowestLgmDate}`
        : '///';
    set('valLgm', lgmText);

    set('valDew06', fmtC(mean(dew06Vals)));
    set('valDew09', fmtC(mean(dew09Vals)));
    set('valDew12', fmtC(mean(dew12Vals)));

    const totalEvap = sum(evapTots);
    set('valEvapTot', totalEvap !== null ? `${totalEvap.toFixed(1)} mm` : '///');
    set('valRain',     fmtMM(rainTotal));

    const totalPiche = sum(evapPiche);
    set('valEvapPiche', totalPiche !== null ? `${totalPiche.toFixed(1)} mm` : '///');

    set('valRainDays', `${rainDays}days`);
    set('valHail',     hailDays > 0 ? `${hailDays} day(s)` : 'nil');
    set('valFrost',    frostDays > 0 ? `${frostDays} day(s)` : 'nil');
    set('valThunder',  `${thunderDays}days`);

    const meanSun = mean(sunshineVals);
    set('valSunshine', meanSun !== null ? `${meanSun.toFixed(1)} N/AHRS/day` : '/// N/AHRS/day');

    const meanRad = mean(radVals);
    set('valRadiation', meanRad !== null ? `${meanRad.toFixed(1)} Lang leys/day` : '/// Lang leys/day');

    set('valPres06', fmtHpa(mean(pres06Vals)));
    set('valPres12', fmtHpa(mean(pres12Vals)));

    const meanRh06 = mean(rh06Vals);
    set('valRh06', meanRh06 !== null ? `${Math.round(meanRh06)}%` : '///');
    const meanRh12 = mean(rh12Vals);
    set('valRh12', meanRh12 !== null ? `${Math.round(meanRh12)}%` : '///');
}

function exportPDF() {
    // Temporarily hide editable outlines for clean PDF
    document.querySelectorAll('.editable-input').forEach(el => {
        el.dataset.oldStyle = el.style.cssText;
        el.style.border = 'none';
        el.style.background = 'transparent';
    });

    const element = document.getElementById('printable-area');
    const opt = {
        margin:       [0, 5, 0, 5],
        filename:     'MonthlyWeatherSummary.pdf',
        image:        { type: 'jpeg', quality: 1 },
        html2canvas:  { scale: 2, useCORS: true, logging: false },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save().then(() => {
        // Restore
        document.querySelectorAll('.editable-input').forEach(el => {
            el.style.cssText = el.dataset.oldStyle || '';
        });
    });
}

function exportWord() {
    // Build a minimal Word-compatible HTML document
    const area = document.getElementById('printable-area');

    // Temporarily convert inputs to spans for export
    const inputs = area.querySelectorAll('input.editable-input');
    inputs.forEach(inp => {
        const span = document.createElement('span');
        span.textContent = inp.value;
        span.setAttribute('data-word-replace', 'true');
        inp.parentNode.insertBefore(span, inp);
        inp.style.display = 'none';
    });

    const htmlContent = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office'
              xmlns:w='urn:schemas-microsoft-com:office:word'
              xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
            <meta charset="UTF-8">
            <meta name=ProgId content=Word.Document>
            <meta name=Generator content='Microsoft Word 15'>
            <meta name=Originator content='Microsoft Word 15'>
            <!--[if gte mso 9]>
            <xml>
                <w:WordDocument>
                    <w:View>Print</w:View>
                    <w:Zoom>90</w:Zoom>
                    <w:DoNotOptimizeForBrowser/>
                </w:WordDocument>
            </xml>
            <![endif]-->
            <style>
                body { font-family: Arial, sans-serif; font-size: 12pt; color: #000; margin: 0; padding: 0; }
                .doc-header { display: flex; justify-content: space-between; margin-bottom: 30px; }
                .data-row { display: flex; margin-bottom: 3px; }
                .dots { flex-grow: 1; border-bottom: 1px dotted #000; margin: 0 5px; }
                .value { min-width: 120px; }
                u { text-decoration: underline; }
                strong { font-weight: bold; }
                table { width: 100%; }
                td { vertical-align: top; }
            </style>
        </head>
        <body>
            ${area.innerHTML}
        </body>
        </html>`;

    // Restore inputs
    inputs.forEach(inp => {
        inp.style.display = '';
        const span = inp.parentNode.querySelector('span[data-word-replace="true"]');
        if (span) inp.parentNode.removeChild(span);
    });

    const blob = new Blob([htmlContent], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'MonthlyWeatherSummary.doc';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}