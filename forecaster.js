// ============================================================
// FORECASTER DASHBOARD JAVASCRIPT
// Kenya Meteorological Department - Smart Wx
// ============================================================

const REGIONS = [
    { code: 'SE', name: 'South Eastern (SE)' },
    { code: 'NE', name: 'North Eastern (NE)' },
    { code: 'Coast', name: 'Coast' },
    { code: 'NW', name: 'North Western (NW)' },
    { code: 'W', name: 'Western (W)' },
    { code: 'Central', name: 'Central' }
];

// Helper functions for table cell inputs
function inputCell(id, placeholder) {
    const ph = placeholder || '';
    return '<td><input type="text" id="' + id + '" placeholder="' + ph + '" autocomplete="off"></td>';
}
function textareaCell(id, rows, placeholder) {
    const r = rows || 3;
    const ph = placeholder || '';
    return '<td><textarea id="' + id + '" rows="' + r + '" placeholder="' + ph + '"></textarea></td>';
}

// ============================================================
// TAB NAVIGATION FUNCTIONS (100% reliable, zero-dependency)
// ============================================================
function openMainTab(tabName) {
    const tabs = ['rofor', 'dailywx', 'monbrief', 'taf'];
    tabs.forEach(t => {
        const btn = document.getElementById(t + '-tab-btn');
        const pane = document.getElementById(t + '-tab-pane');
        if (t === tabName) {
            if (btn) btn.classList.add('active');
            if (pane) {
                pane.classList.add('show', 'active');
                pane.style.display = 'block';
            }
        } else {
            if (btn) btn.classList.remove('active');
            if (pane) {
                pane.classList.remove('show', 'active');
                pane.style.display = 'none';
            }
        }
    });

    if (tabName === 'dailywx') loadLatestDailyWX();
    else if (tabName === 'monbrief') loadLatestMondayBrief();
    else if (tabName === 'taf') loadLatestForecasterTAF();
}

function openRegion(regionCode) {
    REGIONS.forEach(r => {
        const btn = document.getElementById('reg-btn-' + r.code);
        const pane = document.getElementById('region-' + r.code);
        if (r.code === regionCode) {
            if (btn) btn.classList.add('active');
            if (pane) {
                pane.classList.add('show', 'active');
                pane.style.display = 'block';
            }
        } else {
            if (btn) btn.classList.remove('active');
            if (pane) {
                pane.classList.remove('show', 'active');
                pane.style.display = 'none';
            }
        }
    });

    // Ensure form is rendered
    const container = document.getElementById('rofor-form-' + regionCode);
    if (container && !container.innerHTML.trim()) {
        const regObj = REGIONS.find(r => r.code === regionCode) || { code: regionCode, name: regionCode };
        container.innerHTML = buildROFORForm(regObj.code, regObj.name);
    }

    // Load saved data for this region
    loadLatestROFOR(regionCode);
}

