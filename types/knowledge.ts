export interface KnowledgeBase {
  documents: DocumentEntry[];
}

export interface DocumentEntry {
  id: string;
  filename: string;
  type: string;
  size: number;
  created_at: string;
  updated_at: string;
}

export interface KnowledgeBaseConfig {
  isEnabled: boolean;
  config: {
    sources: string[];
    files?: File[];
  };
}

