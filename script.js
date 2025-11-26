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
const clearInputBtn = document.getElementById('clearInputBtn');
const resultsArea = document.getElementById('resultsArea');
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
const keyIPQS = document.getElementById('keyIPQS');
const keyIPinfo = document.getElementById('keyIPinfo');
const userScam = document.getElementById('userScam');
const keyScam = document.getElementById('keyScam');
const keyProxyCheck = document.getElementById('keyProxyCheck');
const settingsBackdrop = document.getElementById('settingsBackdrop');
const settingsContent = document.getElementById('settingsContent');

// State
let searchHistory = JSON.parse(localStorage.getItem('ip_check_history')) || [];
let selectedHistoryIds = new Set();
let apiKeys = JSON.parse(localStorage.getItem('ip_check_api_keys')) || {
    ipqs: '',
    ipinfo: '',
    scamUser: '',
    scamKey: '',
    proxyCheck: ''
};

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    renderHistory();
    loadSettingsUI();
});

// Event Listeners
checkBtn.addEventListener('click', handleCheck);

if (clearInputBtn) {
    clearInputBtn.addEventListener('click', () => {
        ipInput.value = '';
        ipInput.focus();
        showToast('输入框已清空', 'info');
    });
}

if (clearHistory) {
    clearHistory.addEventListener('click', clearHistory);
}

if (exportBtn) {
    exportBtn.addEventListener('click', exportData);
}

if (copyCsvBtn) {
    copyCsvBtn.addEventListener('click', copyHistoryToClipboard);
}

historyToggle.addEventListener('click', toggleSidebar);
closeHistory.addEventListener('click', closeSidebar);

// 修复点1：只在点击遮罩层本身时关闭，防止冒泡误触
if (sidebarOverlay) {
    sidebarOverlay.addEventListener('click', (e) => {
        if (e.target === sidebarOverlay) {
            closeSidebar();
        }
    });
}

// Settings Events
settingsToggle.addEventListener('click', openSettings);
closeSettings.addEventListener('click', closeSettingsModal);
settingsBackdrop.addEventListener('click', closeSettingsModal);
saveSettingsBtn.addEventListener('click', saveSettings);

// 修复：配置清除按钮 (使用双击确认模式，避免原生 confirm 被拦截)
if (clearSettingsBtn) {
    clearSettingsBtn.addEventListener('click', (e) => {
        const btn = e.currentTarget;
        if (btn.dataset.confirming === 'true') {
            // === 执行清除 ===
            keyIPQS.value = '';
            keyIPinfo.value = '';
            userScam.value = '';
            keyScam.value = '';
            keyProxyCheck.value = '';

            // 重置按钮状态
            btn.dataset.confirming = 'false';
            btn.innerHTML = '<i class="ph-bold ph-eraser"></i> 清除配置';
            btn.classList.remove('text-red-600', 'bg-red-100');
            btn.classList.add('text-red-400', 'hover:bg-red-400/10');

            showToast('配置已清除 (需点击保存以生效)', 'success');
        } else {
            // === 进入确认状态 ===
            btn.dataset.confirming = 'true';
            btn.innerHTML = '<i class="ph-bold ph-warning"></i> 再次点击确认';
            btn.classList.remove('text-red-400', 'hover:bg-red-400/10');
            btn.classList.add('text-red-600', 'bg-red-100');

            setTimeout(() => {
                if (btn.dataset.confirming === 'true') {
                    btn.dataset.confirming = 'false';
                    btn.innerHTML = '<i class="ph-bold ph-eraser"></i> 清除配置';
                    btn.classList.remove('text-red-600', 'bg-red-100');
                    btn.classList.add('text-red-400', 'hover:bg-red-400/10');
                }
            }, 3000);
        }
    });
}

// 修复方案：放弃原生 confirm，改用按钮内二次确认
if (clearHistory) {
    clearHistory.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();

        const btn = e.currentTarget;

        // 检查按钮当前是否处于"待确认"状态
        if (btn.dataset.confirming === 'true') {
            // === 第二次点击：执行删除 ===
            searchHistory = [];
            selectedHistoryIds.clear();
            saveHistory();
            renderHistory();

            // 恢复按钮到初始状态
            resetClearButton(btn);
            showToast('历史记录已清空', 'success');
        } else {
            // === 第一次点击：进入确认状态 ===
            btn.dataset.confirming = 'true';

            // 改变样式为红色警示
            btn.innerHTML = '<i class="ph-bold ph-warning"></i> 再次点击确认';
            btn.classList.remove('text-red-400', 'hover:bg-red-400/10'); // 移除旧样式
            btn.classList.add('bg-red-600', 'text-white', 'hover:bg-red-700'); // 添加醒目样式

            // 设置 3 秒倒计时，如果不点就自动恢复
            setTimeout(() => {
                // 只有当按钮还在"待确认"状态时才恢复，防止已被删除逻辑重置
                if (btn.dataset.confirming === 'true') {
                    resetClearButton(btn);
                }
            }, 3000);
        }
    });
}

