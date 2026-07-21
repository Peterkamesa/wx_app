/* ============================================================
   form446.js  –  FORM NO. 446 Logic
   Kenya Meteorological Department
   Evaporation from Standard Evaporation Pan (Pan 'A')

   Column rules (from user spec):
     • Rainfall            = obs at 0600Z for that day
     • Cups taken out      = stored as negative in DB (e.g. -4)
     • Cups added to pan   = stored as positive in DB (e.g. +4)
     • Evaporation         = R + 0.5*N_added – 0.5*N_taken  (R ± 0.5N)
     • Cup-counter reading = wind_run AS READ at 0600Z (same field as windrun)
     • Windrun KM/DAY      = today's reading – yesterday's reading
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
    const user = typeof getUser === 'function' ? getUser() : null;
    if (user) {
        document.getElementById('lblStation').textContent =
            `${user.name || 'UNKNOWN'} - MET STATION`;
    }

    // Default to current month
    const today = new Date();
    const mm = (today.getMonth() + 1).toString().padStart(2, '0');
    const yyyy = today.getFullYear();
    document.getElementById('monthPicker').value = `${yyyy}-${mm}`;

    document.getElementById('btnGenerate').addEventListener('click', generateForm);
    document.getElementById('btnPrint').addEventListener('click', () => window.print());
    document.getElementById('btnPdf').addEventListener('click', exportPDF);
    document.getElementById('btnExcel').addEventListener('click', exportExcel);
    document.getElementById('btnCsv').addEventListener('click', exportCSV);

    generateForm();
});

/* ── Helpers ─────────────────────────────────────────────── */
function showLoading(show) {
    const el = document.getElementById('loading-overlay');
    if (el) el.style.display = show ? 'flex' : 'none';
}

function getNum(val) {
    const n = parseFloat(val);
    return isNaN(n) ? null : n;
}

/** Returns true if the stored value is a missing-data code like /// or //// */
function isMissing(val) {
    if (val === null || val === undefined) return false;
    return /^\/+$/.test(String(val).trim());
}

/** Display helper: pass /// or //// through as-is; otherwise return val or '' */
function fmtVal(val) {
    if (isMissing(val)) return String(val).trim();
    return (val !== null && val !== undefined && val !== '') ? val : '';
}

function fmt(val, decimals = 2) {
    const n = getNum(val);
    return n !== null ? n.toFixed(decimals) : '';
}

function getObsForDate(obsData, dateStr, timePrefix) {
    return obsData.find(o =>
        o.date === dateStr && o.time && o.time.startsWith(timePrefix)
    ) || {};
}

