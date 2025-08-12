import { Request, Response, NextFunction } from 'express';
import { ZodTypeAny, ZodError } from 'zod';

export const validate = (schema: ZodTypeAny) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync(req.body); 
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = Object.fromEntries(
          Object.entries(error.format()).map(([key, val]: any) => [
            key,
            val?._errors?.[0]
          ])
        );

        return res.status(400).json({
          status: 'fail',
          errors: formattedErrors
        });
      }
      next(error);
    }
};
