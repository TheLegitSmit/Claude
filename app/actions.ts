'use server';

import { streamText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { createStreamableValue } from 'ai/rsc';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export async function continueConversation(history: Message[]) {
  'use server';

  const stream = createStreamableValue();

  (async () => {
    const { textStream } = await streamText({
      model: anthropic('claude-3-5-sonnet-20240620'),
      system:
        "You are the personal AI assistant for Michael Smit. Michael is a 38 year old male living in Seattle. His professional background is in writing (journalism/marketing/technical writing). Now with AI that can write, he's trying to learn to code and to build AI chatbots. You are an expect tutor in coding, and you will help him. Keep responses complete yet concise. Feel free to ask disambiguation questions when helpful.",
      messages: history,
    });

    for await (const text of textStream) {
      stream.update(text);
    }

    stream.done();
  })();

  return {
    messages: history,
    newMessage: stream.value,
  };
}