// 辅助函数：恢复清空按钮样式
function resetClearButton(btn) {
    btn.dataset.confirming = 'false';
    btn.innerText = '清空历史'; // 或者恢复之前的图标

    // 恢复回原本的幽灵按钮样式
    btn.classList.remove('bg-red-600', 'text-white', 'hover:bg-red-700');
    btn.classList.add('text-red-400', 'hover:bg-red-400/10');
}

// --- Settings Logic ---

function loadSettingsUI() {
    keyIPQS.value = apiKeys.ipqs || '';
    keyIPinfo.value = apiKeys.ipinfo || '';
    userScam.value = apiKeys.scamUser || '';
    keyScam.value = apiKeys.scamKey || '';
    keyProxyCheck.value = apiKeys.proxyCheck || '';
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
        scamKey: keyScam.value.trim(),
        proxyCheck: keyProxyCheck.value.trim()
    };
    localStorage.setItem('ip_check_api_keys', JSON.stringify(apiKeys));

    // Visual Feedback
    const originalText = saveSettingsBtn.innerText;
    saveSettingsBtn.innerText = '已保存!';
    saveSettingsBtn.classList.add('bg-green-600');
    showToast('API 配置已保存', 'success');

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
        const url = `${PROXY_BASE}/scamalytics?user=${apiKeys.scamUser}&key=${apiKeys.scamKey}&ip=${ip}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Scamalytics Request Failed');
        return await response.json();
    } catch (e) {
        console.warn('Scamalytics Error:', e);
        return { error: e.message };
    }
}

async function fetchProxyCheck(ip) {
    if (!apiKeys.proxyCheck) return null;
    try {
        const response = await fetch(`${PROXY_BASE}/proxycheck`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ip: ip, api_key: apiKeys.proxyCheck })
        });
        if (!response.ok) throw new Error('ProxyCheck Request Failed');
        return await response.json();
    } catch (e) {
        console.warn('ProxyCheck Error:', e);
        return { error: e.message };
    }
}

// --- Validation Logic ---

function isValidIP(ip) {
    // IPv4 Regex
    const ipv4Pattern = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    // IPv6 Regex
    const ipv6Pattern = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;

    return ipv4Pattern.test(ip) || ipv6Pattern.test(ip);
}

// --- Main Logic ---

async function handleCheck() {
    const rawInput = ipInput.value.trim();
    if (!rawInput) {
        showToast('请输入 IP 地址', 'error');
        return;
    }

    // Input Validation & Filtering
    const rawList = rawInput.split(/[\n,]+/).map(ip => ip.trim()).filter(ip => ip);
    const validIPs = [];
    const invalidIPs = [];

    rawList.forEach(ip => {
        if (isValidIP(ip)) {
            validIPs.push(ip);
        } else {
            invalidIPs.push(ip);
        }
    });

    if (validIPs.length === 0) {
        showToast('请输入有效的 IPv4 或 IPv6 地址', 'error');
        return;
    }

    if (invalidIPs.length > 0) {
        showToast(`已自动过滤 ${invalidIPs.length} 个无效格式 IP`, 'info');
    }

    // Loading State
    const originalBtnContent = checkBtn.innerHTML;
    checkBtn.innerHTML = `<i class="ph-bold ph-spinner animate-spin"></i> 正在检测...`;
    checkBtn.disabled = true;

    try {
        // Check if any keys are missing
        const missingKeys = [];
        if (!apiKeys.ipqs) missingKeys.push('IPQualityScore');
        if (!apiKeys.ipinfo) missingKeys.push('IPinfo');
        if (!apiKeys.scamUser || !apiKeys.scamKey) missingKeys.push('Scamalytics');
        if (!apiKeys.proxyCheck) missingKeys.push('ProxyCheck.io');

        if (missingKeys.length === 4) {
            showToast('未配置任何 API Key，将使用模拟数据演示', 'info');
        }

        const results = [];

        for (const ip of validIPs) {
            // Parallel Fetch
            const [ipqsRes, ipinfoRes, scamRes, proxyCheckRes] = await Promise.allSettled([
                fetchIPQS(ip),
                fetchIPinfo(ip),
                fetchScamalytics(ip),
                fetchProxyCheck(ip)
            ]);

            const dataIPQS = ipqsRes.status === 'fulfilled' ? ipqsRes.value : null;
            const dataIPinfo = ipinfoRes.status === 'fulfilled' ? ipinfoRes.value : null;
            const dataScam = scamRes.status === 'fulfilled' ? scamRes.value : null;
            const dataProxyCheck = proxyCheckRes.status === 'fulfilled' ? proxyCheckRes.value : null;

            // Analyze & Merge Data
            const analyzed = analyzeData(ip, dataIPQS, dataIPinfo, dataScam, dataProxyCheck);
            results.push(analyzed);
        }

        renderResults(results);
        addToHistory(validIPs, results);

    } catch (error) {
        console.error("检测IP时发生错误:", error);
        showToast('检测服务连接失败，请检查后端或网络', 'error');
    } finally {
        checkBtn.innerHTML = originalBtnContent;
        checkBtn.disabled = false;
    }
}

function analyzeData(ip, ipqs, ipinfo, scam, proxyCheck) {
    // 1. Determine Location
    let location = '未知位置';
    if (ipqs && ipqs.success) {
        location = `${ipqs.country_code || ''} ${ipqs.city || ''} ${ipqs.region || ''}`.trim();
    } else if (ipinfo && !ipinfo.error) {
        location = `${ipinfo.country || ''} ${ipinfo.city || ''} ${ipinfo.region || ''}`.trim();
    } else if (proxyCheck && proxyCheck[ip]) {
        location = `${proxyCheck[ip].iso || ''} ${proxyCheck[ip].city || ''} ${proxyCheck[ip].region || ''}`.trim();
    } else if (scam && scam.ip) {
        location = `${scam.country || ''}`;
    }

    // 2. Determine ASN/ISP
    let asn = '未知 ISP';
    if (ipqs && ipqs.success) asn = ipqs.ISP || ipqs.ASN || asn;
    else if (ipinfo && !ipinfo.error) asn = ipinfo.org || asn;
    else if (proxyCheck && proxyCheck[ip]) asn = proxyCheck[ip].provider || proxyCheck[ip].asn || asn;
    else if (scam && scam.ip) asn = scam.isp || asn;

    // 3. Determine Type (Refined Logic)
    let type = '未知类型';

    // Data Extraction
    const pc = (proxyCheck && proxyCheck[ip]) ? proxyCheck[ip] : null;
    const pcType = pc ? (pc.type || 'unknown') : null;
    const isPcProxy = pc ? (pc.proxy === 'yes') : false;
    const isIpqsProxy = (ipqs && ipqs.success) ? (ipqs.proxy || ipqs.vpn || ipqs.tor || ipqs.active_vpn) : false;

    // Priority 1: ProxyCheck Type
    if (pcType && pcType !== 'unknown') {
        const typeMap = {
            'Residential': '🏠 住宅宽带',
            'Wireless': '📱 移动网络',
            'Business': '🏢 商业/专线',
            'Hosting': '❌ 机房/托管',
            'ISP': '🌐 固网宽带',
            'VPN': '❌ VPN',
            'Education': '⚠️ 教育网'
        };
        type = typeMap[pcType] || pcType;
    }
    // Priority 2: Fallback to IPQS/IPinfo
    else if (ipqs && ipqs.success) {
        if (ipqs.mobile) type = '📱 移动网络';
        else if (ipqs.proxy || ipqs.vpn || ipqs.tor || ipqs.active_vpn) type = '❌ 代理/VPN';
        else type = '🌐 ISP/宽带';
    } else if (ipinfo && !ipinfo.error && ipinfo.privacy) {
        if (ipinfo.privacy.vpn) type = '❌ VPN';
        else if (ipinfo.privacy.proxy) type = '❌ 代理';
        else if (ipinfo.privacy.hosting) type = '❌ 数据中心';
    }

    // Append Risk Context
    if ((isIpqsProxy || isPcProxy) && !type.includes('机房') && !type.includes('代理') && !type.includes('VPN') && !type.includes('托管')) {
        type += ' (疑似代理)';
    }

    // 4. Calculate Fraud Score
    let fraudScore = 0;
    if (ipqs && ipqs.success) fraudScore = Math.max(fraudScore, ipqs.fraud_score || 0);
    if (scam && scam.score) fraudScore = Math.max(fraudScore, scam.score || 0);
    if (pc && pc.risk) fraudScore = Math.max(fraudScore, parseInt(pc.risk) || 0);

    if (isPcProxy || isIpqsProxy) {
        fraudScore = Math.max(fraudScore, 85);
    }

    if (!ipqs && !ipinfo && !scam && !pc) {
        fraudScore = getRandomScore();
    }

    const { label, color, bg } = getRiskLevel(fraudScore);

    // 5. TikTok Quality Assessment
    const quality = {
        isValid: !!(ipqs || ipinfo || scam || pc),
        isDatacenter: type.includes('机房') || type.includes('Hosting') || type.includes('数据中心'),
        isMobile: type.includes('移动') || type.includes('Wireless') || (ipqs && ipqs.mobile),
        hasRecentAbuse: (ipqs && ipqs.recent_abuse === true) || (pc && pc.risk > 50),
        isCrawler: (ipqs && ipqs.bot_status) || (ipinfo && ipinfo.privacy && ipinfo.privacy.crawler),
        isBlacklisted: (ipqs && ipqs.blacklisted) || (scam && scam.score > 75),
        ispRisk: 'low',
        specialService: [],
        verdict: '未知',
        providerName: asn
    };

    if (quality.isDatacenter) quality.ispRisk = 'high';
    else if (fraudScore > 75) quality.ispRisk = 'high';
    else if (fraudScore > 30) quality.ispRisk = 'medium';

    if (ipinfo && ipinfo.privacy && ipinfo.privacy.tor) quality.specialService.push('Tor');
    if (ipinfo && ipinfo.privacy && ipinfo.privacy.relay) quality.specialService.push('Relay');

    if (pcType === 'Business' && !isPcProxy) {
        quality.verdict = '⚠️ 商业 IP (需养号)';
        quality.isDatacenter = false;
    } else if ((pcType === 'Residential' || pcType === 'Wireless') && !isPcProxy) {
        quality.verdict = '✅ 适合 TikTok';
        quality.isDatacenter = false;
    } else if (pcType === 'Hosting' || isPcProxy || isIpqsProxy) {
        quality.verdict = '❌ 禁止使用 (机房/代理)';
        quality.isDatacenter = true;
    } else {
        quality.verdict = quality.isDatacenter ? '❌ 不推荐' : '✅ 看起来良好';
    }

    // ==========================================
    // [新增] 手动清洗 IPQS 免费版的无效提示字段
    // ==========================================
    if (ipqs) {
        // 如果 abuse_events 包含 "Enterprise plan..."，直接删除该字段
        if (ipqs.abuse_events && Array.isArray(ipqs.abuse_events) && ipqs.abuse_events[0] && ipqs.abuse_events[0].includes('Enterprise')) {
            delete ipqs.abuse_events;
        }
        // 如果 abuse_velocity 包含 "Premium"，直接删除
        if (ipqs.abuse_velocity && typeof ipqs.abuse_velocity === 'string' && ipqs.abuse_velocity.includes('Premium')) {
            delete ipqs.abuse_velocity;
        }
    }

    return {
        ip,
        location,
        asn,
        type,
        fraudScore,
        riskLabel: label,
        riskColor: color,
        riskBg: bg,
        quality,
        rawData: {
            ipqs: ipqs,
            ipinfo: ipinfo,
            scamalytics: scam,
            proxycheck: pc
        }
    };
}

function renderResults(results) {
    resultsArea.innerHTML = '';

    results.forEach(data => {
        const card = document.createElement('div');
        card.className = 'glass-panel rounded-xl p-6 animate-[fadeIn_0.5s_ease-out]';

        // Check if we have real data or mock
        const isMock = !data.rawData.ipqs && !data.rawData.ipinfo && !data.rawData.scamalytics && !data.rawData.proxycheck;
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
                        <span class="text-xs px-2 py-0.5 rounded ${data.rawData.proxycheck && !data.rawData.proxycheck.error ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}">PC.io</span>
                    </div>
                </div>
            </div>
            
            <!-- IP Quality Assessment for TikTok -->
            <div class="mt-6 p-4 bg-gradient-to-br from-purple-900/20 to-blue-900/20 rounded-lg border border-purple-500/30">
                <h4 class="text-sm font-bold text-purple-300 mb-3 flex items-center gap-2">
                    <i class="ph-fill ph-shield-check"></i> IP质量评估 (TikTok运营专用)
                </h4>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <!-- TikTok Verdict -->
                    <div class="flex items-center gap-2 text-xs col-span-2 md:col-span-4 mb-2">
                        <span class="px-3 py-1.5 rounded-md font-bold text-sm bg-white/10 border border-white/20 text-white w-full text-center">
                            结论: ${data.quality.verdict}
                        </span>
                    </div>

                    ${data.quality && data.quality.isValid ? `
                        <div class="flex items-center gap-2 text-xs">
                            ${data.quality.isDatacenter
                    ? '<span class="px-2 py-1 rounded bg-red-500/20 text-red-400">❌ 数据中心</span>'
                    : '<span class="px-2 py-1 rounded bg-green-500/20 text-green-400">✅ 住宅/物理</span>'
                }
                        </div>
                        <div class="flex items-center gap-2 text-xs">
                            ${data.quality.isMobile
                    ? '<span class="px-2 py-1 rounded bg-green-500/20 text-green-400">📱 移动网络</span>'
                    : '<span class="px-2 py-1 rounded bg-gray-500/20 text-gray-400">🏢 固网</span>'
                }
                        </div>
                        <div class="flex items-center gap-2 text-xs">
                            ${data.quality.hasRecentAbuse
                    ? '<span class="px-2 py-1 rounded bg-red-500/20 text-red-400">⚠️ 有滥用</span>'
                    : '<span class="px-2 py-1 rounded bg-green-500/20 text-green-400">✅ 无滥用</span>'
                }
                        </div>
                        <div class="flex items-center gap-2 text-xs">
                            ${data.quality.isBlacklisted
                    ? '<span class="px-2 py-1 rounded bg-red-500/20 text-red-400">🔴 已列黑名单</span>'
                    : '<span class="px-2 py-1 rounded bg-green-500/20 text-green-400">✅ 未列黑名单</span>'
                }
                        </div>
                        <div class="flex items-center gap-2 text-xs">
                            <span class="px-2 py-1 rounded ${data.quality.ispRisk === 'low' ? 'bg-green-500/20 text-green-400' :
                    data.quality.ispRisk === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                        data.quality.ispRisk === 'high' ? 'bg-red-500/20 text-red-400' :
                            'bg-gray-500/20 text-gray-400'
                }">ISP风险: ${data.quality.ispRisk}</span>
                        </div>
                        ${data.quality.specialService.length > 0 ? `
                            <div class="flex items-center gap-2 text-xs col-span-2">
                                <span class="px-2 py-1 rounded bg-blue-500/20 text-blue-400">☁️ ${data.quality.specialService.join(', ')}</span>
                            </div>
                        ` : ''}
                    ` : `
                        <div class="flex items-center gap-2 text-xs col-span-full">
                            <span class="px-3 py-2 rounded bg-red-500/20 text-red-400 border border-red-500/30">⚠️ 质量数据不可用 - API请求失败或服务器未启动</span>
                        </div>
                    `}
                </div>
            </div>
            
            <!-- Raw Data Toggle (Optional) -->
            <div class="mt-4 pt-4 border-t border-white/5">
                <details class="group">
                    <summary class="flex items-center gap-2 text-xs text-gray-500 cursor-pointer hover:text-brand-400 transition-colors">
                        <i class="ph-bold ph-code"></i> 查看原始 API 响应
                        <i class="ph-bold ph-caret-down group-open:rotate-180 transition-transform"></i>
                    </summary>
                    <pre class="mt-2 p-4 bg-dark-900 rounded-lg text-xs text-gray-400 font-mono overflow-auto max-h-64 border border-white/5 custom-scrollbar">${JSON.stringify(data.rawData, null, 2)}</pre>
                </details>
            </div>
        `;
        resultsArea.appendChild(card);
    });
}

