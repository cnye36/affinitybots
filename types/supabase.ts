export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      agents: {
        Row: {
          id: string;
          created_at: string;
          name: string;
          description: string | null;
          model_type: string | null;
          prompt_template: string | null;
          tools: Json | null;
          owner_id: string;
          agent_type: string | null;
          config: Json | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          name: string;
          description?: string | null;
          model_type?: string | null;
          prompt_template?: string | null;
          tools?: Json | null;
          owner_id: string;
          agent_type?: string | null;
          config?: Json | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          name?: string;
          description?: string | null;
          model_type?: string | null;
          prompt_template?: string | null;
          tools?: Json | null;
          owner_id?: string;
          agent_type?: string | null;
          config?: Json | null;
          updated_at?: string | null;
        };
      };
      chat_threads: {
        Row: {
          id: string;
          created_at: string;
          agent_id: string;
          user_id: string;
          title: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          agent_id: string;
          user_id: string;
          title: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          agent_id?: string;
          user_id?: string;
          title?: string;
        };
      };
      agent_chats: {
        Row: {
          id: string;
          created_at: string;
          thread_id: string;
          agent_id: string;
          role: string;
          content: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          thread_id: string;
          agent_id: string;
          role: string;
          content: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          thread_id?: string;
          agent_id?: string;
          role?: string;
          content?: string;
        };
      };
      workflow_agents: {
        Row: {
          id: string;
          created_at: string;
          workflow_id: string;
          agent_id: string;
          position: Json;
        };
        Insert: {
          id?: string;
          created_at?: string;
          workflow_id: string;
          agent_id: string;
          position: Json;
        };
        Update: {
          id?: string;
          created_at?: string;
          workflow_id?: string;
          agent_id?: string;
          position?: Json;
        };
      };
    };
  };
}
