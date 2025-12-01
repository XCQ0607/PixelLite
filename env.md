# Environment Variables Configuration

PixelLite supports runtime configuration via environment variables. This allows you to configure the application without rebuilding it, which is especially useful for deployments on platforms like Vercel.

## Available Variables

The following environment variables can be set in your deployment environment (e.g., Vercel Project Settings).

| Variable | Description | Default Value |
| :--- | :--- | :--- |
| `CUSTOM_API_KEY` | Your custom API Key for AI services (Google Gemini). | `''` (Empty) |
| `CUSTOM_BASE_URL` | Custom Base URL for the AI service API. | `''` (Empty) |
| `DEFAULT_QUALITY` | The default image compression quality (0.0 to 1.0). | `0.8` |
| `SMART_COMPRESSION` | Enable smart compression by default. Set to `true` or `false`. | `true` |
| `COMPRESSION_MODE` | The default compression engine. Options: `canvas` (Fast), `algorithm` (Professional). | `algorithm` |
| `OUTPUT_FORMAT` | The default output format. Options: `original`, `webp`, `png`, `jpeg`. | `original` |
| `DEFAULT_PROCESS_MODE` | The default processing mode. Options: `compress`, `enhance`. | `compress` |
| `ENHANCE_METHOD` | The default enhancement method. Options: `algorithm`, `ai`. | `algorithm` |
| `AI_MODEL` | The name of the AI model used for image generation. | `gemini-2.5-flash-image` |
| `ANALYSIS_MODEL` | The name of the AI model used for image analysis. | `gemini-2.5-flash` |
| `AI_PROMPT` | The default prompt used for AI enhancement. | `Enhance the clarity and details of this image, maintain realistic colors.` |
| `LANGUAGE` | The default application language. Options: `zh` (Chinese), `en` (English). | `zh` |
| `WEBDAV_URL` | The URL for WebDAV backup. | `''` (Empty) |
| `WEBDAV_USERNAME` | The username for WebDAV authentication. | `''` (Empty) |
| `WEBDAV_PASSWORD` | The password for WebDAV authentication. | `''` (Empty) |

## Usage

Set these variables in your environment. For example, in Vercel:

1.  Go to your Project Settings.
2.  Navigate to **Environment Variables**.
3.  Add a new variable, e.g., Key: `DEFAULT_QUALITY`, Value: `0.9`.
4.  Redeploy your application (or restart the dev server locally).
