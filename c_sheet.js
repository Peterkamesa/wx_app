document.addEventListener('DOMContentLoaded', () => {
    const user = typeof getUser === 'function' ? getUser() : null;
    if (user) {
        document.getElementById('lblStationName').textContent = user.name || 'UNKNOWN';
    }

    const today = new Date();
    const currentMonth = (today.getMonth() + 1).toString().padStart(2, '0');
    const currentYear = today.getFullYear();
    const monthPicker = document.getElementById('monthPicker');
    if (monthPicker) {
        monthPicker.value = `${currentYear}-${currentMonth}`;
    }

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
        if (!monthPicker) {
            alert("Please select a month and year.");
            return;
        }

        const [year, month] = monthPicker.split('-');
        
        const monthNames = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
        const monthName = monthNames[parseInt(month, 10) - 1];
        document.getElementById('lblMonth').textContent = monthName;
        document.getElementById('lblYear').textContent = year;
        
        const daysInMonth = new Date(year, month, 0).getDate();
        
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

        renderTableRows(year, month, daysInMonth, allObs);

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

function getNum(val) {
    const n = parseFloat(val);
    return isNaN(n) ? null : n;
}

function renderTableRows(year, month, daysInMonth, obsData) {
    const tbody = document.getElementById('cSheetBody');
    const tfoot = document.getElementById('cSheetFoot');
    tbody.innerHTML = '';
    tfoot.innerHTML = '';

    const params = [
        'max', 'min', 'lgm', 'dew06', 'dew09', 'dew12', 'rh06', 'rh12',
        'sunshine', 'radiation', 'evap', 'rain', 'rain5mm', 'thunder', 'hail',
        'windrun', 'pres06', 'pres12'
    ];
    
    const stats = {};
    params.forEach(p => stats[p] = {sum: 0, count: 0, highest: -Infinity, lowest: Infinity});

    const addStat = (key, val) => {
        const n = getNum(val);
        if (n !== null) {
            stats[key].sum += n;
            stats[key].count++;
            if (n > stats[key].highest) stats[key].highest = n;
            if (n < stats[key].lowest) stats[key].lowest = n;
        }
    };

    const monthStr = month.toString().padStart(2, '0');

    for (let i = 1; i <= daysInMonth; i++) {
        const dayStr = i.toString().padStart(2, '0');
        const dateStr = `${year}-${monthStr}-${dayStr}`;
        const nextDate = (() => {
            const d = new Date(year, month - 1, i + 1);
            return `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2,'0')}-${d.getDate().toString().padStart(2,'0')}`;
        })();
        
        const obs06 = getObsForDateAndTime(obsData, dateStr, '06');
        const obs09 = getObsForDateAndTime(obsData, dateStr, '09');
        const obs12 = getObsForDateAndTime(obsData, dateStr, '12');
        const obs18 = getObsForDateAndTime(obsData, dateStr, '18');
        const nextObs06 = getObsForDateAndTime(obsData, nextDate, '06');

        const tr = document.createElement('tr');
        
        const press06 = obs06.pr_read ? (parseFloat(obs06.pr_read) - 0.1).toFixed(1) : '';
        const press12 = obs12.pr_read ? (parseFloat(obs12.pr_read) - 0.1).toFixed(1) : '';

        addStat('max', obs18.max_temp);   // MAX from 1800Z
        addStat('min', obs06.min_temp);
        addStat('lgm', obs06.g_min);
        addStat('dew06', obs06.dew_point);
        addStat('dew09', obs09.dew_point);
        addStat('dew12', obs12.dew_point);
        addStat('rh06', (obs06.r_h || obs06.rh));
        addStat('rh12', (obs12.r_h || obs12.rh));
        addStat('pres06', press06);
        addStat('pres12', press12);
        
        addStat('sunshine', obs12.sunshine || obs06.sunshine);
        addStat('radiation', obs12.radiation || obs06.radiation);
        
        const evap = nextObs06.e_p || nextObs06.evap_1 || '';
        addStat('evap', evap);
        
        const rawRain = parseFloat(nextObs06.rainfall);
        let rain = nextObs06.rainfall || '';
        if (rain.toUpperCase() === 'NIL' || rawRain === 0) {
            rain = '0.0';
        } else if (!isNaN(rawRain)) {
            rain = rawRain.toFixed(1);
        }
        const dailyRain = getNum(rain);
        if (dailyRain !== null) {
            addStat('rain', dailyRain);
            if (dailyRain >= 5.0) addStat('rain5mm', 1);
        }

        addStat('thunder', obs06.thunder || obs12.thunder);
        addStat('hail', obs06.hail || obs12.hail);
        
        const windrun = nextObs06.w_run || '';
        addStat('windrun', windrun);

        let html = `
            <td>${i}</td>
            <td>${obs18.max_temp || ''}</td>  <!-- MAX from 1800Z -->
            <td>${obs06.min_temp || ''}</td>
            <td></td>
            <td>${obs06.g_min || ''}</td>
            <td>${obs06.dew_point || ''}</td>
            <td>${obs09.dew_point || ''}</td>
            <td>${obs12.dew_point || ''}</td>
            <td>${obs06.r_h || obs06.rh || ''}</td>
            <td>${obs12.r_h || obs12.rh || ''}</td>
            <td>${obs12.sunshine || obs06.sunshine || ''}</td>
            <td>${obs12.radiation || obs06.radiation || ''}</td>
            <td>${evap}</td>
            <td>${rain}</td>
            <td>${(dailyRain !== null && dailyRain >= 5.0) ? '1' : ''}</td>
            <td>${obs06.thunder || obs12.thunder || ''}</td>
            <td>${obs06.hail || obs12.hail || ''}</td>
            <td>${windrun}</td>
            <td>${press06}</td>
            <td>${press12}</td>
        `;
        
        tr.innerHTML = html;
        tbody.appendChild(tr);
    }

    const formatStat = (key, type, isInt = false) => {
        if (stats[key].count === 0) return '';
        let val;
        if (type === 'sum') val = stats[key].sum;
        if (type === 'mean') val = stats[key].sum / stats[key].count;
        if (type === 'highest') val = stats[key].highest;
        if (type === 'lowest') val = stats[key].lowest;
        
        if (isInt) return Math.round(val);
        return val.toFixed(1);
    };

    const buildRow = (label, type) => `
        <tr>
            <td>${label}</td>
            <td>${formatStat('max', type)}</td>
            <td>${formatStat('min', type)}</td>
            <td></td>
            <td>${formatStat('lgm', type)}</td>
            <td>${formatStat('dew06', type)}</td>
            <td>${formatStat('dew09', type)}</td>
            <td>${formatStat('dew12', type)}</td>
            <td>${formatStat('rh06', type, true)}</td>
            <td>${formatStat('rh12', type, true)}</td>
            <td>${formatStat('sunshine', type)}</td>
            <td>${formatStat('radiation', type)}</td>
            <td>${formatStat('evap', type)}</td>
            <td>${formatStat('rain', type)}</td>
            <td>${formatStat('rain5mm', type, true)}</td>
            <td>${formatStat('thunder', type, true)}</td>
            <td>${formatStat('hail', type, true)}</td>
            <td>${formatStat('windrun', type)}</td>
            <td>${formatStat('pres06', type)}</td>
            <td>${formatStat('pres12', type)}</td>
        </tr>
    `;

    tfoot.innerHTML = `
        ${buildRow('SUM', 'sum')}
        ${buildRow('MEAN', 'mean')}
        ${buildRow('HIGHEST', 'highest')}
        ${buildRow('LOWEST', 'lowest')}
    `;
}

function exportPDF() {
    const element = document.getElementById('printable-area');
    const opt = {
        margin:       3,
        filename:     'ComputationSheet.pdf',
        image:        { type: 'jpeg', quality: 1 },
        html2canvas:  { scale: 2, useCORS: true, logging: false },
        jsPDF:        { unit: 'mm', format: 'a3', orientation: 'landscape' }
    };
    
    const table = document.getElementById('cSheetTable');
    const oldWidth = table.style.minWidth;
    table.style.minWidth = 'auto';
    table.style.fontSize = '9px';

    html2pdf().set(opt).from(element).save().then(() => {
        table.style.minWidth = oldWidth;
        table.style.fontSize = '';
    });
}

function exportExcel() {
    if (typeof XLSX === 'undefined') {
        alert("Excel export library failed to load.");
        return;
    }
    const table = document.getElementById('cSheetTable');
    const wb = XLSX.utils.table_to_book(table, {sheet: "ComputationSheet"});
    XLSX.writeFile(wb, 'ComputationSheet.xlsx');
}

function exportCSV() {
    const table = document.getElementById('cSheetTable');
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
    downloadLink.download = 'ComputationSheet.csv';
    downloadLink.href = window.URL.createObjectURL(csvFile);
    downloadLink.style.display = "none";
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
}