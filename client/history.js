// Version: 3.3.0
// History Page Logic - Uses RenderCore & SSOT

// DOM Elements
const historyGrid = document.getElementById('historyGrid');
const detailModal = document.getElementById('detailModal');
const detailContent = document.getElementById('detailContent');
const closeModal = document.getElementById('closeModal');
const exportExcelBtn = document.getElementById('exportExcelBtn');
const copyCsvBtn = document.getElementById('copyCsvBtn');
const selectAllBtn = document.getElementById('selectAllBtn');
const clearAllBtn = document.getElementById('clearAllBtn');

// State
let selectedRecords = new Set();

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    console.log('History Page Online - V2.3.0');
    
    // Check dependency
    if (!window.RenderCore) {
        console.error("Critical: RenderCore not loaded!");
        historyGrid.innerHTML = '<div class="text-red-500 text-center py-10">系统错误: 渲染引擎未加载 (RenderCore missing)</div>';
        return;
    }

    renderHistory();
    
    // Event listeners
    if (closeModal) closeModal.addEventListener('click', closeDetailModal);
    if (exportExcelBtn) exportExcelBtn.addEventListener('click', exportExcel);
    if (copyCsvBtn) copyCsvBtn.addEventListener('click', copyCsv);
    if (selectAllBtn) selectAllBtn.addEventListener('click', selectAll);
    if (clearAllBtn) clearAllBtn.addEventListener('click', clearAll);
    
    // Close modal when clicking outside
    if (detailModal) {
        detailModal.addEventListener('click', (e) => {
            if (e.target === detailModal) {
                closeDetailModal();
            }
        });
    }
});

