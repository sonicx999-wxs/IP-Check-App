// Mock Data Generators (Fallback)
const getRandomScore = () => Math.floor(Math.random() * 100);
const getRiskLevel = (score) => {
    if (score < 30) return { label: '低风险', color: 'text-green-400', bg: 'bg-green-400/10' };
    if (score < 75) return { label: '中风险', color: 'text-yellow-400', bg: 'bg-yellow-400/10' };
    return { label: '高风险', color: 'text-red-400', bg: 'bg-red-400/10' };
};

// DOM Elements
const ipInput = document.getElementById('ipInput');
const checkBtn = document.getElementById('checkBtn');
const resultsArea = document.getElementById('resultsArea');
const historyToggle = document.getElementById('historyToggle');
const closeHistory = document.getElementById('closeHistory');
const historySidebar = document.getElementById('historySidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');

const historyList = document.getElementById('historyList');
const clearHistory = document.getElementById('clearHistory');
const exportBtn = document.getElementById('exportBtn');

// Settings DOM
const settingsToggle = document.getElementById('settingsToggle');
const settingsModal = document.getElementById('settingsModal');
const closeSettings = document.getElementById('closeSettings');
const saveSettingsBtn = document.getElementById('saveSettings');
const keyIPQS = document.getElementById('keyIPQS');
const keyIPinfo = document.getElementById('keyIPinfo');
const userScam = document.getElementById('userScam');
const keyScam = document.getElementById('keyScam');
const settingsBackdrop = document.getElementById('settingsBackdrop');
const settingsContent = document.getElementById('settingsContent');

// State
let searchHistory = JSON.parse(localStorage.getItem('ip_check_history')) || [];
let selectedHistoryIds = new Set();
let apiKeys = JSON.parse(localStorage.getItem('ip_check_api_keys')) || {
    ipqs: '',
    ipinfo: '',
    scamUser: '',
    scamKey: ''
};

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    renderHistory();
    loadSettingsUI();
});

// Event Listeners
checkBtn.addEventListener('click', handleCheck);
historyToggle.addEventListener('click', toggleSidebar);
closeHistory.addEventListener('click', closeSidebar);

// Settings Events
settingsToggle.addEventListener('click', openSettings);
closeSettings.addEventListener('click', closeSettingsModal);
settingsBackdrop.addEventListener('click', closeSettingsModal);
saveSettingsBtn.addEventListener('click', saveSettings);

clearHistory.addEventListener('click', () => {
    if (confirm('确定要清空所有历史记录吗？')) {
        searchHistory = [];
        selectedHistoryIds.clear();
        saveHistory();
        renderHistory();
    }
});

if (exportBtn) {
    exportBtn.addEventListener('click', exportData);
}

// --- Settings Logic ---

function loadSettingsUI() {
    keyIPQS.value = apiKeys.ipqs || '';
    keyIPinfo.value = apiKeys.ipinfo || '';
    userScam.value = apiKeys.scamUser || '';
    keyScam.value = apiKeys.scamKey || '';
}

function openSettings() {
    settingsModal.classList.remove('hidden');
    // Animation
    setTimeout(() => {
        settingsBackdrop.classList.remove('opacity-0');
        settingsContent.classList.remove('opacity-0', 'scale-95');
        settingsContent.classList.add('scale-100');
    }, 10);
}

function closeSettingsModal() {
    settingsBackdrop.classList.add('opacity-0');
    settingsContent.classList.remove('scale-100');
    settingsContent.classList.add('opacity-0', 'scale-95');

    setTimeout(() => {
        settingsModal.classList.add('hidden');
    }, 300);
}

function saveSettings() {
    apiKeys = {
        ipqs: keyIPQS.value.trim(),
        ipinfo: keyIPinfo.value.trim(),
        scamUser: userScam.value.trim(),
        scamKey: keyScam.value.trim()
    };
    localStorage.setItem('ip_check_api_keys', JSON.stringify(apiKeys));

    // Visual Feedback
    const originalText = saveSettingsBtn.innerText;
    saveSettingsBtn.innerText = '已保存!';
    saveSettingsBtn.classList.add('bg-green-600');
    setTimeout(() => {
        saveSettingsBtn.innerText = originalText;
        saveSettingsBtn.classList.remove('bg-green-600');
        closeSettingsModal();
    }, 1000);
}

// --- API Fetch Logic ---

const PROXY_BASE = 'http://localhost:5000/api';

