-- Enable RLS
ALTER TABLE chat_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_chats ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own chat threads" ON chat_threads;
DROP POLICY IF EXISTS "Users can insert their own chat threads" ON chat_threads;
DROP POLICY IF EXISTS "Users can update their own chat threads" ON chat_threads;
DROP POLICY IF EXISTS "Users can delete their own chat threads" ON chat_threads;

DROP POLICY IF EXISTS "Users can view their own chat messages" ON agent_chats;
DROP POLICY IF EXISTS "Users can insert their own chat messages" ON agent_chats;
DROP POLICY IF EXISTS "Users can update their own chat messages" ON agent_chats;
DROP POLICY IF EXISTS "Users can delete their own chat messages" ON agent_chats;

-- Create policies for chat_threads
CREATE POLICY "Users can view their own chat threads"
ON chat_threads FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own chat threads"
ON chat_threads FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own chat threads"
ON chat_threads FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chat threads"
ON chat_threads FOR DELETE
USING (auth.uid() = user_id);

-- Create policies for agent_chats
CREATE POLICY "Users can view their own chat messages"
ON agent_chats FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own chat messages"
ON agent_chats FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own chat messages"
ON agent_chats FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chat messages"
ON agent_chats FOR DELETE
USING (auth.uid() = user_id); 