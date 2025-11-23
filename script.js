// Mock Data Generators
const getRandomScore = () => Math.floor(Math.random() * 100);
const getRiskLevel = (score) => {
    if (score < 30) return { label: '低风险', color: 'text-green-400', bg: 'bg-green-400/10' };
    if (score < 70) return { label: '中风险', color: 'text-yellow-400', bg: 'bg-yellow-400/10' };
    return { label: '高风险', color: 'text-red-400', bg: 'bg-red-400/10' };
};

const mockLocations = ['美国', '德国', '中国', '日本', '巴西', '法国'];
const mockISPs = ['Google LLC', 'Amazon.com', 'Cloudflare', 'Comcast Cable', 'Deutsche Telekom'];
const mockTypes = ['企业专线', '家庭宽带', '数据中心', '移动网络'];

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

// State
let searchHistory = JSON.parse(localStorage.getItem('ip_check_history')) || [];
let selectedHistoryIds = new Set();

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    renderHistory();
});

// Event Listeners
checkBtn.addEventListener('click', handleCheck);
historyToggle.addEventListener('click', toggleSidebar);
closeHistory.addEventListener('click', closeSidebar); // Explicit close action
sidebarOverlay.addEventListener('click', closeSidebar);
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

// Main Logic
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
        // Parse IPs (split by newlines or commas)
        const ips = rawInput.split(/[\n,]+/).map(ip => ip.trim()).filter(ip => ip);

        if (ips.length === 0) return;

        // Simulate API Delay
        // [TODO: API INTEGRATION POINT]
        // 1. Remove the timeout below.
        // 2. Use fetch() to call your real APIs here.
        // 3. Example: const response = await fetch(`https://api.ipinfo.io/${ip}?token=YOUR_TOKEN`);
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Generate Results
        // [TODO: REPLACE WITH REAL DATA]
        // Replace 'generateMockResult(ip)' with the actual data from your API response.
        const results = ips.map(ip => generateMockResult(ip));

        // Update UI
        renderResults(results);

        // Save to History
        addToHistory(ips, results);
    } catch (error) {
        console.error("检测IP时发生错误:", error);
        alert("检测过程中发生错误，请重试。");
    } finally {
        // Reset Button - Always execute
        checkBtn.innerHTML = originalBtnContent;
        checkBtn.disabled = false;
    }
}

function generateMockResult(ip) {
    const score = getRandomScore();
    const risk = getRiskLevel(score);

    return {
        ip: ip,
        location: mockLocations[Math.floor(Math.random() * mockLocations.length)],
        asn: `AS${Math.floor(Math.random() * 99999)} ${mockISPs[Math.floor(Math.random() * mockISPs.length)]}`,
        type: mockTypes[Math.floor(Math.random() * mockTypes.length)],
        fraudScore: score,
        riskLabel: risk.label,
        riskColor: risk.color,
        riskBg: risk.bg,
        // Mock raw data for export demonstration
        rawData: {
            ip: ip,
            city: "Mock City",
            region: "Mock Region",
            country: "Mock Country",
            loc: "0.0000,0.0000",
            org: "Mock Org",
            timezone: "UTC"
        }
    };
}

function renderResults(results) {
    resultsArea.innerHTML = ''; // Clear previous

    results.forEach(data => {
        const card = document.createElement('div');
        card.className = 'glass-panel rounded-xl p-6 animate-[fadeIn_0.5s_ease-out]';
        card.innerHTML = `
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div class="flex items-center gap-4">
                    <div class="w-12 h-12 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-400">
                        <i class="ph-fill ph-globe text-2xl"></i>
                    </div>
                    <div>
                        <h3 class="text-2xl font-bold text-white font-mono tracking-wide">${data.ip}</h3>
                        <p class="text-gray-400 text-sm flex items-center gap-2">
                            <i class="ph-fill ph-map-pin"></i> ${data.location}
                        </p>
                    </div>
                </div>
                <div class="px-4 py-2 rounded-full ${data.riskBg} border border-white/5 backdrop-blur-md">
                    <span class="font-bold ${data.riskColor} flex items-center gap-2">
                        <i class="ph-fill ph-warning-circle"></i>
                        欺诈评分: ${data.fraudScore} (${data.riskLabel})
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
                    <p class="text-gray-500 text-xs uppercase tracking-wider mb-1">风险分析</p>
                    <div class="w-full bg-gray-700 h-2 rounded-full mt-2 overflow-hidden">
                        <div class="h-full ${data.riskColor.replace('text-', 'bg-')}" style="width: ${data.fraudScore}%"></div>
                    </div>
                </div>
            </div>
        `;
        resultsArea.appendChild(card);
    });
}

// History Management
function addToHistory(ips, results) {
    const timestamp = new Date().toLocaleString('zh-CN');

    // Check if this set of IPs already exists in history
    const newIpSignature = [...ips].sort().join(',');

    const existingIndex = searchHistory.findIndex(item => {
        const itemSignature = [...item.ips].sort().join(',');
        return itemSignature === newIpSignature;
    });

    // If it exists, remove it so we can re-add it to the top
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
    if (searchHistory.length > 20) searchHistory.pop(); // Keep last 20
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

        // Checkbox
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

        // Content Container
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
            closeSidebar(); // Ensure sidebar closes
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

    // Filter history items that are selected
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
                    "原始数据 (JSON)": JSON.stringify(res.rawData || {})
                });
            });
        }
    });

    // Create Worksheet
    const ws = XLSX.utils.json_to_sheet(exportRows);

    // Create Workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "IP检测报告");

    // Generate File
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
    sidebarOverlay.classList.remove('hidden');
    // Small delay to allow display:block to apply before opacity transition
    setTimeout(() => sidebarOverlay.classList.add('opacity-100'), 10);
}

function closeSidebar() {
    historySidebar.classList.add('translate-x-full');
    sidebarOverlay.classList.remove('opacity-100');
    // Delay hiding the overlay until after the sidebar transition
    setTimeout(() => sidebarOverlay.classList.add('hidden'), 300);
}
