
import React from 'react';
import { Voice } from '../types';
import { ICONS } from '../constants';

interface VoiceCardProps {
  voice: Voice;
  isSelected: boolean;
  onSelect: (name: string) => void;
  onPreview: (name: string) => void;
  isGeneratingAudio: boolean;
}

const VoiceCard: React.FC<VoiceCardProps> = ({ voice, isSelected, onSelect, onPreview, isGeneratingAudio }) => {
  return (
    <div 
      onClick={() => onSelect(voice.name)}
      className={`relative p-4 rounded-xl border-2 transition-all cursor-pointer group ${
        isSelected 
          ? 'border-secondary bg-primary shadow-[0_0_15px_rgba(201,162,77,0.3)]' 
          : 'border-white/10 bg-white/5 hover:border-white/30'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className={`text-sm font-semibold tracking-wide ${isSelected ? 'text-secondary' : 'text-white/70'}`}>
          {voice.name}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPreview(voice.name);
          }}
          disabled={isGeneratingAudio}
          className="p-2 rounded-full bg-secondary/10 hover:bg-secondary/30 text-secondary transition-colors disabled:opacity-50"
          title="Ouvir voz"
        >
          <ICONS.Play className="w-4 h-4" />
        </button>
      </div>
      <div className="text-xs text-white/50 uppercase tracking-tighter">
        {voice.gender === 'female' ? 'Feminina' : voice.gender === 'male' ? 'Masculina' : 'Neutra'}
      </div>
      
      {isSelected && (
        <div className="absolute -top-1 -right-1">
          <div className="w-3 h-3 bg-secondary rounded-full animate-pulse" />
        </div>
      )}
    </div>
  );
};

export default VoiceCard;
