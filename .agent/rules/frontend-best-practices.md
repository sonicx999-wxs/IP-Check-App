---
trigger: always_on
---

# 前端交互与调试最佳实践 (Frontend Best Practices)

## 1. 核心交互原则：禁止原生弹窗 (Banned Native Dialogs)
**规则**：在任何交互逻辑中，**严禁使用** `window.alert()`, `window.confirm()`, 或 `window.prompt()`。
**原因**：
1.  **环境兼容性差**：Antigravity IDE 调起的调试版 Chrome 是“临时用户配置 (Ephemeral Profile)”，原生弹窗常导致渲染进程阻塞、闪退或自动关闭。
2.  **焦点丢失**：原生弹窗会导致 DOM 焦点漂移，在侧边栏 (Sidebar) 或模态框 (Modal) 中极易引发“抽凳子效应”，导致父容器意外关闭。
3.  **体验割裂**：原生弹窗样式无法定制，破坏现代 UI (Tailwind) 的整体美感。

**替代方案**：
-   **信息提示**：使用 Toast 消息条或在 DOM 中插入临时的 `<div class="alert">`。
-   **操作确认**：使用 **"按钮内二次确认 (In-Button Confirmation)"** 模式。

## 2. 标准代码模式：按钮内二次确认 (Code Pattern)
当需要用户确认敏感操作（如“删除”、“清空”）时，请严格遵守以下代码范式，不要创建新的模态框，而是改变按钮状态：

```
// ✅ 推荐模式：按钮状态机
element.addEventListener('click', (e) => {
    // 1. 必须阻止冒泡和默认行为，防止触发侧边栏关闭或页面刷新
    e.stopPropagation();
    e.preventDefault();
    
    const btn = e.currentTarget;
    
    // 2. 检查状态
    if (btn.dataset.confirming === 'true') {
        // === 执行实际逻辑 ===
        performAction();
        // 重置按钮
        resetBtn(btn);
    } else {
        // === 进入确认状态 ===
        btn.dataset.confirming = 'true';
        const originalContent = btn.innerHTML;
        
        // 视觉反馈：变为红色/警告色，修改文字
        btn.innerHTML = '再次点击确认'; // 或使用图标
        btn.classList.add('bg-red-600', 'text-white'); // Tailwind 示例
        
        // 3. 设置超时自动重置 (防误触)
        setTimeout(() => {
            if (btn.dataset.confirming === 'true') {
                resetBtn(btn);
            }
        }, 3000);
    }
});
```

## 3. DOM 事件安全 (Event Safety)
**规则**：在处理 **浮层 (Overlay)**、**侧边栏 (Sidebar)** 或 **模态框 (Modal)** 内部的点击事件时：
1.  **必须显式添加** `e.stopPropagation()`，防止事件冒泡到遮罩层导致浮层意外关闭。
2.  **遮罩层点击逻辑**：监听遮罩层点击时，必须判断 `if (e.target === e.currentTarget)`，确保只在点击遮罩空白处时才关闭，而不是点击内容区域时关闭。

## 4. HTML 结构完整性 (Structural Integrity)
**规则**：在生成或修改代码时，Agent 必须自我检查 HTML 结构。
-   **禁止嵌套文档**：绝对不允许在 `<body>` 或 `<div>` 内部再次出现 `<!DOCTYPE>`, `<html>`, `<head>` 标签。这是严重的语法错误。
-   **粘贴检查**：在提供完整文件代码前，检查是否存在重复的头部定义。

## 5. 调试环境认知 (Environment Awareness)
**知识点**：
-   用户运行的浏览器环境是 **IDE Debug Chrome**。
-   **特征**：它是一个纯净的、临时的 Profile，**没有任何 Google 账号登录信息、Cookies 或插件**。
-   **应对**：如果遇到 API 鉴权失败或“未登录”错误，不要询问用户的账号信息，而是引导用户在代码中配置 API Key，或检查代码是否依赖了本地存储 (LocalStorage) 中不存在的数据。