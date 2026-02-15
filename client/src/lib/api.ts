import axios from 'axios';

const API_BASE = '/apex';

export interface SearchResult {
  documentId: string;
  score: number;
  termFrequency: number;
}

export interface Document {
  id: string;
  url: string;
  title: string;
  content: string;
  scrapedAt?: string;
}

export interface SearchResponse {
  success: boolean;
  data: SearchResult[];
  message: string;
}

export interface DocumentResponse {
  success: boolean;
  data: Document;
  message: string;
}

export interface DocumentsListResponse {
  success: boolean;
  data: Document[];
  message: string;
}

export interface AutocompleteResponse {
  success: boolean;
  data: string[];
  message: string;
}

const api = {
  search: async (query: string): Promise<SearchResult[]> => {
    const response = await axios.get<SearchResponse>(`${API_BASE}/search`, {
      params: { query },
    });
    return response.data.data;
  },

  scrape: async (url: string): Promise<Document> => {
    const response = await axios.post<DocumentResponse>(`${API_BASE}/scrape`, { url });
    return response.data.data;
  },

  getDocument: async (id: string): Promise<Document> => {
    const response = await axios.get<DocumentResponse>(`${API_BASE}/document/${id}`);
    return response.data.data;
  },

  getAllDocuments: async (): Promise<Document[]> => {
    const response = await axios.get<DocumentsListResponse>(`${API_BASE}/document`);
    return response.data.data;
  },

  autocomplete: async (query: string): Promise<string[]> => {
    const response = await axios.get<AutocompleteResponse>(`${API_BASE}/autocomplete`, {
      params: { q: query },
    });
    return response.data.data;
  },
};

export default api;