// ============================================================
// BUILD EXACT ROFOR FORM (FORM NO.2063) FOR EACH REGION
// ============================================================
function buildROFORForm(regionCode, regionName) {
    const p = 'rofor-' + regionCode;
    return `
    <div class="rofor-header-sheet">
        <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 border-bottom pb-2 mb-2">
            <span class="form-no">FORM NO.2063 (REV.4/ 74)</span>
            <div class="dept-title">
                KENYA METEOROLOGICAL DEPARTMENT<br>
                <span>TABULAR FORECAST OF EN-ROUTE CONDITIONS</span>
            </div>
            <span class="badge" style="background-color:var(--secondary-color); font-size:0.85rem; padding:6px 12px;">${regionName}</span>
        </div>

        <div class="row g-2 rofor-meta-row">
            <div class="col-md-3 col-sm-6">
                <label>Issued By</label>
                <input type="text" class="form-control" id="${p}-issued-by" placeholder="e.g. MAB">
            </div>
            <div class="col-md-3 col-sm-6">
                <label>Meteorological Office</label>
                <input type="text" class="form-control" id="${p}-met-office" placeholder="METEOROLOGICAL OFFICE">
            </div>
            <div class="col-md-3 col-sm-6">
                <label>(Date, Time)</label>
                <input type="text" class="form-control" id="${p}-issue-datetime" placeholder="e.g. 11.09.2026 0330Z">
            </div>
            <div class="col-md-3 col-sm-6">
                <label>By</label>
                <input type="text" class="form-control" id="${p}-by-name" placeholder="e.g. Z.N">
            </div>
        </div>

        <div class="row g-2 rofor-meta-row mt-1">
            <div class="col-md-2 col-sm-4">
                <label>Route</label>
                <input type="text" class="form-control" id="${p}-route-from" placeholder="MAB">
            </div>
            <div class="col-md-2 col-sm-4">
                <label>To</label>
                <input type="text" class="form-control" id="${p}-route-to" placeholder="MAB">
            </div>
            <div class="col-md-2 col-sm-4">
                <label>Via</label>
                <input type="text" class="form-control" id="${p}-route-via" placeholder="...">
            </div>
            <div class="col-md-3 col-sm-6">
                <label>Valid for Departure (Date, Time)</label>
                <input type="text" class="form-control" id="${p}-valid-dept" placeholder="11.09.2026 0330Z">
            </div>
            <div class="col-md-3 col-sm-6">
                <label>Valid for Arrival (Date, Time)</label>
                <input type="text" class="form-control" id="${p}-valid-arr" placeholder="11.09.2026 1500Z">
            </div>
        </div>

        <div class="text-center mt-2 pt-1 border-top" style="font-size:0.75rem; font-weight:700; color:#555; letter-spacing:0.04em;">
            HEIGHT INDICATORS TO PRESSURES ALTITUDE &bull; ALL TIMES ARE IN GMT
        </div>
    </div>

    <!-- GENERAL METEOROLOGICAL OUTLOOK -->
    <div class="rofor-outlook-block">
        <label>GENERAL METEOROLOGICAL OUTLOOK:</label>
        <textarea class="form-control" id="${p}-outlook" rows="3" placeholder="Most parts of the country are expected to remain generally dry. Rainfall expected in some parts of Kericho, Kakamega, Vihiga, Nandi, Uasin Gishu, Bungoma, Trans Nzoia, Murang'a, Meru, Embu, Mombasa, Lamu, Kilifi and Kwale counties."></textarea>
    </div>

    <!-- STRONG WINDS ADVISORY -->
    <div class="rofor-outlook-block">
        <label>STRONG WINDS ADVISORY:</label>
        <textarea class="form-control" id="${p}-strong-winds" rows="2" placeholder="Strong southerly to southeasterly winds of above 25 knots (12.5m/s) expected over parts of Turkana, Marsabit, Isiolo, Garissa, Mandera, Wajir, Tana river, Taita Taveta, Kwale, Kilifi, Lamu and Kitui Counties."></textarea>
    </div>

    <!-- MAIN TABLE -->
    <div class="rofor-table-wrap">
        <table class="rofor-table">
            <thead>
                <tr>
                    <th style="width:230px;">
                        SECTIONS OF ROUTE<br>
                        <span style="font-size:0.72rem; font-weight:400;">(LATITUDE/LONGITUDE) OR GEOGRAPHICAL LOCATIONS</span>
                    </th>
                    <th class="rofor-col">
                        <input type="text" id="${p}-col1-header" value="MAB IN THE MORNING" style="color:white; font-weight:700; text-align:center; background:transparent; border:none; width:100%;">
                    </th>
                    <th class="rofor-col">
                        <input type="text" id="${p}-col2-header" value="MID-ROUTE / GENERAL" style="color:white; font-weight:700; text-align:center; background:transparent; border:none; width:100%;">
                    </th>
                    <th class="rofor-col">
                        <input type="text" id="${p}-col3-header" value="MAB IN THE AFTERNOON" style="color:white; font-weight:700; text-align:center; background:transparent; border:none; width:100%;">
                    </th>
                </tr>
            </thead>
            <tbody>
                <!-- Route Section Locations -->
                <tr>
                    <td class="row-label">GEOGRAPHICAL SECTIONS / COORDS</td>
                    ${inputCell(`${p}-sec-morning`, 'e.g. MAB / Inland')}
                    ${inputCell(`${p}-sec-mid`, 'e.g. En-route / Western Kenya')}
                    ${inputCell(`${p}-sec-afternoon`, 'e.g. MAB / Highlands')}
                </tr>

                <!-- Significant Weather -->
                <tr>
                    <td class="row-label">SIGNIFICANT WEATHER</td>
                    ${textareaCell(`${p}-sigwx-morning`, 3, 'Cloudy, Sunny intervals')}
                    ${textareaCell(`${p}-sigwx-mid`, 3, 'Sunny intervals, moderate showers and thunderstorms expected over few places.')}
                    ${textareaCell(`${p}-sigwx-afternoon`, 3, 'Sunny intervals with light showers expected over few places. (MERU)')}
                </tr>

                <!-- HIGHER LAYER header -->
                <tr class="section-header-row">
                    <td colspan="4">HIGHER LAYER</td>
                </tr>
                <tr>
                    <td class="row-label sub-label">AMOUNT AND TYPE</td>
                    ${inputCell(`${p}-hl-type-morning`, 'BKN/SCT: AC/AS')}
                    ${inputCell(`${p}-hl-type-mid`, 'BKN/SCT: AC/AS')}
                    ${inputCell(`${p}-hl-type-afternoon`, 'BKN/SCT: AC/AS')}
                </tr>
                <tr>
                    <td class="row-label sub-label">PRESSURE ALTITUDE: OF TOPS</td>
                    ${inputCell(`${p}-hl-tops-morning`, '16,000 – 18,000')}
                    ${inputCell(`${p}-hl-tops-mid`, '17,000 – 20,000')}
                    ${inputCell(`${p}-hl-tops-afternoon`, '17,000 – 20,000')}
                </tr>
                <tr>
                    <td class="row-label sub-label">: OF BASE CLOUD</td>
                    ${inputCell(`${p}-hl-base-morning`, '12,000 – 15,000')}
                    ${inputCell(`${p}-hl-base-mid`, '12,000 – 16,000')}
                    ${inputCell(`${p}-hl-base-afternoon`, '14,000 – 16,000')}
                </tr>

                <!-- LOWEST LAYER header -->
                <tr class="section-header-row">
                    <td colspan="4">LOWEST LAYER</td>
                </tr>
                <tr>
                    <td class="row-label sub-label">AMOUNT AND TYPE</td>
                    ${inputCell(`${p}-ll-type-morning`, 'BKN/SCT: SC/CU')}
                    ${inputCell(`${p}-ll-type-mid`, 'BKN/SCT/FEW: SC/CU/CB')}
                    ${inputCell(`${p}-ll-type-afternoon`, 'BKN/SCT/FEW: SC/CU/CB')}
                </tr>
                <tr>
                    <td class="row-label sub-label">PRESSURE ALTITUDE: OF TOPS</td>
                    ${inputCell(`${p}-ll-tops-morning`, '8,000 – 9,000')}
                    ${inputCell(`${p}-ll-tops-mid`, '8,300 – 9,000')}
                    ${inputCell(`${p}-ll-tops-afternoon`, '8,300 – 9,000')}
                </tr>
                <tr>
                    <td class="row-label sub-label">: OF BASE CLOUD</td>
                    ${inputCell(`${p}-ll-base-morning`, '6,500 – 7,700')}
                    ${inputCell(`${p}-ll-base-mid`, '6,800 – 7,800')}
                    ${inputCell(`${p}-ll-base-afternoon`, '7,100 – 7,800')}
                </tr>

                <!-- Surface Visibility -->
                <tr>
                    <td class="row-label">SURFACE VISIBILITY</td>
                    ${inputCell(`${p}-vis-morning`, 'OVER 10KM')}
                    ${inputCell(`${p}-vis-mid`, 'OVER 10KM')}
                    ${inputCell(`${p}-vis-afternoon`, 'OVER 10KM')}
                </tr>

                <!-- 0°C Isotherm -->
                <tr>
                    <td class="row-label">PRESSURE ALTITUDE OF 0°C ISOTHERM</td>
                    ${inputCell(`${p}-isotherm-morning`, 'FL150')}
                    ${inputCell(`${p}-isotherm-mid`, 'FL150')}
                    ${inputCell(`${p}-isotherm-afternoon`, 'FL150')}
                </tr>

                <!-- UPPER WINDS header -->
                <tr class="section-header-row">
                    <td colspan="4">UPPER WINDS (DEGREES TRUE AND KNOTS) &bull; TEMPERATURES (°C) &bull; HEIGHT IN PRESSURE ALTITUDE</td>
                </tr>
                <tr>
                    <td class="row-label sub-label">7,000FT</td>
                    ${inputCell(`${p}-w7-morning`, '14030KT')}
                    ${inputCell(`${p}-w7-mid`, 'VRB10KT')}
                    ${inputCell(`${p}-w7-afternoon`, '13020KT')}
                </tr>
                <tr>
                    <td class="row-label sub-label">10,000FT</td>
                    ${inputCell(`${p}-w10-morning`, 'VRB05KT')}
                    ${inputCell(`${p}-w10-mid`, '08010KT')}
                    ${inputCell(`${p}-w10-afternoon`, '10010KT')}
                </tr>
                <tr>
                    <td class="row-label sub-label">14,000FT</td>
                    ${inputCell(`${p}-w14-morning`, '07010KT')}
                    ${inputCell(`${p}-w14-mid`, '08015KT')}
                    ${inputCell(`${p}-w14-afternoon`, '11015KT')}
                </tr>
                <tr>
                    <td class="row-label sub-label">18,000FT</td>
                    ${inputCell(`${p}-w18-morning`, '08020KT')}
                    ${inputCell(`${p}-w18-mid`, '08015KT')}
                    ${inputCell(`${p}-w18-afternoon`, '08015KT')}
                </tr>
                <tr>
                    <td class="row-label sub-label">24,000FT</td>
                    ${inputCell(`${p}-w24-morning`, '07025KT')}
                    ${inputCell(`${p}-w24-mid`, '08020KT')}
                    ${inputCell(`${p}-w24-afternoon`, '08015KT')}
                </tr>

                <!-- LOWEST MEAN SEA-LEVEL PRESSURE -->
                <tr>
                    <td class="row-label">LOWEST MEAN SEA-LEVEL PRESSURE (mb)</td>
                    ${inputCell(`${p}-mslp-morning`, 'e.g. 1012')}
                    ${inputCell(`${p}-mslp-mid`, 'e.g. 1012')}
                    ${inputCell(`${p}-mslp-afternoon`, 'e.g. 1012')}
                </tr>

                <!-- REMARKS -->
                <tr>
                    <td class="row-label">REMARKS</td>
                    <td colspan="3">
                        <textarea id="${p}-remarks" rows="2" placeholder="FORECASTED WINDS ARE ADVISORY DUE TO SPARSE DATA" style="width:100%; border:none; outline:none; font-size:0.82rem; padding:0.4rem 0.5rem; resize:none; font-family:inherit; color:#333;"></textarea>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>

    <!-- Actions for this region -->
    <div class="d-flex gap-3 align-items-center flex-wrap mt-3">
        <button class="btn-save-primary" onclick="saveROFOR('${regionCode}')">
            <i class="fas fa-save me-2"></i>Save ROFOR (${regionName})
        </button>
        <button class="btn-accent" onclick="loadLatestROFOR('${regionCode}')">
            <i class="fas fa-sync-alt me-2"></i>Load Latest (${regionCode})
        </button>
        <button class="btn btn-outline-secondary" onclick="printROFOR('${regionCode}', '${regionName}')">
            <i class="fas fa-print me-2"></i>Print Form
        </button>
    </div>
    <div class="status-msg" id="rofor-status-${regionCode}"></div>
    `;
}

