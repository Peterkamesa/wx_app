/* ============================================================
   form496.js  –  Form No. 496 (Rev. 7/70)
   Kenya Meteorological Department — Monthly Rainfall Report

   Auto-fill rules (from user spec):
     • Day N value  = rainfall recorded at 0600Z on day N
     • "1st of following month" = 0600Z rainfall on 1st of next month
     • Trace (TR)   = rainfall > 0 but < 0.1 mm
     • TOTAL        = sum of all non-TR rainfall values
     • DAYS         = count of days where rainfall >= 0.1 mm

   Grid layout:
     Row 1: days  2 – 11
     Row 2: days 12 – 21
     Row 3: days 22 – 31   (blank cells for months < 31 days)
     Row 4: "1st of following month" | TOTAL | DAYS
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
    const user = typeof getUser === 'function' ? getUser() : null;
    if (user) {
        document.getElementById('lblStation').textContent   = user.name       || 'UNKNOWN';
        document.getElementById('lblStationId').textContent = user.stationId  || '';
    }

    // Default to current month
    const today = new Date();
    const mm   = (today.getMonth() + 1).toString().padStart(2, '0');
    const yyyy = today.getFullYear().toString();
    document.getElementById('monthPicker').value = `${yyyy}-${mm}`;

    document.getElementById('btnGenerate').addEventListener('click', generateForm);
    document.getElementById('btnPrint').addEventListener('click', () => window.print());
    document.getElementById('btnPdf').addEventListener('click', exportPDF);
    document.getElementById('btnExcel').addEventListener('click', exportExcel);
    document.getElementById('btnCsv').addEventListener('click', exportCSV);

    generateForm();
});

/* ── Helpers ──────────────────────────────────────────────── */
function showLoading(show) {
    const el = document.getElementById('loading-overlay');
    if (el) el.style.display = show ? 'flex' : 'none';
}

function getNum(val) {
    const n = parseFloat(val);
    return isNaN(n) ? null : n;
}

