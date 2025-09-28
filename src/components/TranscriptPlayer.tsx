import { useState, useEffect } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassButton } from "@/components/ui/glass-button";
import { 
  Play, 
  Pause, 
  Download, 
  Search, 
  FileText, 
  Users,
  Clock,
  Sparkles,
  Loader2
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface TranscriptPlayerProps {
  transcriptionId: string;
}

interface Transcription {
  id: string;
  youtube_url: string;
  video_title: string | null;
  transcript_text: string | null;
  status: 'processing' | 'completed' | 'failed';
  language: string | null;
  duration_seconds: number | null;
  created_at: string;
  updated_at: string;
}

export const TranscriptPlayer = ({ transcriptionId }: TranscriptPlayerProps) => {
  const [transcription, setTranscription] = useState<Transcription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchTranscription();
    
    // Poll for updates if still processing
    const interval = setInterval(() => {
      if (transcription?.status === 'processing') {
        fetchTranscription();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [transcriptionId, transcription?.status]);

  const fetchTranscription = async () => {
    try {
      const { data, error } = await supabase
        .from('transcriptions')
        .select('*')
        .eq('id', transcriptionId)
        .single();

      if (error) {
        console.error('Error fetching transcription:', error);
        toast({
          title: "Erro",
          description: "Falha ao carregar a transcrição",
          variant: "destructive",
        });
        return;
      }

      setTranscription(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const extractVideoId = (url: string) => {
    const patterns = [
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&\n?#]+)/,
      /(?:https?:\/\/)?youtu\.be\/([^&\n?#]+)/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const formatTranscriptForDisplay = (text: string) => {
    if (!text) return [];
    
    // Simple parsing - split by line breaks and try to identify speakers
    const lines = text.split('\n').filter(line => line.trim());
    return lines.map((line, index) => ({
      id: index + 1,
      speaker: `Locutor ${(index % 2) + 1}`,
      time: `${String(Math.floor(index * 30 / 60)).padStart(2, '0')}:${String((index * 30) % 60).padStart(2, '0')}`,
      timestamp: index * 30,
      text: line.trim(),
      color: index % 2 === 0 ? "bg-primary/20 border-primary/40" : "bg-success/20 border-success/40"
    }));
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-7xl mx-auto space-y-6">
        <GlassCard className="p-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Carregando transcrição...</p>
        </GlassCard>
      </div>
    );
  }

  if (!transcription) {
    return (
      <div className="w-full max-w-7xl mx-auto space-y-6">
        <GlassCard className="p-8 text-center">
          <p className="text-muted-foreground">Transcrição não encontrada</p>
        </GlassCard>
      </div>
    );
  }

  if (transcription.status === 'failed') {
    return (
      <div className="w-full max-w-7xl mx-auto space-y-6">
        <GlassCard className="p-8 text-center">
          <p className="text-destructive mb-4">Falha na transcrição</p>
          <p className="text-muted-foreground">Houve um erro ao processar este vídeo. Tente novamente.</p>
        </GlassCard>
      </div>
    );
  }

  const videoId = extractVideoId(transcription.youtube_url);
  const transcriptLines = transcription.transcript_text ? formatTranscriptForDisplay(transcription.transcript_text) : [];
  
  const filteredTranscript = transcriptLines.filter(line =>
    line.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
    line.speaker.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const exportFormats = [
    { name: "SRT", icon: FileText, description: "Legendas SubRip" },
    { name: "VTT", icon: FileText, description: "WebVTT" },
    { name: "TXT", icon: FileText, description: "Texto simples" },
    { name: "PDF", icon: FileText, description: "Documento PDF" },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Header with title and controls */}
      <div className="glass-card p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">
              {transcription.video_title || "Vídeo transcrito"}
            </h1>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="bg-glass/50">
                <Users className="h-3 w-3 mr-1" />
                2 Locutores
              </Badge>
              <Badge variant="secondary" className="bg-glass/50">
                <Clock className="h-3 w-3 mr-1" />
                {transcription.duration_seconds ? `${Math.floor(transcription.duration_seconds / 60)}:${String(transcription.duration_seconds % 60).padStart(2, '0')} min` : "N/A"}
              </Badge>
              <Badge variant="secondary" className="bg-glass/50">
                <Sparkles className="h-3 w-3 mr-1" />
                {transcription.language || "Português"}
              </Badge>
              {transcription.status === 'processing' && (
                <Badge variant="secondary" className="bg-warning/20">
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  Processando...
                </Badge>
              )}
            </div>
          </div>
          
          {transcription.status === 'completed' && (
            <div className="flex gap-2">
              {exportFormats.map((format) => (
                <GlassButton
                  key={format.name}
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <format.icon className="h-4 w-4" />
                  {format.name}
                </GlassButton>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Video Player */}
        <div className="space-y-4">
          <GlassCard className="aspect-video bg-black/50 flex items-center justify-center">
            {videoId ? (
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${videoId}`}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="rounded-lg"
              />
            ) : (
              <div className="text-center space-y-4">
                <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
                  <Play className="h-10 w-10 text-primary fill-current" />
                </div>
                <p className="text-muted-foreground">
                  Não foi possível carregar o vídeo
                </p>
              </div>
            )}
          </GlassCard>
        </div>

        {/* Transcript */}
        <div className="space-y-4">
          {/* Search - only show if transcript is completed */}
          {transcription.status === 'completed' && transcriptLines.length > 0 && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar na transcrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-glass/50 border-glass-border"
              />
            </div>
          )}

          {/* Transcript Lines */}
          <GlassCard className="h-[500px] overflow-y-auto">
            <div className="p-4 space-y-3">
              {transcription.status === 'processing' && (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                  <p className="text-muted-foreground">
                    Processando transcrição...
                  </p>
                </div>
              )}
              
              {transcription.status === 'completed' && transcriptLines.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    Nenhum texto de transcrição disponível
                  </p>
                </div>
              )}

              {transcription.status === 'completed' && filteredTranscript.map((line) => (
                <div
                  key={line.id}
                  className={cn(
                    "transcript-line cursor-pointer p-4 rounded-lg border transition-all",
                    line.color,
                    searchTerm && line.text.toLowerCase().includes(searchTerm.toLowerCase()) 
                      ? "bg-warning/10 border-warning/30" 
                      : ""
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 space-y-1">
                      <div className="text-xs font-medium text-primary">
                        {line.speaker}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {line.time}
                      </div>
                    </div>
                    <p className="text-sm leading-relaxed flex-1">
                      {searchTerm ? (
                        <span
                          dangerouslySetInnerHTML={{
                            __html: line.text.replace(
                              new RegExp(`(${searchTerm})`, 'gi'),
                              '<mark class="bg-warning/30 px-1 rounded">$1</mark>'
                            )
                          }}
                        />
                      ) : (
                        line.text
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};