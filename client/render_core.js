// Render Core - Shared UI rendering functions
// This file contains all the UI rendering logic that can be shared across pages

// Helper function to get ProxyCheck data with dynamic IP key
function getProxyCheckData(rawData, ip) {
    const pcRaw = rawData || {};
    // Try to get data by IP directly, if not found, try to find the first object property
    return pcRaw[ip] || Object.values(pcRaw).find(v => typeof v === 'object' && v !== null && !v.error) || {};
}

// Helper function to get risk level from score
function getRiskLevel(score) {
    if (score < 30) return { label: '低风险', color: 'text-green-400', bg: 'bg-green-400/10' };
    if (score < 75) return { label: '中风险', color: 'text-yellow-400', bg: 'bg-yellow-400/10' };
    return { label: '高风险', color: 'text-red-400', bg: 'bg-red-400/10' };
}

// Helper function to get location from raw data
function getLocationFromRawData(rawData, ip) {
    let location = '';
    let country = '';
    let countryConflict = false;
    
    // Priority 1: IPinfo
    if (rawData.ipinfo && !rawData.ipinfo.error) {
        location = `${rawData.ipinfo.country || ''} ${rawData.ipinfo.city || ''} ${rawData.ipinfo.region || ''}`.trim();
        country = rawData.ipinfo.country || '';
        
        // Check for country conflict with ProxyCheck
        if (rawData.proxycheck) {
            const pcData = getProxyCheckData(rawData.proxycheck, ip);
            const proxyCheckCountry = pcData.isocode || pcData.iso;
            if (proxyCheckCountry && country && country !== proxyCheckCountry) {
                countryConflict = true;
            }
        }
    }
    // Priority 2: ProxyCheck
    else if (rawData.proxycheck) {
        const pcData = getProxyCheckData(rawData.proxycheck, ip);
        location = `${pcData.isocode || pcData.iso || ''} ${pcData.city || ''} ${pcData.region || ''}`.trim();
        country = pcData.isocode || pcData.iso || '';
    }
    // Priority 3: IPQS
    else if (rawData.ipqs && rawData.ipqs.success) {
        location = `${rawData.ipqs.country_code || ''} ${rawData.ipqs.city || ''} ${rawData.ipqs.region || ''}`.trim();
        country = rawData.ipqs.country_code || '';
    }
    // Priority 4: Scamalytics
    else if (rawData.scamalytics && rawData.scamalytics.ip) {
        location = rawData.scamalytics.country || '';
        country = rawData.scamalytics.country || '';
    }
    
    return {
        location: location || '未知位置',
        countryConflict: countryConflict
    };
}

// Helper function to get ASN/ISP from raw data
function getAsnFromRawData(rawData, ip) {
    // Priority 1: IPinfo
    if (rawData.ipinfo && !rawData.ipinfo.error && rawData.ipinfo.org) {
        return rawData.ipinfo.org;
    }
    // Priority 2: IPQS
    else if (rawData.ipqs && rawData.ipqs.success) {
        return rawData.ipqs.ISP || rawData.ipqs.ASN || '未知 ISP';
    }
    // Priority 3: ProxyCheck
    else if (rawData.proxycheck) {
        const pcData = getProxyCheckData(rawData.proxycheck, ip);
        return pcData.provider || pcData.asn || '未知 ISP';
    }
    // Priority 4: Scamalytics
    else if (rawData.scamalytics && rawData.scamalytics.ip) {
        return rawData.scamalytics.isp || '未知 ISP';
    }
    return '未知 ISP';
}

// Helper function to get IP type from raw data
function getTypeFromRawData(rawData, ip) {
    // Priority 1: ProxyCheck
    if (rawData.proxycheck) {
        const pcData = getProxyCheckData(rawData.proxycheck, ip);
        const type = pcData.type || '';
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
    }
    // Priority 2: IPQS
    else if (rawData.ipqs && rawData.ipqs.success) {
        return rawData.ipqs.mobile ? '📱 移动网络' : '🌐 ISP/宽带';
    }
    // Priority 3: IPinfo
    else if (rawData.ipinfo && !rawData.ipinfo.error && rawData.ipinfo.privacy) {
        if (rawData.ipinfo.privacy.vpn) return '❌ VPN';
        else if (rawData.ipinfo.privacy.proxy) return '❌ 代理';
        else if (rawData.ipinfo.privacy.hosting) return '❌ 数据中心';
    }
    return '🌐 未知类型';
}

