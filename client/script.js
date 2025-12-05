// Global Version Constant
const APP_VERSION = '2.2.0';

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
    // Version watermark for debugging
    console.log(`IP Intelligence v${APP_VERSION} initialized`);
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
            btn.innerHTML = '<i class="fas fa-eraser"></i> 清除配置';
            btn.classList.remove('text-red-600', 'bg-red-100');
            btn.classList.add('text-red-400', 'hover:bg-red-400/10');

            showToast('配置已清除 (需点击保存以生效)', 'success');
        } else {
            // === 进入确认状态 ===
            btn.dataset.confirming = 'true';
            btn.innerHTML = '<i class="fas fa-exclamation-triangle"></i> 再次点击确认';
            btn.classList.remove('text-red-400', 'hover:bg-red-400/10');
            btn.classList.add('text-red-600', 'bg-red-100');

            setTimeout(() => {
                if (btn.dataset.confirming === 'true') {
                    btn.dataset.confirming = 'false';
                    btn.innerHTML = '<i class="fas fa-eraser"></i> 清除配置';
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
            btn.innerHTML = '<i class="fas fa-exclamation-triangle"></i> 再次点击确认';
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
        // Ensure backdrop is clickable
        settingsBackdrop.style.pointerEvents = 'auto';
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



async function fetchIPQS(ip) {
    if (!apiKeys.ipqs) return null;
    try {
        const targetUrl = `https://www.ipqualityscore.com/api/json/ip/${apiKeys.ipqs}/${ip}`;
        const url = `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`;
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
        const url = `https://ipinfo.io/${ip}?token=${apiKeys.ipinfo}`;
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
        const targetUrl = `https://api11.scamalytics.com/${apiKeys.scamUser}/?key=${apiKeys.scamKey}&ip=${ip}`;
        const url = `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`;
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
        const targetUrl = `http://proxycheck.io/v2/${ip}?key=${apiKeys.proxyCheck}&vpn=1&asn=1&risk=1&info=1`;
        const url = `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`;
        const response = await fetch(url);
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
    checkBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> 正在检测...`;
    checkBtn.disabled = true;

    // 初始化：清空UI
    resultsArea.innerHTML = '';

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
                finalScore: 0,
                finalVerdict: '',
                rawData: {
                    ipqs: null,
                    ipinfo: null,
                    scamalytics: null,
                    proxycheck: null
                }
            };

            try {
                // Layer 1: 基建层 - 并行请求
                result = await executeLayer1(ip, result);
                if (result.status === 'FAIL') {
                    // 即使失败，也需要进行最终判定
                    result = determineFinalVerdict(result);
                    results.push(result);
                    continue;
                }

                // Layer 2: 信誉层
                result = await executeLayer2(ip, result);
                if (result.status === 'WARN') {
                    // 即使警告，也需要进行最终判定
                    result = determineFinalVerdict(result);
                    results.push(result);
                    continue;
                }

                // Layer 3: 终审层
                result = await executeLayer3(ip, result);

            } catch (error) {
                console.error(`IP ${ip} 检测失败:`, error);
                result.status = 'ERROR';
                result.message = `检测失败: ${error.message}`;
            }

            // 最终判定
            result = determineFinalVerdict(result);
            results.push(result);
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

// Layer 1: 基建层 - 并行请求IPinfo和ProxyCheck.io
async function executeLayer1(ip, result) {
    try {
        // 并行请求
        const [ipinfoRes, proxyCheckRes] = await Promise.allSettled([
            fetchIPinfo(ip),
            fetchProxyCheck(ip)
        ]);

        const dataIPinfo = ipinfoRes.status === 'fulfilled' ? ipinfoRes.value : null;
        const dataProxyCheck = proxyCheckRes.status === 'fulfilled' ? proxyCheckRes.value : null;

        result.rawData.ipinfo = dataIPinfo;
        result.rawData.proxycheck = dataProxyCheck;

        // 熔断判定
        // 1. Check ProxyCheck.io result
        if (dataProxyCheck && dataProxyCheck[ip]) {
            const pcData = dataProxyCheck[ip];
            const pcType = pcData.type || '';
            if (['VPN', 'Proxy', 'Hosting'].includes(pcType)) {
                result.status = 'FAIL';
                result.message = `Layer 1 熔断: 检测到 ${pcType}`;
                return result;
            } else if (pcType === 'Business') {
                // Business类型IP继续检测，但标记为WARN
                result.status = 'WARN';
                result.layers.layer1.status = 'WARN';
                result.layers.layer1.specialType = 'Business';
                result.layers.layer1.specialMessage = '检测到商业IP';
                result.layers.layer1.riskLevel = 'medium';
            }
        }

        // 2. Check IPinfo result
        if (dataIPinfo && !dataIPinfo.error && dataIPinfo.org) {
            const isp = dataIPinfo.org.toLowerCase();
            const cloudVendors = ['google', 'amazon', 'aws', 'cloudflare'];
            if (cloudVendors.some(vendor => isp.includes(vendor))) {
                result.status = 'FAIL';
                result.message = `Layer 1 熔断: 检测到云厂商 ${isp}`;
                return result;
            }
        }

        result.layers.layer1.status = 'PASS';
        result.layers.layer1.data = { ipinfo: dataIPinfo, proxycheck: dataProxyCheck };
        return result;

    } catch (error) {
        console.error(`Layer 1 检测失败 (${ip}):`, error);
        result.status = 'ERROR';
        result.message = `Layer 1 检测失败: ${error.message}`;
        return result;
    }
}

// Layer 2: 信誉层 - Scamalytics
async function executeLayer2(ip, result) {
    try {
        const scamRes = await fetchScamalytics(ip);
        result.rawData.scamalytics = scamRes;

        // 熔断判定
        if (scamRes && scamRes.score && scamRes.score > 40) {
            result.status = 'WARN';
            result.message = `Layer 2 熔断: Scamalytics 评分 ${scamRes.score} > 40`;
            result.layers.layer2.status = 'WARN';
            result.layers.layer2.data = scamRes;
            return result;
        }

        result.layers.layer2.status = 'PASS';
        result.layers.layer2.data = scamRes;
        return result;

    } catch (error) {
        console.error(`Layer 2 检测失败 (${ip}):`, error);
        result.status = 'ERROR';
        result.message = `Layer 2 检测失败: ${error.message}`;
        return result;
    }
}

// Layer 3: 终审层 - IPQualityScore with caching
async function executeLayer3(ip, result) {
    try {
        // 缓存检查
        const cacheKey = `ipqs_v2_${ip}`;
        const cachedData = localStorage.getItem(cacheKey);
        const now = Date.now();
        let dataIPQS = null;

        if (cachedData) {
            const parsedCache = JSON.parse(cachedData);
            if (now - parsedCache.timestamp < 24 * 60 * 60 * 1000) {
                // 缓存未过期
                dataIPQS = parsedCache.data;
                result.layers.layer3.data = { ...dataIPQS, fromCache: true };
            }
        }

        // 无缓存或已过期，发起请求
        if (!dataIPQS) {
            const ipqsRes = await fetchIPQS(ip);
            if (ipqsRes && !ipqsRes.error) {
                dataIPQS = ipqsRes;
                // 写入缓存
                localStorage.setItem(cacheKey, JSON.stringify({
                    data: dataIPQS,
                    timestamp: now
                }));
            }
            result.layers.layer3.data = { ...dataIPQS, fromCache: false };
        }

        result.rawData.ipqs = dataIPQS;
        result.layers.layer3.status = 'PASS';
        return result;

    } catch (error) {
        console.error(`Layer 3 检测失败 (${ip}):`, error);
        result.status = 'ERROR';
        result.message = `Layer 3 检测失败: ${error.message}`;
        return result;
    }
}

// 最终判定
function determineFinalVerdict(result) {
    // 默认使用IPQS评分，如果IPQS不可用则使用Scamalytics
    let finalScore = 0;
    let finalVerdict = '';
    let riskLevel = { label: '低风险', color: 'text-green-400', bg: 'bg-green-400/10' };
    let hasValidScore = false;

    if (result.status === 'FAIL') {
        finalScore = 100;
        finalVerdict = '❌ 禁止使用';
        riskLevel = { label: '高风险', color: 'text-red-400', bg: 'bg-red-400/10' };
    } else {
        // 检查IPQS数据
        let ipqsScore = null;
        if (result.layers.layer3.data) {
            const ipqsData = result.layers.layer3.data;
            // 检查ipqsData.success，如果为false则视为N/A
            if (ipqsData && ipqsData.success !== false && ipqsData.fraud_score !== undefined) {
                ipqsScore = ipqsData.fraud_score;
                hasValidScore = true;
            }
        }
        
        // 检查Scamalytics数据
        let scamScore = null;
        if (result.rawData.scamalytics && result.rawData.scamalytics.score) {
            scamScore = result.rawData.scamalytics.score;
            hasValidScore = true;
        }
        
        // 计算最终分数：优先使用IPQS，否则使用Scamalytics，否则使用随机分数
        if (ipqsScore !== null) {
            finalScore = ipqsScore;
        } else if (scamScore !== null) {
            finalScore = scamScore;
        } else {
            finalScore = getRandomScore();
            hasValidScore = false;
        }
        
        riskLevel = getRiskLevel(finalScore);
        
        // 检查Layer 1状态和IP类型
        const isBusiness = result.layers.layer1.specialType === 'Business';
        const isResidential = result.rawData.proxycheck && result.rawData.proxycheck[result.ip] && result.rawData.proxycheck[result.ip].type === 'Residential';
        
        // 最终判定逻辑
        if (finalScore < 30) {
            if (isBusiness) {
                finalVerdict = '🟡 警告 (Business IP)';
                riskLevel = { label: '中风险', color: 'text-yellow-400', bg: 'bg-yellow-400/10' };
            } else if (isResidential) {
                finalVerdict = '🟢 通过';
                riskLevel = { label: '低风险', color: 'text-green-400', bg: 'bg-green-400/10' };
            } else {
                finalVerdict = '✅ 可以使用';
            }
        } else if (finalScore < 75) {
            finalVerdict = '⚠️ 需谨慎使用';
            riskLevel = { label: '中风险', color: 'text-yellow-400', bg: 'bg-yellow-400/10' };
        } else {
            finalVerdict = '❌ 禁止使用';
            riskLevel = { label: '高风险', color: 'text-red-400', bg: 'bg-red-400/10' };
        }
        
        if (!hasValidScore) {
            finalVerdict = '⚠️ 数据不足';
        }
    }

    result.finalScore = finalScore;
    result.finalVerdict = finalVerdict;
    result.riskLevel = riskLevel;
    
    // 构造兼容现有renderResults的数据结构
    result.fraudScore = finalScore;
    result.riskLabel = riskLevel.label;
    result.riskColor = riskLevel.color;
    result.riskBg = riskLevel.bg;
    
    // 填充基本信息
    const locationData = getLocationFromRawData(result.rawData, result.ip);
    result.location = locationData.location;
    result.countryConflict = locationData.countryConflict;
    result.asn = getAsnFromRawData(result.rawData, result.ip);
    result.type = getTypeFromRawData(result.rawData, result.ip);
    result.typeConfidence = 'medium';
    result.scoreSources = getScoreSources(result.rawData);
    result.scoreConfidence = 'medium';
    
    // 填充quality对象
    result.quality = {
        verdict: finalVerdict,
        isDatacenter: false,
        isMobile: false,
        hasRecentAbuse: false,
        isCrawler: false,
        isBlacklisted: false,
        ispRisk: finalScore < 30 ? 'low' : finalScore < 75 ? 'medium' : 'high',
        specialService: [],
        isValid: true,
        countryConflict: result.countryConflict,
        availableSources: {
            ipqs: !!result.rawData.ipqs,
            ipinfo: !!result.rawData.ipinfo,
            scamalytics: !!result.rawData.scamalytics,
            proxycheck: !!result.rawData.proxycheck
        }
    };
    
    // 检查是否为Business类型IP，添加特殊标记
    if (result.layers.layer1.specialType === 'Business') {
        if (result.quality.specialService) {
            result.quality.specialService.push('Business');
        } else {
            result.quality.specialService = ['Business'];
        }
    }
    
    return result;
}

// 辅助函数：从原始数据中提取位置信息
function getLocationFromRawData(rawData, ip) {
    let location = '';
    let country = '';
    let countryConflict = false;
    
    // 优先使用 ipinfo.city 和 ipinfo.region
    if (rawData.ipinfo && !rawData.ipinfo.error) {
        location = `${rawData.ipinfo.city || ''} ${rawData.ipinfo.region || ''}`.trim();
        country = rawData.ipinfo.country || '';
        
        // 检查国家归属地冲突
        if (rawData.proxycheck && rawData.proxycheck[ip]) {
            const proxycheckCountry = rawData.proxycheck[ip].isocode;
            if (proxycheckCountry && country && country !== proxycheckCountry) {
                countryConflict = true;
            }
        }
    } 
    // 备选方案：使用 proxycheck 数据
    else if (rawData.proxycheck && rawData.proxycheck[ip]) {
        location = `${rawData.proxycheck[ip].city || ''} ${rawData.proxycheck[ip].region || ''}`.trim();
        country = rawData.proxycheck[ip].isocode || '';
    }
    // 备选方案：使用 ipqs 数据
    else if (rawData.ipqs && rawData.ipqs.success) {
        location = `${rawData.ipqs.city || ''} ${rawData.ipqs.region || ''}`.trim();
        country = rawData.ipqs.country_code || '';
    }
    // 备选方案：使用 scamalytics 数据
    else if (rawData.scamalytics && rawData.scamalytics.ip) {
        location = `${rawData.scamalytics.country || ''}`;
        country = rawData.scamalytics.country || '';
    }
    
    const finalLocation = `${country} ${location}`.trim() || '未知位置';
    
    return {
        location: finalLocation,
        countryConflict: countryConflict
    };
}

// 辅助函数：从原始数据中提取ASN/ISP信息
function getAsnFromRawData(rawData, ip) {
    // 优先显示 ipinfo.org (通常更规范)
    if (rawData.ipinfo && !rawData.ipinfo.error && rawData.ipinfo.org) {
        return rawData.ipinfo.org;
    } else if (rawData.ipqs && rawData.ipqs.success) {
        return rawData.ipqs.ISP || rawData.ipqs.ASN || '未知 ISP';
    } else if (rawData.proxycheck && rawData.proxycheck[ip]) {
        return rawData.proxycheck[ip].provider || rawData.proxycheck[ip].asn || '未知 ISP';
    } else if (rawData.scamalytics && rawData.scamalytics.ip) {
        return rawData.scamalytics.isp || '未知 ISP';
    }
    return '未知 ISP';
}

// 辅助函数：从原始数据中提取IP类型
function getTypeFromRawData(rawData, ip) {
    if (rawData.proxycheck && rawData.proxycheck[ip]) {
        const type = rawData.proxycheck[ip].type || '';
        const typeMap = {
            'Residential': '🏠 住宅宽带',
            'Wireless': '📱 移动网络',
            'Business': '🏢 商业/专线',
            'Hosting': '❌ 机房/托管',
            'ISP': '🌐 固网宽带',
            'VPN': '❌ VPN',
            'Education': '⚠️ 教育网'
        };
        return typeMap[type] || '🌐 未知类型';
    } else if (rawData.ipqs && rawData.ipqs.success) {
        if (rawData.ipqs.mobile) return '📱 移动网络';
        else return '🌐 ISP/宽带';
    } else if (rawData.ipinfo && !rawData.ipinfo.error && rawData.ipinfo.privacy) {
        if (rawData.ipinfo.privacy.vpn) return '❌ VPN';
        else if (rawData.ipinfo.privacy.proxy) return '❌ 代理';
        else if (rawData.ipinfo.privacy.hosting) return '❌ 数据中心';
    }
    return '🌐 未知类型';
}

// 辅助函数：获取评分来源
function getScoreSources(rawData) {
    const sources = [];
    if (rawData.ipqs && rawData.ipqs.success) sources.push('IPQS');
    if (rawData.scamalytics && rawData.scamalytics.score) sources.push('Scamalytics');
    if (rawData.proxycheck) {
        const proxyCheckValues = Object.values(rawData.proxycheck);
        if (proxyCheckValues.length > 0 && proxyCheckValues[0] && proxyCheckValues[0].risk !== undefined) {
            sources.push('ProxyCheck');
        }
    }
    if (sources.length === 0) sources.push('Random (No Data)');
    return sources;
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
    let typeConfidence = 'low'; // 类型判断置信度：high/medium/low

    // Data Extraction
    const pc = (proxyCheck && proxyCheck[ip]) ? proxyCheck[ip] : null;
    const pcType = pc ? (pc.type || 'unknown') : null;
    const isPcProxy = pc ? (pc.proxy === 'yes') : false;
    const isIpqsProxy = (ipqs && ipqs.success) ? (ipqs.proxy || ipqs.vpn || ipqs.tor || ipqs.active_vpn) : false;

    // Priority 1: ProxyCheck Type (High Confidence)
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
        typeConfidence = 'high';
    }
    // Priority 2: IPQS Data (Medium Confidence)
    else if (ipqs && ipqs.success) {
        if (ipqs.mobile) {
            type = '📱 移动网络';
            typeConfidence = 'medium';
        } else if (ipqs.proxy || ipqs.vpn || ipqs.tor || ipqs.active_vpn) {
            type = '❌ 代理/VPN';
            typeConfidence = 'medium';
        } else {
            type = '🌐 ISP/宽带';
            typeConfidence = 'medium';
        }
    }
    // Priority 3: IPinfo Privacy Data (Medium Confidence)
    else if (ipinfo && !ipinfo.error && ipinfo.privacy) {
        if (ipinfo.privacy.vpn) {
            type = '❌ VPN';
            typeConfidence = 'medium';
        } else if (ipinfo.privacy.proxy) {
            type = '❌ 代理';
            typeConfidence = 'medium';
        } else if (ipinfo.privacy.hosting) {
            type = '❌ 数据中心';
            typeConfidence = 'medium';
        }
    }
    // Priority 4: Default (Low Confidence)
    else {
        type = '🌐 未知类型';
        typeConfidence = 'low';
    }

    // Append Risk Context
    if ((isIpqsProxy || isPcProxy) && !type.includes('机房') && !type.includes('代理') && !type.includes('VPN') && !type.includes('托管')) {
        type += ' (疑似代理)';
        typeConfidence = Math.min(typeConfidence, 'medium');
    }

    // 4. Calculate Fraud Score
    let fraudScore = 0;
    let scoreSources = [];
    let scoreConfidence = 'low'; // 评分置信度：high/medium/low/very_low
    
    // Count actual score sources
    let actualScoreSources = 0;
    
    if (ipqs && ipqs.success) {
        fraudScore = Math.max(fraudScore, ipqs.fraud_score || 0);
        scoreSources.push('IPQS');
        actualScoreSources++;
    }
    if (scam && scam.score) {
        fraudScore = Math.max(fraudScore, scam.score || 0);
        scoreSources.push('Scamalytics');
        actualScoreSources++;
    }
    if (pc && pc.risk) {
        fraudScore = Math.max(fraudScore, parseInt(pc.risk) || 0);
        scoreSources.push('ProxyCheck');
        actualScoreSources++;
    }

    if (isPcProxy || isIpqsProxy) {
        fraudScore = Math.max(fraudScore, 85);
        scoreSources.push('Proxy Detection');
        actualScoreSources++;
    }

    // Determine score confidence based on number of sources
    if (actualScoreSources >= 2) {
        scoreConfidence = 'high';
    } else if (actualScoreSources === 1) {
        scoreConfidence = 'medium';
    } else if (!ipqs && !ipinfo && !scam && !pc) {
        // Only use random score as absolute last resort, and mark it clearly
        fraudScore = getRandomScore();
        scoreSources.push('Random (No Data)');
        scoreConfidence = 'very_low';
    } else {
        // No actual score data, but we have some other data
        scoreConfidence = 'low';
    }

    const { label, color, bg } = getRiskLevel(fraudScore);

    // 5. TikTok Quality Assessment
    // Track which data sources are available
    const availableSources = {
        ipqs: !!(ipqs && ipqs.success),
        ipinfo: !!(ipinfo && !ipinfo.error),
        scamalytics: !!(scam && scam.status === 'ok'),
        proxycheck: !!(pc)
    };
    
    // Count available sources
    const sourceCount = Object.values(availableSources).filter(Boolean).length;
    
    // Calculate confidence level for each quality attribute
    const isDatacenterConfidence = type.includes('机房') || type.includes('数据中心') ? 'high' : (sourceCount >= 2 ? 'medium' : 'low');
    const isMobileConfidence = type.includes('移动') || type.includes('Wireless') ? 'high' : (ipqs && ipqs.success ? 'medium' : 'low');
    const hasRecentAbuseConfidence = (ipqs && ipqs.recent_abuse === true) || (pc && pc.risk > 50) ? 'high' : (sourceCount >= 2 ? 'medium' : 'low');
    const isCrawlerConfidence = (ipqs && ipqs.bot_status) || (ipinfo && ipinfo.privacy && ipinfo.privacy.crawler) ? 'high' : 'low';
    const isBlacklistedConfidence = (ipqs && ipqs.blacklisted) || (scam && scam.score > 75) ? 'high' : (sourceCount >= 2 ? 'medium' : 'low');
    
    const quality = {
        isValid: sourceCount > 0,
        isDatacenter: type.includes('机房') || type.includes('Hosting') || type.includes('数据中心'),
        isDatacenterConfidence: isDatacenterConfidence,
        isMobile: type.includes('移动') || type.includes('Wireless') || (ipqs && ipqs.mobile),
        isMobileConfidence: isMobileConfidence,
        hasRecentAbuse: (ipqs && ipqs.recent_abuse === true) || (pc && pc.risk > 50),
        hasRecentAbuseConfidence: hasRecentAbuseConfidence,
        isCrawler: (ipqs && ipqs.bot_status) || (ipinfo && ipinfo.privacy && ipinfo.privacy.crawler),
        isCrawlerConfidence: isCrawlerConfidence,
        isBlacklisted: (ipqs && ipqs.blacklisted) || (scam && scam.score > 75),
        isBlacklistedConfidence: isBlacklistedConfidence,
        ispRisk: 'low',
        ispRiskConfidence: scoreConfidence,
        specialService: [],
        verdict: '未知',
        verdictConfidence: sourceCount >= 3 ? 'high' : (sourceCount >= 2 ? 'medium' : 'low'),
        providerName: asn,
        availableSources: availableSources,
        sourceCount: sourceCount
    };

    // Calculate ISP Risk based on available data
    if (quality.isDatacenter) quality.ispRisk = 'high';
    else if (fraudScore > 75) quality.ispRisk = 'high';
    else if (fraudScore > 30) quality.ispRisk = 'medium';

    // Add special services if available
    if (ipinfo && ipinfo.privacy) {
        if (ipinfo.privacy.tor) quality.specialService.push('Tor');
        if (ipinfo.privacy.relay) quality.specialService.push('Relay');
        if (ipinfo.privacy.proxy) quality.specialService.push('Proxy');
        if (ipinfo.privacy.vpn) quality.specialService.push('VPN');
    }

    // Determine verdict based on available data and confidence
    let verdictReasons = [];
    
    // Check for definite red flags first (high confidence)
    if (isPcProxy || isIpqsProxy) {
        quality.verdict = '❌ 禁止使用 (检测到代理/VPN)';
        quality.isDatacenter = true;
        verdictReasons.push('代理/VPN 检测');
    } else if (quality.isDatacenter && isDatacenterConfidence === 'high') {
        quality.verdict = '❌ 不推荐 (数据中心 IP)';
        verdictReasons.push('数据中心 IP');
    } else if (quality.isBlacklisted && isBlacklistedConfidence === 'high') {
        quality.verdict = '❌ 禁止使用 (已列入黑名单)';
        verdictReasons.push('已列入黑名单');
    } else if (quality.hasRecentAbuse && hasRecentAbuseConfidence === 'high') {
        quality.verdict = '⚠️ 需谨慎使用 (近期有滥用记录)';
        verdictReasons.push('近期有滥用记录');
    } else if (quality.isCrawler && isCrawlerConfidence === 'high') {
        quality.verdict = '❌ 禁止使用 (爬虫 IP)';
        verdictReasons.push('爬虫 IP');
    } else if (pcType === 'Business' && !isPcProxy) {
        quality.verdict = '⚠️ 商业 IP (需养号)';
        quality.isDatacenter = false;
        verdictReasons.push('商业 IP');
    } else if ((pcType === 'Residential' || pcType === 'Wireless') && !isPcProxy) {
        quality.verdict = '✅ 适合 TikTok (住宅/移动 IP)';
        quality.isDatacenter = false;
        verdictReasons.push('住宅/移动 IP');
    } 
    // Handle cases with limited data
    else if (sourceCount < 2) {
        // Only one data source available, be conservative
        if (fraudScore < 30) {
            quality.verdict = '⚠️ 数据不足 - 初步判断低风险';
            verdictReasons.push('低风险 IP (数据不足)');
        } else if (fraudScore < 75) {
            quality.verdict = '⚠️ 数据不足 - 初步判断中风险';
            verdictReasons.push('中风险 IP (数据不足)');
        } else {
            quality.verdict = '⚠️ 数据不足 - 初步判断高风险';
            verdictReasons.push('高风险 IP (数据不足)');
        }
    }
    // Standard cases with sufficient data
    else if (fraudScore < 30) {
        quality.verdict = '✅ 看起来良好 (低风险 IP)';
        verdictReasons.push('低风险 IP');
    } else if (fraudScore < 75) {
        quality.verdict = '⚠️ 需谨慎使用 (中风险 IP)';
        verdictReasons.push('中风险 IP');
    } else {
        quality.verdict = '❌ 不推荐 (高风险 IP)';
        verdictReasons.push('高风险 IP');
    }
    
    // Add data source reliability note
    if (sourceCount < 2) {
        quality.verdict += ` (基于 ${sourceCount} 个数据源)`;
        verdictReasons.push(`仅 ${sourceCount} 个数据源可用`);
    }
    
    quality.verdictReasons = verdictReasons;

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
        typeConfidence: typeConfidence,
        fraudScore,
        scoreConfidence: scoreConfidence,
        riskLabel: label,
        riskColor: color,
        riskBg: bg,
        quality,
        scoreSources: scoreSources,
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
                        <i class="fas fa-globe text-2xl"></i>
                    </div>
                    <div>
                        <h3 class="text-2xl font-bold text-white font-mono tracking-wide flex items-center">
                            ${data.ip}
                            ${mockBadge}
                        </h3>
                        <p class="text-gray-400 text-sm flex items-center gap-2">
                            <i class="fas fa-map-marker-alt"></i> ${data.location}
                        </p>
                    </div>
                </div>
                <div class="px-4 py-2 rounded-full ${data.riskBg} border border-white/5 backdrop-blur-md">
                    <span class="font-bold ${data.riskColor} flex items-center gap-2">
                        <i class="fas fa-exclamation-circle"></i>
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
                    <div class="flex items-center gap-2">
                        <p class="text-white font-medium">${data.type}</p>
                        <span class="text-xs px-1.5 py-0.5 rounded ${data.typeConfidence === 'high' ? 'bg-green-500/20 text-green-400' : data.typeConfidence === 'medium' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-gray-500/20 text-gray-400'}">${data.typeConfidence === 'high' ? '高置信度' : data.typeConfidence === 'medium' ? '中置信度' : '低置信度'}</span>
                    </div>
                </div>
                <div class="bg-dark-900/50 p-4 rounded-lg border border-white/5">
                    <p class="text-gray-500 text-xs uppercase tracking-wider mb-1">数据来源状态</p>
                    <div class="flex gap-2 mt-1">
                        <span class="text-xs px-2 py-0.5 rounded ${data.rawData.ipqs && !data.rawData.ipqs.error ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}">IPQS</span>
                        <span class="text-xs px-2 py-0.5 rounded ${data.rawData.ipinfo && !data.rawData.ipinfo.error ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}">IPinfo</span>
                        <span class="text-xs px-2 py-0.5 rounded ${data.rawData.scamalytics && !data.rawData.scamalytics.error ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}">Scam</span>
                        <span class="text-xs px-2 py-0.5 rounded ${data.rawData.proxycheck && !data.rawData.proxycheck.error ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}">PC.io</span>
                    </div>
                    ${data.scoreSources && data.scoreSources.length > 0 ? `
                        <div class="mt-2 text-xs text-gray-400">
                            <span class="text-gray-500">评分来源:</span> ${data.scoreSources.join(', ')}
                        </div>
                    ` : ''}
                    <div class="mt-1 text-xs text-gray-400">
                        <span class="text-gray-500">评分置信度:</span> 
                        <span class="${data.scoreConfidence === 'high' ? 'text-green-400' : data.scoreConfidence === 'medium' ? 'text-yellow-400' : data.scoreConfidence === 'low' ? 'text-orange-400' : 'text-red-400'}">
                            ${data.scoreConfidence === 'high' ? '高' : data.scoreConfidence === 'medium' ? '中' : data.scoreConfidence === 'low' ? '低' : '极低'}
                        </span>
                    </div>
                    ${data.countryConflict || (data.quality && data.quality.countryConflict) ? `
                        <div class="mt-1 text-xs text-yellow-400 flex items-center gap-2">
                            <i class="fas fa-exclamation-triangle"></i>
                            <span>⚠️ 国家归属地数据冲突</span>
                        </div>
                    ` : ''}
                </div>
            </div>
            
            <!-- IP Quality Assessment for TikTok -->
            <div class="mt-6 p-4 bg-gradient-to-br from-purple-900/20 to-blue-900/20 rounded-lg border border-purple-500/30">
                <h4 class="text-sm font-bold text-purple-300 mb-3 flex items-center gap-2">
                    <i class="fas fa-shield-check"></i> IP质量评估 (TikTok运营专用)
                </h4>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <!-- TikTok Verdict -->
                    <div class="flex items-center gap-2 text-xs col-span-2 md:col-span-4 mb-2">
                        <span class="px-3 py-1.5 rounded-md font-bold text-sm bg-white/10 border border-white/20 text-white w-full text-center">
                            结论: ${data.quality ? data.quality.verdict : data.finalVerdict}
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
                        <i class="fas fa-code"></i> 查看原始 API 响应
                        <i class="fas fa-chevron-down group-open:rotate-180 transition-transform"></i>
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
        deleteBtn.innerHTML = '<i class="fas fa-trash text-lg"></i>';
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
        iconClass = 'fa-exclamation-circle';
        bgColor = 'bg-red-500/90';
    } else if (type === 'success') {
        iconClass = 'fa-check-circle';
        bgColor = 'bg-green-500/90';
    } else if (type === 'info') {
        iconClass = 'fa-info';
        bgColor = 'bg-blue-500/90';
    }

    toast.className = `fixed top-4 left-1/2 -translate-x-1/2 z-[100] ${bgColor} text-white backdrop-blur-md border border-white/20 rounded-lg shadow-2xl px-6 py-3 font-medium flex items-center gap-2 animate-[fadeIn_0.3s_ease-out]`;

    toast.innerHTML = `
        <i class="fas ${iconClass} text-xl"></i>
        <span>${message}</span>
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s ease-out';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}