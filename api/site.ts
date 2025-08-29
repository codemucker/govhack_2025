import { api } from "encore.dev/api";

interface HomeResponse {
  html: string;
}

// Simple homepage endpoint that returns basic HTML
export const homepage = api(
  { method: "GET", path: "/" },
  async (): Promise<HomeResponse> => {
    return {
      html: `
      <!DOCTYPE html>
      <html>
        <head>
          <title>LegalEase - Development Mode</title>
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
              text-align: center; 
              padding: 50px; 
              background: #f9fafb; 
            }
            .container { max-width: 600px; margin: 0 auto; background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .status { color: #666; background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #dcfce7; }
            h1 { color: #059669; margin-bottom: 1rem; }
            a { color: #059669; text-decoration: none; }
            a:hover { text-decoration: underline; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🚀 LegalEase</h1>
            <div class="status">
              <p><strong>API Server Running</strong></p>
              <p>Backend is operational. Frontend will be integrated in production build.</p>
            </div>
            <p>API endpoints:</p>
            <ul style="text-align: left; display: inline-block;">
              <li><a href="/api/hello">Hello World</a></li>
              <li><a href="/api/health">Health Check</a></li>
              <li><a href="/api/v1/councils/search?q=Brisbane">Council Search</a></li>
            </ul>
          </div>
        </body>
      </html>
      `
    };
  }
);