import { useState } from "react";
import { YouTubeUrlInput } from "@/components/YouTubeUrlInput";
import { TranscriptPlayer } from "@/components/TranscriptPlayer";
import { GlassCard } from "@/components/ui/glass-card";
import { Sparkles, Zap, Globe, Users, FileText, Search } from "lucide-react";

const Index = () => {
  const [currentVideo, setCurrentVideo] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleTranscribe = async (url: string) => {
    setIsProcessing(true);
    
    // Simulate processing time
    setTimeout(() => {
      setCurrentVideo(url);
      setIsProcessing(false);
    }, 3000);
  };

  const features = [
    {
      icon: Users,
      title: "Identificação de Locutores",
      description: "Distingue automaticamente quem está falando no vídeo"
    },
    {
      icon: Globe,
      title: "Multilíngue",
      description: "Suporte para mais de 50 idiomas com detecção automática"
    },
    {
      icon: FileText,
      title: "Múltiplos Formatos",
      description: "Exporte em SRT, VTT, TXT, PDF, DOCX e JSON"
    },
    {
      icon: Search,
      title: "Busca Inteligente",
      description: "Encontre qualquer palavra ou frase na transcrição"
    },
    {
      icon: Zap,
      title: "Processamento Rápido",
      description: "Transcrições precisas em minutos, não horas"
    },
    {
      icon: Sparkles,
      title: "Resumo Automático",
      description: "Gere resumos inteligentes do conteúdo transcrito"
    }
  ];

  if (currentVideo) {
    return (
      <div className="min-h-screen p-6">
        <div className="container mx-auto">
          <TranscriptPlayer videoUrl={currentVideo} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 px-6">
        <div className="container mx-auto text-center space-y-12">
          {/* Main Hero */}
          <div className="space-y-8 animate-fade-in">
            <div className="space-y-4">
              <h1 className="text-5xl lg:text-7xl font-bold bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
                ytranscript
              </h1>
              <h2 className="text-2xl lg:text-3xl font-light text-muted-foreground max-w-3xl mx-auto">
                Transforme qualquer vídeo do YouTube em transcrições precisas com IA
              </h2>
            </div>
            
            <YouTubeUrlInput onSubmit={handleTranscribe} isLoading={isProcessing} />
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-20 animate-slide-up">
            {features.map((feature, index) => (
              <GlassCard key={index} className="p-6 text-center space-y-4 hover:scale-105 transition-transform">
                <div className="mx-auto w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center">
                  <feature.icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* Usage Stats */}
      <section className="py-16 px-6">
        <div className="container mx-auto">
          <GlassCard className="p-8">
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div className="space-y-2">
                <div className="text-3xl font-bold text-primary">10k+</div>
                <div className="text-sm text-muted-foreground">Vídeos Transcritos</div>
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-primary">50+</div>
                <div className="text-sm text-muted-foreground">Idiomas Suportados</div>
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-primary">99.5%</div>
                <div className="text-sm text-muted-foreground">Precisão Média</div>
              </div>
            </div>
          </GlassCard>
        </div>
      </section>
    </div>
  );
};

export default Index;
