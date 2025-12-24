export interface UserProfile {
  id: string;
  email: string;
  name: string;
  username: string;
  avatar_url: string | null;
  provider: string;
  updated_at?: string;
  preferences?: Record<string, any>;
}