// ============================================================
// STATUS MESSAGE HELPER
// ============================================================
function showStatus(elementId, message, type) {
    const statusType = type || 'info';
    const el = document.getElementById(elementId);
    if (!el) return;
    el.className = 'status-msg ' + statusType;
    el.innerHTML = message;
    el.style.display = 'block';
    setTimeout(() => {
        el.style.display = 'none';
        el.className = 'status-msg';
    }, 6000);
}

// ============================================================
// ROFOR DATA COLLECT & POPULATE
// ============================================================
const ROFOR_FIELDS = [
    'issued-by', 'met-office', 'issue-datetime', 'by-name',
    'route-from', 'route-to', 'route-via', 'valid-dept', 'valid-arr',
    'outlook', 'strong-winds',
    'col1-header', 'col2-header', 'col3-header',
    'sec-morning', 'sec-mid', 'sec-afternoon',
    'sigwx-morning', 'sigwx-mid', 'sigwx-afternoon',
    'hl-type-morning', 'hl-type-mid', 'hl-type-afternoon',
    'hl-tops-morning', 'hl-tops-mid', 'hl-tops-afternoon',
    'hl-base-morning', 'hl-base-mid', 'hl-base-afternoon',
    'll-type-morning', 'll-type-mid', 'll-type-afternoon',
    'll-tops-morning', 'll-tops-mid', 'll-tops-afternoon',
    'll-base-morning', 'll-base-mid', 'll-base-afternoon',
    'vis-morning', 'vis-mid', 'vis-afternoon',
    'isotherm-morning', 'isotherm-mid', 'isotherm-afternoon',
    'w7-morning', 'w7-mid', 'w7-afternoon',
    'w10-morning', 'w10-mid', 'w10-afternoon',
    'w14-morning', 'w14-mid', 'w14-afternoon',
    'w18-morning', 'w18-mid', 'w18-afternoon',
    'w24-morning', 'w24-mid', 'w24-afternoon',
    'mslp-morning', 'mslp-mid', 'mslp-afternoon',
    'remarks'
];

