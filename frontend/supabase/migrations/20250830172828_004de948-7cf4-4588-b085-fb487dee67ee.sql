-- Create table for storing CV generation sessions
CREATE TABLE public.cv_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_language TEXT NOT NULL,
  chat_history JSONB DEFAULT '[]'::jsonb,
  generated_cv JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security (allowing public access for this demo)
ALTER TABLE public.cv_sessions ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to create and read sessions (for demo purposes)
CREATE POLICY "Anyone can create CV sessions" 
ON public.cv_sessions 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can view CV sessions" 
ON public.cv_sessions 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can update CV sessions" 
ON public.cv_sessions 
FOR UPDATE 
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_cv_sessions_updated_at
  BEFORE UPDATE ON public.cv_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();