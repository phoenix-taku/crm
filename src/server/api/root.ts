import { contactRouter } from "~/server/api/routers/contact";
import { dealRouter } from "~/server/api/routers/deal";
import { customFieldRouter } from "~/server/api/routers/customField";
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  contact: contactRouter,
  deal: dealRouter,
  customField: customFieldRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.contact.getAll();
 *       ^? Contact[]
 */
export const createCaller = createCallerFactory(appRouter);
