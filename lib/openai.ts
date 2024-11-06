import OpenAI from 'openai';

// Only initialize on server side
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL,
});

export { openai }; 