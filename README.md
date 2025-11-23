# IP Intelligence - 专业 IP 检测工具

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-1.0.0-green.svg)

一款现代化、高性能的 IP 地址检测与分析 Web 应用。专注于美学设计（"玻璃拟态 Glassmorphism"）与极致的用户体验。

## ✨ 功能亮点 (Features)

- **🚀 批量检测**: 支持同时输入并检测多个 IP 地址。
- **💎 高级感 UI**: 采用深色玻璃拟态设计，界面精致美观。
- **🌍 全中文界面**: 贴心的中文汉化，操作更顺手。
- **📊 风险评分**: 直观展示 IP 的欺诈评分 (Fraud Score) 和风险等级。
- **📥 Excel 导出**: 支持一键导出检测报告，包含详细的原始数据。
- **🕒 智能历史记录**:
  - 自动保存查询历史到本地。
  - **自动去重**: 查询已存在的 IP 时，会自动更新该记录并将其置顶，避免重复。
- **🔒 隐私优先**: 所有历史记录仅存储在您的浏览器中 (LocalStorage)，不会上传服务器。

## 🛠️ 技术栈 (Tech Stack)

- **核心**: HTML5, 原生 JavaScript (ES6+)
- **样式**: [Tailwind CSS](https://tailwindcss.com/) (CDN 引入)
- **图标**: [Phosphor Icons](https://phosphoricons.com/)
- **字体**: Google Fonts (Outfit)

## 🚀 如何使用 (Getting Started)

本项目采用轻量化架构，**无需安装任何环境**！

1.  **获取代码**:
    *   **克隆仓库**: `git clone https://github.com/sonicx999-wxs/IP-Check-App.git`
    *   或者直接点击右上角的 "Code" -> "Download ZIP" 下载。
2.  **运行**: 直接双击打开文件夹中的 `index.html` (推荐使用 Chrome, Edge, Firefox 浏览器)。
3.  **开始使用！**

## 🔌 API 集成 (API Integration)

目前项目使用 **模拟数据 (Mock Data)** 进行演示。如需接入真实数据：

1.  获取 API Key (推荐 **IPInfo.io**, **MaxMind**, 或 **Scamalytics**)。
2.  打开 `script.js` 文件。
3.  搜索 `TODO: API INTEGRATION POINT`。
4.  参考 `API_INTEGRATION_GUIDE.md` 文档，将模拟逻辑替换为真实的 `fetch()` 请求。

## 📝 许可证 (License)

本项目基于 MIT License 开源 - 详见 [LICENSE](LICENSE) 文件。
