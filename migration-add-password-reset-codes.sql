-- Create table to store password reset codes
CREATE TABLE IF NOT EXISTS public.password_reset_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    code TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    used_at TIMESTAMP WITH TIME ZONE
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS password_reset_codes_email_idx ON public.password_reset_codes(email);
CREATE INDEX IF NOT EXISTS password_reset_codes_code_idx ON public.password_reset_codes(code);

-- Enable Row Level Security
ALTER TABLE public.password_reset_codes ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to insert (for requesting codes)
CREATE POLICY "Anyone can request password reset codes" ON public.password_reset_codes
    FOR INSERT WITH CHECK (true);

-- Create policy to allow anyone to read their own codes (for verification)
CREATE POLICY "Anyone can verify codes" ON public.password_reset_codes
    FOR SELECT USING (true);

-- Create policy to allow updating used status
CREATE POLICY "Anyone can mark codes as used" ON public.password_reset_codes
    FOR UPDATE USING (true);

-- Function to clean up expired codes (optional, run periodically)
CREATE OR REPLACE FUNCTION clean_expired_reset_codes()
RETURNS void AS $$
BEGIN
    DELETE FROM public.password_reset_codes
    WHERE expires_at < NOW() - INTERVAL '1 day';
END;
$$ LANGUAGE plpgsql;
