# IP Intelligence - 专业 IP 检测工具

<div align="center">

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-2.1.0-brightgreen.svg)
![Platform](https://img.shields.io/badge/platform-Web-orange.svg)
![Python](https://img.shields.io/badge/python-3.x-blue.svg)

**专为美区 TikTok 运营打造的 IP 纯净度与风险检测工具**

集成 ProxyCheck.io • IPQualityScore • Scamalytics • IPinfo 多源数据分析

[快速开始](#-快速开始) • [功能特性](#-核心功能) • [API 配置](#-api-配置) • [更新日志](./CHANGELOG.md)

</div>

---

## 📖 项目简介

IP Intelligence 是一款现代化、高性能的 IP 地址检测与分析 Web 应用,专注于为 TikTok 运营团队提供专业的 IP 质量评估服务。

### 🎯 核心优势

- ✅ **多源数据融合** - 整合 4 大主流 IP 情报 API,提供最全面的风险评估
- ✅ **TikTok 专用优化** - 针对美区 TikTok 运营场景深度定制
- ✅ **现代化 UI** - Glassmorphism 玻璃拟态设计,极致视觉体验
- ✅ **零学习成本** - 全中文界面,开箱即用
- ✅ **隐私优先** - 本地存储,数据不上传

---

## ✨ 核心功能

### 1. 🔍 智能 IP 检测

- **批量检测** - 支持同时检测多个 IP 地址(换行或逗号分隔)
- **格式验证** - 自动识别 IPv4/IPv6 格式,过滤无效输入
- **实时分析** - 并发请求多个 API,秒级返回结果

### 2. 📊 TikTok 专用质量评估

针对 TikTok 运营场景的 7 项关键指标:

| 指标 | 说明 | 重要性 |
|------|------|--------|
| 🏢 **数据中心检测** | 识别机房 IP vs 住宅 IP | ⭐⭐⭐⭐⭐ |
| 📱 **移动网络** | 检测是否为移动运营商网络 | ⭐⭐⭐⭐ |
| ⚠️ **滥用记录** | 历史恶意行为记录 | ⭐⭐⭐⭐⭐ |
| 🤖 **爬虫检测** | 识别爬虫/机器人流量 | ⭐⭐⭐⭐ |
| 🚫 **黑名单状态** | 是否被主流黑名单收录 | ⭐⭐⭐⭐⭐ |
| 🏷️ **ISP 风险** | 运营商风险等级评估 | ⭐⭐⭐ |
| ☁️ **特殊服务** | VPN/Proxy/Tor 等服务标记 | ⭐⭐⭐⭐ |

### 3. 💾 数据管理

- **智能历史记录** - 自动保存查询历史,支持去重和置顶
- **Excel 导出** - 一键导出详细报告(.xlsx 格式)
- **CSV 复制** - 复制到剪贴板,直接粘贴到 Excel/Google Sheets
- **批量操作** - 勾选多条记录批量导出

### 4. 🎨 用户体验

- **Toast 通知系统** - 优雅的消息提示,替代原生弹窗
- **按钮内二次确认** - 防止误操作,无需弹窗确认
- **响应式设计** - 完美适配桌面和移动设备
- **暗色主题** - 护眼的深色玻璃拟态风格

---

## 🛠️ 技术栈

### 前端
- **核心**: HTML5 + 原生 JavaScript (ES6+)
- **样式**: Tailwind CSS (CDN)
- **图标**: Phosphor Icons
- **字体**: Google Fonts (Outfit)
- **导出**: SheetJS (xlsx)

### 后端
- **语言**: Python 3.x
- **框架**: Flask
- **功能**: API 代理服务器(解决 CORS 跨域问题)

### API 集成
- **IPQualityScore** - 核心欺诈评分与风险检测
- **IPinfo** - 地理位置与 ASN 信息
- **Scamalytics** - 补充风险评分与 ISP 数据
- **ProxyCheck.io** - 网络类型识别(住宅/商用/移动/机房)

---

## 🚀 快速开始

### 环境要求

- 现代浏览器 (Chrome 90+ / Edge 90+ / Firefox 88+)
- Python 3.7+
- 网络连接

### 安装步骤

#### 1. 克隆项目

```bash
git clone https://github.com/sonicx999-wxs/IP-Check-App.git
cd IP-Check-App
```

#### 2. 安装 Python 依赖

```bash
pip install flask requests flask-cors
```

#### 3. 启动后端服务（可选）

```bash
python server_legacy/server.py
```

服务将运行在 `http://localhost:5000`

#### 4. 打开前端应用

直接在浏览器中打开 `index.html` 文件即可。

---

## 🔑 API 配置

### 获取 API Key

本项目需要以下 API 服务的密钥:

| 服务 | 注册地址 | 免费额度 | 必需性 |
|------|----------|----------|--------|
| **IPQualityScore** | [ipqualityscore.com](https://www.ipqualityscore.com/) | 5,000次/月 | 推荐 |
| **IPinfo** | [ipinfo.io](https://ipinfo.io/) | 50,000次/月 | 推荐 |
| **Scamalytics** | [scamalytics.com](https://scamalytics.com/) | 100次/天 | 可选 |
| **ProxyCheck.io** | [proxycheck.io](https://proxycheck.io/) | 1,000次/天 | 推荐 |

### 配置方法

1. 点击页面右上角的 **⚙️ 设置** 图标
2. 在弹出的设置面板中填入各 API 的密钥
3. 点击 **保存配置** 按钮
4. 配置将自动保存到浏览器本地存储

> **提示**: 如果未配置 API Key,应用将使用模拟数据演示功能。

---

## 📚 使用指南

### 基础检测

1. 在输入框中输入 IP 地址(支持多个,换行或逗号分隔)
2. 点击 **开始检测** 按钮
3. 等待结果显示(通常 2-5 秒)

### 查看历史

1. 点击右上角 **📋 历史记录** 按钮
2. 侧边栏显示所有查询历史
3. 点击历史记录可快速加载缓存结果

### 导出数据

**方法 1: Excel 导出**
1. 在历史记录侧边栏勾选需要导出的记录
2. 点击 **导出 Excel** 按钮
3. 自动下载 `.xlsx` 文件

**方法 2: CSV 复制**
1. 在历史记录侧边栏勾选需要导出的记录
2. 点击 **复制 CSV** 按钮
3. 打开 Excel,直接粘贴(Ctrl+V)

---

## 📂 项目结构

```
IP-Check-App/
├── .agent/             # Agent 配置
├── client/             # 前端应用
│   ├── index.html      # 主页面
│   ├── script.js       # 前端逻辑
│   ├── README-client.md # 前端文档
│   └── CHANGELOG-client.md # 前端更新日志
├── docs/               # 文档目录
│   ├── CHANGELOG.md    # 主更新日志
│   ├── IP_Intelligence_架构分析与建议.md
│   ├── IP_Intelligence_前端化部署执行方案.md
│   ├── dev_history/    # 开发历史记录
│   │   └── README-dev_history.md # 开发历史索引
│   └── reference_docs/ # 参考文档
├── server_legacy/      # 后端代理（遗留）
│   └── server.py       # Python 后端代理
├── .git/               # Git 版本控制
├── .gitignore          # Git 忽略规则
└── README.md           # 项目文档
```

---

## 🗺️ 开发路线

### v2.1.0 (当前版本)
- ✅ 项目结构重构为 Monorepo 布局
- ✅ 前端文件整合到 client/ 目录
- ✅ 后端文件归档到 server_legacy/ 目录
- ✅ 文档整合到 docs/ 目录
- ✅ 清理不再需要的文件和目录
- ✅ 更新 .gitignore 文件

### 未来计划
- [ ] 支持 IPv6 深度分析
- [ ] 添加 IP 地理位置地图可视化
- [ ] 支持自定义检测规则
- [ ] 添加 API 使用统计面板
- [ ] 支持暗色/亮色主题切换

---

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request!

### 开发流程

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

---

## 📝 许可证

本项目基于 MIT License 开源 - 详见 [LICENSE](LICENSE) 文件。

---

## 👨‍💻 作者

**sonicx999**

- GitHub: [@sonicx999-wxs](https://github.com/sonicx999-wxs)
- 项目地址: [IP-Check-App](https://github.com/sonicx999-wxs/IP-Check-App)

---

## 🙏 致谢

感谢以下开源项目和服务:

- [Tailwind CSS](https://tailwindcss.com/) - 实用优先的 CSS 框架
- [Phosphor Icons](https://phosphoricons.com/) - 灵活的图标库
- [SheetJS](https://sheetjs.com/) - Excel 文件处理
- [Flask](https://flask.palletsprojects.com/) - Python Web 框架

---

<div align="center">

**如果这个项目对您有帮助,请给个 ⭐ Star 支持一下!**

Made with ❤️ by sonicx999

</div>
