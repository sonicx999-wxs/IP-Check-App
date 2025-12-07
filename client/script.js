// Version: 3.3.2 (Fix: Brace Balance & Structure)
// Client Side Logic - Unified Architecture

// ==========================================
// 1. 全局配置与状态 (Global State)
// ==========================================

// DOM Elements
const ipInput = document.getElementById('ipInput');
const checkBtn = document.getElementById('checkBtn');
const clearInputBtn = document.getElementById('clearInputBtn');
const resultsArea = document.getElementById('resultsArea');

// Sidebar DOM
const historyToggle = document.getElementById('historyToggle');
const closeHistory = document.getElementById('closeHistory');
const historySidebar = document.getElementById('historySidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const historyList = document.getElementById('historyList');
const clearHistory = document.getElementById('clearHistory');
const exportBtn = document.getElementById('exportBtn');
const copyCsvBtn = document.getElementById('copyCsvBtn');

// Settings DOM
const settingsToggle = document.getElementById('settingsToggle');
const settingsModal = document.getElementById('settingsModal');
const closeSettings = document.getElementById('closeSettings');
const saveSettingsBtn = document.getElementById('saveSettings');
const clearSettingsBtn = document.getElementById('clearSettingsBtn');
const settingsBackdrop = document.getElementById('settingsBackdrop');
const settingsContent = document.getElementById('settingsContent');

// Input Fields
const keyIPQS = document.getElementById('keyIPQS');
const keyIPinfo = document.getElementById('keyIPinfo');
const userScam = document.getElementById('userScam');
const keyScam = document.getElementById('keyScam');
const keyProxyCheck = document.getElementById('keyProxyCheck');

// State
let selectedHistoryIds = new Set();
let apiKeys = JSON.parse(localStorage.getItem('ip_check_api_keys')) || {
    ipqs: '',
    ipinfo: '',
    scamUser: '',
    scamKey: '',
    proxyCheck: ''
};

// ==========================================
// 2. 初始化 (Initialization)
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    console.log(`System Online - V2.3.2`);

    // 加载配置 UI
    loadSettingsUI();
    
    // 清理旧的冗余数据 (SSOT原则)
    localStorage.removeItem('ip_check_history'); 

    // 绑定侧边栏事件
    if (historyToggle) {
        historyToggle.addEventListener('click', toggleSidebar);
    }
    if (closeHistory) {
        closeHistory.addEventListener('click', closeSidebar);
    }
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', (e) => {
            if (e.target === sidebarOverlay) closeSidebar();
        });
    }

    // 绑定设置模态框事件
    if (settingsToggle) {
        settingsToggle.addEventListener('click', openSettings);
    }
    if (closeSettings) {
        closeSettings.addEventListener('click', closeSettingsModal);
    }
    if (settingsBackdrop) {
        settingsBackdrop.addEventListener('click', closeSettingsModal);
    }
    if (saveSettingsBtn) {
        saveSettingsBtn.addEventListener('click', saveSettings);
    }

    // 绑定设置清除按钮 (双击确认逻辑)
    if (clearSettingsBtn) {
        clearSettingsBtn.addEventListener('click', handleClearSettings);
    }

    // 核心检测功能绑定 (仅在存在检测按钮的页面执行)
    if (checkBtn) {
        // 初始化侧边栏历史
        renderSidebarHistory();

        checkBtn.addEventListener('click', handleCheck);

        if (clearInputBtn) {
            clearInputBtn.addEventListener('click', () => {
                ipInput.value = '';
                ipInput.focus();
                showToast('输入框已清空', 'info');
            });
        }

        // 侧边栏清空按钮
        if (clearHistory) {
            clearHistory.addEventListener('click', handleClearHistory);
        }

        // 侧边栏导出按钮
        if (exportBtn) {
            exportBtn.addEventListener('click', exportData);
        }
        if (copyCsvBtn) {
            copyCsvBtn.addEventListener('click', copyHistoryToClipboard);
        }
    }
}); // End DOMContentLoaded

// ==========================================
// 3. 核心检测逻辑 (Core Logic)
// ==========================================

