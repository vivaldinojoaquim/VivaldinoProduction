
import { GoogleGenAI, Modality } from "@google/genai";

const API_KEY = process.env.API_KEY || "";

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export const generateScript = async (params: {
  contentType: string;
  theme: string;
  newsText: string;
  modelText: string;
}): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const prompt = `
    Aja como um roteirista profissional. 
    Crie um(a) ${params.contentType} profundo, reflexivo, claro e envolvente.
    Linguagem: Português (Brasil), acessível mas elegante.
    Estrutura: Lógica e com mensagem impactante.
    Tom: Inspirador e educativo.

    Informações Base:
    - Tema: ${params.theme || 'Não especificado'}
    - Notícia Relacionada: ${params.newsText || 'Nenhuma'}
    - Texto Modelo/Referência: ${params.modelText || 'Nenhum'}

    Instruções Adicionais:
    Foque na essência do tema e crie uma narrativa que conecte emocionalmente com o público.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      temperature: 0.8,
      topK: 40,
      topP: 0.9,
    }
  });

  return response.text || "";
};

export const generateAudio = async (text: string, voiceName: string, audioContext: AudioContext): Promise<AudioBuffer> => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  // Basic validation/fallback for voice names
  const validVoices = ['Kore', 'Puck', 'Charon', 'Fenrir', 'Zephyr'];
  const voiceToUse = validVoices.includes(voiceName) ? voiceName : 'Kore';

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: `Say with a natural and expressive tone: ${text}` }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: voiceToUse },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) {
    throw new Error("Não foi possível gerar o áudio.");
  }

  const audioData = decode(base64Audio);
  return await decodeAudioData(audioData, audioContext, 24000, 1);
};