// Helper function to get score sources
function getScoreSources(rawData) {
    const sources = [];
    if (rawData.ipqs && rawData.ipqs.success && rawData.ipqs.fraud_score !== undefined) sources.push('IPQS');
    if (rawData.scamalytics && rawData.scamalytics.score !== undefined) sources.push('Scamalytics');
    if (rawData.proxycheck) {
        const pcData = Object.values(rawData.proxycheck).find(v => typeof v === 'object' && v.risk !== undefined);
        if (pcData && pcData.risk !== undefined) sources.push('ProxyCheck');
    }
    if (sources.length === 0) sources.push('Random (No Data)');
    return sources;
}

// Helper function to get score confidence
function getScoreConfidence(rawData) {
    let actualScoreSources = 0;
    if (rawData.ipqs && rawData.ipqs.success && rawData.ipqs.fraud_score !== undefined) actualScoreSources++;
    if (rawData.scamalytics && rawData.scamalytics.score !== undefined) actualScoreSources++;
    if (rawData.proxycheck) {
        const pcData = Object.values(rawData.proxycheck).find(v => typeof v === 'object' && v.risk !== undefined);
        if (pcData && pcData.risk !== undefined) actualScoreSources++;
    }
    
    if (actualScoreSources >= 2) return 'high';
    if (actualScoreSources === 1) return 'medium';
    if (Object.values(rawData).some(v => v)) return 'low';
    return 'very_low';
}

// Layer 1 HTML Generation - Basic Info
function getLayer1HTML(data) {
    const locationData = getLocationFromRawData(data.rawData, data.ip);
    const countryConflict = locationData.countryConflict || (data.quality && data.quality.countryConflict);
    
    return `
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
                ${countryConflict ? `
                    <div class="mt-1 text-xs text-yellow-400 flex items-center gap-2">
                        <i class="fas fa-exclamation-triangle"></i>
                        <span>⚠️ 国家归属地数据冲突</span>
                    </div>
                ` : ''}
            </div>
        </div>
    `;
}

// Layer 2 HTML Generation - Quality Assessment
function getLayer2HTML(data) {
    return `
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
                'bg-gray-500/20 text-gray-400'}">ISP风险: ${data.quality.ispRisk}</span>
                    </div>
                    ${data.quality.specialService && data.quality.specialService.length > 0 ? `
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
    `;
}

// Layer 3 HTML Generation - Raw Data Toggle
function getLayer3HTML(data) {
    return `
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
}

// Render Result Card Header
function getResultCardHeaderHTML(data) {
    const isMock = !data.rawData.ipqs && !data.rawData.ipinfo && !data.rawData.scamalytics && !data.rawData.proxycheck;
    const mockBadge = isMock ? `<span class="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded ml-2">模拟数据</span>` : '';
    
    return `
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
    `;
}

// Render Full Result Card
function getResultCardHTML(data) {
    return `
        <div class="glass-panel rounded-xl p-6 animate-[fadeIn_0.5s_ease-out]">
            ${getResultCardHeaderHTML(data)}
            ${getLayer1HTML(data)}
            ${getLayer2HTML(data)}
            ${getLayer3HTML(data)}
        </div>
    `;
}

// Render Verdict Component
function getVerdictHTML(data) {
    return `
        <div class="p-4 bg-gradient-to-r from-brand-500/20 to-blue-500/20 rounded-lg border border-brand-500/30">
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <i class="fas fa-gavel text-brand-400 text-xl"></i>
                    <div>
                        <h4 class="font-bold text-white">最终判定</h4>
                        <p class="text-gray-400 text-sm">基于多维度风险评估</p>
                    </div>
                </div>
                <div class="text-right">
                    <p class="text-2xl font-bold ${data.riskColor}">${data.finalVerdict}</p>
                    <p class="text-sm ${data.riskColor}">风险评分: ${data.fraudScore} (${data.riskLabel})</p>
                </div>
            </div>
        </div>
    `;
}

// Expose to global scope
window.RenderCore = {
    getResultCardHeaderHTML,
    getLayer1HTML,
    getLayer2HTML,
    getLayer3HTML,
    getResultCardHTML,
    getVerdictHTML,
    // Helper functions for external use
    getRiskLevel,
    getLocationFromRawData,
    getAsnFromRawData,
    getTypeFromRawData,
    getScoreSources,
    getScoreConfidence,
    getProxyCheckData
};
