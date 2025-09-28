import { useState } from "react";
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
  Sparkles
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Mock transcript data
const mockTranscript = [
  {
    id: 1,
    speaker: "Locutor 1",
    time: "00:12",
    timestamp: 12,
    text: "Olá pessoal, bem-vindos ao nosso canal! Hoje vamos falar sobre inteligência artificial e como ela está transformando o mundo dos negócios.",
    color: "bg-primary/20 border-primary/40"
  },
  {
    id: 2,
    speaker: "Locutor 2", 
    time: "00:28",
    timestamp: 28,
    text: "Essa é realmente uma revolução incrível. A IA está mudando completamente a forma como trabalhamos e vivemos.",
    color: "bg-success/20 border-success/40"
  },
  {
    id: 3,
    speaker: "Locutor 1",
    time: "00:45",
    timestamp: 45,
    text: "Exatamente! E uma das aplicações mais interessantes é no processamento de linguagem natural, como a transcrição automática que vocês estão vendo agora.",
    color: "bg-primary/20 border-primary/40"
  },
  {
    id: 4,
    speaker: "Locutor 2",
    time: "01:02",
    timestamp: 62,
    text: "Sim, a precisão dessas ferramentas melhorou drasticamente nos últimos anos. Antes era comum ter muitos erros, agora conseguimos transcrições quase perfeitas.",
    color: "bg-success/20 border-success/40"
  }
];

interface TranscriptPlayerProps {
  videoUrl: string;
  title?: string;
}

export const TranscriptPlayer = ({ videoUrl, title = "Vídeo transcrito" }: TranscriptPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeLineId, setActiveLineId] = useState<number | null>(1);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredTranscript = mockTranscript.filter(line =>
    line.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
    line.speaker.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleLineClick = (timestamp: number, id: number) => {
    setActiveLineId(id);
    // Here would integrate with video player to seek to timestamp
    console.log(`Seeking to ${timestamp} seconds`);
  };

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
            <h1 className="text-2xl font-bold">{title}</h1>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="bg-glass/50">
                <Users className="h-3 w-3 mr-1" />
                2 Locutores
              </Badge>
              <Badge variant="secondary" className="bg-glass/50">
                <Clock className="h-3 w-3 mr-1" />
                5:30 min
              </Badge>
              <Badge variant="secondary" className="bg-glass/50">
                <Sparkles className="h-3 w-3 mr-1" />
                Português
              </Badge>
            </div>
          </div>
          
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
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Video Player */}
        <div className="space-y-4">
          <GlassCard className="aspect-video bg-black/50 flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
                <Play className="h-10 w-10 text-primary fill-current" />
              </div>
              <p className="text-muted-foreground">
                Player do YouTube seria integrado aqui
              </p>
            </div>
          </GlassCard>
          
          {/* Player Controls */}
          <div className="glass-card p-4">
            <div className="flex items-center justify-between">
              <GlassButton
                variant="ghost"
                size="icon"
                onClick={() => setIsPlaying(!isPlaying)}
              >
                {isPlaying ? (
                  <Pause className="h-5 w-5" />
                ) : (
                  <Play className="h-5 w-5 fill-current" />
                )}
              </GlassButton>
              
              <div className="flex-1 mx-4">
                <div className="h-2 bg-glass/50 rounded-full overflow-hidden">
                  <div className="h-full w-1/3 bg-gradient-primary rounded-full" />
                </div>
              </div>
              
              <span className="text-sm text-muted-foreground min-w-[60px]">
                01:45 / 05:30
              </span>
            </div>
          </div>
        </div>

        {/* Transcript */}
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar na transcrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-glass/50 border-glass-border"
            />
          </div>

          {/* Transcript Lines */}
          <GlassCard className="h-[500px] overflow-y-auto">
            <div className="p-4 space-y-3">
              {filteredTranscript.map((line) => (
                <div
                  key={line.id}
                  onClick={() => handleLineClick(line.timestamp, line.id)}
                  className={cn(
                    "transcript-line cursor-pointer p-4 rounded-lg border transition-all",
                    line.color,
                    activeLineId === line.id && "active ring-2 ring-primary/50",
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