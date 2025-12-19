declare global {
  namespace Express {
    interface Request {
      rawBody?: Buffer;
      userId?: string;
    }
  }
}

export {};