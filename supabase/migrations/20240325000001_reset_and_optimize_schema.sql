-- Add index for thread-agent relationship
create index if not exists idx_thread_metadata_agent_id 
on thread(((metadata->>'agent_id')::uuid));

-- Add index for common queries
create index if not exists idx_agents_owner_id 
on agents(owner_id);

-- Function to create a new thread for an agent
create or replace function create_thread_for_agent(
  p_agent_id uuid,
  p_user_id uuid,
  p_name text default 'New Chat'
) returns uuid
language plpgsql
security definer
as $$
declare
  v_thread_id uuid;
begin
  -- Generate a new UUID for the thread
  v_thread_id := gen_random_uuid();
  
  -- Create the thread with agent metadata
  insert into thread (
    thread_id,
    metadata,
    config,
    status
  ) values (
    v_thread_id,
    jsonb_build_object(
      'agent_id', p_agent_id,
      'user_id', p_user_id,
      'name', p_name
    ),
    jsonb_build_object(
      'configurable', jsonb_build_object(
        'thread_id', v_thread_id
      )
    ),
    'idle'
  );
  
  return v_thread_id;
end;
$$;