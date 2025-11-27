
# PixelLite Pro 📸

**现代、智能、安全的一站式图片处理工作台。**

PixelLite Pro 是一个基于 React 和 Vite 构建的纯前端图片处理应用。它将智能压缩算法、清晰度增强算法和 AI 驱动的图片分析/生成（Google Gemini）集成到一个美观的现代化界面中。

![Stars](https://img.shields.io/github/stars/yourusername/pixellite-pro?style=social)

## ✨ 核心功能

- **智能压缩**:
  - **均衡模式 (Balanced)**: 在保留画质的同时减小文件体积。
  - **现代模式 (Modern - WebP)**: 使用先进的 WebP 编码，在保持分辨率的同时大幅压缩体积。
- **画质增强**:
  - **算法模式 (Algorithm)**: 基于卷积的锐化算法，瞬间提升图片清晰度。
  - **AI 模式 (AI)**: 使用 Google Gemini 2.5 Flash 模型进行图生图 AI 修复与画质重绘。
- **AI 智能分析**:
  - 使用 Gemini Vision 自动生成图片中文描述和 SEO 标签。
  - 支持自定义 AI 生图提示词 (Prompt)。
- **数据安全**:
  - **本地优先**: 绝大部分处理（压缩、算法增强）仅在浏览器中运行。
  - **WebDAV 备份**: 将您的设置和处理历史安全地同步到您的私有云盘（如坚果云、Nextcloud、Alist 等）。
- **现代化体验**:
  - 拖拽上传 / 剪贴板粘贴 (Ctrl+V)。
  - 压缩/增强前后实时滑动对比。
  - 完美支持深色模式 (Dark Mode)。
  - 中英双语国际化支持。

## 🛠 技术栈

- **框架**: React 18, Vite 5
- **样式**: Tailwind CSS
- **AI 集成**: Google GenAI SDK
- **工具库**: JSZip (导出), Lucide React (图标)

## 🚀 部署指南

### 一键部署 (Vercel)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyourusername%2Fpixellite-pro)

### 环境变量

本项目的高级 AI 功能需要 Google Gemini API Key。

| 变量名 | 描述 |
| :--- | :--- |
| `API_KEY` | **必填**。您的 Google Gemini API Key。请在 [aistudio.google.com](https://aistudio.google.com/) 免费获取。 |

*注意：用户也可以在应用内的设置界面中填入自己的 API Key。*

### 手动部署

#### Vercel

1.  将代码推送到 GitHub 仓库。
2.  在 Vercel 中导入该项目。
3.  在项目设置 (Project Settings) 中添加环境变量 `API_KEY`。
4.  点击部署！(项目已包含 `vercel.json` 配置文件以适配 SPA 路由)。

#### Cloudflare Pages

1.  将代码推送到 GitHub 仓库。
2.  在 Cloudflare Pages 中创建新应用。
3.  连接您的仓库。
4.  **构建配置 (Build Settings)**:
    - **框架预设**: Vite
    - **构建命令**: `npm run build`
    - **输出目录**: `dist`
5.  在 **Settings > Environment variables** 中添加 `API_KEY`。
6.  点击部署。

## 📦 本地开发

```bash
# 1. 克隆仓库
git clone https://github.com/yourusername/pixellite-pro.git

# 2. 安装依赖
npm install

# 3. 设置环境
# 创建 .env 文件并填入 Key
echo "API_KEY=your_google_api_key_here" > .env

# 4. 启动开发服务器
npm run dev
```

## 🔒 隐私说明

PixelLite Pro 主要在客户端运行。
- **压缩与算法增强**: 100% 本地运行，图片不会上传到任何服务器。
- **AI 功能**: 图片数据会直接从浏览器发送至 Google API 接口。没有中间服务器存储您的图片。
- **数据缓存**: 历史记录仅存储在浏览器内存中，刷新页面即丢失（除非使用 WebDAV 备份）。

## 📄 许可证

MIT License.

---
© 2025 PixelLite Pro. Designed by XCQ.
