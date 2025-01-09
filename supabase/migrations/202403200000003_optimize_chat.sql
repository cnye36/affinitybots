-- Create a table for chat threads
CREATE TABLE IF NOT EXISTS chat_threads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID NOT NULL REFERENCES agents(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Modify agent_chats to be message-focused
ALTER TABLE agent_chats
DROP COLUMN IF EXISTS name,
DROP COLUMN IF EXISTS thread_id,
ADD COLUMN IF NOT EXISTS thread_id UUID REFERENCES chat_threads(id);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_threads_agent_user ON chat_threads(agent_id, user_id);
CREATE INDEX IF NOT EXISTS idx_agent_chats_thread ON agent_chats(thread_id);

-- Add trigger to update thread's updated_at
CREATE OR REPLACE FUNCTION update_thread_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE chat_threads 
  SET updated_at = now()
  WHERE id = NEW.thread_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER update_thread_timestamp
AFTER INSERT ON agent_chats
FOR EACH ROW
EXECUTE FUNCTION update_thread_timestamp(); 