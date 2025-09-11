import { ENV } from "@/env/env";
import { isServer } from "@/env/isServer";

const localHost = isServer() ? "localhost" : location.hostname;

export const HOST = {
  [ENV.PROD]: `https://blog.nextrows.com`,
  [ENV.LOCAL]: `http://${localHost}:3000`,
} as const;
