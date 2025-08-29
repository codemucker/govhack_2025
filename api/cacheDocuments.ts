// Document caching API endpoint
import { api } from "encore.dev/api";
import { documentFetcher, SAMPLE_AUSTLII_DOCUMENTS } from './documentFetcher';

export interface CacheDocumentsRequest {
  urls?: string[]; // Optional specific URLs to cache
}

export interface CacheDocumentsResponse {
  success: boolean;
  documentsAdded: number;
  totalDocuments: number;
  cachedDocuments: Array<{
    url: string;
    title: string;
    tags: string[];
  }>;
  error?: string;
}

// Endpoint to cache legal documents
export const cacheDocuments = api(
  { method: "POST", path: "/api/cache-documents" },
  async (req: CacheDocumentsRequest): Promise<CacheDocumentsResponse> => {
    try {
      // Use provided URLs or default sample documents
      const urlsToCache = req.urls && req.urls.length > 0 
        ? req.urls 
        : SAMPLE_AUSTLII_DOCUMENTS;

      console.log(`Caching ${urlsToCache.length} documents...`);
      
      // Fetch and cache documents
      const cachedDocs = await documentFetcher.fetchMultipleDocuments(urlsToCache);
      
      // Get total documents count
      const allDocs = await documentFetcher.getCachedDocuments();
      
      const cachedDocuments = cachedDocs.map(doc => ({
        url: doc.url,
        title: extractTitleFromUrl(doc.url),
        tags: doc.tags
      }));

      return {
        success: true,
        documentsAdded: cachedDocs.length,
        totalDocuments: allDocs.length,
        cachedDocuments
      };

    } catch (error) {
      console.error('Error caching documents:', error);
      return {
        success: false,
        documentsAdded: 0,
        totalDocuments: 0,
        cachedDocuments: [],
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
);

// List cached documents endpoint
export const listCachedDocuments = api(
  { method: "GET", path: "/api/cached-documents" },
  async (): Promise<{ documents: Array<{ id: string; url: string; tags: string; created_at: Date }> }> => {
    try {
      const documents = await documentFetcher.getCachedDocuments();
      return { documents };
    } catch (error) {
      console.error('Error listing cached documents:', error);
      return { documents: [] };
    }
  }
);

function extractTitleFromUrl(url: string): string {
  const match = url.match(/\/([^/]+)\/([^/]+)\/$/);
  if (match) {
    return match[2].replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, str => str.toUpperCase());
  }
  return 'Australian Legal Document';
}