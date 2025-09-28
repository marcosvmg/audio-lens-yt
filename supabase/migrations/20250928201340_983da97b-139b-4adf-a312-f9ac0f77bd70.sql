-- Create enum for transcription status
CREATE TYPE public.transcription_status AS ENUM ('processing', 'completed', 'failed');

-- Create transcriptions table
CREATE TABLE public.transcriptions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    youtube_url TEXT NOT NULL,
    video_title TEXT,
    transcript_text TEXT,
    status transcription_status NOT NULL DEFAULT 'processing',
    language TEXT,
    duration_seconds INTEGER,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.transcriptions ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own transcriptions" 
ON public.transcriptions 
FOR SELECT 
USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can create transcriptions" 
ON public.transcriptions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own transcriptions" 
ON public.transcriptions 
FOR UPDATE 
USING (auth.uid() = user_id OR user_id IS NULL);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_transcriptions_updated_at
    BEFORE UPDATE ON public.transcriptions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();