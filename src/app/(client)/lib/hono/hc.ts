import { getEnv } from "@/env/getEnv";
import { HOST } from "@/env/host";
import { isServer } from "@/env/isServer";
import { hc as honoClient } from "hono/client";
import type { app } from "@/app/(server)/api/app";
import { BASE_PATH } from "@/env/basePath";

export const hc = honoClient<typeof app>(
  `${isServer() ? HOST[getEnv()] : location.origin}${BASE_PATH}`,
);
