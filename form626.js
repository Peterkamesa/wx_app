document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize logic
    const user = typeof getUser === 'function' ? getUser() : null;
    if (user) {
        document.getElementById('lblStationName').textContent = user.name || 'UNKNOWN';
        document.getElementById('lblStationId').textContent = user.stationId || 'UNKNOWN';
    }

    // Set default month to current month
    const today = new Date();
    const currentMonth = (today.getMonth() + 1).toString().padStart(2, '0');
    const currentYear = today.getFullYear();
    const monthPicker = document.getElementById('monthPicker');
    if (monthPicker) {
        monthPicker.value = `${currentYear}-${currentMonth}`;
    }

    // Event Listeners
    document.getElementById('btnGenerate').addEventListener('click', generateForm);
    document.getElementById('btnPrint').addEventListener('click', () => window.print());
    document.getElementById('btnPdf').addEventListener('click', exportPDF);
    document.getElementById('btnExcel').addEventListener('click', exportExcel);
    document.getElementById('btnCsv').addEventListener('click', exportCSV);

    // Initial generate
    generateForm();
});

function showLoading(show) {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) overlay.style.display = show ? 'flex' : 'none';
}

async function generateForm() {
    showLoading(true);
    try {
        const monthPicker = document.getElementById('monthPicker').value; // "YYYY-MM"
        if (!monthPicker) {
            alert("Please select a month and year.");
            return;
        }

        const [year, month] = monthPicker.split('-');
        
        // Update labels
        const monthNames = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
        const monthName = monthNames[parseInt(month, 10) - 1];
        document.getElementById('lblMonthYear').textContent = `${monthName} ${year}`;
        
        // Determine days in month (28, 29, 30, 31)
        const daysInMonth = new Date(year, month, 0).getDate();
        
        // Fetch observations
        const user = typeof getUser === 'function' ? getUser() : null;
        let allObs = [];
        if (user && typeof authenticatedFetch === 'function') {
            try {
                // Fetch all observations for the station (needed for next day lookups)
                const res = await authenticatedFetch(`${API_BASE_URL}/station/${user.name}/observations`);
                allObs = await res.json();
            } catch (err) {
                console.error("Error fetching observations:", err);
            }
        }

        renderTableRows(year, month, daysInMonth, allObs, user ? user.stationId : 'UNKNOWN');

    } catch (error) {
        console.error("Error generating form:", error);
        alert("An error occurred while generating the form.");
    } finally {
        showLoading(false);
    }
}

function getObsForDateAndTime(obsData, dateStr, timePrefix) {
    return obsData.find(obs => {
        if (!obs.date || !obs.time) return false;
        return obs.date === dateStr && obs.time.startsWith(timePrefix);
    }) || {};
}

/** Returns true if the stored value is a missing-data code like /// or //// */
function isMissing(val) {
    if (val === null || val === undefined) return false;
    return /^\/+$/.test(String(val).trim());
}

/** Display helper: pass /// or //// through as-is; otherwise return val or fallback */
function fmtVal(val, fallback = '') {
    if (isMissing(val)) return String(val).trim();
    return (val !== null && val !== undefined && val !== '') ? val : fallback;
}