function collectROFORData(regionCode) {
    const p = 'rofor-' + regionCode;
    const data = {};
    ROFOR_FIELDS.forEach(f => {
        const el = document.getElementById(p + '-' + f);
        data[f] = el ? el.value : '';
    });
    return data;
}

function populateROFORData(regionCode, data) {
    if (!data) return;
    const p = 'rofor-' + regionCode;
    ROFOR_FIELDS.forEach(f => {
        const el = document.getElementById(p + '-' + f);
        if (el && data[f] !== undefined) {
            el.value = data[f];
        }
    });
}

// ============================================================
// ROFOR API CALLS
// ============================================================
async function saveROFOR(regionCode) {
    const forecastData = collectROFORData(regionCode);
    showStatus('rofor-status-' + regionCode, '<i class="fas fa-spinner fa-spin me-2"></i>Saving ROFOR...', 'info');

    try {
        const res = await authenticatedFetch(API_BASE_URL + '/forecaster/rofor', {
            method: 'POST',
            body: JSON.stringify({
                region: regionCode,
                forecastDate: new Date().toISOString(),
                forecastData: forecastData
            })
        });

        if (res && res.ok) {
            showStatus('rofor-status-' + regionCode, '✅ ROFOR for ' + regionCode + ' saved successfully!', 'success');
        } else {
            const err = await res.json().catch(() => ({}));
            showStatus('rofor-status-' + regionCode, '❌ Failed to save ROFOR: ' + (err.message || 'Please log in with station credentials.'), 'error');
        }
    } catch (e) {
        showStatus('rofor-status-' + regionCode, '⚠️ Connection error while saving ROFOR.', 'error');
    }
}

