# 更新日志 (Changelog)

本项目的所有重要更改都将记录在此文件中。
项目地址: [https://github.com/sonicx999-wxs/IP-Check-App](https://github.com/sonicx999-wxs/IP-Check-App)

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
并且遵守 [Semantic Versioning](https://semver.org/lang/zh-CN/) 语义化版本规范。

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
