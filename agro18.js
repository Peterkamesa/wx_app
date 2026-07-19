document.addEventListener('DOMContentLoaded', () => {
    const user = typeof getUser === 'function' ? getUser() : null;
    if (user) {
        document.getElementById('lblStationName').textContent = user.name || 'UNKNOWN';
        document.getElementById('lblStationId').textContent = user.stationId || '';
    }

    const today = new Date();
    const currentMonth = (today.getMonth() + 1).toString().padStart(2, '0');
    const currentYear = today.getFullYear();
    const monthPicker = document.getElementById('monthPicker');
    if (monthPicker) {
        monthPicker.value = `${currentYear}-${currentMonth}`;
    }

    const currentDay = today.getDate();
    let defaultDekad = 1;
    if (currentDay > 10 && currentDay <= 20) defaultDekad = 2;
    if (currentDay > 20) defaultDekad = 3;
    document.getElementById('dekadPicker').value = defaultDekad;

    document.getElementById('btnGenerate').addEventListener('click', generateForm);
    document.getElementById('btnPrint').addEventListener('click', () => window.print());
    document.getElementById('btnPdf').addEventListener('click', exportPDF);
    document.getElementById('btnExcel').addEventListener('click', exportExcel);
    document.getElementById('btnCsv').addEventListener('click', exportCSV);

    generateForm();
});

function showLoading(show) {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) overlay.style.display = show ? 'flex' : 'none';
}

async function generateForm() {
    showLoading(true);
    try {
        const monthPicker = document.getElementById('monthPicker').value;
        const dekadPicker = parseInt(document.getElementById('dekadPicker').value, 10);
        
        if (!monthPicker || !dekadPicker) {
            alert("Please select a month, year, and dekad.");
            return;
        }

        const [yearStr, monthStr] = monthPicker.split('-');
        const year = parseInt(yearStr, 10);
        const month = parseInt(monthStr, 10);
        
        const monthNames = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
        document.getElementById('lblMonth').textContent = monthNames[month - 1];
        document.getElementById('lblYear').textContent = yearStr;
        
        // Calculate Annual Dekad (1-36)
        const annualDekad = (month - 1) * 3 + dekadPicker;
        document.getElementById('lblDekad').textContent = annualDekad;
        
        // Calculate Days Range
        const daysInMonth = new Date(year, month, 0).getDate();
        let startDay = 1, endDay = 10;
        if (dekadPicker === 2) {
            startDay = 11;
            endDay = 20;
        } else if (dekadPicker === 3) {
            startDay = 21;
            endDay = daysInMonth;
        }
        
        const user = typeof getUser === 'function' ? getUser() : null;
        let allObs = [];
        if (user && typeof authenticatedFetch === 'function') {
            try {
                // Fetch all observations to ensure we have next day's 0600Z rain
                const res = await authenticatedFetch(`${API_BASE_URL}/station/${user.name}/observations`);
                allObs = await res.json();
            } catch (err) {
                console.error("Error fetching observations:", err);
            }
        }

        renderTableRows(year, month, startDay, endDay, allObs);

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

function getNextDateStr(year, month, day) {
    const d = new Date(year, month - 1, day + 1);
    const y = d.getFullYear();
    const m = (d.getMonth() + 1).toString().padStart(2, '0');
    const dd = d.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${dd}`;
}

function getNum(val) {
    const n = parseFloat(val);
    return isNaN(n) ? null : n;
}

function computeAverage(val1, val2) {
    const n1 = getNum(val1);
    const n2 = getNum(val2);
    if (n1 === null || n2 === null) return '///';
    return ((n1 + n2) / 2).toFixed(1);
}

function renderTableRows(year, month, startDay, endDay, allObs) {
    const tbody = document.getElementById('agroBody');
    tbody.innerHTML = '';

    const monthStr = month.toString().padStart(2, '0');

    for (let day = startDay; day <= endDay; day++) {
        const dayStr = day.toString().padStart(2, '0');
        const currentDateStr = `${year}-${monthStr}-${dayStr}`;
        const nextDateStr = getNextDateStr(year, month, day);
        
        const obs06 = getObsForDateAndTime(allObs, currentDateStr, '06');
        const obs09 = getObsForDateAndTime(allObs, currentDateStr, '09');
        const obs12 = getObsForDateAndTime(allObs, currentDateStr, '12');
        const obs18 = getObsForDateAndTime(allObs, currentDateStr, '18');
        
        // Evaporation, Windrun, Rainfall are next day's 0600Z
        const nextObs06 = getObsForDateAndTime(allObs, nextDateStr, '06');
        
        const evap = nextObs06.e_p || nextObs06.evap_1 || '';
        const windrun = nextObs06.w_run || '';
        
        const rawRain = parseFloat(nextObs06.rainfall);
        let rain = nextObs06.rainfall || '';
        if (rain.toUpperCase() === 'NIL' || rawRain === 0) {
            rain = '0.0';
        } else if (!isNaN(rawRain)) {
            rain = rawRain.toFixed(1);
        }

        const tr = document.createElement('tr');
        
        let html = `
            <td>${day}</td>
            <td>${obs18.max_temp || ''}</td>
            <td>${obs06.min_temp || ''}</td>
            <td>${obs09.soil_5 || ''}</td>
            <td>${obs09.soil_10 || ''}</td>
            <td>${obs09.soil_20 || ''}</td>
            <td>${computeAverage(obs06.dew_point, obs12.dew_point)}</td>
            <td>${computeAverage(obs06.dry_bulb, obs12.dry_bulb)}</td>
            <td>${computeAverage(obs06.wet_bulb, obs12.wet_bulb)}</td>
            <td>${obs12.sunshine || obs06.sunshine || ''}</td>
            <td>${obs12.radiation || obs06.radiation || ''}</td>
            <td>${evap}</td>
            <td>${rain}</td>
            <td>${windrun}</td>
        `;
        
        tr.innerHTML = html;
        tbody.appendChild(tr);
    }
}

function exportPDF() {
    const element = document.getElementById('printable-area');
    const opt = {
        margin:       3,
        filename:     'AGRO18.pdf',
        image:        { type: 'jpeg', quality: 1 },
        html2canvas:  { scale: 2, useCORS: true, logging: false },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'landscape' }
    };
    
    html2pdf().set(opt).from(element).save();
}

function exportExcel() {
    if (typeof XLSX === 'undefined') {
        alert("Excel export library failed to load.");
        return;
    }
    const table = document.getElementById('agroTable');
    const wb = XLSX.utils.table_to_book(table, {sheet: "AGRO18"});
    XLSX.writeFile(wb, 'AGRO18.xlsx');
}

function exportCSV() {
    const table = document.getElementById('agroTable');
    let csv = [];
    const rows = table.querySelectorAll('tr');
    
    for (let i = 0; i < rows.length; i++) {
        let row = [], cols = rows[i].querySelectorAll('td, th');
        
        for (let j = 0; j < cols.length; j++) {
            let data = cols[j].innerText.replace(/(\r\n|\n|\r)/gm, ' ').replace(/"/g, '""');
            row.push('"' + data + '"');
        }
        csv.push(row.join(','));
    }

    const csvFile = new Blob([csv.join('\n')], {type: "text/csv"});
    const downloadLink = document.createElement("a");
    downloadLink.download = 'AGRO18.csv';
    downloadLink.href = window.URL.createObjectURL(csvFile);
    downloadLink.style.display = "none";
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
}