async function loadLatestROFOR(regionCode) {
    try {
        const res = await authenticatedFetch(API_BASE_URL + '/forecaster/rofor/latest?region=' + encodeURIComponent(regionCode));
        if (res && res.ok) {
            const record = await res.json();
            if (record && record.forecastData) {
                populateROFORData(regionCode, record.forecastData);
                showStatus('rofor-status-' + regionCode, '✅ Latest ROFOR loaded (Saved: ' + new Date(record.createdAt).toLocaleString() + ')', 'success');
            }
        }
    } catch (e) {
        // Silent catch on load so fresh forms don't show error banners
    }
}

function printROFOR(regionCode, regionName) {
    const el = document.getElementById('rofor-form-' + regionCode);
    if (!el) return;
    const printWin = window.open('', '_blank');
    if (!printWin) return;
    const doc = printWin.document;
    doc.open();
    doc.write('<!DOCTYPE html><html><head><title>ROFOR FORM NO.2063 - ' + regionName + '</title></head><body>' + el.innerHTML + '</body></html>');
    doc.close();

    const style = doc.createElement('style');
    style.textContent = `
        body { font-family: Arial, sans-serif; font-size: 11px; margin: 15mm; color: #000; }
        .rofor-header-sheet { border: 2px solid #000; padding: 8px; margin-bottom: 8px; }
        .dept-title { font-weight: bold; font-size: 13px; text-align: center; }
        .rofor-table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 11px; }
        .rofor-table th, .rofor-table td { border: 1px solid #000; padding: 4px; vertical-align: top; }
        .rofor-table thead th { background: #eee; text-align: center; font-weight: bold; }
        .row-label { font-weight: bold; background: #f9f9f9; width: 220px; }
        .section-header-row td { background: #e0e0e0; font-weight: bold; text-align: center; }
        input, textarea { width: 100%; border: none; font-family: inherit; font-size: 11px; background: transparent; }
        .rofor-outlook-block { border: 1px solid #000; padding: 6px; margin-bottom: 6px; }
        .btn-save-primary, .btn-accent, .btn, .status-msg { display: none !important; }
    `;
    doc.head.appendChild(style);
    printWin.focus();
    setTimeout(() => { printWin.print(); }, 400);
}

// ============================================================
// IMAGE HANDLERS FOR DAILY WX
// ============================================================
function previewImage(inputId, imgId) {
    const url = document.getElementById(inputId).value.trim();
    const img = document.getElementById(imgId);
    if (!img) return;
    if (url) {
        img.src = url;
        img.style.display = 'inline-block';
        img.onerror = () => { img.style.display = 'none'; };
    } else {
        img.style.display = 'none';
    }
}