// --- History Management ---

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

        const contentWrapper = document.createElement('div');
        contentWrapper.className = 'flex-1 flex items-center justify-between gap-2';

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
            renderResults(item.results);
        });

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'text-gray-400 hover:text-red-400 transition-colors p-1';
        deleteBtn.innerHTML = '<i class="ph-bold ph-trash text-lg"></i>';
        deleteBtn.dataset.confirming = 'false';

        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();

            const btn = e.currentTarget;

            if (btn.dataset.confirming === 'true') {
                const index = searchHistory.findIndex(h => h.id === item.id);
                if (index !== -1) {
                    searchHistory.splice(index, 1);
                    selectedHistoryIds.delete(item.id);
                    saveHistory();
                    renderHistory();
                    showToast('已删除该历史记录', 'success');
                }
            } else {
                btn.dataset.confirming = 'true';
                btn.classList.remove('text-gray-400', 'hover:text-red-400');
                btn.classList.add('text-red-500');

                setTimeout(() => {
                    if (btn.dataset.confirming === 'true') {
                        btn.dataset.confirming = 'false';
                        btn.classList.remove('text-red-500');
                        btn.classList.add('text-gray-400', 'hover:text-red-400');
                    }
                }, 3000);
            }
        });

        contentWrapper.appendChild(content);
        contentWrapper.appendChild(deleteBtn);

        div.appendChild(checkbox);
        div.appendChild(contentWrapper);
        historyList.appendChild(div);
    });
}