async function handleCheck() {
    const rawInput = ipInput.value.trim();
    if (!rawInput) {
        showToast('请输入 IP 地址', 'error');
        return;
    }

    // 验证与过滤
    const rawList = rawInput.split(/[\n,]+/).map(ip => ip.trim()).filter(ip => ip);
    const validIPs = [];
    rawList.forEach(ip => {
        if (isValidIP(ip)) validIPs.push(ip);
    });

    if (validIPs.length === 0) {
        showToast('请输入有效的 IPv4 或 IPv6 地址', 'error');
        return;
    }

    // UI Loading
    const originalBtnContent = checkBtn.innerHTML;
    checkBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> 正在检测...`;
    checkBtn.disabled = true;
    resultsArea.innerHTML = ''; // 清空旧结果

    try {
        const results = [];

        for (const ip of validIPs) {
            let result = {
                ip,
                status: 'PASS',
                message: '',
                layers: {
                    layer1: { status: 'PENDING', data: null },
                    layer2: { status: 'PENDING', data: null },
                    layer3: { status: 'PENDING', data: null }
                },
                rawData: { ipqs: null, ipinfo: null, scamalytics: null, proxycheck: null }
            };

            try {
                // Layer 1: 基建层
                result = await executeLayer1(ip, result);
                
                if (result.status !== 'FAIL') {
                    // Layer 2: 信誉层
                    result = await executeLayer2(ip, result);
                    
                    if (result.status !== 'WARN' && result.status !== 'FAIL') {
                        // Layer 3: 终审层
                        result = await executeLayer3(ip, result);
                    }
                }

            } catch (error) {
                console.error(`IP ${ip} 检测异常:`, error);
                result.status = 'ERROR';
                result.message = error.message;
            }

            // 最终判定与数据封装
            result = determineFinalVerdict(result);
            
            // 保存至历史记录 (SSOT)
            saveToHistoryLog(result);
            
            results.push(result);
        }

        // 渲染结果 (使用 RenderCore)
        renderResults(results);
        
        // 刷新侧边栏
        renderSidebarHistory();

    } catch (error) {
        console.error("全局错误:", error);
        showToast('检测流程发生未知错误', 'error');
    } finally {
        checkBtn.innerHTML = originalBtnContent;
        checkBtn.disabled = false;
    }
} // End handleCheck

// Layer 1: 基建层
async function executeLayer1(ip, result) {
    try {
        const [ipinfoRes, proxyCheckRes] = await Promise.allSettled([
            fetchIPinfo(ip),
            fetchProxyCheck(ip)
        ]);

        const dataIPinfo = ipinfoRes.status === 'fulfilled' ? ipinfoRes.value : null;
        const dataProxyCheck = proxyCheckRes.status === 'fulfilled' ? proxyCheckRes.value : null;

        result.rawData.ipinfo = dataIPinfo;
        result.rawData.proxycheck = dataProxyCheck;

        // 熔断逻辑
        // 1. ProxyCheck 类型熔断
        if (dataProxyCheck) {
            // 动态 Key 获取 ProxyCheck 数据
            const pcNode = getProxyCheckNode(dataProxyCheck, ip);
            const pcType = pcNode.type || '';
            
            if (['VPN', 'Proxy', 'Hosting'].includes(pcType)) {
                result.status = 'FAIL';
                result.message = `Layer 1 拦截: 类型为 ${pcType}`;
                return result;
            } else if (pcType === 'Business') {
                result.layers.layer1.specialType = 'Business';
            }
        }

        // 2. IPinfo 云厂商熔断
        if (dataIPinfo && dataIPinfo.org) {
            const isp = dataIPinfo.org.toLowerCase();
            const cloudVendors = ['google', 'amazon', 'aws', 'cloudflare', 'alibaba', 'tencent'];
            if (cloudVendors.some(v => isp.includes(v))) {
                result.status = 'FAIL';
                result.message = `Layer 1 拦截: 云厂商 ${isp}`;
                return result;
            }
        }

        result.layers.layer1.status = 'PASS';
        result.layers.layer1.data = { ipinfo: dataIPinfo, proxycheck: dataProxyCheck };
        return result;

    } catch (e) {
        console.warn('Layer 1 Error', e);
        return result;
    }
} // End executeLayer1

// Layer 2: Scamalytics
async function executeLayer2(ip, result) {
    try {
        const scamRes = await fetchScamalytics(ip);
        result.rawData.scamalytics = scamRes;

        if (scamRes && scamRes.score > 40) {
            result.status = 'WARN'; 
            result.message = `Layer 2 警告: Scamalytics 分数过高 (${scamRes.score})`;
            result.layers.layer2.status = 'WARN';
        } else {
            result.layers.layer2.status = 'PASS';
        }
        result.layers.layer2.data = scamRes;
        return result;

    } catch (e) {
        console.warn('Layer 2 Error', e);
        return result;
    }
} // End executeLayer2

// Layer 3: IPQS (Cache)
async function executeLayer3(ip, result) {
    try {
        const cacheKey = `ipqs_v2_${ip}`;
        const cached = localStorage.getItem(cacheKey);
        const now = Date.now();
        let dataIPQS = null;

        if (cached) {
            const parsed = JSON.parse(cached);
            if (now - parsed.timestamp < 86400000) { // 24h
                dataIPQS = parsed.data;
                result.layers.layer3.fromCache = true;
            }
        }

        if (!dataIPQS) {
            dataIPQS = await fetchIPQS(ip);
            if (dataIPQS && (dataIPQS.success === true || dataIPQS.request_id)) {
                localStorage.setItem(cacheKey, JSON.stringify({ data: dataIPQS, timestamp: now }));
            }
        }

        result.rawData.ipqs = dataIPQS;
        result.layers.layer3.status = 'PASS';
        result.layers.layer3.data = dataIPQS;
        return result;

    } catch (e) {
        console.warn('Layer 3 Error', e);
        return result;
    }
} // End executeLayer3

// 最终判定逻辑
function determineFinalVerdict(result) {
    // 1. 提取分数 (严格处理 0 分)
    let ipqsScore = null;
    if (result.rawData.ipqs && result.rawData.ipqs.success && result.rawData.ipqs.fraud_score !== undefined) {
        ipqsScore = result.rawData.ipqs.fraud_score;
    }

    let scamScore = null;
    if (result.rawData.scamalytics && result.rawData.scamalytics.score !== undefined) {
        scamScore = result.rawData.scamalytics.score;
    }

    const pcNode = getProxyCheckNode(result.rawData.proxycheck, result.ip);
    let pcScore = null;
    if (pcNode.risk !== undefined) {
        pcScore = parseInt(pcNode.risk);
    }

    // 2. 决策优先级
    let finalScore = 0;
    if (ipqsScore !== null) finalScore = ipqsScore;
    else if (scamScore !== null) finalScore = scamScore;
    else if (pcScore !== null) finalScore = pcScore;
    
    // 3. 判定红绿灯
    let verdict = '未知';
    let riskLevel = { label: '低风险', color: 'text-green-400' };

    if (result.status === 'FAIL') {
        verdict = result.message || '❌ 禁止使用';
        riskLevel = { label: '高风险', color: 'text-red-400' };
        finalScore = 100;
    } else {
        if (finalScore < 30) {
            if (result.layers.layer1.specialType === 'Business') {
                verdict = '🟡 警告 (Business IP)';
                riskLevel = { label: '中风险', color: 'text-yellow-400' };
            } else {
                verdict = '🟢 通过';
                riskLevel = { label: '低风险', color: 'text-green-400' };
            }
        } else if (finalScore < 75) {
            verdict = '⚠️ 需谨慎使用';
            riskLevel = { label: '中风险', color: 'text-yellow-400' };
        } else {
            verdict = '❌ 禁止使用';
            riskLevel = { label: '高风险', color: 'text-red-400' };
        }
    }

    // 4. 回填数据
    result.finalScore = finalScore;
    result.finalVerdict = verdict;
    result.riskLevel = riskLevel;
    
    const ipinfo = result.rawData.ipinfo || {};
    result.location = `${ipinfo.country || ''} ${ipinfo.city || ''}`.trim();
    result.asn = ipinfo.org || pcNode.provider || '未知 ISP';
    result.type = pcNode.type || '未知类型';
    result.typeConfidence = 'medium'; // 默认置信度
    
    // 添加 quality 对象，确保 IP 质量评估模块能正常显示
    const RC = window.RenderCore;
    result.quality = {
        isValid: true,
        verdict: verdict,
        isDatacenter: result.type.includes('机房') || result.type.includes('Hosting'),
        isMobile: result.type.includes('移动') || result.type.includes('Wireless'),
        hasRecentAbuse: (result.rawData.ipqs?.recent_abuse === true) || (pcScore > 50),
        isBlacklisted: (result.rawData.ipqs?.blacklisted === true) || (scamScore > 75),
        ispRisk: finalScore < 30 ? 'low' : finalScore < 75 ? 'medium' : 'high',
        specialService: [],
        countryConflict: false // 默认无冲突
    };
    
    // 添加其他 RenderCore 需要的属性
    result.scoreSources = RC.getScoreSources(result.rawData);
    result.scoreConfidence = RC.getScoreConfidence(result.rawData);
    
    return result;
} // End determineFinalVerdict

// 辅助：获取 ProxyCheck 的内部节点
function getProxyCheckNode(proxyData, ip) {
    if (!proxyData) return {};
    if (proxyData[ip]) return proxyData[ip];
    const found = Object.values(proxyData).find(v => typeof v === 'object' && v.risk !== undefined);
    return found || {};
}

// ==========================================
// 4. 历史记录管理 (SSOT: ip_history_log)
// ==========================================

function saveToHistoryLog(result) {
    try {
        let history = JSON.parse(localStorage.getItem('ip_history_log')) || [];
        
        const newRecord = {
            id: Date.now(),
            timeStr: new Date().toLocaleString(),
            ip: result.ip,
            verdict: result.finalVerdict,
            summary: {
                isp: result.asn,
                country: result.rawData.ipinfo?.country || result.rawData.scamalytics?.country || 'XX',
                flag: result.rawData.ipinfo?.country || 'XX'
            },
            raw_data: result.rawData
        };

        history = history.filter(item => item.ip !== result.ip);
        history.unshift(newRecord);
        if (history.length > 50) history.pop();

        localStorage.setItem('ip_history_log', JSON.stringify(history));
    } catch (e) {
        console.error("保存历史记录失败", e);
    }
} // End saveToHistoryLog

// 渲染侧边栏
function renderSidebarHistory() {
    if (!historyList) return;
    historyList.innerHTML = '';
    
    const history = JSON.parse(localStorage.getItem('ip_history_log')) || [];
    
    if (history.length === 0) {
        historyList.innerHTML = `<div class="text-center text-gray-500 py-8">暂无历史记录</div>`;
        return;
    }

    history.forEach(item => {
        const div = document.createElement('div');
        div.className = 'p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-transparent hover:border-brand-500/30 flex gap-3 items-start group';

        let statusColor = 'bg-gray-500';
        if (item.verdict.includes('通过')) statusColor = 'bg-green-500';
        else if (item.verdict.includes('警告') || item.verdict.includes('谨慎')) statusColor = 'bg-yellow-500';
        else if (item.verdict.includes('禁止') || item.verdict.includes('失败')) statusColor = 'bg-red-500';

        const content = `
            <div class="w-1 self-stretch rounded-full ${statusColor} mr-2"></div>
            <div class="flex items-start gap-2 flex-1 overflow-hidden">
                <input type="checkbox" class="history-checkbox w-4 h-4 rounded text-brand-500 focus:ring-brand-500 bg-dark-800 border-white/10 mt-1" onclick="event.stopPropagation()" onchange="toggleSidebarSelection(${item.id}, this.checked)" ${selectedHistoryIds.has(item.id) ? 'checked' : ''}>
                <div class="flex-1 cursor-pointer">
                    <div class="flex justify-between items-start mb-1">
                        <span class="text-sm font-bold text-gray-200">${item.ip}</span>
                        <span class="text-xs text-gray-500">${item.summary.country}</span>
                    </div>
                    <div class="text-xs text-gray-400 truncate">${item.summary.isp}</div>
                    <div class="text-[10px] text-gray-600 mt-1">${item.timeStr.split(' ')[0]}</div>
                </div>
                <button class="delete-btn opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition-opacity p-1" data-id="${item.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        div.innerHTML = content;
        
        div.querySelector('.cursor-pointer').addEventListener('click', () => {
            closeSidebar();
            ipInput.value = item.ip; // 自动填充IP地址到输入栏
            renderHistoryRecord(item);
            showToast('已加载历史记录', 'success'); 
        });

        div.querySelector('.delete-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            deleteSidebarRecord(item.id);
        });

        historyList.appendChild(div);
    });
} // End renderSidebarHistory

