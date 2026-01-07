
import React, { useState, useCallback, useRef } from 'react';
import { ContentType, AppState } from './types';
import { VOICES, ICONS } from './constants';
import { generateScript, generateAudio } from './services/geminiService';
import VoiceCard from './components/VoiceCard';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    contentType: 'História',
    theme: '',
    newsText: '',
    modelText: '',
    generatedScript: '',
    selectedVoice: VOICES[0].name,
    isGeneratingScript: false,
    isGeneratingAudio: false,
    audioBuffer: null,
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const initAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    return audioContextRef.current;
  };

  const handleGenerateScript = async () => {
    if (!state.theme && !state.newsText && !state.modelText) {
      alert("Por favor, preencha pelo menos um campo de entrada (Tema, Notícia ou Texto Modelo).");
      return;
    }

    setState(prev => ({ ...prev, isGeneratingScript: true }));
    try {
      const script = await generateScript({
        contentType: state.contentType,
        theme: state.theme,
        newsText: state.newsText,
        modelText: state.modelText,
      });
      setState(prev => ({ ...prev, generatedScript: script, isGeneratingScript: false }));
    } catch (error) {
      console.error(error);
      alert("Erro ao gerar roteiro.");
      setState(prev => ({ ...prev, isGeneratingScript: false }));
    }
  };

  const handleGenerateAudio = async () => {
    if (!state.generatedScript) return;
    
    setState(prev => ({ ...prev, isGeneratingAudio: true, audioBuffer: null }));
    const ctx = initAudioContext();
    
    try {
      // Limit text for TTS to avoid errors if script is too long
      const textToSpeak = state.generatedScript.slice(0, 5000); 
      const buffer = await generateAudio(textToSpeak, state.selectedVoice, ctx);
      setState(prev => ({ ...prev, audioBuffer: buffer, isGeneratingAudio: false }));
      playBuffer(buffer);
    } catch (error) {
      console.error(error);
      alert("Erro ao gerar áudio.");
      setState(prev => ({ ...prev, isGeneratingAudio: false }));
    }
  };

  const handlePreviewVoice = async (voiceName: string) => {
    const ctx = initAudioContext();
    setState(prev => ({ ...prev, isGeneratingAudio: true }));
    try {
      const previewText = `Olá! Eu sou a voz ${voiceName}. Estou pronta para dar vida ao seu roteiro.`;
      const buffer = await generateAudio(previewText, voiceName, ctx);
      playBuffer(buffer);
      setState(prev => ({ ...prev, isGeneratingAudio: false }));
    } catch (error) {
      console.error(error);
      setState(prev => ({ ...prev, isGeneratingAudio: false }));
    }
  };

  const playBuffer = (buffer: AudioBuffer) => {
    const ctx = initAudioContext();
    if (audioSourceRef.current) {
      audioSourceRef.current.stop();
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.onended = () => setIsPlaying(false);
    source.start(0);
    audioSourceRef.current = source;
    setIsPlaying(true);
  };

  const stopAudio = () => {
    if (audioSourceRef.current) {
      audioSourceRef.current.stop();
      setIsPlaying(false);
    }
  };

  const downloadText = () => {
    const element = document.createElement("a");
    const file = new Blob([state.generatedScript], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `roteiro-${state.contentType.toLowerCase()}.txt`;
    document.body.appendChild(element);
    element.click();
  };

  return (
    <div className="min-h-screen flex flex-col items-center py-12 px-4 bg-background text-white selection:bg-secondary/30">
      {/* Header */}
      <header className="text-center mb-16 space-y-4 max-w-2xl">
        <h1 className="text-5xl md:text-6xl font-serif font-bold tracking-tight text-white">
          Vivaldino <span className="text-secondary italic">Production</span>
        </h1>
        <p className="text-white/60 text-lg font-light leading-relaxed">
          Crie roteiros cinematográficos, parábolas inspiradoras e discursos impactantes impulsionados por IA.
        </p>
      </header>

      <main className="w-full max-w-4xl space-y-8">
        {/* Input Card */}
        <div className="bg-primary/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <label className="block text-secondary text-sm font-semibold mb-3 uppercase tracking-widest">
                  Tipo de Conteúdo
                </label>
                <div className="flex gap-2">
                  {(['História', 'Parábola', 'Discurso'] as ContentType[]).map((type) => (
                    <button
                      key={type}
                      onClick={() => setState(prev => ({ ...prev, contentType: type }))}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border transition-all ${
                        state.contentType === type
                          ? 'bg-secondary border-secondary text-primary font-bold'
                          : 'border-white/10 text-white/60 hover:border-white/30'
                      }`}
                    >
                      {type === 'História' && <ICONS.History className="w-5 h-5" />}
                      {type === 'Parábola' && <ICONS.Parable className="w-5 h-5" />}
                      {type === 'Discurso' && <ICONS.Speech className="w-5 h-5" />}
                      <span className="text-sm">{type}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-secondary text-sm font-semibold mb-3 uppercase tracking-widest">
                  Tema da Narrativa
                </label>
                <input
                  type="text"
                  placeholder="Ex: Superação, Amor, Coragem..."
                  value={state.theme}
                  onChange={(e) => setState(prev => ({ ...prev, theme: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3 focus:outline-none focus:border-secondary/50 focus:ring-1 focus:ring-secondary/50 transition-all text-white placeholder:text-white/20"
                />
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-secondary text-sm font-semibold mb-3 uppercase tracking-widest">
                  Base de Conteúdo
                </label>
                <textarea
                  placeholder="Cole uma notícia ou texto modelo aqui..."
                  rows={6}
                  value={state.newsText || state.modelText}
                  onChange={(e) => setState(prev => ({ ...prev, newsText: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3 focus:outline-none focus:border-secondary/50 focus:ring-1 focus:ring-secondary/50 transition-all text-white placeholder:text-white/20 resize-none"
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleGenerateScript}
            disabled={state.isGeneratingScript}
            className="w-full mt-10 py-5 bg-gradient-to-r from-secondary to-accent text-primary font-bold text-xl rounded-2xl shadow-xl shadow-secondary/20 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {state.isGeneratingScript ? (
              <div className="flex items-center justify-center gap-3">
                <div className="w-6 h-6 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                <span>Teclando as primeiras palavras...</span>
              </div>
            ) : (
              "Gerar Roteiro Mestre"
            )}
          </button>
        </div>

        {/* Results Card */}
        {state.generatedScript && (
          <div className="bg-primary/20 backdrop-blur-md border border-white/5 rounded-3xl p-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-serif text-white flex items-center gap-3">
                <div className="w-8 h-[2px] bg-secondary" />
                Roteiro Finalizado
              </h2>
              <button 
                onClick={downloadText}
                className="flex items-center gap-2 text-white/40 hover:text-secondary transition-colors text-sm"
              >
                <ICONS.Download className="w-5 h-5" />
                Baixar TXT
              </button>
            </div>

            <textarea
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-lg leading-relaxed text-white/80 focus:outline-none focus:border-secondary/30 transition-all resize-none mb-8 min-h-[400px]"
              value={state.generatedScript}
              onChange={(e) => setState(prev => ({ ...prev, generatedScript: e.target.value }))}
            />

            <div className="border-t border-white/10 pt-8">
              <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="flex-1 space-y-4">
                  <label className="block text-secondary text-sm font-semibold uppercase tracking-widest">
                    Escolha uma Voz para Narração
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {VOICES.map((v) => (
                      <VoiceCard
                        key={v.name}
                        voice={v}
                        isSelected={state.selectedVoice === v.name}
                        onSelect={(name) => setState(prev => ({ ...prev, selectedVoice: name }))}
                        onPreview={handlePreviewVoice}
                        isGeneratingAudio={state.isGeneratingAudio}
                      />
                    ))}
                  </div>
                </div>

                <div className="w-full md:w-auto flex flex-col gap-4">
                  <button
                    onClick={handleGenerateAudio}
                    disabled={state.isGeneratingAudio}
                    className="flex-1 px-10 py-5 bg-white text-primary font-bold rounded-2xl hover:bg-secondary hover:text-primary transition-all disabled:opacity-50 whitespace-nowrap"
                  >
                    {state.isGeneratingAudio ? "Processando Voz..." : "Gerar Áudio do Roteiro"}
                  </button>
                  
                  {isPlaying && (
                    <button
                      onClick={stopAudio}
                      className="px-6 py-2 border border-red-500/50 text-red-400 text-xs rounded-lg hover:bg-red-500/10 transition-all uppercase tracking-tighter"
                    >
                      Parar Reprodução
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="mt-20 text-white/20 text-sm tracking-widest uppercase">
        Vivaldino Production &copy; {new Date().getFullYear()} — Elegância em Narrativas
      </footer>
    </div>
  );
};

export default App;
