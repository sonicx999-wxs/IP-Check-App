# 更新日志 (Changelog)

本项目的所有重要更改都将记录在此文件中。
项目地址: [https://github.com/sonicx999-wxs/IP-Check-App](https://github.com/sonicx999-wxs/IP-Check-App)

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
并且遵守 [Semantic Versioning](https://semver.org/lang/zh-CN/) 语义化版本规范。

## [2.2.0] - 2025-12-05 🔧

### ✨ 核心功能更新 (Core Feature Updates)

#### 级联熔断模式 (Circuit Breaker)
- **实现级联熔断**: 采用"级联熔断"模式替代并行请求，提高检测效率
- **分层检测逻辑**:
  - **Layer 1 (基建层)**: 并行请求 IPinfo 和 ProxyCheck.io
    - 熔断条件: ProxyCheck 返回 VPN/Proxy/Hosting 类型，或 IPinfo ISP 包含云厂商关键词
    - Business 类型 IP 不再直接熔断，而是进入完整检测流程
  - **Layer 2 (信誉层)**: 调用 Scamalytics
    - 熔断条件: 分数 > 40，标记为 WARN
  - **Layer 3 (终审层)**: 调用 IPQualityScore
    - 缓存机制: 24小时本地缓存，Key=`ipqs_v2_${ip}`

#### 数据融合与冲突处理
- **地理位置优化**: 优先显示 `ipinfo.city` 和 `ipinfo.region`
- **国家归属地冲突检测**: 当 IPinfo 和 ProxyCheck 的 Country Code 不一致时，显示警告
- **ISP 显示优化**: 优先显示 `ipinfo.org`（更规范）
- **IPQS 容错处理**: 检查 `ipqsData.success`，失败时视为 "N/A"，依赖 Scamalytics 评分

#### 最终判定逻辑更新
- **Business IP 判定**: 分数安全时显示 "🟡 警告 (Business IP)"
- **Residential IP 判定**: 分数安全时显示 "🟢 通过"
- **分层结果综合**: 综合 Layer 1-3 结果给出最终判定

### 🐛 修复与优化
- **修复类型判定**: 放宽 Business 类型判定，允许进入完整检测流程
- **优化结果渲染**: 显示国家归属地冲突警告
- **增强错误处理**: 每个 API 请求添加 try-catch 块
- **移除不必要代码**: 删除 WebRTC 和浏览器指纹检测代码

## [2.1.0] - 2025-12-04 📁

### 🏗️ 项目结构变更 (Directory Restructuring)

#### 目录迁移
- **目录重命名**: 前端目录从 `frontend/` 重命名为 `client/`
- **项目结构优化**: 加入 Monorepo 布局，与后端代码分离

#### 相关变更
- **主文档更新**: 主 CHANGELOG 已迁移到根目录的 `docs/CHANGELOG.md`
- **项目结构简化**: 根目录只包含必要的文件和目录

## [3.0.0] - 2025-11-30 🚀

### ✨ 核心更新：前端化部署 (Serverless Deployment)

#### 架构转型
- **Serverless 架构** - 移除 Python Flask 后端依赖，实现纯前端部署
- **GitHub Pages 兼容** - 支持直接部署到 GitHub Pages 等静态托管服务
- **CORS 解决方案** - 使用 corsproxy.io 处理跨域 API 请求
- **直接 API 调用** - 前端直接调用第三方 API，无中间层

#### 代码优化
- **移除后端依赖** - 删除 `PROXY_BASE` 常量，更新所有 API 请求逻辑
- **增强错误处理** - 添加置信度标记系统，明确显示判断可靠性
- **改进数据源处理** - 优化数据源不足时的处理逻辑
- **图标库升级** - 从 Phosphor Icons 迁移到 Font Awesome

#### UI/UX 改进
- **页脚更新** - 显示 "Serverless Mode (GitHub Pages Compatible)"
- **数据源状态显示** - 明确显示每个数据源的可用性
- **置信度可视化** - 为 IP 类型判断、欺诈评分添加置信度标记
- **改进结论描述** - 数据源不足时显示 "数据不足 - 初步判断"

#### 部署优化
- **简化部署流程** - 只需部署静态文件
- **降低维护成本** - 无需维护后端服务器
- **提高可靠性** - 减少后端服务器故障风险
- **增强扩展性** - 直接调用第三方 API，无单点故障

### 📦 项目结构更新
- **独立部署文件夹** - 创建 `frontend/` 文件夹用于静态部署
- **过时文件标记** - `server.py` 和 `requirements.txt` 标记为过时文件
- **更新 README 文档** - 反映前端化部署架构
- **详细部署方案** - 新增完整的前端化部署执行方案文档

## [2.0.0] - 2025-11-26 🎉

### 🚀 正式发布 (Official Release)

这是 IP Intelligence 的首个正式发布版本,标志着项目从开发阶段进入生产就绪状态。

### ✨ 核心功能总览 (Core Features)

#### 智能检测系统
- **批量 IP 检测** - 支持同时检测多个 IP 地址(换行或逗号分隔)
- **格式验证** - 自动识别并验证 IPv4/IPv6 格式,过滤无效输入
- **多源数据融合** - 整合 IPQualityScore, IPinfo, Scamalytics, ProxyCheck.io 四大 API

#### TikTok 专用优化
- **7 项质量指标** - 数据中心检测、移动网络、滥用记录、爬虫检测、黑名单状态、ISP 风险、特殊服务标记
- **智能评分系统** - 综合多源数据生成欺诈评分和风险等级
- **可视化展示** - Color-coded 徽章系统,一目了然

#### 数据管理
- **智能历史记录** - 自动保存、去重、置顶
- **Excel 导出** - 一键导出详细报告(.xlsx 格式)
- **CSV 复制** - 复制到剪贴板,直接粘贴到 Excel/Google Sheets
- **批量操作** - 支持勾选多条记录批量导出

#### 用户体验
- **Toast 通知系统** - 优雅的消息提示,完全替代原生弹窗
- **按钮内二次确认** - 防止误操作,无需弹窗
- **Glassmorphism UI** - 现代化玻璃拟态设计
- **响应式布局** - 完美适配桌面和移动设备

### 📦 项目完整性 (Project Completeness)
- ✅ 完整的 README 文档
- ✅ 详细的 API 配置指南
- ✅ 规范的 CHANGELOG 记录
- ✅ 完善的开发历史归档
- ✅ MIT 开源许可证

### 🎨 品牌与 SEO
- **动态 Favicon** - SVG 盾牌图标
- **品牌副标题** - "专为美区 TikTok 运营打造的 IP 纯净度与风险检测工具"
- **专业页脚** - 版权信息与技术栈展示
- **SEO 优化** - Meta description 和 author 标签

### 📊 版本历程回顾
- **v1.0.0 - v1.3.x**: 基础功能开发与 API 集成
- **v1.4.x**: 脚本修复与逻辑优化
- **v1.5.0**: Toast 通知系统与 IP 验证
- **v1.5.1**: CSV 复制功能与 IPQS 数据清洗
- **v1.5.2**: UI 润色与品牌强化
- **v2.0.0**: 正式发布,生产就绪 ✨

---

## [1.5.2] - 2025-11-26

### 🎨 UI 优化 (UI Polish)
- **品牌强化**: Header 添加副标题"专为美区 TikTok 运营打造的 IP 纯净度与风险检测工具"
- **动态 Favicon**: 使用 SVG 数据 URI 实现盾牌图标,无需额外文件
- **专业页脚**: 添加版权信息和技术栈展示(ProxyCheck.io, IPQualityScore, Scamalytics, IPinfo)
- **SEO 优化**: 添加 meta description 和 author 标签,提升搜索引擎可见性
- **布局完善**: 页脚自动粘底,Glassmorphism 风格统一

## [1.5.1] - 2025-11-26

### ✨ 新增功能 (New Features)
- **复制 CSV 功能**: 新增"复制 CSV"按钮,支持将历史记录复制到剪贴板,解决 IDE 环境下文件下载受限问题
- **一键粘贴到 Excel**: 复制的 CSV 数据可直接粘贴到 Excel、Google Sheets 等工具

### 🎨 优化改进 (Improvements)
- **导出按钮布局**: 将"导出 Excel"和"复制 CSV"按钮并排显示,提升操作便捷性
- **IPQS 数据清洗**: 自动过滤 IPQS 免费版 API 返回的付费提示字段(`abuse_events`, `abuse_velocity`),避免干扰数据展示
- **导出数据增强**: Excel 导出新增"结论"字段,并添加 SheetJS 库加载检测和错误处理

### 🐛 Bug 修复 (Bug Fixes)
- **滥用记录判断**: 修复 `hasRecentAbuse` 字段的布尔值判断逻辑,避免误判

## [1.5.0] - 2025-11-26

### ✨ 新增功能 (New Features)
- **Toast 通知系统**: 全面替换原生 `alert()` 弹窗,使用自定义 Toast 通知,避免 IDE 预览环境下的浏览器阻塞问题
- **IP 地址验证**: 新增前端 IP 格式验证功能,支持 IPv4 和 IPv6,自动过滤无效输入,节省 API 配额
- **智能提示优化**: 所有用户交互均使用 Toast 提示,包括清空输入、保存配置、删除记录等操作

### 🎨 优化改进 (Improvements)
- **交互体验**: 使用 Glassmorphism 风格的 Toast 通知,支持错误/成功/信息三种类型
- **API Key 确认**: 将原生 `confirm()` 弹窗改为 Toast 提示,简化用户操作流程
- **输入验证**: 实时验证 IP 格式,提前拦截无效输入,提升检测效率

### 🐛 Bug 修复 (Bug Fixes)
- **历史记录**: 修复历史记录管理函数缺失导致的保存失败问题
- **错误提示**: 修复因函数缺失导致的误报"服务器连接失败"问题

## [1.4.2] - 2025-11-26

### ✨ 新增功能 (New Features)
- **清空输入按钮**: 在 IP 输入框右下角新增"清空"按钮,一键清空输入内容并自动聚焦
- **清除配置按钮**: 在设置弹窗底部新增"清除配置"按钮,支持快速清空所有 API Key 配置(需二次确认)

### 🎨 优化改进 (Improvements)
- **UI 优化**: 输入区域按钮布局改为 Flex 横向排列,提升视觉层次感
- **交互优化**: 清空输入后自动聚焦到输入框,提升操作流畅度

## [1.4.1] - 2025-11-26

### ✨ 优化改进 (Improvements)

- **TikTok IP 质量评估**: 优化了针对 TikTok 的 IP 质量判定逻辑，更准确地识别商业 IP 和机房 IP。
- **代码稳定性**: 修复了 `script.js` 中的关键语法错误，恢复了丢失的函数定义 (`renderResults`, `addToHistory`)，确保应用稳定运行。
- **逻辑完善**: 修复了 `handleCheck` 函数的异常处理逻辑，防止按钮卡在"正在检测"状态。

## [1.4.0] - 2025-11-26

### ✨ 新增功能 (New Features)

- **ProxyCheck.io 集成**: 新增 ProxyCheck.io API 支持
  - 后端新增 `/api/proxycheck` 代理路由 (POST)
  - 前端设置面板新增 ProxyCheck.io API Key 配置项
  - 综合风险评分算法纳入 ProxyCheck.io 风险值
  - IP类型识别逻辑支持 ProxyCheck.io 返回的数据 (Business/Residential/Wireless等)

## [1.3.3] - 2025-11-26

### ✨ 新增功能 (New Features)

- **单个历史记录删除**: 历史记录侧边栏每条记录右侧新增删除按钮
  - 采用"按钮内二次确认"模式:首次点击图标变红,再次点击执行删除
  - 3秒超时自动恢复,防止误操作
  - 使用 `e.stopPropagation()` 阻止事件冒泡,确保不会触发历史记录加载

### 🐛 修复 (Fixes)

- **Phosphor Icons 图标显示**: 修复删除按钮图标不可见的问题
  - 根本原因:缺少 `ph-bold` 前缀类名,导致浏览器无法识别 Phosphor 字体
  - 修复方案:将 `ph-trash` 改为 `ph-bold ph-trash`,确保图标正确渲染

## [1.3.2] - 2025-11-26

### ✨ 优化改进 (Improvements)

- **清空历史交互优化**: 采用"按钮内二次确认"模式替代原生confirm对话框
  - 解决了IDE预览环境下confirm弹窗闪退的问题
  - 提升用户体验：首次点击按钮变红并显示"再次点击确认"，3秒后自动恢复
  - 更符合现代Web应用的交互规范，避免使用浏览器原生弹窗

### 🐛 修复 (Fixes)

- **HTML结构修复**: 清理了重复的DOCTYPE和head标签，修复文件结构问题
- **事件冒泡处理**: 优化遮罩层点击逻辑，防止误触子元素导致侧边栏意外关闭

## [1.3.1] - 2025-11-25

### 🐛 修复 (Fixes)

- **IP质量数据验证**: 修复API失败时仍显示"合格"数据的bug，现在会正确显示红色警告
- **侧边栏交互**: 添加遮罩层，支持点击外部区域关闭历史记录侧边栏

## [1.3.0] - 2025-11-25

### ✨ 新增功能 (New Features)

- **TikTok专用IP质量检测**: 新增7项针对TikTok运营的关键指标
  - 数据中心IP识别 (Datacenter Detection)
  - 移动网络检测 (Mobile Network Detection)
  - 滥用记录检查 (Recent Abuse Check)
  - 爬虫IP识别 (Crawler Detection)
  - 黑名单状态 (Blacklist Status)
  - ISP风险评级 (ISP Risk Rating)
  - 特殊服务标记 (Special Service Tags: AWS/Google/iCloud)
- **IP质量评估可视化**: 新增专用展示区域，使用Color-coded徽章系统

### 🎨 优化改进 (Improvements)

- **历史记录交互优化**: 点击历史记录直接显示缓存结果，无需重新检测，提升响应速度

## [1.2.1] - 2025-11-25

### 🚑 修复 (Fixes)

- **CORS 修复**: 引入 Python Flask 代理服务器 (`server.py`) 解决浏览器跨域请求失败的问题。
- **架构调整**: 从纯前端请求改为 "前端 -> 本地代理 -> 第三方 API" 模式。

## [1.2.0] - 2025-11-25

### ✨ 新增功能 (New Features)

- **API 集成**: 集成了 IPQualityScore, IPinfo, 和 Scamalytics 三个 API，替换了模拟数据。
- **设置界面**: 新增 API Key 配置弹窗，支持用户自定义 Key。
- **数据持久化**: API Key 和历史记录均保存在本地 LocalStorage 中。

## [1.1.0] - 2025-11-24

### ✨ 新增功能 (New Features)

- **Excel 导出**: 历史记录侧边栏新增导出功能，支持批量导出选中记录为 `.xlsx` 文件，包含基础字段及原始 JSON 数据。
- **全中文界面**: 界面已全面汉化，包括按钮、提示语及检测结果字段。

### 🐛 问题修复 (Bug Fixes)

- 修复了“开始检测”按钮在检测完成后无法恢复状态的问题。
- 修复了点击遮罩层无法关闭历史记录侧边栏的问题。
- 修复了 `script.js` 中的语法错误。

## [1.0.0] - 2025-11-24

### 🎉 首次发布 (Initial Release)

- **新增功能**
  - 基于 HTML + Tailwind CSS 的核心架构。
  - "玻璃拟态 (Glassmorphism)" 深色主题 UI 设计。
  - 支持批量 IP 输入（换行或逗号分隔）。
  - 模拟 API 层 (Mock API)，模拟网络延迟与数据返回。
  - 结果卡片展示：IP、地理位置、ASN 和风险评分。
  - 侧边栏历史记录功能。
  - 开发者指南 `API_INTEGRATION_GUIDE.md`。

- **优化改进**
  - **历史记录逻辑优化**: 查询重复 IP 时，不再新增记录，而是更新现有记录并置顶。

### 🔧 技术细节

- 零依赖：无需安装 Node.js，纯静态文件。
- 数据持久化：使用 LocalStorage 存储历史记录。