function buildDateStr(year, month, day) {
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/* ── Main generator ──────────────────────────────────────── */
async function generateForm() {
    showLoading(true);
    try {
        const picker = document.getElementById('monthPicker').value;
        if (!picker) { alert('Please select a month and year.'); return; }

        const [yearStr, monthStr] = picker.split('-');
        const year  = parseInt(yearStr, 10);
        const month = parseInt(monthStr, 10);

        const monthNames = ['JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE',
                            'JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER'];
        document.getElementById('lblMonth').textContent = monthNames[month - 1];
        document.getElementById('lblYear').textContent  = yearStr;

        const daysInMonth = new Date(year, month, 0).getDate();

        // Fetch ALL station observations (we need previous month's last day too)
        const user = typeof getUser === 'function' ? getUser() : null;
        let allObs = [];
        if (user && typeof authenticatedFetch === 'function') {
            try {
                const res  = await authenticatedFetch(`${API_BASE_URL}/station/${user.name}/observations`);
                allObs = await res.json();
            } catch (err) {
                console.error('Error fetching observations:', err);
            }
        }

        renderRows(year, month, daysInMonth, allObs);

    } catch (err) {
        console.error('generateForm error:', err);
        alert('An error occurred while generating the form.');
    } finally {
        showLoading(false);
    }
}

/* ── Render table rows ───────────────────────────────────── */
function renderRows(year, month, daysInMonth, allObs) {
    const tbody = document.getElementById('form446Body');
    const tfoot = document.getElementById('form446Foot');
    tbody.innerHTML = '';
    tfoot.innerHTML = '';

    let totalRain  = 0;
    let totalEvap  = 0;

    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = buildDateStr(year, month, day);
        const obs06   = getObsForDate(allObs, dateStr, '06');

        // ── Column 2: Rainfall (0600Z today)
        const rain = getNum(obs06.rainfall) ?? 0;
        totalRain += rain;

        // ── Column 3: Cups  (negative = taken out, positive = added)
        //    Field in DB: obs06.evap_pan
        const cupsRaw      = getNum(obs06.evap_pan);
        const cupsTakenOut = (cupsRaw !== null && cupsRaw < 0) ? Math.abs(cupsRaw) : 0;
        const cupsAdded    = (cupsRaw !== null && cupsRaw > 0) ? cupsRaw : 0;

        // ── Column 5: Evaporation = R + 0.5*cupsAdded – 0.5*cupsTakenOut
        const evap = rain + (0.5 * cupsAdded) - (0.5 * cupsTakenOut);
        totalEvap += evap;

        // ── Column 6: Cup-counter Anemometer Reading (windrun AS READ at 0600Z)
        // Show //// if stored as //// or missing
        const windRunRaw = obs06.wind_run;
        const windrunRead = isMissing(windRunRaw) ? null : getNum(windRunRaw);
        const windrunReadDisplay = isMissing(windRunRaw)
            ? String(windRunRaw).trim()
            : (windrunRead !== null ? windrunRead.toFixed(2) : '');

        // ── Column 7: Windrun KM/DAY = NEXT day's reading – today's reading
        // Show //// if today or next day wind_run is missing or stored as ////
        const nextDate = (() => {
            const d = new Date(year, month - 1, day + 1);
            return buildDateStr(d.getFullYear(), d.getMonth() + 1, d.getDate());
        })();
        const nextObs06      = getObsForDate(allObs, nextDate, '06');
        const nextWindRunRaw = nextObs06.wind_run;
        const nextWindrunRead = isMissing(nextWindRunRaw) ? null : getNum(nextWindRunRaw);
        let windrunKm = '';
        if (isMissing(windRunRaw) || isMissing(nextWindRunRaw)) {
            windrunKm = '////';  // can't calculate if either reading is ////
        } else if (windrunRead !== null && nextWindrunRead !== null) {
            windrunKm = (nextWindrunRead - windrunRead).toFixed(2);
        }

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${day}</td>
            <td>${rain > 0 ? rain.toFixed(1) : '0.0'}</td>
            <td>${cupsTakenOut > 0 ? cupsTakenOut : ''}</td>
            <td>${cupsAdded    > 0 ? cupsAdded   : ''}</td>
            <td>${evap.toFixed(1)}</td>
            <td>${windrunReadDisplay}</td>
            <td>${windrunKm}</td>
        `;
        tbody.appendChild(tr);
    }

    // ── Footer: totals row
    tfoot.innerHTML = `
        <tr>
            <td><strong>TOTAL</strong></td>
            <td><strong>${totalRain.toFixed(1)}</strong></td>
            <td></td>
            <td></td>
            <td><strong>${totalEvap.toFixed(1)}</strong></td>
            <td></td>
            <td></td>
        </tr>
    `;
}

/* ── Export Functions ────────────────────────────────────── */
function exportPDF() {
    const element = document.getElementById('printable-area');
    const opt = {
        margin:      [10, 10, 10, 10],
        filename:    'Form446_EvaporationPan.pdf',
        image:       { type: 'jpeg', quality: 1 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF:       { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
}

function exportExcel() {
    if (typeof XLSX === 'undefined') { alert('Excel export library not loaded.'); return; }
    const wb = XLSX.utils.table_to_book(
        document.getElementById('form446Table'), { sheet: 'Form446' }
    );
    XLSX.writeFile(wb, 'Form446.xlsx');
}

function exportCSV() {
    const table = document.getElementById('form446Table');
    const rows  = table.querySelectorAll('tr');
    const csv   = [];

    rows.forEach(row => {
        const cells = row.querySelectorAll('td, th');
        const cols  = [...cells].map(c =>
            '"' + c.innerText.replace(/(\r\n|\n|\r)/gm, ' ').replace(/"/g, '""') + '"'
        );
        csv.push(cols.join(','));
    });

    const blob = new Blob([csv.join('\n')], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href     = URL.createObjectURL(blob);
    link.download = 'Form446.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}