function buildDateStr(year, month, day) {
    return `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
}

function getObsForDate(obsData, dateStr, timePrefix) {
    return obsData.find(o =>
        o.date === dateStr && o.time && o.time.startsWith(timePrefix)
    ) || {};
}

/** Format a rainfall value:
 *  null / undefined  → ''
 *  0                 → '0.0'
 *  0 < v < 0.1      → 'TR'
 *  >= 0.1            → '1 dp string'
 */
function fmtRain(val) {
    const n = getNum(val);
    if (n === null) return '';
    if (n === 0)    return '0.0';
    if (n < 0.1)    return 'TR';
    return n.toFixed(1);
}

/* ── Main generator ───────────────────────────────────────── */
async function generateForm() {
    showLoading(true);
    try {
        const picker = document.getElementById('monthPicker').value;
        if (!picker) { alert('Please select a month and year.'); return; }

        const [yearStr, monthStr] = picker.split('-');
        const year  = parseInt(yearStr, 10);
        const month = parseInt(monthStr, 10);

        const MONTH_NAMES = ['JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE',
                             'JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER'];
        document.getElementById('lblMonth').textContent = MONTH_NAMES[month - 1];
        document.getElementById('lblYear').textContent  = yearStr;

        const daysInMonth = new Date(year, month, 0).getDate();

        // Next-month's 1st for the "1st of following month" row
        const nextMonthDate = new Date(year, month, 1); // JS month is 0-indexed
        const nextYear  = nextMonthDate.getFullYear();
        const nextMonth = nextMonthDate.getMonth() + 1;

        /* Fetch all station observations */
        const user = typeof getUser === 'function' ? getUser() : null;
        let allObs = [];
        if (user && typeof authenticatedFetch === 'function') {
            try {
                const res = await authenticatedFetch(`${API_BASE_URL}/station/${user.name}/observations`);
                allObs    = await res.json();
            } catch (err) {
                console.error('Error fetching observations:', err);
            }
        }

        buildGrid(year, month, yearStr, monthStr, daysInMonth, nextYear, nextMonth, allObs);

    } catch (err) {
        console.error('generateForm error:', err);
        alert('An error occurred while generating the form.');
    } finally {
        showLoading(false);
    }
}

/* ── Build the rainfall grid ──────────────────────────────── */
function buildGrid(year, month, yearStr, monthStr, daysInMonth,
                   nextYear, nextMonth, allObs) {

    const tbody = document.getElementById('rainBody');
    tbody.innerHTML = '';

    /* Gather rainfall values: index 2..31 (day 1 is absent from main grid) */
    const rainValues = {};   // rainValues[day] = formatted string
    let total     = 0;
    let rainyDays = 0;

    for (let day = 2; day <= 31; day++) {
        if (day > daysInMonth) {
            rainValues[day] = null;  // month doesn't have this day
            continue;
        }
        const dateStr = buildDateStr(yearStr, monthStr, day);
        const obs06   = getObsForDate(allObs, dateStr, '06');
        const raw     = getNum(obs06.rainfall);

        if (raw !== null) {
            if (raw >= 1.0) { total += raw; rainyDays++; }
            else if (raw > 0) { total += raw; }  // count amount but not as rainy day
            rainValues[day] = fmtRain(raw);
        } else {
            rainValues[day] = '';
        }
    }

    /* "1st of following month" = 0600Z on 1st of next month */
    const firstNextStr  = buildDateStr(nextYear, nextMonth, 1);
    const firstNextObs  = getObsForDate(allObs, firstNextStr, '06');
    const firstNextRaw  = getNum(firstNextObs.rainfall);
    const firstNextFmt  = firstNextRaw !== null ? fmtRain(firstNextRaw) : '';
    if (firstNextRaw !== null && firstNextRaw >= 1.0) { total += firstNextRaw; rainyDays++; }
    else if (firstNextRaw !== null && firstNextRaw > 0) { total += firstNextRaw; }

    /* ── Three data rows (days 2-11, 12-21, 22-31) ── */
    const groups = [
        [2,  3,  4,  5,  6,  7,  8,  9,  10, 11],
        [12, 13, 14, 15, 16, 17, 18, 19, 20, 21],
        [22, 23, 24, 25, 26, 27, 28, 29, 30, 31],
    ];

    groups.forEach(days => {
        // Header row
        const hdrRow = document.createElement('tr');
        days.forEach(d => {
            const td = document.createElement('td');
            td.className = 'day-header';
            if (d <= daysInMonth) {
                td.textContent = d;
            } else {
                td.textContent = '';
                td.style.backgroundColor = '#FFD700';
                td.style.border = 'none';
            }
            hdrRow.appendChild(td);
        });
        tbody.appendChild(hdrRow);

        // Value row
        const valRow = document.createElement('tr');
        days.forEach(d => {
            const td = document.createElement('td');
            td.className = 'value-cell';
            if (d <= daysInMonth) {
                td.textContent = rainValues[d] ?? '';
                td.id = `rain_day_${d}`;
            } else {
                // Day doesn't exist in this month – match background exactly
                td.style.backgroundColor = '#FFD700';
                td.style.border = 'none';
            }
            valRow.appendChild(td);
        });
        tbody.appendChild(valRow);
    });

    /* ── Footer row 1: labels ── */
    const footLblRow = document.createElement('tr');

    // "1st of following month" spans 4 cols, TOTAL spans 3 cols, DAYS spans 3 cols
    const td1lbl = document.createElement('td');
    td1lbl.colSpan = 4;
    td1lbl.className = 'footer-label';
    td1lbl.textContent = '1st of the following month';
    footLblRow.appendChild(td1lbl);

    const tdTotLbl = document.createElement('td');
    tdTotLbl.colSpan = 3;
    tdTotLbl.className = 'footer-label';
    tdTotLbl.textContent = 'TOTAL';
    footLblRow.appendChild(tdTotLbl);

    const tdDaysLbl = document.createElement('td');
    tdDaysLbl.colSpan = 3;
    tdDaysLbl.className = 'footer-label';
    tdDaysLbl.textContent = 'DAYS';
    footLblRow.appendChild(tdDaysLbl);

    tbody.appendChild(footLblRow);

    /* ── Footer row 2: values ── */
    const footValRow = document.createElement('tr');

    const td1val = document.createElement('td');
    td1val.colSpan = 4;
    td1val.className = 'value-cell';
    td1val.style.fontWeight = 'bold';
    td1val.textContent = firstNextFmt;
    footValRow.appendChild(td1val);

    const tdTotVal = document.createElement('td');
    tdTotVal.colSpan = 3;
    tdTotVal.className = 'value-cell';
    tdTotVal.style.fontWeight = 'bold';
    tdTotVal.textContent = total > 0 ? total.toFixed(1) : '0.0';
    footValRow.appendChild(tdTotVal);

    const tdDaysVal = document.createElement('td');
    tdDaysVal.colSpan = 3;
    tdDaysVal.className = 'value-cell';
    tdDaysVal.style.fontWeight = 'bold';
    tdDaysVal.textContent = rainyDays;
    footValRow.appendChild(tdDaysVal);

    tbody.appendChild(footValRow);
}

/* ── Export functions ─────────────────────────────────────── */
function exportPDF() {
    const el  = document.getElementById('printable-area');
    const opt = {
        margin:      [8, 10, 8, 10],
        filename:    'Form496_MonthlyRainfall.pdf',
        image:       { type: 'jpeg', quality: 1 },
        html2canvas: { scale: 2, useCORS: true, logging: false,
                       backgroundColor: '#FFD700' },
        jsPDF:       { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(el).save();
}

function exportExcel() {
    if (typeof XLSX === 'undefined') { alert('Excel library not loaded.'); return; }
    const wb = XLSX.utils.table_to_book(
        document.getElementById('rainTable'), { sheet: 'Form496' }
    );
    XLSX.writeFile(wb, 'Form496.xlsx');
}

function exportCSV() {
    const rows = document.querySelectorAll('#rainTable tr');
    const csv  = [...rows].map(row =>
        [...row.querySelectorAll('td, th')]
            .map(c => '"' + c.innerText.replace(/"/g,'""') + '"')
            .join(',')
    );
    const blob = new Blob([csv.join('\n')], { type: 'text/csv' });
    const a    = document.createElement('a');
    a.href     = URL.createObjectURL(blob);
    a.download = 'Form496.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}
