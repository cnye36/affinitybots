-- Enable the pgvector extension to work with embedding vectors
create extension if not exists vector;

-- Create a table for storing document metadata
create table if not exists documents (
    id uuid default gen_random_uuid() primary key,
    agent_id uuid references agents(id) on delete cascade,
    filename text not null,
    type text,
    size integer,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create a table for storing document vectors
create table if not exists document_vectors (
    id uuid default gen_random_uuid() primary key,
    content text not null,
    metadata jsonb,
    embedding vector(1536),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add indexes for better query performance
create index if not exists documents_agent_id_idx on documents(agent_id);
create index if not exists document_vectors_metadata_agent_id_idx on document_vectors((metadata->>'agent_id'));
create index if not exists document_vectors_metadata_document_id_idx on document_vectors((metadata->>'document_id'));

-- Create a function to update the updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = timezone('utc'::text, now());
    return new;
end;
$$ language plpgsql;

-- Create a trigger to automatically update the updated_at column
create trigger update_documents_updated_at
    before update on documents
    for each row
    execute function update_updated_at_column(); 