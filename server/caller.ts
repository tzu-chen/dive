import { appRouter } from './routers/_app';
import { createCallerFactory } from './trpc';

const createCaller = createCallerFactory(appRouter);

export function getCaller() {
  return createCaller({});
}
