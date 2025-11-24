# 演示与验收 (Walkthrough)

## 任务目标 (Goal)
集成 IPQualityScore, IPinfo, 和 Scamalytics 三个 API，替换原有的模拟数据，并添加 API Key 配置界面。

## 变更摘要 (Changes Summary)

### 1. 界面更新 (UI Updates)
- **新增设置入口**: 在页面右上角添加了齿轮图标按钮。
- **新增配置弹窗**: 点击按钮可打开模态框，输入三个 API 的 Key。
- **结果展示优化**: 结果卡片现在显示真实的数据来源状态（绿色表示成功，红色表示失败）。

### 2. 逻辑实现 (Logic Implementation)
- **状态管理**: 使用 `localStorage` 持久化存储 API Key。
- **并行请求**: 使用 `Promise.allSettled` 同时请求三个 API，提高响应速度。
- **数据整合**: 智能合并三个来源的数据：
    - **地理位置**: 优先使用 IPinfo (更准确)，其次 IPQS。
    - **ISP/ASN**: 优先使用 IPinfo。
    - **风险评分**: 取各平台评分的最大值，确保风险不被遗漏。
- **错误处理**: 单个 API 失败不影响整体流程，会在界面上标记为红色。

## 验证结果 (Verification Results)

> [!WARNING]
> **自动化验证跳过 (Automated Verification Skipped)**
> 由于 AI 服务暂时达到限流阈值 (429 Error)，无法自动运行浏览器进行截图验证。建议您手动进行以下测试。

### 手动验证步骤 (Manual Verification Steps)
1.  **配置 Key**: 点击右上角设置按钮，输入您的 API Key。
2.  **测试查询**: 输入 `8.8.8.8`，点击检测。
3.  **观察结果**:
    - 确认显示了真实的地理位置（如 "US Mountain View"）。
    - 确认 ASN 显示为 "AS15169 Google LLC"。
    - 确认数据来源状态标签（IPQS/IPinfo/Scam）根据您的 Key 配置显示为绿色。

## 下一步 (Next Steps)
- 如果遇到跨域 (CORS) 错误，请尝试安装 "Allow CORS" 浏览器插件或使用代理服务器。
- 可以进一步优化移动端的适配。
