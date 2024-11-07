 import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function* createOpenAIStream(prompt: string) {
  const stream = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
    stream: true,
  });

  for await (const chunk of stream) {
    if (chunk.choices[0]?.delta?.content) {
      yield chunk.choices[0].delta.content;
    }
  }
}