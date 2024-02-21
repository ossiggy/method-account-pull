import dotenv from 'dotenv';
import { Method, Environments } from 'method-node';

dotenv.config();

export const method = new Method({
  apiKey: process.env.METHOD_API_KEY || '',
  env: Environments[process.env.METHOD_ENV as keyof typeof Environments]
});