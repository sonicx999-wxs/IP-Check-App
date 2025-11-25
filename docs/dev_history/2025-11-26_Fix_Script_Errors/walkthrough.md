# ProxyCheck.io 集成 (ProxyCheck.io Integration)

## 变更摘要 (Changes Summary)
本次更新集成了 **ProxyCheck.io** API，作为新的 IP 风险数据源，增强了检测的准确性和覆盖面。

### 后端 (Backend)
- **[NEW] Route**: `/api/proxycheck`
    - 接受 POST 请求，包含 `{ ip, api_key }`。
    - 转发请求至 `http://proxycheck.io/v2/{ip}`。
    - 强制开启参数: `vpn=1`, `asn=1`, `risk=1`, `info=1` (用于获取详细类型信息)。

### 前端 (Frontend)
- **设置 (Settings)**: 新增 "ProxyCheck.io Key" 输入框。
- **逻辑 (Logic)**:
    - `fetchProxyCheck`: 并行请求新 API。
    - `analyzeData`: 解析 ProxyCheck.io 返回的 `type` (Business, Residential, Wireless) 和 `risk` (0-100)。
    - **综合评分**: 取各家 API (IPQS, Scamalytics, ProxyCheck) 的最大风险值。
- **UI**: 在结果卡片中显示 ProxyCheck.io 的数据来源状态。

## 验证结果 (Verification Results)

### 1. 设置界面 (Settings UI)
已验证设置模态框中正确显示了新的配置项。

![Settings Modal](/C:/Users/Sailing/.gemini/antigravity/brain/149185ad-6ce5-489e-9ed2-77641d32db82/settings_modal_proxycheck_1764099838294.png)

### 2. 功能测试 (Functional Testing)
- **输入**: 配置 ProxyCheck.io Key。
- **操作**: 输入 IP 点击检测。
- **预期**:
    - 后端成功转发请求。
    - 前端正确解析并显示数据。
    - 风险评分反映 ProxyCheck.io 的结果。

> [!NOTE]
> 由于需要真实的 API Key 才能获取有效数据，建议用户在本地配置 Key 后进行实际测试。目前代码已包含完整的错误处理逻辑。
