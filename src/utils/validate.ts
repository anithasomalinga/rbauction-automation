import { z } from 'zod';

/** Validates data against a Zod schema and returns the typed result, or throws a readable error. */
export function validate<S extends z.ZodType>(schema: S, data: unknown, source: string): z.output<S> {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new Error(
      `${source} does not match the expected schema:\n${z.prettifyError(result.error)}`,
    );
  }
  return result.data;
}
