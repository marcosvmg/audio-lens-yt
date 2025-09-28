import { useState } from "react";
import { GlassButton } from "@/components/ui/glass-button";
import { Input } from "@/components/ui/input";
import { Play, Link, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface YouTubeUrlInputProps {
  onSubmit?: (transcriptionId: string) => void;
  isLoading?: boolean;
}

export const YouTubeUrlInput = ({ onSubmit, isLoading = false }: YouTubeUrlInputProps) => {
  const [url, setUrl] = useState("");
  const [isTranscribing, setIsTranscribing] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, insira um link do YouTube",
        variant: "destructive",
      });
      return;
    }

    if (!isValidYouTubeUrl(url)) {
      toast({
        title: "URL inválida",
        description: "Por favor, insira um link válido do YouTube",
        variant: "destructive",
      });
      return;
    }

    setIsTranscribing(true);

    try {
      // Get current user (optional - works for both authenticated and anonymous users)
      const { data: { user } } = await supabase.auth.getUser();
      
      // Call transcription edge function
      const { data, error } = await supabase.functions.invoke('transcribe-youtube', {
        body: {
          youtubeUrl: url.trim(),
          userId: user?.id || null
        }
      });

      if (error) {
        console.error('Transcription error:', error);
        toast({
          title: "Erro na transcrição",
          description: "Falha ao processar o vídeo. Tente novamente.",
          variant: "destructive",
        });
        return;
      }

      if (data?.id) {
        toast({
          title: "Transcrição iniciada",
          description: "O vídeo está sendo processado...",
        });
        if (onSubmit) {
          onSubmit(data.id);
        }
        setUrl(""); // Clear the input
      }

    } catch (error) {
      console.error('Error calling transcription function:', error);
      toast({
        title: "Erro",
        description: "Erro interno. Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setIsTranscribing(false);
    }
  };

  const isValidYouTubeUrl = (url: string) => {
    const pattern = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
    return pattern.test(url);
  };

  const isProcessing = isLoading || isTranscribing;

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
      <div className="glass-card p-8 space-y-6">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-glow-pulse" />
              <div className="relative bg-gradient-primary p-4 rounded-full">
                <Play className="h-8 w-8 text-primary-foreground fill-current" />
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">
              Transcreva qualquer vídeo do YouTube
            </h2>
            <p className="text-muted-foreground text-lg">
              Cole o link e obtenha transcrições precisas com identificação de locutores
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
              <Link className="h-5 w-5" />
            </div>
            <Input
              type="url"
              placeholder="https://www.youtube.com/watch?v=..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className={cn(
                "h-14 pl-12 pr-6 text-base bg-glass/50 backdrop-blur-soft border-glass-border",
                "focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all",
                isValidYouTubeUrl(url) && "border-success/50 ring-1 ring-success/20"
              )}
              disabled={isProcessing}
            />
            {isValidYouTubeUrl(url) && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-success">
                <Sparkles className="h-5 w-5" />
              </div>
            )}
          </div>

          <GlassButton
            variant="primary"
            size="lg"
            type="submit"
            disabled={!url.trim() || isProcessing}
            className="w-full h-14 text-lg font-semibold"
          >
            {isProcessing ? (
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                Processando...
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Play className="h-5 w-5 fill-current" />
                Transcrever Agora
              </div>
            )}
          </GlassButton>
        </div>

        <div className="flex flex-wrap gap-2 justify-center text-xs text-muted-foreground">
          <span className="px-3 py-1 bg-glass/30 rounded-full border border-glass-border">
            Multilíngue
          </span>
          <span className="px-3 py-1 bg-glass/30 rounded-full border border-glass-border">
            Identificação de Locutores
          </span>
          <span className="px-3 py-1 bg-glass/30 rounded-full border border-glass-border">
            Exportação SRT/VTT
          </span>
          <span className="px-3 py-1 bg-glass/30 rounded-full border border-glass-border">
            Resumo Automático
          </span>
        </div>
      </div>
    </form>
  );
};