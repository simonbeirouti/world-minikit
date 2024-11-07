import { Groq } from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function generateQuestions(interests: string[]): Promise<string[]> {
  const prompt = `Given these interests: ${interests.join(', ')}, generate 3-5 engaging questions that would help understand the person better. The questions should be conversational and open-ended. Return only the questions, separated by newlines.`;

  const completion = await groq.chat.completions.create({
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
    model: "mixtral-8x7b-32768",
    temperature: 0.7,
  });

  const questions = completion.choices[0]?.message?.content
    ?.split('\n')
    .filter(q => q.trim().length > 0) || [];

  return questions;
} 