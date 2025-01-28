-- Create a function to handle atomic creation of agent and assistant
create or replace function create_agent_with_assistant(
  agent_data jsonb,
  assistant_data jsonb
) returns void
language plpgsql
security definer
as $$
begin
  -- Insert the agent
  insert into agents
  select * from jsonb_populate_record(null::agents, agent_data);
  
  -- Insert the corresponding assistant
  insert into assistant
  select * from jsonb_populate_record(null::assistant, assistant_data);
  
  -- Both inserts succeed or both fail (transaction)
  return;
exception
  when others then
    -- Rollback happens automatically on error
    raise exception 'Failed to create agent with assistant: %', sqlerrm;
end;
$$; 