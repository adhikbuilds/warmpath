// Empty stub the Anthropic SDK is Node.js only.
// RemoteAIProvider catches the error and falls back to MockAIProvider.
export default class Anthropic {
  messages = {
    create: async (): Promise<never> => {
      throw new Error("Anthropic SDK not available in browser");
    },
  };
}