function exportData() {
    if (selectedHistoryIds.size === 0) {
        showToast('请先勾选需要导出的历史记录', 'info');
        return;
    }

    // Safety Check: SheetJS library
    if (typeof XLSX === 'undefined') {
        showToast('导出失败：Excel 组件(SheetJS) 未加载，请检查网络', 'error');
        return;
    }

    try {
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
                        "结论": res.quality ? res.quality.verdict : '未知',
                        "原始数据": JSON.stringify(res.rawData || {})
                    });
                });
            }
        });

        const ws = XLSX.utils.json_to_sheet(exportRows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "IP检测报告");
        XLSX.writeFile(wb, `IP_Report_${Date.now()}.xlsx`);

        showToast('导出成功！', 'success');

    } catch (error) {
        console.error("Export Error:", error);
        showToast('导出过程中发生错误', 'error');
    }
}

// Copy History to Clipboard as CSV
function copyHistoryToClipboard() {
    if (selectedHistoryIds.size === 0) {
        showToast('请先勾选需要复制的记录', 'info');
        return;
    }

    try {
        const selectedItems = searchHistory.filter(item => selectedHistoryIds.has(item.id));

        // Build CSV Header
        let csvContent = "查询时间,IP地址,地理位置,ASN,网络类型,欺诈评分,风险等级,结论\n";

        // Build CSV Rows
        selectedItems.forEach(item => {
            if (item.results) {
                item.results.forEach(res => {
                    const line = [
                        item.time,
                        res.ip,
                        `"${res.location}"`, // Quote to handle commas
                        res.asn || '未知',
                        res.type || '未知',
                        res.fraudScore || '0',
                        res.riskLabel || '未知',
                        res.quality ? res.quality.verdict : '未知'
                    ].join(",");
                    csvContent += line + "\n";
                });
            }
        });

        // Write to Clipboard
        navigator.clipboard.writeText(csvContent).then(() => {
            showToast('已复制 CSV 数据！可直接粘贴到 Excel', 'success');
        }).catch(err => {
            console.error('Clipboard Error:', err);
            showToast('复制失败，请检查浏览器剪贴板权限', 'error');
        });

    } catch (error) {
        console.error('CSV Generation Error:', error);
        showToast('生成 CSV 时发生错误', 'error');
    }
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

// --- Toast Notification System ---
function showToast(message, type = 'error') {
    const toast = document.createElement('div');

    let iconClass, bgColor;
    if (type === 'error') {
        iconClass = 'ph-warning-circle';
        bgColor = 'bg-red-500/90';
    } else if (type === 'success') {
        iconClass = 'ph-check-circle';
        bgColor = 'bg-green-500/90';
    } else if (type === 'info') {
        iconClass = 'ph-info';
        bgColor = 'bg-blue-500/90';
    }

    toast.className = `fixed top-4 left-1/2 -translate-x-1/2 z-[100] ${bgColor} text-white backdrop-blur-md border border-white/20 rounded-lg shadow-2xl px-6 py-3 font-medium flex items-center gap-2 animate-[fadeIn_0.3s_ease-out]`;

    toast.innerHTML = `
        <i class="ph-bold ${iconClass} text-xl"></i>
        <span>${message}</span>
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s ease-out';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}