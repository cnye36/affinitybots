-- Add foreign key constraint to user_assistants table
alter table public.user_assistants
add constraint user_assistants_assistant_id_fkey
foreign key (assistant_id) references public.assistant(assistant_id)
on delete cascade;

-- Add index to improve join performance
create index if not exists idx_user_assistants_assistant_id 
on public.user_assistants(assistant_id);

-- Add index for user_id lookups
create index if not exists idx_user_assistants_user_id 
on public.user_assistants(user_id); 