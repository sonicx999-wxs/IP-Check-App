// History Page Script

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
    console.log('History page loaded');
    
    renderHistory();
    
    // Event listeners
    closeModal.addEventListener('click', closeDetailModal);
    exportExcelBtn.addEventListener('click', exportExcel);
    copyCsvBtn.addEventListener('click', copyCsv);
    selectAllBtn.addEventListener('click', selectAll);
    clearAllBtn.addEventListener('click', clearAll);
    
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
    const storedData = localStorage.getItem('ip_history_log');
    let history = [];
    
    try {
        history = JSON.parse(storedData) || [];
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
        
        // Get risk score from raw data
        let riskScore = 0;
        let riskLabel = '低风险';
        let riskColor = 'text-green-400';
        let riskBg = 'bg-green-500/20';
        
        // Calculate final risk score from available sources
        if (item.raw_data.ipqs?.fraud_score !== undefined && item.raw_data.ipqs?.fraud_score !== null) {
            riskScore = item.raw_data.ipqs.fraud_score;
        } else if (item.raw_data.scamalytics?.score !== undefined && item.raw_data.scamalytics?.score !== null) {
            riskScore = item.raw_data.scamalytics.score;
        } else {
            // Handle ProxyCheck data with dynamic IP key
            const pcRaw = item.raw_data.proxycheck || {};
            // 尝试直接获取该IP的数据，如果没找到，尝试找对象中第一个是对象的属性
            const pcNode = pcRaw[item.ip] || Object.values(pcRaw).find(v => typeof v === 'object' && v.risk !== undefined) || {};
            const pcRisk = pcNode.risk;
            if (pcRisk !== undefined && pcRisk !== null) {
                riskScore = parseInt(pcRisk);
            }
        }
        
        // Determine risk level based on score
        if (riskScore < 30) {
            riskLabel = '低风险';
            riskColor = 'text-green-400';
            riskBg = 'bg-green-500/20';
        } else if (riskScore < 75) {
            riskLabel = '中风险';
            riskColor = 'text-yellow-400';
            riskBg = 'bg-yellow-500/20';
        } else {
            riskLabel = '高风险';
            riskColor = 'text-red-400';
            riskBg = 'bg-red-500/20';
        }
        
        // Format country flag emoji
        const countryCode = item.summary.flag || 'XX';
        const flagEmoji = countryCodeToFlag(countryCode);
        
        return `
            <div class="glass-panel rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 card-border ${borderColor}" data-id="${item.id}">
                <div class="p-6">
                    <!-- Card Header with Checkbox and Actions -->
                    <div class="flex justify-between items-start mb-3">
                        <div class="flex items-center gap-2">
                            <input type="checkbox" class="history-checkbox w-4 h-4 rounded text-brand-500 focus:ring-brand-500 bg-dark-800 border-white/10" data-id="${item.id}">
                            <h3 class="text-xl font-bold text-white font-mono tracking-wider">${item.ip}</h3>
                        </div>
                        <div class="flex gap-2">
                            <button class="delete-btn text-gray-400 hover:text-red-400 transition-colors" data-id="${item.id}" title="删除记录">
                                <i class="fas fa-trash"></i>
                            </button>
                            <button class="detail-btn text-gray-400 hover:text-blue-400 transition-colors" data-id="${item.id}" title="查看详情">
                                <i class="fas fa-info-circle"></i>
                            </button>
                        </div>
                    </div>
                    
                    <!-- Verdict and Risk Score -->
                    <div class="flex flex-col gap-3 mb-4">
                        <span class="self-start px-3 py-1 rounded-full text-xs font-medium ${item.verdict === 'PASS' ? 'bg-green-500/20 text-green-400' : item.verdict === 'WARN' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}">
                            ${item.verdict === 'PASS' ? '✅ 通过' : item.verdict === 'WARN' ? '⚠️ 警告' : '❌ 失败'}
                        </span>
                        <span class="font-bold ${riskColor} flex items-center gap-2 px-3 py-1.5 rounded-full ${riskBg} border border-white/10">
                            <i class="fas fa-exclamation-circle"></i>
                            风险评分: ${riskScore} (${riskLabel})
                        </span>
                    </div>
                    
                    <!-- ISP and Country -->
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
                    
                    <!-- Detection Time -->
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
    
    // Add event listeners to checkboxes
    document.querySelectorAll('.history-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            const id = parseInt(e.target.dataset.id);
            if (e.target.checked) {
                selectedRecords.add(id);
            } else {
                selectedRecords.delete(id);
            }
        });
    });
    
    // Add event listeners to delete buttons
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = parseInt(e.target.closest('.delete-btn').dataset.id);
            deleteRecord(id);
        });
    });
    
    // Add event listeners to detail buttons
    document.querySelectorAll('.detail-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = parseInt(e.target.closest('.detail-btn').dataset.id);
            showDetailModal(id);
        });
    });
    
    // Add event listeners to cards for detail view
    document.querySelectorAll('.glass-panel.card-border').forEach(card => {
        card.addEventListener('click', (e) => {
            // Don't trigger if click is on checkbox, delete, or detail button
            if (!e.target.closest('.history-checkbox') && !e.target.closest('.delete-btn') && !e.target.closest('.detail-btn')) {
                const id = parseInt(card.dataset.id);
                showDetailModal(id);
            }
        });
    });
}

// Show detail modal with full IP data
function showDetailModal(id) {
    const history = JSON.parse(localStorage.getItem('ip_history_log')) || [];
    const item = history.find(item => item.id === id);
    
    if (!item) return;
    
    // Get risk score from raw data
    let riskScore = 0;
    if (item.raw_data.ipqs?.fraud_score !== undefined && item.raw_data.ipqs?.fraud_score !== null) {
        riskScore = item.raw_data.ipqs.fraud_score;
    } else if (item.raw_data.scamalytics?.score !== undefined && item.raw_data.scamalytics?.score !== null) {
        riskScore = item.raw_data.scamalytics.score;
    } else {
        // Handle ProxyCheck data with dynamic IP key
        const pcRaw = item.raw_data.proxycheck || {};
        // 尝试直接获取该IP的数据，如果没找到，尝试找对象中第一个是对象的属性
        const pcNode = pcRaw[item.ip] || Object.values(pcRaw).find(v => typeof v === 'object' && v.risk !== undefined) || {};
        const pcRisk = pcNode.risk;
        if (pcRisk !== undefined && pcRisk !== null) {
            riskScore = parseInt(pcRisk);
        }
    }
    
    // Format the raw data for display
    const formattedRawData = JSON.stringify(item.raw_data, null, 2);
    
    // Generate detail HTML (similar to main app's detail view)
    detailContent.innerHTML = `
        <div class="space-y-6">
            <!-- Basic Info -->
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
                                <span class="text-gray-400">风险评分:</span>
                                <span class="font-bold text-yellow-400">${riskScore}</span>
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
                        <h4 class="text-sm text-gray-500 mb-2">API 数据来源</h4>
                        <div class="space-y-2">
                            <div class="flex justify-between">
                                <span class="text-gray-400">IPQualityScore:</span>
                                <span class="${item.raw_data.ipqs ? 'text-green-400' : 'text-red-400'}">
                                    ${item.raw_data.ipqs ? '✅ 可用' : '❌ 不可用'}
                                </span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-400">Scamalytics:</span>
                                <span class="${item.raw_data.scamalytics ? 'text-green-400' : 'text-red-400'}">
                                    ${item.raw_data.scamalytics ? '✅ 可用' : '❌ 不可用'}
                                </span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-400">ProxyCheck:</span>
                                <span class="${item.raw_data.proxycheck ? 'text-green-400' : 'text-red-400'}">
                                    ${item.raw_data.proxycheck ? '✅ 可用' : '❌ 不可用'}
                                </span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-400">IPinfo:</span>
                                <span class="${item.raw_data.ipinfo ? 'text-green-400' : 'text-red-400'}">
                                    ${item.raw_data.ipinfo ? '✅ 可用' : '❌ 不可用'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Risk Scores from Each Source -->
            <div class="glass-panel rounded-xl p-4">
                <h4 class="text-sm text-gray-500 mb-4">各平台风险评分</h4>
                <div class="grid grid-cols-2 gap-4">
                    <div class="bg-dark-900/50 p-3 rounded-lg">
                        <div class="flex justify-between items-center mb-2">
                            <span class="text-sm text-gray-400">IPQualityScore:</span>
                            <span class="font-medium ${item.raw_data.ipqs?.fraud_score !== undefined && item.raw_data.ipqs?.fraud_score !== null ? 'text-yellow-400' : 'text-gray-500'}">
                                ${item.raw_data.ipqs?.fraud_score !== undefined && item.raw_data.ipqs?.fraud_score !== null ? item.raw_data.ipqs.fraud_score : '无'}
                            </span>
                        </div>
                        <div class="flex justify-between items-center mb-2">
                            <span class="text-sm text-gray-400">Scamalytics 评分:</span>
                            <span class="font-medium ${item.raw_data.scamalytics?.score !== undefined && item.raw_data.scamalytics?.score !== null ? 'text-yellow-400' : 'text-gray-500'}">
                                ${item.raw_data.scamalytics?.score !== undefined && item.raw_data.scamalytics?.score !== null ? item.raw_data.scamalytics.score : '无'}
                            </span>
                        </div>
                        <div class="flex justify-between items-center mb-2">
                            <span class="text-sm text-gray-400">Scamalytics 风险等级:</span>
                            <span class="font-medium ${item.raw_data.scamalytics?.risk !== undefined && item.raw_data.scamalytics?.risk !== null ? 'text-yellow-400' : 'text-gray-500'}">
                                ${item.raw_data.scamalytics?.risk !== undefined && item.raw_data.scamalytics?.risk !== null ? item.raw_data.scamalytics.risk : '无'}
                            </span>
                        </div>
                        <div class="flex justify-between items-center">
                            <span class="text-sm text-gray-400">ProxyCheck:</span>
                            ${(() => {
                                // Handle ProxyCheck data with dynamic IP key
                                const pcRaw = item.raw_data.proxycheck || {};
                                // 尝试直接获取该IP的数据，如果没找到，尝试找对象中第一个是对象的属性
                                const pcNode = pcRaw[item.ip] || Object.values(pcRaw).find(v => typeof v === 'object' && v.risk !== undefined) || {};
                                const pcRisk = pcNode.risk;
                                const hasRisk = pcRisk !== undefined && pcRisk !== null;
                                return `
                                    <span class="font-medium ${hasRisk ? 'text-yellow-400' : 'text-gray-500'}">
                                        ${hasRisk ? pcRisk : '无'}
                                    </span>
                                `;
                            })()}
                        </div>
                    </div>
                    <div class="bg-dark-900/50 p-3 rounded-lg">
                        <div class="flex justify-between items-center mb-2">
                            <span class="text-sm text-gray-400">总欺诈评分:</span>
                            <span class="font-bold text-yellow-400">${riskScore}</span>
                        </div>
                        <div class="flex justify-between items-center mb-2">
                            <span class="text-sm text-gray-400">判定结果:</span>
                            <span class="font-medium ${item.verdict === 'PASS' ? 'text-green-400' : item.verdict === 'WARN' ? 'text-yellow-400' : 'text-red-400'}">
                                ${item.verdict === 'PASS' ? '✅ 通过' : item.verdict === 'WARN' ? '⚠️ 警告' : '❌ 失败'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Raw API Data -->
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

// Delete a record from history
function deleteRecord(id) {
    if (!confirm('确定要删除这条记录吗？')) {
        return;
    }
    
    let history = JSON.parse(localStorage.getItem('ip_history_log')) || [];
    const newHistory = history.filter(item => item.id !== id);
    localStorage.setItem('ip_history_log', JSON.stringify(newHistory));
    
    // Update selected records
    selectedRecords.delete(id);
    
    // Re-render the history
    renderHistory();
}

// Select all records
function selectAll() {
    selectedRecords.clear();
    const history = JSON.parse(localStorage.getItem('ip_history_log')) || [];
    history.forEach(item => {
        selectedRecords.add(item.id);
    });
    
    // Update checkboxes
    document.querySelectorAll('.history-checkbox').forEach(checkbox => {
        checkbox.checked = true;
    });
}

// Clear all selections
function clearAll() {
    selectedRecords.clear();
    document.querySelectorAll('.history-checkbox').forEach(checkbox => {
        checkbox.checked = false;
    });
}

// Export selected records as Excel (CSV format)
function exportExcel() {
    const history = JSON.parse(localStorage.getItem('ip_history_log')) || [];
    let exportData = history;
    
    // If there are selected records, only export those
    if (selectedRecords.size > 0) {
        exportData = history.filter(item => selectedRecords.has(item.id));
    }
    
    if (exportData.length === 0) {
        alert('暂无记录可导出');
        return;
    }
    
    // Create CSV headers with improved structure
    const headers = [
        'ID', 
        'IP', 
        'Verdict', 
        'ISP', 
        'Country', 
        'Detection Time', 
        'Total Fraud Score', 
        'IPQualityScore', 
        'Scamalytics Score', 
        'Scamalytics Risk',
        'ProxyCheck',
        'Raw Data (JSON)'
    ];
    
    let csvContent = headers.map(header => `"${header}"`).join(',') + '\n';
    
    // Add data rows
    exportData.forEach(item => {
        // Helper function to get ProxyCheck risk score
        const getProxyCheckRisk = (proxyData, ip) => {
            const pcRaw = proxyData || {};
            // 尝试直接获取该IP的数据，如果没找到，尝试找对象中第一个是对象的属性
            const pcNode = pcRaw[ip] || Object.values(pcRaw).find(v => typeof v === 'object' && v.risk !== undefined) || {};
            return pcNode.risk;
        };
        
        // Calculate total risk score
        let totalScore = 0;
        if (item.raw_data.ipqs?.fraud_score !== undefined && item.raw_data.ipqs?.fraud_score !== null) {
            totalScore = item.raw_data.ipqs.fraud_score;
        } else if (item.raw_data.scamalytics?.score !== undefined && item.raw_data.scamalytics?.score !== null) {
            totalScore = item.raw_data.scamalytics.score;
        } else {
            const pcRisk = getProxyCheckRisk(item.raw_data.proxycheck, item.ip);
            if (pcRisk !== undefined && pcRisk !== null) {
                totalScore = parseInt(pcRisk);
            }
        }
        
        // Get ProxyCheck risk score
        const pcRisk = getProxyCheckRisk(item.raw_data.proxycheck, item.ip);
        
        const row = [
            item.id,
            item.ip,
            item.verdict,
            item.summary.isp || '未知',
            item.summary.country || '未知',
            item.timeStr,
            totalScore,
            item.raw_data.ipqs?.fraud_score !== undefined && item.raw_data.ipqs?.fraud_score !== null ? item.raw_data.ipqs.fraud_score : '无',
            item.raw_data.scamalytics?.score !== undefined && item.raw_data.scamalytics?.score !== null ? item.raw_data.scamalytics.score : '无',
            item.raw_data.scamalytics?.risk !== undefined && item.raw_data.scamalytics?.risk !== null ? item.raw_data.scamalytics.risk : '无',
            pcRisk !== undefined && pcRisk !== null ? pcRisk : '无',
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
    downloadFile(csvContent, 'ip_history.xlsx', 'application/vnd.ms-excel');
}

// Copy selected records as CSV to clipboard
function copyCsv() {
    const history = JSON.parse(localStorage.getItem('ip_history_log')) || [];
    let exportData = history;
    
    // If there are selected records, only export those
    if (selectedRecords.size > 0) {
        exportData = history.filter(item => selectedRecords.has(item.id));
    }
    
    if (exportData.length === 0) {
        alert('暂无记录可复制');
        return;
    }
    
    // Create CSV headers
    const headers = [
        'ID', 
        'IP', 
        'Verdict', 
        'ISP', 
        'Country', 
        'Detection Time', 
        'Total Fraud Score', 
        'IPQualityScore', 
        'Scamalytics Score', 
        'Scamalytics Risk',
        'ProxyCheck'
    ];
    
    let csvContent = headers.map(header => `"${header}"`).join(',') + '\n';
    
    // Add data rows
    exportData.forEach(item => {
        // Helper function to get ProxyCheck risk score
        const getProxyCheckRisk = (proxyData, ip) => {
            const pcRaw = proxyData || {};
            // 尝试直接获取该IP的数据，如果没找到，尝试找对象中第一个是对象的属性
            const pcNode = pcRaw[ip] || Object.values(pcRaw).find(v => typeof v === 'object' && v.risk !== undefined) || {};
            return pcNode.risk;
        };
        
        // Calculate total risk score
        let totalScore = 0;
        if (item.raw_data.ipqs?.fraud_score !== undefined && item.raw_data.ipqs?.fraud_score !== null) {
            totalScore = item.raw_data.ipqs.fraud_score;
        } else if (item.raw_data.scamalytics?.score !== undefined && item.raw_data.scamalytics?.score !== null) {
            totalScore = item.raw_data.scamalytics.score;
        } else {
            const pcRisk = getProxyCheckRisk(item.raw_data.proxycheck, item.ip);
            if (pcRisk !== undefined && pcRisk !== null) {
                totalScore = parseInt(pcRisk);
            }
        }
        
        // Get ProxyCheck risk score
        const pcRisk = getProxyCheckRisk(item.raw_data.proxycheck, item.ip);
        
        const row = [
            item.id,
            item.ip,
            item.verdict,
            item.summary.isp || '未知',
            item.summary.country || '未知',
            item.timeStr,
            totalScore,
            item.raw_data.ipqs?.fraud_score !== undefined && item.raw_data.ipqs?.fraud_score !== null ? item.raw_data.ipqs.fraud_score : '无',
            item.raw_data.scamalytics?.score !== undefined && item.raw_data.scamalytics?.score !== null ? item.raw_data.scamalytics.score : '无',
            item.raw_data.scamalytics?.risk !== undefined && item.raw_data.scamalytics?.risk !== null ? item.raw_data.scamalytics.risk : '无',
            pcRisk !== undefined && pcRisk !== null ? pcRisk : '无'
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
    
    // Copy to clipboard
    navigator.clipboard.writeText(csvContent)
        .then(() => {
            // Show success feedback
            alert('CSV 数据已复制到剪贴板');
        })
        .catch(err => {
            console.error('无法复制 CSV 数据:', err);
            alert('复制失败，请手动复制');
        });
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