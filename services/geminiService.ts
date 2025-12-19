
import { GoogleGenAI, Modality } from "@google/genai";
import { GameState } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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

export async function getAIAdvice(state: GameState): Promise<string> {
  try {
    const prompt = `
      You are an AI city advisor for a kids' educational game called EcoCity.
      Current stats:
      - Gold: ${state.gold} (${state.goldDelta}/min)
      - Population: ${state.population}/${state.maxPopulation}
      - Power: ${state.power}/${state.powerCapacity}
      - Pollution: ${state.pollution}%
      - Happiness: ${state.happiness}%
      
      Give a short, encouraging advice (1-2 sentences) in Chinese for the player on how to improve the city.
      Focus on the most critical bottleneck.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || "城市运转良好，继续保持！";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "正在分析城市数据...";
  }
}

export async function generateFeedback(state: GameState): Promise<string> {
  try {
    const prompt = `
      Based on a city with ${state.pollution}% pollution and ${state.happiness}% happiness, 
      generate a one-sentence citizen feedback message in Chinese. 
      If pollution is high, complain about air. If happiness is low, complain about parks or services.
    `;
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "我觉得这里挺好的。";
  } catch {
    return "我们需要更多公园！";
  }
}

let audioContext: AudioContext | null = null;

export async function speakAdvice(text: string): Promise<void> {
  try {
    if (!audioContext) {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `用温柔亲切的声音说：${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      const audioBuffer = await decodeAudioData(
        decode(base64Audio),
        audioContext,
        24000,
        1,
      );
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      source.start();
    }
  } catch (error) {
    console.error("TTS Error:", error);
  }
}
