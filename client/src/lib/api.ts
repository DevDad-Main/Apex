import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "";

const apiClient = axios.create({
  baseURL: `${API_BASE}/apex`,
});

export interface SearchResult {
  documentId: string;
  score: number;
  title: string;
  url: string;
  content: string;
}

export interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SearchResponse {
  results: SearchResult[];
  pagination: PaginationInfo;
}

export interface Document {
  id: string;
  url: string;
  title: string;
  content: string;
  scrapedAt?: string;
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
  search: async (query: string, page = 1, limit = 10): Promise<SearchResponse> => {
    const response = await apiClient.get<{ success: boolean; data: SearchResponse; message: string }>("/search", {
      params: { query, page, limit },
    });
    return response.data.data;
  },

  scrape: async (url: string): Promise<Document> => {
    const response = await apiClient.post<DocumentResponse>("/scrape", {
      url,
    });
    return response.data.data;
  },

  getDocument: async (id: string): Promise<Document> => {
    const response = await apiClient.get<DocumentResponse>(`/document/${id}`);
    return response.data.data;
  },

  getAllDocuments: async (): Promise<Document[]> => {
    const response = await apiClient.get<DocumentsListResponse>("/document");

    console.log(`Documents DATA: `, response.data.data);
    return response.data.data;
  },

  autocomplete: async (query: string): Promise<string[]> => {
    const response = await apiClient.get<AutocompleteResponse>(
      "/autocomplete",
      {
        params: { q: query },
      },
    );
    return response.data.data;
  },

  getRandom: async (limit = 10): Promise<SearchResponse> => {
    const response = await apiClient.get<{ success: boolean; data: SearchResponse; message: string }>("/search/random", {
      params: { limit },
    });
    return response.data.data;
  },
};

export default api;