function deleteSidebarRecord(id) {
    if(!confirm('确定删除此记录?')) return;
    let history = JSON.parse(localStorage.getItem('ip_history_log')) || [];
    history = history.filter(item => item.id !== id);
    localStorage.setItem('ip_history_log', JSON.stringify(history));
    renderSidebarHistory();
}

function handleClearHistory() {
    if(!confirm('确定清空所有历史记录?')) return;
    localStorage.removeItem('ip_history_log');
    renderSidebarHistory();
    showToast('历史记录已清空', 'success');
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

// Render history record in results area
function renderHistoryRecord(item) {
    const viewData = reconstructViewData(item);
    resultsArea.innerHTML = window.RenderCore.getResultCardHTML(viewData);
}

// Toggle selection for sidebar history items
function toggleSidebarSelection(id, isChecked) {
    if (isChecked) {
        selectedHistoryIds.add(id);
    } else {
        selectedHistoryIds.delete(id);
    }
}

// Select all sidebar history items
function selectAllSidebarHistory() {
    const history = JSON.parse(localStorage.getItem('ip_history_log')) || [];
    history.forEach(item => selectedHistoryIds.add(item.id));
    renderSidebarHistory();
    showToast('已全选历史记录', 'info');
}

// Clear all sidebar history selections
function clearAllSidebarHistorySelections() {
    selectedHistoryIds.clear();
    renderSidebarHistory();
    showToast('已取消全选', 'info');
}

// ==========================================
// 5. 渲染与导出
// ==========================================

function renderResults(results) {
    if (window.RenderCore && typeof window.RenderCore.getResultCardHTML === 'function') {
        results.forEach(data => {
            resultsArea.innerHTML += window.RenderCore.getResultCardHTML(data);
        });
    } else {
        console.error("RenderCore 未加载");
        showToast("系统模块缺失 (RenderCore)", "error");
    }
}

function copyHistoryToClipboard() {
    const history = JSON.parse(localStorage.getItem('ip_history_log')) || [];
    let exportData = history;
    
    // 仅导出选中的记录，如果没有选中则导出全部
    if (selectedHistoryIds.size > 0) {
        exportData = history.filter(item => selectedHistoryIds.has(item.id));
    }
    
    if (exportData.length === 0) {
        showToast('暂无记录可导出', 'info');
        return;
    }

    let csv = "时间,IP,结果,国家,ISP\n";
    exportData.forEach(item => {
        csv += `${item.timeStr},${item.ip},${item.verdict},${item.summary.country},"${item.summary.isp}"\n`;
    });

    navigator.clipboard.writeText(csv).then(() => {
        const msg = selectedHistoryIds.size > 0 ? '已复制选中记录' : '已复制所有记录';
        showToast(msg, 'success');
    });
}

function exportData() {
    const history = JSON.parse(localStorage.getItem('ip_history_log')) || [];
    let exportData = history;
    
    // 仅导出选中的记录，如果没有选中则导出全部
    if (selectedHistoryIds.size > 0) {
        exportData = history.filter(item => selectedHistoryIds.has(item.id));
    }
    
    if (exportData.length === 0) {
        showToast('暂无记录', 'info');
        return;
    }
    
    let content = "Time,IP,Verdict,Country,ISP,RawData\n";
    exportData.forEach(item => {
        const rawJson = JSON.stringify(item.raw_data).replace(/"/g, '""');
        content += `${item.timeStr},${item.ip},${item.verdict},${item.summary.country},"${item.summary.isp}","${rawJson}"\n`;
    });

    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `IP_Report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    const msg = selectedHistoryIds.size > 0 ? '已导出选中记录' : '已导出所有记录';
    showToast(msg, 'success');
}

// ==========================================
// 6. API 请求与工具函数
// ==========================================

async function fetchIPinfo(ip) {
    if (!apiKeys.ipinfo) return null;
    try {
        const res = await fetch(`https://ipinfo.io/${ip}?token=${apiKeys.ipinfo}`);
        if (!res.ok) throw new Error('IPinfo Failed');
        return await res.json();
    } catch (e) { 
        return { error: e.message }; 
    }
}

async function fetchProxyCheck(ip) {
    if (!apiKeys.proxyCheck) return null;
    try {
        const url = `https://corsproxy.io/?${encodeURIComponent(`http://proxycheck.io/v2/${ip}?key=${apiKeys.proxyCheck}&vpn=1&asn=1&risk=1&info=1`)}`;
        const res = await fetch(url);
        return await res.json();
    } catch (e) { 
        return { error: e.message }; 
    }
}

async function fetchScamalytics(ip) {
    if (!apiKeys.scamUser) return null;
    try {
        const target = `https://api11.scamalytics.com/${apiKeys.scamUser}/?key=${apiKeys.scamKey}&ip=${ip}`;
        const url = `https://corsproxy.io/?${encodeURIComponent(target)}`;
        const res = await fetch(url);
        return await res.json();
    } catch (e) { 
        return { error: e.message }; 
    }
}

async function fetchIPQS(ip) {
    if (!apiKeys.ipqs) return null;
    try {
        const target = `https://www.ipqualityscore.com/api/json/ip/${apiKeys.ipqs}/${ip}`;
        const url = `https://corsproxy.io/?${encodeURIComponent(target)}`;
        const res = await fetch(url);
        return await res.json();
    } catch (e) { 
        return { error: e.message }; 
    }
}

function isValidIP(ip) {
    return /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(\d{1,3}\.){2}\d{1,3}$/.test(ip) || ip.includes(':');
}

function loadSettingsUI() {
    keyIPQS.value = apiKeys.ipqs || '';
    keyIPinfo.value = apiKeys.ipinfo || '';
    userScam.value = apiKeys.scamUser || '';
    keyScam.value = apiKeys.scamKey || '';
    keyProxyCheck.value = apiKeys.proxyCheck || '';
}

function openSettings() {
    settingsModal.classList.remove('hidden');
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
    setTimeout(() => settingsModal.classList.add('hidden'), 300);
}

function saveSettings() {
    apiKeys = {
        ipqs: keyIPQS.value.trim(),
        ipinfo: keyIPinfo.value.trim(),
        scamUser: userScam.value.trim(),
        scamKey: keyScam.value.trim(),
        proxyCheck: keyProxyCheck.value.trim()
    };
    localStorage.setItem('ip_check_api_keys', JSON.stringify(apiKeys));
    showToast('配置已保存', 'success');
    closeSettingsModal();
}

function handleClearSettings(e) {
    const btn = e.currentTarget;
    if (btn.dataset.confirming === 'true') {
        keyIPQS.value = ''; keyIPinfo.value = ''; userScam.value = ''; keyScam.value = ''; keyProxyCheck.value = '';
        btn.dataset.confirming = 'false';
        btn.innerText = '清除配置';
        btn.classList.remove('text-red-600');
        showToast('配置已清除', 'success');
    } else {
        btn.dataset.confirming = 'true';
        btn.innerText = '确认清除?';
        btn.classList.add('text-red-600');
        setTimeout(() => {
            btn.dataset.confirming = 'false';
            btn.innerText = '清除配置';
            btn.classList.remove('text-red-600');
        }, 3000);
    }
}

// 侧边栏 Toggle
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

function showToast(msg, type = 'info') {
    const div = document.createElement('div');
    const color = type === 'error' ? 'bg-red-500' : type === 'success' ? 'bg-green-500' : 'bg-blue-500';
    div.className = `fixed top-4 left-1/2 -translate-x-1/2 z-[100] ${color} text-white px-6 py-3 rounded shadow-lg animate-[fadeIn_0.3s_ease-out]`;
    div.innerText = msg;
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 3000);
}
// End of script.js