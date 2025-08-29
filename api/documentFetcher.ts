// Real document fetcher for AustLII documents
import { db, Doc, generateId } from './database';

export interface FetchedDocument {
  content: string;
  tags: string[];
  url: string;
}

export class DocumentFetcher {
  
  // Extract tags from URL and content
  private extractTags(content: string, url: string): string[] {
    const tags: string[] = [];
    
    // Jurisdiction from URL
    if (url.includes('/cth/')) tags.push('commonwealth');
    if (url.includes('/nsw/')) tags.push('nsw');
    if (url.includes('/vic/')) tags.push('vic');
    if (url.includes('/qld/')) tags.push('qld');
    if (url.includes('/wa/')) tags.push('wa');
    if (url.includes('/sa/')) tags.push('sa');
    if (url.includes('/tas/')) tags.push('tas');
    if (url.includes('/nt/')) tags.push('nt');
    if (url.includes('/act/')) tags.push('act');
    
    // Domain from content keywords (case-insensitive)
    const lowerContent = content.toLowerCase();
    if (lowerContent.includes('business') || lowerContent.includes('corporation')) tags.push('business');
    if (lowerContent.includes('food') || lowerContent.includes('nutrition')) tags.push('food');
    if (lowerContent.includes('planning') || lowerContent.includes('development')) tags.push('planning');
    if (lowerContent.includes('license') || lowerContent.includes('licence')) tags.push('licensing');
    if (lowerContent.includes('environment') || lowerContent.includes('pollution')) tags.push('environment');
    if (lowerContent.includes('consumer') || lowerContent.includes('trade')) tags.push('consumer');
    if (lowerContent.includes('liquor') || lowerContent.includes('alcohol')) tags.push('hospitality');
    if (lowerContent.includes('health') || lowerContent.includes('medical')) tags.push('health');
    if (lowerContent.includes('employment') || lowerContent.includes('workplace')) tags.push('employment');
    
    return tags;
  }

  // Fetch document with caching
  async fetchDocument(url: string): Promise<FetchedDocument> {
    try {
      // Check cache first
      const cachedRows = [];
      for await (const row of db.query`SELECT * FROM docs WHERE url = ${url}`) {
        cachedRows.push(row);
      }
      
      if (cachedRows.length > 0) {
        const row = cachedRows[0];
        return {
          content: row.content as string,
          tags: (row.tags as string).split(',').filter(t => t.length > 0),
          url: row.url as string
        };
      }
      
      // Fetch from AustLII
      console.log(`Fetching document from: ${url}`);
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch document: ${response.status} ${response.statusText}`);
      }
      
      const content = await response.text();
      
      // Extract plain text content from HTML (basic parsing)
      const textContent = this.extractTextFromHtml(content);
      const tags = this.extractTags(textContent, url);
      
      // Store in cache
      await db.exec`
        INSERT INTO docs (id, url, content, tags, created_at)
        VALUES (${generateId()}, ${url}, ${textContent}, ${tags.join(',')}, CURRENT_TIMESTAMP)
      `;
      
      return {
        content: textContent,
        tags,
        url
      };
      
    } catch (error) {
      console.error(`Error fetching document from ${url}:`, error);
      throw error;
    }
  }

  // Basic HTML to text extraction
  private extractTextFromHtml(html: string): string {
    // Remove script and style elements
    let text = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
    
    // Remove HTML tags
    text = text.replace(/<[^>]+>/g, ' ');
    
    // Decode HTML entities
    text = text.replace(/&nbsp;/g, ' ');
    text = text.replace(/&amp;/g, '&');
    text = text.replace(/&lt;/g, '<');
    text = text.replace(/&gt;/g, '>');
    text = text.replace(/&quot;/g, '"');
    text = text.replace(/&#39;/g, "'");
    
    // Clean up whitespace
    text = text.replace(/\s+/g, ' ').trim();
    
    return text;
  }

  // Batch fetch multiple documents
  async fetchMultipleDocuments(urls: string[]): Promise<FetchedDocument[]> {
    const results: FetchedDocument[] = [];
    
    for (const url of urls) {
      try {
        const doc = await this.fetchDocument(url);
        results.push(doc);
        console.log(`✅ Cached document: ${url}`);
      } catch (error) {
        console.error(`❌ Failed to cache document: ${url}`, error);
      }
    }
    
    return results;
  }

  // Find documents by tags or text search
  async findDocuments(searchTerm: string, tags?: string[]): Promise<Doc[]> {
    const searchPattern = `%${searchTerm}%`;
    const queryRows = [];
    for await (const row of db.query`
      SELECT * FROM docs WHERE content LIKE ${searchPattern}
      ORDER BY created_at DESC
    `) {
      queryRows.push(row);
    }
    
    return queryRows.map(row => ({
      id: row.id as string,
      url: row.url as string,
      content: row.content as string,
      tags: row.tags as string,
      created_at: new Date(row.created_at as string)
    }));
  }

  // Get all cached documents
  async getCachedDocuments(): Promise<Doc[]> {
    const rows = [];
    for await (const row of db.query`SELECT * FROM docs ORDER BY created_at DESC`) {
      rows.push(row);
    }
    return rows.map(row => ({
      id: row.id as string,
      url: row.url as string,
      content: row.content as string,
      tags: row.tags as string,
      created_at: new Date(row.created_at as string)
    }));
  }
}

// Pre-defined AustLII documents for initial caching
export const SAMPLE_AUSTLII_DOCUMENTS = [
  'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/cth/consol_act/ca2001172/', // Corporations Act
  'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/nsw/consol_act/epaaa1979389/', // NSW Planning Act
  'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/cth/consol_act/fsanza1991472/', // Food Standards Act
  'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/nsw/consol_act/la2007107/', // NSW Liquor Act
  'https://www.austlii.edu.au/cgi-bin/viewdoc/au/legis/cth/consol_act/cca2010265/', // Consumer Law
];

export const documentFetcher = new DocumentFetcher();