declare module '@mistralai/mistralai' {
  export class MistralClient {
    constructor(apiKey: string);

    chat(options: {
      model: string;
      messages: Array<{
        role: 'system' | 'user' | 'assistant';
        content: string | Array<{
          type: 'text' | 'image_url';
          text?: string;
          image_url?: {
            url: string;
          };
        }>;
      }>;
    }): Promise<{
      choices: Array<{
        message: {
          role: 'assistant';
          content: string;
        };
        index: number;
      }>;
    }>;
  }
}