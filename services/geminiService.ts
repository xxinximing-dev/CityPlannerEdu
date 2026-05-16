import { GameState } from "../types";

export async function getAIAdvice(state: GameState): Promise<string> {
  return "AI suggestion is temporarily disabled in this demo. Please continue the collaboration task.";
}

export async function generateFeedback(state: GameState): Promise<string> {
  return "AI suggestion is temporarily disabled in this demo. Please continue the collaboration task.";
}

export async function speakAdvice(text: string): Promise<void> {
  console.log("Mock speaking: ", text);
}
