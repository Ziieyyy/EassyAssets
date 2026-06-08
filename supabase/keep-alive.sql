-- Enable the pg_cron extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- Create a small table to log our daily pings
CREATE TABLE IF NOT EXISTS public.keep_alive_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    pinged_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on the table (good security practice)
ALTER TABLE public.keep_alive_logs ENABLE ROW LEVEL SECURITY;

-- Schedule a job to insert a new row every day at midnight
SELECT cron.schedule(
    'keep-alive-daily',
    '0 0 * * *',
    $$ INSERT INTO public.keep_alive_logs (pinged_at) VALUES (now()); $$
);

-- Schedule a job to delete logs older than 7 days so it doesn't take up storage
SELECT cron.schedule(
    'cleanup-keep-alive-logs',
    '0 1 * * *',
    $$ DELETE FROM public.keep_alive_logs WHERE pinged_at < now() - interval '7 days'; $$
);
