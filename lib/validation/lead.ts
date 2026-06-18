import { z } from 'zod';
export const leadSchema = z.object({ name: z.string().min(2), email: z.string().email(), company: z.string().optional(), message: z.string().min(3), source: z.string().default('contact') });