function renderTableRows(year, month, daysInMonth, obsData, stnNumber) {
    const tbody = document.getElementById('form626Body');
    tbody.innerHTML = '';

    const monthStr = month.toString().padStart(2, '0');

    for (let i = 1; i <= daysInMonth; i++) {
        const dayStr = i.toString().padStart(2, '0');
        const dateStr = `${year}-${monthStr}-${dayStr}`;
        const nextDate = (() => {
            const d = new Date(year, month - 1, i + 1);
            return `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2,'0')}-${d.getDate().toString().padStart(2,'0')}`;
        })();
        
        // Find observations for 0600Z, 1200Z, and 1800Z
        const obs06 = getObsForDateAndTime(obsData, dateStr, '06');
        const obs12 = getObsForDateAndTime(obsData, dateStr, '12');
        const obs18 = getObsForDateAndTime(obsData, dateStr, '18');
        const nextObs06 = getObsForDateAndTime(obsData, nextDate, '06');

        const nextObsExists = Object.keys(nextObs06).length > 0;

        // Fetch Next Day 0600Z for Evaporation, Windrun, Rainfall
        // Evaporation: pass through /// or //// if stored that way. If record exists but missing, use ///
        const evap = fmtVal(nextObs06.e_p || nextObs06.evap_1, nextObsExists ? '///' : '');

        // Windrun: show //// if w_run is //// or missing (and record exists)
        const nextWindRunRaw = nextObs06.wind_run;
        const wRunRaw = nextObs06.w_run;
        let windrun = '';
        if (nextObsExists && (isMissing(wRunRaw) || isMissing(nextWindRunRaw) || String(wRunRaw).trim() === '')) {
            windrun = '////';
        } else {
            windrun = fmtVal(wRunRaw);
        }

        // Rainfall: pass through /// or //// if stored that way
        let rain = '';
        if (isMissing(nextObs06.rainfall)) {
            rain = String(nextObs06.rainfall).trim();
        } else {
            const rawRain = parseFloat(nextObs06.rainfall);
            rain = nextObs06.rainfall || '';
            if (String(rain).toUpperCase() === 'NIL' || rawRain === 0) {
                rain = '0.0';
            } else if (!isNaN(rawRain)) {
                rain = rawRain.toFixed(1);
            }
        }

        const tr = document.createElement('tr');
        
        let html = `
            <td>${stnNumber}</td>
            <td>${year}</td>
            <td>${parseInt(month, 10)}</td>
            <td class="text-primary">${dayStr}</td>
            <td class="text-primary">06</td>
            
            <!-- TEMP 0600Z -->
            <td>${fmtVal(obs06.dry_bulb)}</td>
            <td>${fmtVal(obs06.wet_bulb)}</td>
            <td>${fmtVal(obs06.dew_point)}</td>
            <td>${fmtVal(obs06.r_h || obs06.rh)}</td>
            
            <!-- TEMP C (Max from 1800Z, Min, Grass from 0600Z) -->
            <td>${fmtVal(obs18.max_temp)}</td>
            <td>${fmtVal(obs06.min_temp)}</td>
            <td>${fmtVal(obs06.g_min)}</td>
            
            <!-- SOIL 0500GMT (5, 10, 20, 30, 50, 100) -->
            <td>${fmtVal(obs06.soil_5)}</td>
            <td>${fmtVal(obs06.soil_10)}</td>
            <td>${fmtVal(obs06.soil_20)}</td>
            <td>${fmtVal(obs06.soil_30)}</td>
            <td>${fmtVal(obs06.soil_50)}</td>
            <td>${fmtVal(obs06.soil_100)}</td>
            
            <!-- SOIL 0900GMT (5, 10, 20) -->
            <td>${fmtVal(obs06.soil_0900_5)}</td>
            <td>${fmtVal(obs06.soil_0900_10)}</td>
            <td>${fmtVal(obs06.soil_0900_20)}</td>
            
            <!-- ANEMOMETER (Height, Windrun) -->
            <td>${fmtVal(obs06.anemometer_height)}</td>
            <td>${windrun}</td>
            
            <!-- RAINFALL -->
            <td>${rain}</td>
            <td>${fmtVal(nextObs06.rainfall_duration)}</td>
            
            <!-- SUNSHINE -->
            <td>${fmtVal(obs06.sunshine)}</td>
            
            <!-- RADIOMETER -->
            <td>${fmtVal(obs06.rad_type1)}</td>
            <td>${fmtVal(obs06.radiation)}</td>
            <td>${fmtVal(obs06.rad_type2)}</td>
            
            <!-- EVAPO PANS -->
            <td>${evap}</td>
            <td>${fmtVal(nextObs06.evap_type)}</td>
            <td>${fmtVal(nextObs06.evap_2)}</td>
            
            <!-- HOURS p.m. -->
            <td class="text-primary">12</td>
            
            <!-- TEMP 1200Z -->
            <td>${obs12.dry_bulb || ''}</td>
            <td>${obs12.wet_bulb || ''}</td>
            <td>${obs12.dew_point || ''}</td>
            <td>${obs12.r_h || obs12.rh || ''}</td>
            
            <!-- SOIL 1300G (5, 10, 20) -->
            <td>${obs12.soil_1300_5 || ''}</td>
            <td>${obs12.soil_1300_10 || ''}</td>
            <td>${obs12.soil_1300_20 || ''}</td>
            
            <!-- MAX/MIN RESET -->
            <td>${obs12.max_reset || ''}</td>
            <td>${obs12.min_reset || ''}</td>
            
            <!-- SOIL MOISTURE (5, 100) -->
            <td>${obs12.soil_moist_5 || ''}</td>
            <td>${obs12.soil_moist_100 || ''}</td>
        `;
        
        tr.innerHTML = html;
        tbody.appendChild(tr);
    }
}

function exportPDF() {
    const element = document.getElementById('printable-area');
    // Save current styling to restore later if needed
    const opt = {
        margin:       3,
        filename:     'Form626.pdf',
        image:        { type: 'jpeg', quality: 1 },
        html2canvas:  { scale: 2, useCORS: true, logging: false },
        jsPDF:        { unit: 'mm', format: 'a3', orientation: 'landscape' }
    };
    
    // add small style temporarily for pdf rendering to fit
    const table = document.getElementById('formTable');
    const oldWidth = table.style.minWidth;
    table.style.minWidth = 'auto'; // allow it to scale
    table.style.fontSize = '8px'; // reduce font size to fit A3 width

    html2pdf().set(opt).from(element).save().then(() => {
        // restore
        table.style.minWidth = oldWidth;
        table.style.fontSize = '';
    });
}

function exportExcel() {
    if (typeof XLSX === 'undefined') {
        alert("Excel export library failed to load.");
        return;
    }
    const table = document.getElementById('formTable');
    const wb = XLSX.utils.table_to_book(table, {sheet: "Form626"});
    XLSX.writeFile(wb, 'Form626.xlsx');
}

function exportCSV() {
    const table = document.getElementById('formTable');
    let csv = [];
    const rows = table.querySelectorAll('tr');
    
    for (let i = 0; i < rows.length; i++) {
        let row = [], cols = rows[i].querySelectorAll('td, th');
        
        for (let j = 0; j < cols.length; j++) {
            // Clean inner text by replacing quotes and line breaks
            let data = cols[j].innerText.replace(/(\r\n|\n|\r)/gm, ' ').replace(/"/g, '""');
            row.push('"' + data + '"');
        }
        csv.push(row.join(','));
    }

    const csvFile = new Blob([csv.join('\n')], {type: "text/csv"});
    const downloadLink = document.createElement("a");
    downloadLink.download = 'Form626.csv';
    downloadLink.href = window.URL.createObjectURL(csvFile);
    downloadLink.style.display = "none";
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
}