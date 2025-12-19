import { z } from 'zod';
import { insertUserSchema, users, insertSurveyResponseSchema } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  users: {
    create: {
      method: 'POST' as const,
      path: '/api/users',
      input: insertUserSchema,
      responses: {
        201: z.custom<typeof users.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/users/:id',
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    updateProfile: {
      method: 'PATCH' as const,
      path: '/api/users/:id/profile',
      input: z.object({
        demographics: z.record(z.any()).optional(),
        preferences: z.record(z.any()).optional(),
      }),
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    }
  },
  survey: {
    generate: {
      method: 'POST' as const,
      path: '/api/survey/generate',
      input: z.object({
        question: z.string(),
        userId: z.number(),
      }),
      responses: {
        200: z.object({
          answer: z.string(),
          modelUsed: z.string(),
          logs: z.array(z.string()),
        }),
        500: errorSchemas.internal,
      },
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