async function fetchIPQS(ip) {
    if (!apiKeys.ipqs) return null;
    try {
        // Use Proxy
        const url = `${PROXY_BASE}/ipqs?key=${apiKeys.ipqs}&ip=${ip}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('IPQS Request Failed');
        return await response.json();
    } catch (e) {
        console.warn('IPQS Error:', e);
        return { error: e.message };
    }
}

async function fetchIPinfo(ip) {
    if (!apiKeys.ipinfo) return null;
    try {
        // Use Proxy
        const url = `${PROXY_BASE}/ipinfo?key=${apiKeys.ipinfo}&ip=${ip}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('IPinfo Request Failed');
        return await response.json();
    } catch (e) {
        console.warn('IPinfo Error:', e);
        return { error: e.message };
    }
}

async function fetchScamalytics(ip) {
    if (!apiKeys.scamUser || !apiKeys.scamKey) return null;
    try {
        // Use Proxy
        const url = `${PROXY_BASE}/scamalytics?user=${apiKeys.scamUser}&key=${apiKeys.scamKey}&ip=${ip}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Scamalytics Request Failed');
        return await response.json();
    } catch (e) {
        console.warn('Scamalytics Error:', e);
        return { error: e.message };
    }
}

// --- Main Logic ---

async function handleCheck() {
    const rawInput = ipInput.value.trim();
    if (!rawInput) {
        alert('请输入 IP 地址');
        return;
    }

    // Loading State
    const originalBtnContent = checkBtn.innerHTML;
    checkBtn.innerHTML = `<i class="ph-bold ph-spinner animate-spin"></i> 正在检测...`;
    checkBtn.disabled = true;

    try {
        const ips = rawInput.split(/[\n,]+/).map(ip => ip.trim()).filter(ip => ip);
        if (ips.length === 0) return;

        // Check if any keys are missing
        const missingKeys = [];
        if (!apiKeys.ipqs) missingKeys.push('IPQualityScore');
        if (!apiKeys.ipinfo) missingKeys.push('IPinfo');
        if (!apiKeys.scamUser || !apiKeys.scamKey) missingKeys.push('Scamalytics');

        if (missingKeys.length === 3) {
            if (!confirm('未配置任何 API Key，将使用模拟数据演示。是否继续？\n(请点击右上角设置图标配置 Key)')) {
                return;
            }
        }

        const results = [];

        for (const ip of ips) {
            // Parallel Fetch
            const [ipqsRes, ipinfoRes, scamRes] = await Promise.allSettled([
                fetchIPQS(ip),
                fetchIPinfo(ip),
                fetchScamalytics(ip)
            ]);

            const dataIPQS = ipqsRes.status === 'fulfilled' ? ipqsRes.value : null;
            const dataIPinfo = ipinfoRes.status === 'fulfilled' ? ipinfoRes.value : null;
            const dataScam = scamRes.status === 'fulfilled' ? scamRes.value : null;

            // Analyze & Merge Data
            const analyzed = analyzeData(ip, dataIPQS, dataIPinfo, dataScam);
            results.push(analyzed);
        }

        renderResults(results);
        addToHistory(ips, results);

    } catch (error) {
        console.error("检测IP时发生错误:", error);
        alert("检测过程中发生错误，请重试。");
    } finally {
        checkBtn.innerHTML = originalBtnContent;
        checkBtn.disabled = false;
    }
}

function analyzeData(ip, ipqs, ipinfo, scam) {
    // 1. Determine Location (Priority: IPinfo > IPQS > Mock)
    let location = '未知位置';
    let city = '';
    let country = '';

    if (ipinfo && !ipinfo.error) {
        city = ipinfo.city || '';
        country = ipinfo.country || ''; // IPinfo returns country code usually
        location = `${country} ${city}`.trim();
    } else if (ipqs && ipqs.success) {
        city = ipqs.city || '';
        country = ipqs.country_code || '';
        location = `${country} ${city}`.trim();
    }

    if (!location || location === ' ') location = '未知位置 (无数据)';

    // 2. Determine ASN/ISP
    let asn = '未知 ISP';
    if (ipinfo && !ipinfo.error && ipinfo.org) {
        asn = ipinfo.org;
    } else if (ipqs && ipqs.success && ipqs.ISP) {
        asn = `${ipqs.ASN || ''} ${ipqs.ISP}`;
    }

    // 3. Determine Type
    let type = '未知类型';
    if (ipqs && ipqs.success) {
        if (ipqs.mobile) type = '移动网络';
        else if (ipqs.proxy) type = '代理/VPN';
        else if (ipqs.vpn) type = 'VPN';
        else if (ipqs.tor) type = 'Tor节点';
        else if (ipqs.active_vpn) type = '活跃VPN';
        else type = 'ISP/宽带';
    } else if (ipinfo && !ipinfo.error && ipinfo.privacy) {
        if (ipinfo.privacy.vpn) type = 'VPN';
        else if (ipinfo.privacy.proxy) type = '代理';
        else if (ipinfo.privacy.hosting) type = '数据中心';
    }

    // 4. Calculate Fraud Score (Max of available scores)
    let score = 0;
    let sources = 0;

    if (ipqs && ipqs.success) {
        score = Math.max(score, ipqs.fraud_score || 0);
        sources++;
    }
    if (scam && !scam.error && scam.scamalytics) {
        score = Math.max(score, scam.scamalytics.score || 0); // Scamalytics uses 'score' or 'scamalytics_score'
        sources++;
    }

    // Fallback to mock if no API data
    if (sources === 0) {
        score = getRandomScore(); // Mock score
        location = location === '未知位置 (无数据)' ? '模拟位置 (无Key)' : location;
    }

    const risk = getRiskLevel(score);

    return {
        ip: ip,
        location: location,
        asn: asn,
        type: type,
        fraudScore: score,
        riskLabel: risk.label,
        riskColor: risk.color,
        riskBg: risk.bg,
        rawData: {
            ipqs: ipqs,
            ipinfo: ipinfo,
            scamalytics: scam
        }
    };
}

function renderResults(results) {
    resultsArea.innerHTML = '';

    results.forEach(data => {
        const card = document.createElement('div');
        card.className = 'glass-panel rounded-xl p-6 animate-[fadeIn_0.5s_ease-out]';

        // Check if we have real data or mock
        const isMock = !data.rawData.ipqs && !data.rawData.ipinfo && !data.rawData.scamalytics;
        const mockBadge = isMock ? `<span class="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded ml-2">模拟数据</span>` : '';

        card.innerHTML = `
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div class="flex items-center gap-4">
                    <div class="w-12 h-12 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-400">
                        <i class="ph-fill ph-globe text-2xl"></i>
                    </div>
                    <div>
                        <h3 class="text-2xl font-bold text-white font-mono tracking-wide flex items-center">
                            ${data.ip}
                            ${mockBadge}
                        </h3>
                        <p class="text-gray-400 text-sm flex items-center gap-2">
                            <i class="ph-fill ph-map-pin"></i> ${data.location}
                        </p>
                    </div>
                </div>
                <div class="px-4 py-2 rounded-full ${data.riskBg} border border-white/5 backdrop-blur-md">
                    <span class="font-bold ${data.riskColor} flex items-center gap-2">
                        <i class="ph-fill ph-warning-circle"></i>
                        风险评分: ${data.fraudScore} (${data.riskLabel})
                    </span>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="bg-dark-900/50 p-4 rounded-lg border border-white/5">
                    <p class="text-gray-500 text-xs uppercase tracking-wider mb-1">运营商 / ASN</p>
                    <p class="text-white font-medium truncate" title="${data.asn}">${data.asn}</p>
                </div>
                <div class="bg-dark-900/50 p-4 rounded-lg border border-white/5">
                    <p class="text-gray-500 text-xs uppercase tracking-wider mb-1">网络类型</p>
                    <p class="text-white font-medium">${data.type}</p>
                </div>
                <div class="bg-dark-900/50 p-4 rounded-lg border border-white/5">
                    <p class="text-gray-500 text-xs uppercase tracking-wider mb-1">数据来源状态</p>
                    <div class="flex gap-2 mt-1">
                        <span class="text-xs px-2 py-0.5 rounded ${data.rawData.ipqs && !data.rawData.ipqs.error ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}">IPQS</span>
                        <span class="text-xs px-2 py-0.5 rounded ${data.rawData.ipinfo && !data.rawData.ipinfo.error ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}">IPinfo</span>
                        <span class="text-xs px-2 py-0.5 rounded ${data.rawData.scamalytics && !data.rawData.scamalytics.error ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}">Scam</span>
                    </div>
                </div>
            </div>
            
            <!-- Raw Data Toggle (Optional) -->
            <div class="mt-4 pt-4 border-t border-white/5">
                <details class="group">
                    <summary class="flex items-center gap-2 text-xs text-gray-500 cursor-pointer hover:text-brand-400 transition-colors">
                        <i class="ph-bold ph-code"></i> 查看原始 API 响应
                        <i class="ph-bold ph-caret-down group-open:rotate-180 transition-transform"></i>
                    </summary>
                    <pre class="mt-2 p-4 bg-dark-900 rounded-lg text-xs text-gray-400 overflow-x-auto font-mono">${JSON.stringify(data.rawData, null, 2)}</pre>
                </details>
            </div>
        `;
        resultsArea.appendChild(card);
    });
}

// History Management
function addToHistory(ips, results) {
    const timestamp = new Date().toLocaleString('zh-CN');
    const newIpSignature = [...ips].sort().join(',');

    const existingIndex = searchHistory.findIndex(item => {
        const itemSignature = [...item.ips].sort().join(',');
        return itemSignature === newIpSignature;
    });

    if (existingIndex !== -1) {
        searchHistory.splice(existingIndex, 1);
    }

    const entry = {
        id: Date.now(),
        ips: ips,
        results: results,
        time: timestamp
    };
    searchHistory.unshift(entry);
    if (searchHistory.length > 20) searchHistory.pop();
    saveHistory();
    renderHistory();
}

function saveHistory() {
    localStorage.setItem('ip_check_history', JSON.stringify(searchHistory));
}

function renderHistory() {
    historyList.innerHTML = '';
    if (searchHistory.length === 0) {
        historyList.innerHTML = `<div class="text-center text-gray-500 py-8">暂无历史记录</div>`;
        return;
    }

    searchHistory.forEach(item => {
        const div = document.createElement('div');
        div.className = 'p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-transparent hover:border-brand-500/30 flex gap-3 items-start';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'mt-1 w-4 h-4 rounded border-gray-600 text-brand-600 focus:ring-brand-500 bg-dark-900';
        checkbox.checked = selectedHistoryIds.has(item.id);
        checkbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                selectedHistoryIds.add(item.id);
            } else {
                selectedHistoryIds.delete(item.id);
            }
        });

        const content = document.createElement('div');
        content.className = 'flex-1 cursor-pointer';
        content.innerHTML = `
            <div class="flex justify-between items-start mb-1">
                <span class="text-xs text-brand-400 font-mono">${item.time}</span>
            </div>
            <div class="text-sm text-gray-300 truncate font-mono">
                ${item.ips.join(', ')}
            </div>
        `;
        content.addEventListener('click', () => {
            ipInput.value = item.ips.join('\n');
            closeSidebar();
            handleCheck();
        });

        div.appendChild(checkbox);
        div.appendChild(content);
        historyList.appendChild(div);
    });
}

function exportData() {
    if (selectedHistoryIds.size === 0) {
        alert('请至少选择一条记录进行导出。');
        return;
    }

    const exportRows = [];
    const selectedItems = searchHistory.filter(item => selectedHistoryIds.has(item.id));

    selectedItems.forEach(item => {
        if (item.results) {
            item.results.forEach(res => {
                exportRows.push({
                    "查询时间": item.time,
                    "IP地址": res.ip,
                    "地理位置": res.location,
                    "ASN": res.asn,
                    "网络类型": res.type,
                    "欺诈评分": res.fraudScore,
                    "风险等级": res.riskLabel,
                    "原始数据": JSON.stringify(res.rawData || {})
                });
            });
        }
    });

    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "IP检测报告");
    XLSX.writeFile(wb, `IP_Report_${Date.now()}.xlsx`);
}

// Sidebar Toggle
function toggleSidebar() {
    const isOpen = !historySidebar.classList.contains('translate-x-full');
    if (isOpen) {
        closeSidebar();
    } else {
        openSidebar();
    }
}

function openSidebar() {
    historySidebar.classList.remove('translate-x-full');
    // Assuming sidebarOverlay exists or we handle it gracefully if not
    if (sidebarOverlay) {
        sidebarOverlay.classList.remove('hidden');
        setTimeout(() => sidebarOverlay.classList.add('opacity-100'), 10);
    }
}

function closeSidebar() {
    historySidebar.classList.add('translate-x-full');
    if (sidebarOverlay) {
        sidebarOverlay.classList.remove('opacity-100');
        setTimeout(() => sidebarOverlay.classList.add('hidden'), 300);
    }
}
