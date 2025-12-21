# TK IP 风险检测逻辑与权重设计规范 (V2025.12 - 统一低分制)

## 1. 核心设计理念
本项目采用 **"风险累积评分制 (Risk Accumulation System)"**，与 IPQS/Scamalytics 保持逻辑一致。
*   **0 分:** 理论上的绝对纯净状态。
*   **100 分:** 确定的黑产/机房/高危 IP。
*   **逻辑核心:** 初始风险为 0，发现疑点 **加分 (罚)**，发现可信特征 **减分 (赏)**。最终分数越高，风险越大。

## 2. 层级定义 (Tier Definitions)

| 层级 | 风险分 (Risk Score) | 颜色 | 适用场景 |
| :--- | :--- | :--- | :--- |
| **Tier S (完美)** | **0 - 10** | 🟢 绿色 | **注册新号 / 提现 / 申诉 / 投流** |
| **Tier A (优秀)** | **11 - 30** | 🔵 蓝色 | **日常运营 / 挂车 / 直播** |
| **Tier B (警告)** | **31 - 75** | 🟡 黄色 | **仅限刷视频养号 (观察期)** |
| **Tier F (高危)** | **> 75** | 🔴 红色 | **立即弃用 / 熔断** |

## 3. 详细评分规则 (Scoring Matrix)

### A. 熔断机制 (Instant Fail / Set to 100)
一旦触发下列任一条件，风险分直接锁定为 **100 分** (Tier F)。
1.  **第三方高危:** Scamalytics Score > 50 或 Proxycheck Risk > 40。
2.  **黑名单组织:** Organization 命中 Blacklist (如 Google, AWS, DigitalOcean, NetNut)。
3.  **高危类型:** Proxycheck Type 为 VPN, Tor, Hosting。

### B. 风险累积项 (Risk Additions / +Points)
| 检测维度 | 加分 (增加风险) | 逻辑说明 |
| :--- | :--- | :--- |
| **所有权存疑 (Leased Line)** | **+40** | ISP 名称与 Organization 不一致，且 Org 含商业词汇。视为“二房东”租赁 IP。 |
| **商业类型 (Business Type)** | **+25** | API 明确标记 Type 为 "Business"。TK 对此类 IP 容忍度较低。 |
| **主机名异常 (Bad Hostname)** | **+20** | Hostname 包含 `static`, `dedicated`, `colo` 等非家用特征词。 |

### C. 风险稀释项 (Risk Reductions / -Points)
*注意：最低减至 0 分，不出现负分。*

| 检测维度 | 减分 (降低风险) | 逻辑说明 |
| :--- | :--- | :--- |
| **白名单 ISP (Whitelist ISP)** | **-20** | 属于美国主流家宽运营商 (Comcast, AT&T, Verizon 等)。 |
| **住宅特征 (Res Hostname)** | **-20** | Hostname 包含 `res`, `dyn`, `home`, `fios` 等明确的家庭网络关键词。 |
| **双重纯净认证** | **-5** | Scamalytics 和 Proxycheck 的原始分数均为 0。 |

## 4. 关键词库定义
(此处对应代码中的 Const 常量定义，包含 Blacklist, Graylist, Whitelist)
// [BLACKLIST] - Known Cloud, Proxy Providers & Data Centers (2025 Update)
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

// [GRAYLIST] - Commercial/Business Indicators (Risk Level: Medium)
const GRAYLIST_KEYWORDS = [
  "business", "biz", "corp", "corporate", "static", "fixed",
  "dedi", "dedicated", "colo", "colocation", "enterprise",
  "solutions", "telecom", "host", "data", "center", "gw", "gateway"
];

// [WHITELIST] - True Residential Indicators (US Focus)
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