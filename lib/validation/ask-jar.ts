import { z } from 'zod';
export const askJarSchema = z.object({ conversationId: z.string().uuid().optional(), message: z.string().min(3).max(4000), name: z.string().min(2).max(120).optional(), email: z.string().email().optional(), company: z.string().max(160).optional(), metadata: z.record(z.string(), z.unknown()).optional() });
