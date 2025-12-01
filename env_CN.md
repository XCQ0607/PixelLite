# 环境变量配置

PixelLite 支持通过环境变量进行运行时配置。这允许您在不重新构建应用程序的情况下对其进行配置，这对于在 Vercel 等平台上的部署特别有用。

## 可用变量

您可以在部署环境（例如 Vercel 项目设置）中设置以下环境变量。

| 变量 | 描述 | 默认值 |
| :--- | :--- | :--- |
| `CUSTOM_API_KEY` | 用于 AI 服务的自定义 API Key (Google Gemini)。 | `''` (空) |
| `CUSTOM_BASE_URL` | AI 服务 API 的自定义 Base URL。 | `''` (空) |
| `DEFAULT_QUALITY` | 默认图像压缩质量 (0.0 到 1.0)。 | `0.8` |
| `SMART_COMPRESSION` | 默认是否启用智能压缩。设置为 `true` 或 `false`。 | `true` |
| `COMPRESSION_MODE` | 默认压缩引擎。选项：`canvas` (快速), `algorithm` (专业)。 | `algorithm` |
| `OUTPUT_FORMAT` | 默认输出格式。选项：`original` (原图), `webp`, `png`, `jpeg`。 | `original` |
| `DEFAULT_PROCESS_MODE` | 默认处理模式。选项：`compress` (压缩), `enhance` (增强)。 | `compress` |
| `ENHANCE_METHOD` | 默认增强方法。选项：`algorithm` (算法), `ai` (AI)。 | `algorithm` |
| `AI_MODEL` | 用于图像生成的 AI 模型名称。 | `gemini-2.5-flash-image` |
| `ANALYSIS_MODEL` | 用于图像分析的 AI 模型名称。 | `gemini-2.5-flash` |
| `AI_PROMPT` | 用于 AI 增强的默认提示词。 | `Enhance the clarity and details of this image, maintain realistic colors.` |
| `LANGUAGE` | 默认应用程序语言。选项：`zh` (中文), `en` (英文)。 | `zh` |
| `WEBDAV_URL` | WebDAV 备份的 URL。 | `''` (空) |
| `WEBDAV_USERNAME` | WebDAV 认证用户名。 | `''` (空) |
| `WEBDAV_PASSWORD` | WebDAV 认证密码。 | `''` (空) |

## 后端环境变量

这些变量仅由无服务器函数 (`api/`) 使用，**不会**暴露给前端。

| 变量 | 描述 | 默认值 |
| :--- | :--- | :--- |
| `GEMINI_API_KEY` | 后端代理使用的 API Key。 | `''` (空) |
| `GEMINI_BASE_URL` | 后端代理使用的 Base URL。 | `''` (空) |

## 使用方法

在您的环境中设置这些变量。以 Vercel 为例：

1.  进入您的项目设置 (**Project Settings**)。
2.  导航至 **Environment Variables** (环境变量)。
3.  添加一个新的变量，例如：Key: `DEFAULT_QUALITY`, Value: `0.9`。
4.  重新部署您的应用程序（或在本地重启开发服务器）。