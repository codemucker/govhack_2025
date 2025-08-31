#!/usr/bin/env node

// Web Fetch Service - Simple service to fetch web content for permit sites

export class WebFetch {
  constructor() {
    this.userAgent = 'Mozilla/5.0 (compatible; LegalEase Document Crawler/1.0)';
  }

  async fetchContent(url, prompt = 'Extract key information from this webpage') {
    try {
      console.log(`🌐 Fetching: ${url}`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-AU,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
        },
        timeout: 30000
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type') || '';
      
      if (!contentType.includes('text/html')) {
        throw new Error(`Unsupported content type: ${contentType}`);
      }

      const html = await response.text();
      
      // Basic HTML to text conversion
      const textContent = this.htmlToText(html);
      
      if (textContent.length < 100) {
        throw new Error('Insufficient content extracted');
      }

      return {
        url: url,
        content: textContent,
        contentType: contentType,
        size: textContent.length,
        timestamp: new Date()
      };

    } catch (error) {
      console.error(`❌ Failed to fetch ${url}:`, error.message);
      throw error;
    }
  }

  // Basic HTML to text conversion
  htmlToText(html) {
    // Remove script and style elements
    let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
    text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
    
    // Remove HTML tags but preserve some structure
    text = text.replace(/<br[^>]*>/gi, '\n');
    text = text.replace(/<\/p>/gi, '\n\n');
    text = text.replace(/<\/div>/gi, '\n');
    text = text.replace(/<\/h[1-6]>/gi, '\n\n');
    text = text.replace(/<[^>]+>/g, ' ');
    
    // Clean up whitespace
    text = text.replace(/&nbsp;/g, ' ');
    text = text.replace(/&amp;/g, '&');
    text = text.replace(/&lt;/g, '<');
    text = text.replace(/&gt;/g, '>');
    text = text.replace(/&quot;/g, '"');
    text = text.replace(/&#\d+;/g, ' ');
    
    // Normalize whitespace
    text = text.replace(/\s+/g, ' ');
    text = text.replace(/\n\s+/g, '\n');
    text = text.replace(/\n{3,}/g, '\n\n');
    
    return text.trim();
  }

  // Test connection to a URL
  async testConnection(url) {
    try {
      const response = await fetch(url, {
        method: 'HEAD',
        headers: {
          'User-Agent': this.userAgent
        },
        timeout: 10000
      });
      
      return {
        success: response.ok,
        status: response.status,
        contentType: response.headers.get('content-type')
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Batch fetch multiple URLs with rate limiting
  async fetchMultiple(urls, delayMs = 2000) {
    const results = [];
    
    for (const url of urls) {
      try {
        const result = await this.fetchContent(url);
        results.push(result);
      } catch (error) {
        results.push({
          url: url,
          error: error.message,
          failed: true
        });
      }
      
      // Rate limiting delay
      if (delayMs > 0) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
    
    return results;
  }
}