function handleImageFile(inputEl, urlInputId, imgPreviewId) {
    const file = inputEl.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        const base64Data = e.target.result;
        document.getElementById(urlInputId).value = base64Data;
        const img = document.getElementById(imgPreviewId);
        if (img) {
            img.src = base64Data;
            img.style.display = 'inline-block';
        }
    };
    reader.readAsDataURL(file);
}

// ============================================================
// DAILY WX API CALLS
// ============================================================
async function saveDailyWX() {
    showStatus('wx-status', '<i class="fas fa-spinner fa-spin me-2"></i>Saving Daily WX report...', 'info');

    const forecastData = {
        period: document.getElementById('wx-forecast-period').value,
        issuedBy: document.getElementById('wx-issued-by').value,
        rainfall: document.getElementById('wx-rainfall-text').value,
        nairobi: document.getElementById('wx-nairobi-text').value,
        surfWinds: document.getElementById('wx-surf-winds-text').value,
        mb700: document.getElementById('wx-700mb-text').value,
        maxTemp: document.getElementById('wx-max-temp-text').value,
        minTemp: document.getElementById('wx-min-temp-text').value
    };

    const imageUrls = [
        document.getElementById('wx-rainfall-img').value,
        document.getElementById('wx-nairobi-img').value,
        document.getElementById('wx-surf-winds-img').value,
        document.getElementById('wx-700mb-img').value,
        document.getElementById('wx-max-temp-img').value,
        document.getElementById('wx-min-temp-img').value
    ];

    const forecastDate = document.getElementById('wx-forecast-date').value || new Date().toISOString();

    try {
        const res = await authenticatedFetch(API_BASE_URL + '/forecaster/daily-wx', {
            method: 'POST',
            body: JSON.stringify({ forecastDate, forecastData, imageUrls })
        });

        if (res && res.ok) {
            showStatus('wx-status', '✅ Daily WX forecast saved successfully!', 'success');
        } else {
            const err = await res.json().catch(() => ({}));
            showStatus('wx-status', '❌ Failed to save Daily WX: ' + (err.message || 'Please log in with station credentials.'), 'error');
        }
    } catch (e) {
        showStatus('wx-status', '⚠️ Connection error while saving Daily WX.', 'error');
    }
}

async function loadLatestDailyWX() {
    try {
        const res = await authenticatedFetch(API_BASE_URL + '/forecaster/daily-wx/latest');
        if (res && res.ok) {
            const record = await res.json();
            if (record && record.forecastData) {
                const d = record.forecastData;
                if (record.forecastDate) {
                    document.getElementById('wx-forecast-date').value = record.forecastDate.split('T')[0];
                }
                document.getElementById('wx-forecast-period').value = d.period || '';
                document.getElementById('wx-issued-by').value = d.issuedBy || '';
                document.getElementById('wx-rainfall-text').value = d.rainfall || '';
                document.getElementById('wx-nairobi-text').value = d.nairobi || '';
                document.getElementById('wx-surf-winds-text').value = d.surfWinds || '';
                document.getElementById('wx-700mb-text').value = d.mb700 || '';
                document.getElementById('wx-max-temp-text').value = d.maxTemp || '';
                document.getElementById('wx-min-temp-text').value = d.minTemp || '';

                if (d.period) {
                    const descEl = document.getElementById('dailywx-header-desc');
                    if (descEl) descEl.innerText = d.period;
                }

                const imgInputs = [
                    'wx-rainfall-img', 'wx-nairobi-img', 'wx-surf-winds-img',
                    'wx-700mb-img', 'wx-max-temp-img', 'wx-min-temp-img'
                ];
                const imgPreviews = [
                    'wx-rainfall-preview', 'wx-nairobi-preview', 'wx-surf-winds-preview',
                    'wx-700mb-preview', 'wx-max-temp-preview', 'wx-min-temp-preview'
                ];

                if (Array.isArray(record.imageUrls)) {
                    imgInputs.forEach((inputId, idx) => {
                        const url = record.imageUrls[idx] || '';
                        const inp = document.getElementById(inputId);
                        if (inp) {
                            inp.value = url;
                            previewImage(inputId, imgPreviews[idx]);
                        }
                    });
                }
            }
        }
    } catch (e) {
        // Silent catch
    }
}

