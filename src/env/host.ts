import { ENV } from "@/env/env";
import { isServer } from "@/env/isServer";

const localHost = isServer() ? "localhost" : location.hostname;

export const HOST = {
  [ENV.PROD]: `https://nextrows.com/blog`,
  [ENV.LOCAL]: `http://${localHost}:3000`,
} as const;
