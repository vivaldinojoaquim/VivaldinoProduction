
export type ContentType = 'História' | 'Parábola' | 'Discurso';

export interface Voice {
  name: string;
  gender: 'male' | 'female' | 'neutral';
  preview_enabled: boolean;
}

export interface AppState {
  contentType: ContentType;
  theme: string;
  newsText: string;
  modelText: string;
  generatedScript: string;
  selectedVoice: string;
  isGeneratingScript: boolean;
  isGeneratingAudio: boolean;
  audioBuffer: AudioBuffer | null;
}
