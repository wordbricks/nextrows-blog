import { ENV } from "@/env/env";
import { isServer } from "@/env/isServer";

const localHost = isServer() ? "localhost" : location.hostname;

export const HOST = {
  [ENV.PROD]: `https://nextrows-blog.vercel.app`,
  [ENV.LOCAL]: `http://${localHost}:4321`,
} as const;
