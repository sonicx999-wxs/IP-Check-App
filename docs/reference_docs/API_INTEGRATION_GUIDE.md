# API 集成指南 (API Integration Guide)

这份文档将指导你如何将“模拟数据”替换为真实的 IP 检测 API（如 IPInfo, MaxMind 等）。

## 1. 需要修改的文件
你需要修改的文件是项目根目录下的 `script.js`。

## 2. 定位修改位置
请在 `script.js` 中搜索 `TODO: API INTEGRATION POINT`。我已经为你标记了具体的代码行（大约在第 54 行附近）。

## 3. 修改步骤示例

### 原始代码 (Mock Data)
目前的代码是这样的，它只是假装等待 1.5 秒，然后生成随机数据：

```javascript
// Simulate API Delay
await new Promise(resolve => setTimeout(resolve, 1500));

// Generate Results
const results = ips.map(ip => generateMockResult(ip));
```

### 修改后的代码 (Real API)
假设你申请了 **IPInfo.io** 的 API Key (例如 `1234567890abcdef`)，你可以将上面的代码替换为：

```javascript
// 创建一个空数组存放结果
const results = [];

// 遍历用户输入的每一个 IP
for (const ip of ips) {
    try {
        // [关键] 发送真实请求
        // 注意：这里把 YOUR_TOKEN 换成你真实的 Key
        const response = await fetch(`https://ipinfo.io/${ip}?token=YOUR_TOKEN`);
        const data = await response.json();

        // 把 API 返回的数据转换成我们界面需要的格式
        results.push({
            ip: ip,
            location: data.city + ', ' + data.country, // 例如: "Los Angeles, US"
            asn: data.org,                             // 例如: "AS15169 Google LLC"
            type: "Real Data",                         // 标记为真实数据
            fraudScore: 0,                             // IPInfo 免费版可能没有欺诈分，暂时设为0
            riskLabel: "Unknown",
            riskColor: "text-gray-400",
            riskBg: "bg-gray-400/10"
        });

    } catch (error) {
        console.error("API Error:", error);
        // 如果出错，可以放一个错误提示
        results.push(generateMockResult(ip)); // 或者暂时用假数据兜底
    }
}
```

## 4. 推荐的 API 服务
以下是你之前提到的服务，你可以去申请它们的 API Key：

1.  **IPInfo.io**: 提供地理位置、ASN 等基础信息（有免费额度）。
2.  **IPQualityScore**: 提供欺诈风险评分（Fraud Score）。
3.  **Scamalytics**: 专门检测欺诈风险。

## 5. 遇到困难怎么办？
如果你申请到了 Key 但不知道怎么写代码，可以直接把 Key 发给我（或者告诉我你申请了哪家服务），我会帮你写好具体的代码替换进去。