// Load METAR & TAF for Sidebar
async function loadSidebarData() {
    try {
        const res = await authenticatedFetch(API_BASE_URL + '/reports/METAR/latest');
        if (res && res.ok) {
            const data = await res.json();
            const el = document.getElementById('wx-latest-metar');
            if (el) el.innerText = data.content || 'No METAR content.';
        } else {
            const el = document.getElementById('wx-latest-metar');
            if (el) el.innerText = 'No METAR available.';
        }
    } catch {
        const el = document.getElementById('wx-latest-metar');
        if (el) el.innerText = 'No METAR available.';
    }

    try {
        const res = await authenticatedFetch(API_BASE_URL + '/reports/TAF/latest');
        if (res && res.ok) {
            const data = await res.json();
            const el = document.getElementById('wx-latest-taf');
            if (el) el.innerText = data.content || 'No TAF content.';
        } else {
            const el = document.getElementById('wx-latest-taf');
            if (el) el.innerText = 'No TAF available.';
        }
    } catch {
        const el = document.getElementById('wx-latest-taf');
        if (el) el.innerText = 'No TAF available.';
    }
}

// ============================================================
// MONDAY BRIEF API CALLS
// ============================================================
async function saveMondayBrief() {
    showStatus('brief-status', '<i class="fas fa-spinner fa-spin me-2"></i>Saving Monday Brief...', 'info');

    const forecastData = {
        validPeriod: document.getElementById('brief-valid-period').value,
        station: document.getElementById('brief-station').value,
        issuedBy: document.getElementById('brief-issued-by').value,
        issueTime: document.getElementById('brief-issue-time').value,
        synoptic: document.getElementById('brief-synoptic').value,
        outlook: document.getElementById('brief-outlook').value,
        rainfall: document.getElementById('brief-rainfall').value,
        temperature: document.getElementById('brief-temperature').value,
        surfaceWinds: document.getElementById('brief-surface-winds').value,
        upperWinds: document.getElementById('brief-upper-winds').value,
        aviation: document.getElementById('brief-aviation').value,
        warnings: document.getElementById('brief-warnings').value,
        agro: document.getElementById('brief-agro').value,
        remarks: document.getElementById('brief-remarks').value
    };

    const forecastDate = document.getElementById('brief-date').value || new Date().toISOString();

    try {
        const res = await authenticatedFetch(API_BASE_URL + '/forecaster/mon-brief', {
            method: 'POST',
            body: JSON.stringify({ forecastDate, forecastData })
        });

        if (res && res.ok) {
            showStatus('brief-status', '✅ Monday Brief saved successfully!', 'success');
        } else {
            const err = await res.json().catch(() => ({}));
            showStatus('brief-status', '❌ Failed to save Monday Brief: ' + (err.message || 'Please log in with station credentials.'), 'error');
        }
    } catch (e) {
        showStatus('brief-status', '⚠️ Connection error while saving Monday Brief.', 'error');
    }
}

async function loadLatestMondayBrief() {
    try {
        const res = await authenticatedFetch(API_BASE_URL + '/forecaster/mon-brief/latest');
        if (res && res.ok) {
            const record = await res.json();
            if (record && record.forecastData) {
                const d = record.forecastData;
                if (record.forecastDate) {
                    document.getElementById('brief-date').value = record.forecastDate.split('T')[0];
                }
                document.getElementById('brief-valid-period').value = d.validPeriod || '';
                document.getElementById('brief-station').value = d.station || '';
                document.getElementById('brief-issued-by').value = d.issuedBy || '';
                document.getElementById('brief-issue-time').value = d.issueTime || '';
                document.getElementById('brief-synoptic').value = d.synoptic || '';
                document.getElementById('brief-outlook').value = d.outlook || '';
                document.getElementById('brief-rainfall').value = d.rainfall || '';
                document.getElementById('brief-temperature').value = d.temperature || '';
                document.getElementById('brief-surface-winds').value = d.surfaceWinds || '';
                document.getElementById('brief-upper-winds').value = d.upperWinds || '';
                document.getElementById('brief-aviation').value = d.aviation || '';
                document.getElementById('brief-warnings').value = d.warnings || '';
                document.getElementById('brief-agro').value = d.agro || '';
                document.getElementById('brief-remarks').value = d.remarks || '';
            }
        }
    } catch (e) {
        // Silent catch
    }
}

