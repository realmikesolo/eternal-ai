import { Configuration, OpenAIApi } from 'openai';
import { Env } from '../shared/env';

const configuration = new Configuration({
  apiKey: Env.OPEN_AI_API_KEY,
});

export const openai = new OpenAIApi(configuration);
