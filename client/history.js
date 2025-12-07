// History Page Script

// DOM Elements
const historyGrid = document.getElementById('historyGrid');
const detailModal = document.getElementById('detailModal');
const detailContent = document.getElementById('detailContent');
const closeModal = document.getElementById('closeModal');
const exportExcelBtn = document.getElementById('exportExcelBtn');
const exportCsvBtn = document.getElementById('exportCsvBtn');

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    console.log('History page loaded');
    console.log('DOM elements:', {
        historyGrid: !!historyGrid,
        detailModal: !!detailModal,
        detailContent: !!detailContent,
        closeModal: !!closeModal,
        exportExcelBtn: !!exportExcelBtn,
        exportCsvBtn: !!exportCsvBtn
    });
    
    renderHistory();
    
    // Event listeners
    closeModal.addEventListener('click', closeDetailModal);
    exportExcelBtn.addEventListener('click', exportExcel);
    exportCsvBtn.addEventListener('click', exportCsv);
    
    // Close modal when clicking outside
    detailModal.addEventListener('click', (e) => {
        if (e.target === detailModal) {
            closeDetailModal();
        }
    });
});

// Render history cards
function renderHistory() {
    // Get history from localStorage
    console.log('Rendering history...');
    const storedData = localStorage.getItem('ip_history_log');
    console.log('Stored data:', storedData);
    
    let history = [];
    try {
        history = JSON.parse(storedData) || [];
        console.log('Parsed history:', history);
        console.log('History length:', history.length);
    } catch (error) {
        console.error('Error parsing history data:', error);
        history = [];
    }
    
    if (history.length === 0) {
        // Empty state
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
        let borderColor = 'border-green-500';
        if (item.verdict === 'WARN') {
            borderColor = 'border-yellow-500';
        } else if (item.verdict === 'FAIL') {
            borderColor = 'border-red-500';
        }
        
        // Format country flag emoji
        const countryCode = item.summary.flag || 'XX';
        const flagEmoji = countryCodeToFlag(countryCode);
        
        return `
            <div class="glass-panel rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 cursor-pointer card-border ${borderColor}" data-id="${item.id}">
                <div class="p-6">
                    <div class="flex justify-between items-start mb-4">
                        <h3 class="text-2xl font-bold text-white font-mono tracking-wider">${item.ip}</h3>
                        <span class="px-3 py-1 rounded-full text-xs font-medium ${item.verdict === 'PASS' ? 'bg-green-500/20 text-green-400' : item.verdict === 'WARN' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}">
                            ${item.verdict === 'PASS' ? '✅ 通过' : item.verdict === 'WARN' ? '⚠️ 警告' : '❌ 失败'}
                        </span>
                    </div>
                    
                    <div class="space-y-2 mb-4">
                        <div class="flex items-center gap-2 text-sm">
                            <i class="fas fa-building text-gray-500"></i>
                            <span class="text-gray-300">ISP:</span>
                            <span class="text-white truncate">${item.summary.isp || '未知'}</span>
                        </div>
                        
                        <div class="flex items-center gap-2 text-sm">
                            <i class="fas fa-flag text-gray-500"></i>
                            <span class="text-gray-300">国家:</span>
                            <span class="text-white flex items-center gap-1">
                                ${flagEmoji}
                                ${item.summary.country || '未知'}
                            </span>
                        </div>
                    </div>
                    
                    <div class="pt-4 border-t border-white/10">
                        <div class="flex items-center gap-2 text-xs text-gray-500">
                            <i class="fas fa-clock"></i>
                            <span>检测时间:</span>
                            <span class="text-gray-400">${item.timeStr}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    historyGrid.innerHTML = cards;
    
    // Add click event listeners to cards
    document.querySelectorAll('.glass-panel.card-border').forEach(card => {
        card.addEventListener('click', () => {
            const id = parseInt(card.dataset.id);
            showDetailModal(id);
        });
    });
}

// Show detail modal
function showDetailModal(id) {
    const history = JSON.parse(localStorage.getItem('ip_history_log')) || [];
    const item = history.find(item => item.id === id);
    
    if (!item) return;
    
    // Format the raw data for display
    const formattedRawData = JSON.stringify(item.raw_data, null, 2);
    
    // Generate detail HTML
    detailContent.innerHTML = `
        <div class="space-y-6">
            <div class="glass-panel rounded-xl p-4">
                <h3 class="text-xl font-bold text-white font-mono mb-4">${item.ip}</h3>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <h4 class="text-sm text-gray-500 mb-2">基本信息</h4>
                        <div class="space-y-2">
                            <div class="flex justify-between">
                                <span class="text-gray-400">判定结果:</span>
                                <span class="font-medium ${item.verdict === 'PASS' ? 'text-green-400' : item.verdict === 'WARN' ? 'text-yellow-400' : 'text-red-400'}">
                                    ${item.verdict === 'PASS' ? '✅ 通过' : item.verdict === 'WARN' ? '⚠️ 警告' : '❌ 失败'}
                                </span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-400">检测时间:</span>
                                <span class="text-white">${item.timeStr}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-400">ISP:</span>
                                <span class="text-white">${item.summary.isp || '未知'}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-400">国家:</span>
                                <span class="text-white">${item.summary.country || '未知'}</span>
                            </div>
                        </div>
                    </div>
                    <div>
                        <h4 class="text-sm text-gray-500 mb-2">摘要信息</h4>
                        <pre class="bg-dark-900/50 p-3 rounded-lg text-xs text-gray-300 overflow-auto max-h-32">${JSON.stringify(item.summary, null, 2)}</pre>
                    </div>
                </div>
            </div>
            
            <div class="glass-panel rounded-xl p-4">
                <h4 class="text-sm text-gray-500 mb-2">原始 API 数据</h4>
                <pre class="bg-dark-900/50 p-4 rounded-lg text-xs text-gray-300 overflow-auto max-h-96">${formattedRawData}</pre>
            </div>
        </div>
    `;
    
    // Show modal
    detailModal.classList.remove('hidden');
    detailModal.classList.add('flex');
    document.body.style.overflow = 'hidden';
}

// Close detail modal
function closeDetailModal() {
    detailModal.classList.add('hidden');
    detailModal.classList.remove('flex');
    document.body.style.overflow = 'auto';
}

// Export as Excel (using CSV format)
function exportExcel() {
    // In browser environment, we use CSV as Excel format
    const history = JSON.parse(localStorage.getItem('ip_history_log')) || [];
    
    if (history.length === 0) {
        alert('暂无记录可导出');
        return;
    }
    
    // Create CSV content
    let csvContent = '"Summary","Raw Data (JSON)"\n';
    
    history.forEach(item => {
        // Create summary text
        const summary = `${item.ip} - ${item.verdict} - ${item.timeStr} - ISP: ${item.summary.isp || '未知'} - Country: ${item.summary.country || '未知'}`;
        
        // Escape raw data for CSV
        const rawDataStr = JSON.stringify(item.raw_data).replace(/"/g, '""');
        
        csvContent += `"${summary}","${rawDataStr}"\n`;
    });
    
    // Download file
    downloadFile(csvContent, 'ip_history.xlsx', 'application/vnd.ms-excel');
}

// Export as CSV
function exportCsv() {
    const history = JSON.parse(localStorage.getItem('ip_history_log')) || [];
    
    if (history.length === 0) {
        alert('暂无记录可导出');
        return;
    }
    
    // Create CSV headers
    const headers = ['ID', 'IP', 'Verdict', 'ISP', 'Country', 'Detection Time', 'Raw Data (JSON)'];
    let csvContent = headers.map(header => `"${header}"`).join(',') + '\n';
    
    // Add data rows
    history.forEach(item => {
        const row = [
            item.id,
            item.ip,
            item.verdict,
            item.summary.isp || '未知',
            item.summary.country || '未知',
            item.timeStr,
            JSON.stringify(item.raw_data)
        ];
        
        // Escape CSV values
        const escapedRow = row.map(value => {
            if (typeof value === 'string') {
                return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
        });
        
        csvContent += escapedRow.join(',') + '\n';
    });
    
    // Download file
    downloadFile(csvContent, 'ip_history.csv', 'text/csv;charset=utf-8;');
}

// Helper function to download file
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

// Helper function to convert country code to flag emoji
function countryCodeToFlag(countryCode) {
    // Only process 2-letter country codes
    if (!countryCode || countryCode.length !== 2) {
        return '🌍';
    }
    
    // Convert country code to Unicode flag emoji
    try {
        const codePoints = countryCode.toUpperCase().split('').map(char => 127397 + char.charCodeAt(0));
        return String.fromCodePoint(...codePoints);
    } catch (e) {
        return '🌍';
    }
}