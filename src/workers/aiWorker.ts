import { AIWorkerMessages, calculateAIMove } from "../utils/ai";

self.onmessage = (e: MessageEvent) => {
  const message = e.data as AIWorkerMessages;
  // Perform the expensive AI calculation here
  const move = calculateAIMove(message.state, message.aiPlayer, message.maxDepth);
  // Send the result back to the main thread
  self.postMessage(move);
};