// Render history cards (Grid View)
function renderHistory() {
    const storedData = localStorage.getItem('ip_history_log');
    let history = [];
    
    try {
        history = JSON.parse(storedData) || [];
    } catch (error) {
        console.error('History parse error:', error);
        history = [];
    }
    
    if (history.length === 0) {
        historyGrid.innerHTML = `
            <div class="col-span-full flex flex-col items-center justify-center py-20 text-center">
                <i class="fas fa-history text-6xl text-gray-600 mb-4 opacity-50"></i>
                <h3 class="text-xl font-medium text-gray-400 mb-2">暂无记录</h3>
                <p class="text-gray-500 max-w-md">使用检测工具进行 IP 检测后，结果将显示在这里</p>
            </div>
        `;
        return;
    }
    
    // Generate cards
    const cards = history.map(item => {
        // Determine border color based on verdict
        let borderColor = 'border-gray-500';
        let verdictIcon = '❓';
        let verdictClass = 'bg-gray-500/20 text-gray-400';

        if (item.verdict.includes('通过') || item.verdict.includes('良好') || item.verdict.includes('适合')) {
            borderColor = 'border-green-500';
            verdictIcon = '✅';
            verdictClass = 'bg-green-500/20 text-green-400';
        } else if (item.verdict.includes('警告') || item.verdict.includes('谨慎') || item.verdict.includes('商业')) {
            borderColor = 'border-yellow-500';
            verdictIcon = '⚠️';
            verdictClass = 'bg-yellow-500/20 text-yellow-400';
        } else if (item.verdict.includes('禁止') || item.verdict.includes('失败') || item.verdict.includes('高风险')) {
            borderColor = 'border-red-500';
            verdictIcon = '❌';
            verdictClass = 'bg-red-500/20 text-red-400';
        }
        
        // Calculate scores using RenderCore helper logic logic (Simplified for card)
        let riskScore = 0;
        if (item.raw_data.ipqs?.fraud_score !== undefined) riskScore = item.raw_data.ipqs.fraud_score;
        else if (item.raw_data.scamalytics?.score !== undefined) riskScore = item.raw_data.scamalytics.score;
        else {
            // Fix: Use RenderCore's helper to safely get ProxyCheck data
            const pcData = window.RenderCore.getProxyCheckData(item.raw_data.proxycheck, item.ip);
            if (pcData.risk !== undefined) riskScore = parseInt(pcData.risk);
        }
        
        const riskLevel = window.RenderCore.getRiskLevel(riskScore);
        
        // Country Flag
        const countryCode = item.summary.flag || item.summary.country || 'XX';
        const flagEmoji = countryCodeToFlag(countryCode);
        
        return `
            <div class="glass-panel rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 card-border ${borderColor} cursor-pointer group" onclick="showDetailModal(${item.id})">
                <div class="p-6 relative">
                    <div class="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button class="delete-btn text-gray-500 hover:text-red-400 p-2 bg-dark-900/50 rounded-full backdrop-blur-sm" onclick="event.stopPropagation(); deleteRecord(${item.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>

                    <!-- Header -->
                    <div class="flex justify-between items-start mb-3">
                        <div class="flex items-center gap-3">
                            <input type="checkbox" class="history-checkbox w-4 h-4 rounded text-brand-500 focus:ring-brand-500 bg-dark-800 border-white/10" onclick="event.stopPropagation()" onchange="toggleSelection(${item.id}, this.checked)" ${selectedRecords.has(item.id) ? 'checked' : ''}>
                            <h3 class="text-xl font-bold text-white font-mono tracking-wider">${item.ip}</h3>
                        </div>
                    </div>
                    
                    <!-- Verdict Badge -->
                    <div class="flex flex-wrap gap-2 mb-4">
                        <span class="px-3 py-1 rounded-full text-xs font-medium ${verdictClass} border border-white/5">
                            ${verdictIcon} ${item.verdict}
                        </span>
                        <span class="px-3 py-1 rounded-full text-xs font-medium ${riskLevel.color} ${riskLevel.bg} border border-white/5">
                            风险分: ${riskScore}
                        </span>
                    </div>
                    
                    <!-- Info Grid -->
                    <div class="grid grid-cols-2 gap-y-2 text-sm">
                        <div class="flex items-center gap-2">
                            <i class="fas fa-building text-gray-500 w-4"></i>
                            <span class="text-gray-300 truncate" title="${item.summary.isp}">${item.summary.isp || '未知'}</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <i class="fas fa-flag text-gray-500 w-4"></i>
                            <span class="text-gray-300 flex items-center gap-1">
                                ${flagEmoji} ${item.summary.country || '未知'}
                            </span>
                        </div>
                    </div>
                    
                    <!-- Footer -->
                    <div class="pt-4 mt-4 border-t border-white/10 flex justify-between items-center text-xs text-gray-500">
                        <div class="flex items-center gap-2">
                            <i class="fas fa-clock"></i>
                            <span>${item.timeStr}</span>
                        </div>
                        <i class="fas fa-chevron-right opacity-0 group-hover:opacity-100 transition-opacity text-brand-400"></i>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    historyGrid.innerHTML = cards;
}

// Show detail modal using RenderCore
function showDetailModal(id) {
    const history = JSON.parse(localStorage.getItem('ip_history_log')) || [];
    const item = history.find(item => item.id === id);
    
    if (!item) return;

    // 关键：重构数据对象，使其符合 RenderCore 的输入要求
    const viewData = reconstructViewData(item);
    
    // 使用 RenderCore 生成完整的详情 HTML
    const html = window.RenderCore.getResultCardHTML(viewData);
    
    detailContent.innerHTML = html;
    
    // Show modal
    detailModal.classList.remove('hidden');
    detailModal.classList.add('flex');
    document.body.style.overflow = 'hidden';
}

// Helper: Reconstructs the full data object expected by RenderCore from history item
function reconstructViewData(item) {
    const raw = item.raw_data;
    const RC = window.RenderCore; // Alias
    
    // 1. Recalculate basics using RenderCore helpers
    const locationInfo = RC.getLocationFromRawData(raw, item.ip);
    const asn = RC.getAsnFromRawData(raw, item.ip);
    const type = RC.getTypeFromRawData(raw, item.ip);
    
    // 2. Recalculate Scores
    let ipqsScore = null;
    if (raw.ipqs?.success && raw.ipqs.fraud_score !== undefined) ipqsScore = raw.ipqs.fraud_score;

    let scamScore = null;
    if (raw.scamalytics?.score !== undefined) scamScore = raw.scamalytics.score;

    const pcData = RC.getProxyCheckData(raw.proxycheck, item.ip);
    let pcScore = null;
    if (pcData.risk !== undefined) pcScore = parseInt(pcData.risk);

    let finalScore = 0;
    if (ipqsScore !== null) finalScore = ipqsScore;
    else if (scamScore !== null) finalScore = scamScore;
    else if (pcScore !== null) finalScore = pcScore;

    const riskLevel = RC.getRiskLevel(finalScore);

    // 3. Reconstruct Quality Object (Mocking the logic from script.js)
    // 注意：因为 script.js 没有保存 quality 对象，我们需要在这里简易重建
    // 这里的逻辑是为了确保 RenderCore.getLayer2HTML 能正常显示，而不是报错
    const quality = {
        isValid: true,
        verdict: item.verdict, // 直接使用保存的结论
        isDatacenter: type.includes('机房') || type.includes('Hosting'),
        isMobile: type.includes('移动') || type.includes('Wireless'),
        hasRecentAbuse: (raw.ipqs?.recent_abuse === true) || (pcData.risk > 50),
        isBlacklisted: (raw.ipqs?.blacklisted === true) || (scamScore > 75),
        ispRisk: finalScore < 30 ? 'low' : finalScore < 75 ? 'medium' : 'high',
        specialService: [],
        countryConflict: locationInfo.countryConflict
    };

    // 4. Return the full object
    return {
        ip: item.ip,
        location: locationInfo.location,
        asn: asn,
        type: type,
        typeConfidence: 'medium', // Default for history
        
        finalVerdict: item.verdict,
        fraudScore: finalScore,
        riskLabel: riskLevel.label,
        riskColor: riskLevel.color,
        riskBg: riskLevel.bg,
        
        scoreSources: RC.getScoreSources(raw),
        scoreConfidence: RC.getScoreConfidence(raw),
        
        quality: quality, // Passed to Layer 2
        rawData: raw      // Passed to Layer 3
    };
}

function closeDetailModal() {
    detailModal.classList.add('hidden');
    detailModal.classList.remove('flex');
    document.body.style.overflow = 'auto';
}

// Toggle checkbox selection
window.toggleSelection = function(id, isChecked) {
    if (isChecked) selectedRecords.add(id);
    else selectedRecords.delete(id);
}

// Delete Record
window.deleteRecord = function(id) {
    if (!confirm('确定要删除这条记录吗？')) return;
    
    let history = JSON.parse(localStorage.getItem('ip_history_log')) || [];
    const newHistory = history.filter(item => item.id !== id);
    localStorage.setItem('ip_history_log', JSON.stringify(newHistory));
    
    selectedRecords.delete(id);
    renderHistory();
}

function selectAll() {
    selectedRecords.clear();
    const history = JSON.parse(localStorage.getItem('ip_history_log')) || [];
    history.forEach(item => selectedRecords.add(item.id));
    renderHistory();
}

function clearAll() {
    selectedRecords.clear();
    renderHistory();
}

// Export Excel (CSV format)
function exportExcel() {
    const history = JSON.parse(localStorage.getItem('ip_history_log')) || [];
    let exportData = history;
    
    if (selectedRecords.size > 0) {
        exportData = history.filter(item => selectedRecords.has(item.id));
    }
    
    if (exportData.length === 0) {
        alert('暂无记录可导出');
        return;
    }
    
    // CSV Header
    let csvContent = '\uFEFF'; // BOM for Excel
    csvContent += "ID,IP,结论,ISP,国家,时间,总分,IPQS分,Scam分,PC分,原始数据\n";
    
    exportData.forEach(item => {
        const raw = item.raw_data;
        
        // Extract scores
        const ipqs = raw.ipqs?.fraud_score ?? '无';
        const scam = raw.scamalytics?.score ?? '无';
        const pcData = window.RenderCore.getProxyCheckData(raw.proxycheck, item.ip);
        const pc = pcData.risk ?? '无';
        
        // Calculate total (re-logic)
        let total = 0;
        if (typeof ipqs === 'number') total = ipqs;
        else if (typeof scam === 'number') total = scam;
        else if (typeof pc === 'number') total = parseInt(pc);

        // Escape JSON
        const safeJson = JSON.stringify(raw).replace(/"/g, '""');

        const row = [
            item.id,
            item.ip,
            item.verdict,
            item.summary.isp || '未知',
            item.summary.country || '未知',
            item.timeStr,
            total,
            ipqs,
            scam,
            pc,
            `"${safeJson}"`
        ];
        
        csvContent += row.join(',') + '\n';
    });
    
    downloadFile(csvContent, `IP_History_${Date.now()}.csv`, 'text/csv;charset=utf-8');
}

function copyCsv() {
    // Similar to exportExcel but to clipboard
    // Simplified for brevity
    alert("请使用导出 Excel 功能获取完整数据");
}

function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function countryCodeToFlag(countryCode) {
    if (!countryCode || countryCode.length !== 2) return '🌍';
    try {
        const codePoints = countryCode.toUpperCase().split('').map(char => 127397 + char.charCodeAt(0));
        return String.fromCodePoint(...codePoints);
    } catch (e) { return '🌍'; }
}