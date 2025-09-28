import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const googleApiKey = Deno.env.get('GOOGLE_API_KEY')!;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { youtubeUrl, userId } = await req.json();
    
    if (!youtubeUrl) {
      return new Response(
        JSON.stringify({ error: 'YouTube URL is required' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Create transcription record
    const { data: transcription, error: insertError } = await supabase
      .from('transcriptions')
      .insert({
        youtube_url: youtubeUrl,
        user_id: userId,
        status: 'processing'
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating transcription record:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to create transcription record' }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract video ID from YouTube URL
    const videoId = extractYouTubeVideoId(youtubeUrl);
    if (!videoId) {
      await supabase
        .from('transcriptions')
        .update({ status: 'failed' })
        .eq('id', transcription.id);
        
      return new Response(
        JSON.stringify({ error: 'Invalid YouTube URL' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Call Google Gemini API for transcription
    try {
      const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${googleApiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                fileData: {
                  fileUri: `https://www.youtube.com/watch?v=${videoId}`
                }
              },
              {
                text: 'Transcreva o vídeo completo incluindo identificação de locutores quando possível. Formate a transcrição de forma clara e organize por timestamps.'
              }
            ]
          }]
        })
      });

      if (!geminiResponse.ok) {
        throw new Error(`Gemini API error: ${geminiResponse.status}`);
      }

      const geminiData = await geminiResponse.json();
      const transcriptText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!transcriptText) {
        throw new Error('No transcription text received from Gemini API');
      }

      // Update transcription record with result
      const { error: updateError } = await supabase
        .from('transcriptions')
        .update({
          transcript_text: transcriptText,
          status: 'completed',
          language: 'pt' // Default to Portuguese, could be enhanced with language detection
        })
        .eq('id', transcription.id);

      if (updateError) {
        console.error('Error updating transcription:', updateError);
        throw new Error('Failed to save transcription');
      }

      return new Response(
        JSON.stringify({ 
          id: transcription.id,
          status: 'completed',
          transcript: transcriptText
        }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (geminiError) {
      console.error('Gemini API error:', geminiError);
      
      // Update status to failed
      await supabase
        .from('transcriptions')
        .update({ status: 'failed' })
        .eq('id', transcription.id);

      const errorMessage = geminiError instanceof Error ? geminiError.message : 'Unknown error occurred';
      
      return new Response(
        JSON.stringify({ 
          error: 'Transcription failed',
          details: errorMessage 
        }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Error in transcribe-youtube function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&\n?#]+)/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([^&\n?#]+)/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/v\/([^&\n?#]+)/,
    /(?:https?:\/\/)?youtu\.be\/([^&\n?#]+)/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }
  return null;
}