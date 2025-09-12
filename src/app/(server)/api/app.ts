import { Hono } from "hono";
import { logger } from "hono/logger";
import { search } from "@/app/(server)/api/search";

export type Env = {
  Variables: {};
};

export const app = new Hono<Env>()
  //
  .basePath(`/api`)
  .use(logger())
  .route("/search", search);