// ============================================================
// TAF API CALLS
// ============================================================
async function saveForecasterTAF() {
    const tafContent = document.getElementById('taf-input').value;
    if (!tafContent.trim()) {
        showStatus('taf-status', '⚠️ Please enter a TAF report before saving.', 'error');
        return;
    }

    showStatus('taf-status', '<i class="fas fa-spinner fa-spin me-2"></i>Saving TAF...', 'info');

    try {
        const res = await authenticatedFetch(API_BASE_URL + '/forecaster/taf', {
            method: 'POST',
            body: JSON.stringify({ content: tafContent })
        });

        if (res && res.ok) {
            showStatus('taf-status', '✅ TAF saved successfully!', 'success');
        } else {
            const err = await res.json().catch(() => ({}));
            showStatus('taf-status', '❌ Failed to save TAF: ' + (err.message || 'Please log in with station credentials.'), 'error');
        }
    } catch (e) {
        showStatus('taf-status', '⚠️ Error connecting to server.', 'error');
    }
}

async function loadLatestForecasterTAF() {
    try {
        const res = await authenticatedFetch(API_BASE_URL + '/forecaster/taf/latest');
        if (res && res.ok) {
            const record = await res.json();
            if (record && record.content) {
                document.getElementById('taf-input').value = record.content;
                showStatus('taf-status', '✅ Latest TAF loaded (Saved: ' + new Date(record.createdAt).toLocaleString() + ')', 'success');
                return;
            }
        }

        // Fallback to station TAF
        const fallbackRes = await authenticatedFetch(API_BASE_URL + '/reports/TAF/latest');
        if (fallbackRes && fallbackRes.ok) {
            const data = await fallbackRes.json();
            if (data && data.content) {
                document.getElementById('taf-input').value = data.content;
                showStatus('taf-status', '✅ Latest station TAF loaded.', 'success');
            }
        }
    } catch (e) {
        // Silent catch
    }
}

// ============================================================
// INITIALIZATION ON PAGE LOAD
// ============================================================
document.addEventListener('DOMContentLoaded', function () {
    // Check authentication without hard-redirecting guests
    const token = localStorage.getItem('weatherAuthToken');
    const user = typeof getUser === 'function' ? getUser() : null;

    if (!token || !user) {
        const banner = document.getElementById('auth-warning-banner');
        if (banner) banner.style.display = 'block';
    } else {
        const displayName = user.name || user.station || 'Station Forecaster';
        const userBadge = document.getElementById('user-display-name');
        if (userBadge) userBadge.innerText = displayName;

        const headerLabel = document.getElementById('forecaster-station-label');
        if (headerLabel) {
            headerLabel.innerText = displayName + ' · Kenya Meteorological Department';
        }

        if (document.getElementById('brief-station')) document.getElementById('brief-station').value = displayName;
        if (document.getElementById('brief-issued-by')) document.getElementById('brief-issued-by').value = displayName;
        if (document.getElementById('taf-issued-by')) document.getElementById('taf-issued-by').value = displayName;
        if (document.getElementById('wx-issued-by')) document.getElementById('wx-issued-by').value = displayName;
        if (document.getElementById('taf-icao') && user.icaoCode) document.getElementById('taf-icao').value = user.icaoCode;
    }

    // Set today's date
    const today = new Date().toISOString().split('T')[0];
    if (document.getElementById('wx-forecast-date')) document.getElementById('wx-forecast-date').value = today;
    if (document.getElementById('brief-date')) document.getElementById('brief-date').value = today;

    // Immediately render all 6 ROFOR forms into their containers
    REGIONS.forEach(r => {
        const container = document.getElementById('rofor-form-' + r.code);
        if (container) {
            container.innerHTML = buildROFORForm(r.code, r.name);
            if (user) {
                const issuedByEl = document.getElementById('rofor-' + r.code + '-issued-by');
                if (issuedByEl) issuedByEl.value = user.name || 'MAB';
            }
        }
    });

    // Load initial sidebar data
    loadSidebarData();

    // Check URL parameters or hash to open specific tab/region
    const urlParams = new URLSearchParams(window.location.search);
    const regionParam = urlParams.get('region') || window.location.hash.replace('#', '');
    const tabParam = urlParams.get('tab');

    if (tabParam) {
        openMainTab(tabParam);
    } else if (regionParam) {
        const matched = REGIONS.find(r => r.code.toLowerCase() === regionParam.toLowerCase());
        if (matched) {
            openMainTab('rofor');
            openRegion(matched.code);
            return;
        }
        openMainTab('rofor');
        openRegion('SE');
    } else {
        openMainTab('rofor');
        openRegion('SE');
    }
});
