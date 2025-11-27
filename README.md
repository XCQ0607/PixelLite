
# PixelLite Pro 📸

[![中文文档](https://img.shields.io/badge/Docs-中文文档-blue)](./README_CN.md)

**Modern, Intelligent, Secure Image Processing Workspace.**

PixelLite Pro is a pure frontend image processing application built with React and Vite. It combines intelligent compression algorithms, algorithmic clarity enhancement, and AI-powered image analysis/generation (Google Gemini) into a single, beautiful interface.

![Stars](https://img.shields.io/github/stars/yourusername/pixellite-pro?style=social)

## ✨ Features

- **Smart Compression**:
  - **Balanced Mode**: Preserves visual quality while reducing file size.
  - **Modern Mode (WebP)**: Uses advanced encoding to significantly reduce size without resizing.
- **Image Enhancement**:
  - **Algorithm Mode**: Convolution-based sharpening for instant clarity improvement.
  - **AI Mode**: Uses Google Gemini 2.5 Flash for image-to-image AI upscaling and restoration.
- **AI Intelligence**:
  - Auto-generate image descriptions and SEO tags using Gemini Vision.
  - Custom Prompt support for AI image generation.
- **Data Security**:
  - **Local First**: All processing happens in your browser. Images are NOT uploaded to any server (except when using AI features which send data to Google API directly).
  - **WebDAV Backup**: Securely sync your settings and processing history to your private cloud (Nextcloud, Alist, etc.).
- **Modern UX**:
  - Drag & Drop interface.
  - Before/After comparison slider.
  - Dark Mode support.
  - Internationalization (English / Chinese).

## 🛠 Tech Stack

- **Framework**: React 18, Vite 5
- **Styling**: Tailwind CSS
- **AI Integration**: Google GenAI SDK
- **Utilities**: JSZip (Export), Lucide React (Icons)

## 🚀 Deployment

### One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyourusername%2Fpixellite-pro)

### Environment Variables

This application requires a Google Gemini API Key for AI features.

| Variable | Description |
| :--- | :--- |
| `API_KEY` | **Required**. Your Google Gemini API Key. Get it at [aistudio.google.com](https://aistudio.google.com/). |

*Note: Users can also enter their own API Key in the application settings.*

### Manual Deployment

#### Vercel

1.  Push your code to a GitHub repository.
2.  Import the project in Vercel.
3.  Add the `API_KEY` environment variable in Project Settings.
4.  Deploy! (The included `vercel.json` handles SPA routing).

#### Cloudflare Pages

1.  Push your code to GitHub.
2.  Create a new application in Cloudflare Pages.
3.  Connect your repository.
4.  **Build Settings**:
    - **Framework Preset**: Vite
    - **Build command**: `npm run build`
    - **Output directory**: `dist`
5.  Add `API_KEY` in **Settings > Environment variables**.
6.  Deploy.

## 📦 Local Development

```bash
# 1. Clone the repo
git clone https://github.com/yourusername/pixellite-pro.git

# 2. Install dependencies
npm install

# 3. Set up environment
# Create a .env file and add your API Key
echo "API_KEY=your_google_api_key_here" > .env

# 4. Run dev server
npm run dev
```

## 🔒 Privacy

PixelLite Pro operates primarily client-side.
- **Compression/Enhancement (Algo)**: 100% Local.
- **AI Features**: Data is sent directly from your browser to Google's API endpoints. No intermediate servers store your images.

## 📄 License

MIT License.

---
© 2025 PixelLite Pro. Designed by XCQ.
