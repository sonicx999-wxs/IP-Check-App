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
            
            // 高危类型检测 (VPN, Tor, Hosting)
            if (['VPN', 'Tor', 'Hosting'].includes(pcType)) {
                result.status = 'FAIL';
                result.message = `Layer 1 拦截: 高危类型 ${pcType}`;
                return result;
            } else if (pcType === 'Business') {
                result.layers.layer1.specialType = 'Business';
            }
        }

        // 2. 黑名单组织检测
        if (dataIPinfo && dataIPinfo.org) {
            const org = dataIPinfo.org;
            if (BLACKLIST_PROVIDERS.some(provider => org.includes(provider))) {
                result.status = 'FAIL';
                result.message = `Layer 1 拦截: 黑名单组织 ${org}`;
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

        // 熔断逻辑：Scamalytics 评分 > 50 直接熔断
        if (scamRes && scamRes.score > 50) {
            result.status = 'FAIL'; 
            result.message = `Layer 2 熔断: Scamalytics 高危分数 (${scamRes.score})`;
            result.layers.layer2.status = 'FAIL';
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

// 关键词库定义
const BLACKLIST_PROVIDERS = [
    // Major Cloud
    "Amazon", "Google", "Microsoft", "Azure", "Oracle", "Alibaba", "Tencent",
    "DigitalOcean", "Vultr", "Linode", "Hetzner", "OVH", "Choopa", "M247",
    // Proxy Networks (Commercial Residential Proxies) - CRITICAL FOR TIKTOK
    "NetNut", "Bright Data", "Luminati", "Oxylabs", "Smartproxy", "Decodo",
    "Soax", "IPRoyal", "PacketStream", "GeoSurf", "StormProxies", "Rayobyte",
    // Hosting/VPN specific
    "NetLab", "Hostinger", "Kamatera", "Webdock", "Cogent", "QuadraNet",
    "Zenlayer", "Hostwinds", "FranTech", "BuyVM"
];

const GRAYLIST_KEYWORDS = [
    "business", "biz", "corp", "corporate", "static", "fixed",
    "dedi", "dedicated", "colo", "colocation", "enterprise",
    "solutions", "telecom", "host", "data", "center", "gw", "gateway"
];

const WHITELIST_ISPS = [
    "Comcast", "Charter", "Spectrum", "Time Warner",
    "Verizon", "Fios", "AT&T", "U-verse", "SBC Internet",
    "Cox Communications", "CenturyLink", "Lumen",
    "T-Mobile USA", "Sprint", "Frontier", "Windstream", "Mediacom"
];

const WHITELIST_HOSTNAME_KEYWORDS = [
    "res", "resid", "residential", // Strongest signal
    "dyn", "dynamic", "dhcp",      // Strong signal
    "home", "user", "cpe", "fios", "dsl", "cable",
    "pool", "client", "subscriber"
];

// 规范化输出数据结构 - RiskAssessment
class RiskAssessment {
    constructor(ip, rawData) {
        this.ip = ip;
        this.rawData = rawData;
        this.riskScore = 0;
        this.tier = {
            name: '',
            level: '',
            text: '',
            emoji: '',
            color: '',
            bgColor: ''
        };
        this.riskLabel = '';
        this.verdict = '';
        this.location = '';
        this.asn = '';
        this.ipType = {
            type: '',
            confidence: 'medium'
        };
        this.quality = {
            isValid: true,
            isDatacenter: false,
            isMobile: false,
            hasRecentAbuse: false,
            isBlacklisted: false,
            ispRisk: 'low',
            specialService: [],
            countryConflict: false
        };
        this.metadata = {
            scoreSources: [],
            scoreConfidence: 'medium'
        };
        this.calculationDetails = {
            additions: [],
            reductions: []
        };
    }
    
    // 设置风险评分
    setRiskScore(score) {
        this.riskScore = Math.max(0, Math.min(100, score));
        this.calculateTier();
        this.calculateRiskLabel();
        this.calculateVerdict();
    }
    
    // 计算Tier等级
    calculateTier() {
        if (this.riskScore <= 10) {
            this.tier = {
                name: 'Tier S',
                level: 'S',
                text: '完美',
                emoji: '🟢',
                color: 'text-green-400',
                bgColor: 'bg-green-400/10'
            };
        } else if (this.riskScore <= 30) {
            this.tier = {
                name: 'Tier A',
                level: 'A',
                text: '优秀',
                emoji: '🔵',
                color: 'text-blue-400',
                bgColor: 'bg-blue-400/10'
            };
        } else if (this.riskScore <= 75) {
            this.tier = {
                name: 'Tier B',
                level: 'B',
                text: '警告',
                emoji: '🟡',
                color: 'text-yellow-400',
                bgColor: 'bg-yellow-400/10'
            };
        } else {
            this.tier = {
                name: 'Tier F',
                level: 'F',
                text: '高危',
                emoji: '🔴',
                color: 'text-red-400',
                bgColor: 'bg-red-400/10'
            };
        }
    }
    
    // 计算风险标签
    calculateRiskLabel() {
        if (this.riskScore <= 10) {
            this.riskLabel = '最低风险';
        } else if (this.riskScore <= 30) {
            this.riskLabel = '低风险';
        } else if (this.riskScore <= 75) {
            this.riskLabel = '中风险';
        } else {
            this.riskLabel = '高风险';
        }
    }
    
    // 生成最终判定
    calculateVerdict() {
        this.verdict = `${this.tier.emoji} ${this.tier.text} (${this.tier.name})`;
        this.quality.verdict = this.verdict;
    }
    
    // 添加风险累积项
    addRiskAddition(reason, points) {
        this.calculationDetails.additions.push({ reason, points });
    }
    
    // 添加风险稀释项
    addRiskReduction(reason, points) {
        this.calculationDetails.reductions.push({ reason, points });
    }
    
    // 设置位置信息
    setLocation(country, city) {
        this.location = `${country || ''} ${city || ''}`.trim();
    }
    
    // 设置ISP信息
    setAsn(asn) {
        this.asn = asn;
    }
    
    // 设置IP类型
    setIpType(type, confidence = 'medium') {
        this.ipType = {
            type,
            confidence
        };
        
        // 更新质量评估
        this.quality.isDatacenter = type.includes('机房') || type.includes('Hosting') || type === 'Hosting';
        this.quality.isMobile = type.includes('移动') || type.includes('Wireless') || type === 'Wireless';
    }
    
    // 设置质量评估
    setQualityAssessment(isDatacenter, isMobile, hasRecentAbuse, isBlacklisted, ispRisk, specialService = [], countryConflict = false) {
        this.quality = {
            isValid: true,
            isDatacenter,
            isMobile,
            hasRecentAbuse,
            isBlacklisted,
            ispRisk,
            specialService,
            countryConflict
        };
    }
    
    // 设置元数据
    setMetadata(scoreSources, scoreConfidence) {
        this.metadata = {
            scoreSources,
            scoreConfidence
        };
    }
    
    // 转换为RenderCore兼容格式
    toRenderCoreFormat() {
        return {
            ip: this.ip,
            rawData: this.rawData,
            finalScore: this.riskScore,
            finalVerdict: this.verdict,
            riskLevel: {
                label: this.riskLabel,
                color: this.tier.color,
                bg: this.tier.bgColor
            },
            riskLabel: this.riskLabel,
            riskColor: this.tier.color,
            riskBg: this.tier.bgColor,
            location: this.location,
            asn: this.asn,
            type: this.ipType.type,
            typeConfidence: this.ipType.confidence,
            quality: this.quality,
            scoreSources: this.metadata.scoreSources,
            scoreConfidence: this.metadata.scoreConfidence,
            fraudScore: this.riskScore // 兼容旧代码
        };
    }
}

// 最终判定逻辑 - 风险累积评分制
function determineFinalVerdict(result) {
    // 1. 获取各API数据
    const ipqsData = result.rawData.ipqs || {};
    const scamData = result.rawData.scamalytics || {};
    const pcData = window.RenderCore.getProxyCheckData(result.rawData.proxycheck, result.ip);
    const ipinfoData = result.rawData.ipinfo || {};
    
    // 2. 创建规范化的风险评估对象
    const assessment = new RiskAssessment(result.ip, result.rawData);
    
    let riskScore = 0;
    
    // 3. 熔断机制 (直接锁定为100分)
    let is熔断 = false;
    
    // 第三方高危
    if ((scamData.score > 50) || (pcData.risk > 40)) {
        riskScore = 100;
        is熔断 = true;
    }
    // 黑名单组织
    else if (ipinfoData.org && BLACKLIST_PROVIDERS.some(provider => ipinfoData.org.includes(provider))) {
        riskScore = 100;
        is熔断 = true;
    }
    // 高危类型
    else if (['VPN', 'Tor', 'Hosting'].includes(pcData.type)) {
        riskScore = 100;
        is熔断 = true;
    }
    // 4. 风险累积评分
    else {
        // 初始风险为0
        riskScore = 0;
        
        // 风险累积项 (加分)
        // Scamalytics 评分风险
        if (scamData.score !== undefined) {
            if (scamData.score > 50) {
                // 已经在熔断机制中处理
            } else if (scamData.score > 30) {
                riskScore += scamData.score * 0.5; // 30-50分，乘以0.5的权重
                assessment.addRiskAddition(`Scamalytics 评分风险 (${scamData.score})`, Math.round(scamData.score * 0.5));
            } else if (scamData.score > 10) {
                riskScore += scamData.score * 0.3; // 10-30分，乘以0.3的权重
                assessment.addRiskAddition(`Scamalytics 评分风险 (${scamData.score})`, Math.round(scamData.score * 0.3));
            }
        }
        
        // 所有权存疑 (Leased Line)
        if (ipinfoData.org && ipinfoData.isp) {
            const orgLower = ipinfoData.org.toLowerCase();
            const ispLower = ipinfoData.isp.toLowerCase();
            if (!orgLower.includes(ispLower) && GRAYLIST_KEYWORDS.some(keyword => orgLower.includes(keyword))) {
                riskScore += 40;
                assessment.addRiskAddition('所有权存疑 (Leased Line)', 40);
            }
        }
        
        // 商业类型 (Business Type)
        if (pcData.type === 'Business') {
            riskScore += 25;
            assessment.addRiskAddition('商业类型 (Business Type)', 25);
        }
        
        // 主机名异常 (Bad Hostname)
        if (pcData.hostname) {
            const hostnameLower = pcData.hostname.toLowerCase();
            if (GRAYLIST_KEYWORDS.some(keyword => hostnameLower.includes(keyword))) {
                riskScore += 20;
                assessment.addRiskAddition('主机名异常 (Bad Hostname)', 20);
            }
        }
        
        // 风险稀释项 (减分)
        // 白名单 ISP (Whitelist ISP)
        if (ipinfoData.isp) {
            const ispLower = ipinfoData.isp.toLowerCase();
            if (WHITELIST_ISPS.some(isp => ispLower.includes(isp.toLowerCase()))) {
                riskScore -= 20;
                assessment.addRiskReduction('白名单 ISP (Whitelist ISP)', 20);
            }
        }
        
        // 住宅特征 (Res Hostname)
        if (pcData.hostname) {
            const hostnameLower = pcData.hostname.toLowerCase();
            if (WHITELIST_HOSTNAME_KEYWORDS.some(keyword => hostnameLower.includes(keyword))) {
                riskScore -= 20;
                assessment.addRiskReduction('住宅特征 (Res Hostname)', 20);
            }
        }
        
        // 双重纯净认证
        if ((scamData.score === 0) && (pcData.risk === 0)) {
            riskScore -= 5;
            assessment.addRiskReduction('双重纯净认证', 5);
        }
    }
    
    // 5. 设置风险评分
    assessment.setRiskScore(riskScore);
    
    // 6. 设置位置和ISP信息
    assessment.setLocation(ipinfoData.country, ipinfoData.city);
    assessment.setAsn(ipinfoData.org || pcData.provider || '未知 ISP');
    
    // 7. 设置IP类型
    const ipType = pcData.type || '未知类型';
    assessment.setIpType(ipType);
    
    // 8. 设置质量评估
    const isDatacenter = ipType.includes('机房') || ipType.includes('Hosting') || ipType === 'Hosting';
    const isMobile = ipType.includes('移动') || ipType.includes('Wireless') || ipType === 'Wireless';
    const hasRecentAbuse = (ipqsData.recent_abuse === true) || (pcData.risk > 50);
    const isBlacklisted = (ipqsData.blacklisted === true) || (scamData.score > 75);
    const ispRisk = riskScore <= 10 ? 'low' : riskScore <= 30 ? 'low' : riskScore <= 75 ? 'medium' : 'high';
    
    assessment.setQualityAssessment(
        isDatacenter,
        isMobile,
        hasRecentAbuse,
        isBlacklisted,
        ispRisk
    );
    
    // 9. 设置元数据
    const RC = window.RenderCore;
    assessment.setMetadata(
        RC.getScoreSources(result.rawData),
        RC.getScoreConfidence(result.rawData)
    );
    
    // 10. 转换为兼容格式并返回
    const renderCoreData = assessment.toRenderCoreFormat();
    
    // 保留原始结果的必要属性
    return {
        ...result,
        ...renderCoreData,
        // 添加规范化的assessment对象，便于后续扩展
        assessment: assessment
    };
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
            // 使用 reconstructViewData 函数处理数据，确保与历史记录数据格式一致
            const viewData = reconstructViewData({
                id: Date.now(),
                raw_data: data.rawData,
                ip: data.ip,
                verdict: data.finalVerdict
            });
            resultsArea.innerHTML += window.RenderCore.getResultCardHTML(viewData);
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