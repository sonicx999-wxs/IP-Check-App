# IP Intelligence - 专业 IP 检测工具

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-1.2.1-green.svg)

一款现代化、高性能的 IP 地址检测与分析 Web 应用。专注于美学设计（"玻璃拟态 Glassmorphism"）与极致的用户体验。

## ✨ 功能亮点 (Features)

- **� 批量检测**: 支持同时输入并检测多个 IP 地址。
- **💎 高级感 UI**: 采用深色玻璃拟态设计，界面精致美观。
- **🌍 全中文界面**: 贴心的中文汉化，操作更顺手。
- **📊 风险评分**: 直观展示 IP 的欺诈评分 (Fraud Score) 和风险等级。
- **📥 Excel 导出**: 支持一键导出检测报告，包含详细的原始数据。
- **�🕒 智能历史记录**:
  - 自动保存查询历史到本地。
  - **自动去重**: 查询已存在的 IP 时，会自动更新该记录并将其置顶，避免重复。
- **🔒 隐私优先**: 所有历史记录仅存储在您的浏览器中 (LocalStorage)，不会上传服务器。

## 🛠️ 技术栈 (Tech Stack)

- **核心**: HTML5, 原生 JavaScript (ES6+)
- **样式**: [Tailwind CSS](https://tailwindcss.com/) (CDN 引入)
- **图标**: [Phosphor Icons](https://phosphoricons.com/)
- **字体**: Google Fonts (Outfit)
- **后端**: Python (Flask) - *用于解决 API 跨域问题*

## 🚀 快速开始 (Quick Start)

### 1. 环境准备 (Prerequisites)
- 浏览器 (Chrome/Edge/Firefox)
- **Python 3.x** (用于运行代理服务器)

### 2. 安装依赖 (Install Dependencies)
```bash
pip install flask requests flask-cors
```

### 3. 启动服务 (Start Server)
```bash
python server.py
# 服务将运行在 http://localhost:5000
```

### 4. 运行应用 (Run App)
直接在浏览器中打开 `index.html` 即可。

## 🔌 API 集成 (API Integration)

本项目已集成 **IPQualityScore**, **IPInfo**, 和 **Scamalytics**。
请点击页面右上角的 **设置图标** 配置您的 API Key。

## 📝 许可证 (License)

本项目基于 MIT License 开源 - 详见 [LICENSE](LICENSE) 文件。
