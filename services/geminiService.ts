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
      你是一款名为 EcoCity 的少儿教育游戏的 AI 城市顾问。
      当前数据：
      - 金币：${state.gold} (${state.goldDelta}/分钟)
      - 人口：${state.population}/${state.maxPopulation}
      - 电力：${state.power}/${state.powerCapacity}
      - 污染：${state.pollution}%
      - 幸福度：${state.happiness}%
      
      请为玩家提供简短且富有鼓励性的建议（1-2 句话），告诉他们如何改进城市。
      请使用中文回答，并关注最关键的瓶颈问题。
    `;

    // Switched to gemini-2.5-flash for better stability
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "城市运行良好，继续加油！";
  } catch (error) {
    console.error("Gemini Error (getAIAdvice):", error);
    return "正在分析城市数据...";
  }
}

export async function generateFeedback(state: GameState): Promise<string> {
  try {
    const prompt = `
      基于一个污染度为 ${state.pollution}% 且幸福度为 ${state.happiness}% 的城市，
      生成一条简短的（一句话）公民反馈消息。
      请使用中文回答。
      如果污染高，则抱怨空气质量；如果幸福度低，则抱怨公园或服务设施。
    `;
    // Switched to gemini-2.5-flash for better stability
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "我觉得这里还不错。";
  } catch (error) {
    console.error("Gemini Error (generateFeedback):", error);
    return "我们需要更多的公园！";
  }
}

let audioContext: AudioContext | null = null;

export async function speakAdvice(text: string): Promise<void> {
  try {
    if (!audioContext) {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }

    // Resume context if suspended (browser policy)
    if (audioContext.state === 'suspended') {
      try {
        await audioContext.resume();
      } catch (e) {
        console.warn("AudioContext resume failed, user interaction needed.");
      }
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `请用亲切友好的语气读出以下内容：${text}` }] }],
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