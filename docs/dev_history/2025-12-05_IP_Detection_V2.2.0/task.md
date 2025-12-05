# IP检测V2.2.0开发任务计划

## 任务基本信息

| 项目 | 详情 |
| --- | --- |
| **任务名称** | IP检测V2.2.0核心逻辑重构 |
| **版本号** | v2.2.0 |
| **开发日期** | 2025-12-05 |
| **任务类型** | 功能增强 |
| **相关Issue** | N/A |

## 任务目标

实现 "IP检测 V2.2.0" 的核心逻辑，采用 "级联熔断 (Circuit Breaker)" 模式，而非并行请求。

## 核心逻辑流程

1. **初始化**: 清空 UI，显示 Loading。
2. **Layer 1 (基建层)**: 
   - **并行请求**: 同时调用 `fetchIPInfo` (使用 IPinfo) 和 `fetchProxyCheck` (使用 ProxyCheck.io)。
   - **熔断判定**: 
     - 如果 ProxyCheck 返回 `type` 为 VPN/Proxy/Hosting，**立即停止**后续检测，标记为 FAIL。
     - 如果 IPinfo 的 `isp` 包含 "Google", "Amazon", "AWS", "Cloudflare" 等云厂商关键词，**立即停止**，标记为 FAIL。
     - Business 类型 IP 不再直接熔断，而是进入完整检测流程。
3. **Layer 2 (信誉层)**: 
   - **请求**: 调用 `fetchScamalytics`。
   - **熔断判定**: 如果 `score > 40`，**立即停止**后续检测，标记为 WARN (建议更换)，不浪费 IPQS 额度。
4. **Layer 3 (终审层)**: 
   - **缓存检查**: 在请求 IPQualityScore 之前，先检查 `localStorage`。
   - **缓存规则**: Key=`ipqs_v2_${ip}`，有效期 **24小时**。命中缓存直接使用。
   - **请求**: 若无缓存，调用 `fetchIPQualityScore`，成功后写入缓存。
5. **最终判定**: 根据 Layer 3 的分数给出红绿灯结果 (Score < 30 为 Green, 30-75 为 Yellow, > 75 为 Red)。

## 技术约束

- **移除**: 不要包含任何 WebRTC 或 浏览器指纹检测 代码。
- **UI交互**: 保持现有的 DOM ID 引用 (如 `resultsArea`, `verdictArea`)，使用 `innerHTML` 更新结果。
- **代码风格**: 使用 async/await，代码整洁，包含必要的错误捕获 (try-catch)。

## 数据融合与冲突处理

在渲染结果时，遵循以下优先级：
- **地理位置**: 优先显示 `ipinfo.city` 和 `ipinfo.region`。如果 `ipinfo` 和 `proxycheck` 的 **Country Code** 不一致 (例如 'US' vs 'CN')，在最终结果中增加一条 "⚠️ 国家归属地数据冲突" 的警告。
- **ISP 显示**: 优先显示 `ipinfo.org` (通常更规范)。
- **IPQS 容错**: 检查 `ipqsData.success`。如果为 `false` (如余额不足)，不要报错，视为 "N/A"，并仅依赖 Scamalytics 的分数进行最终判定。

## 最终判定 (Verdict) 更新

`finalizeVerdict` 函数需综合 Layer 1 的结果：
- 如果 Layer 1 是 Business (Warn) 且 Layer 2/3 分数安全 -> 最终结果为 **🟡 警告 (Business IP)**。
- 如果 Layer 1 是 Residential 且 Layer 2/3 分数安全 -> 最终结果为 **🟢通过**。

## 验收标准

1. ✅ 实现级联熔断模式，提高检测效率
2. ✅ Business 类型 IP 不再直接熔断，而是进入完整检测流程
3. ✅ 实现24小时本地缓存机制，减少API调用次数
4. ✅ 优化数据融合与冲突处理，提高结果准确性
5. ✅ 更新最终判定逻辑，区分不同类型IP的判定结果
6. ✅ 增强错误处理，提高系统稳定性
7. ✅ 移除不必要的代码，优化代码结构
8. ✅ 更新文档，包括CHANGELOG和开发历史记录

## 交付物

1. 重构后的 `client/script.js` 文件
2. 更新后的 `docs/CHANGELOG.md` 文件
3. 更新后的 `client/CHANGELOG-client.md` 文件
4. 新的开发历史记录目录 `docs/dev_history/2025-12-05_IP_Detection_V2.2.0/`
5. 更新后的 `docs/dev_history/README-dev_history.md` 文件

## 实施计划

| 步骤 | 任务 | 负责人 | 预计完成时间 | 实际完成时间 | 状态 |
| --- | --- | --- | --- | --- | --- |
| 1 | 分析当前代码结构 | AI助手 | 2025-12-05 09:00 | 2025-12-05 09:30 | ✅ 完成 |
| 2 | 重构handleCheck函数，实现级联熔断逻辑 | AI助手 | 2025-12-05 10:00 | 2025-12-05 11:00 | ✅ 完成 |
| 3 | 实现数据融合与冲突处理逻辑 | AI助手 | 2025-12-05 11:30 | 2025-12-05 12:30 | ✅ 完成 |
| 4 | 更新最终判定逻辑 | AI助手 | 2025-12-05 13:00 | 2025-12-05 14:00 | ✅ 完成 |
| 5 | 修复代码错误，测试功能 | AI助手 | 2025-12-05 14:30 | 2025-12-05 15:30 | ✅ 完成 |
| 6 | 更新文档，添加开发历史记录 | AI助手 | 2025-12-05 16:00 | 2025-12-05 17:00 | ✅ 完成 |

## 风险评估

| 风险 | 影响 | 缓解措施 | 状态 |
| --- | --- | --- | --- |
| API调用失败 | 导致检测结果不准确 | 添加错误处理，使用备用数据源 | ✅ 已处理 |
| 缓存机制失效 | 导致API调用次数增加 | 实现健壮的缓存检查和更新逻辑 | ✅ 已处理 |
| 数据冲突 | 导致结果显示不准确 | 实现数据融合与冲突处理逻辑 | ✅ 已处理 |
| 性能问题 | 导致检测速度慢 | 采用级联熔断模式，减少不必要的API调用 | ✅ 已处理 |

## 成果展示

1. **级联熔断模式**：实现了分层检测逻辑，提高了检测效率
2. **Business IP判定**：允许Business类型IP进入完整检测流程
3. **数据融合优化**：优化了地理位置和ISP显示，添加了数据冲突检测
4. **IPQS容错处理**：增强了系统的稳定性和容错能力
5. **最终判定更新**：区分了不同类型IP的判定结果

## 后续改进建议

1. 支持IPv6深度分析
2. 添加IP地理位置地图可视化
3. 支持自定义检测规则
4. 添加API使用统计面板
5. 支持暗色/亮色主题切换

## 相关文档

- [CHANGELOG.md](../../CHANGELOG.md)
- [client/CHANGELOG-client.md](../../client/CHANGELOG-client.md)
- [API_INTEGRATION_GUIDE.md](../reference_docs/API_INTEGRATION_GUIDE.md)