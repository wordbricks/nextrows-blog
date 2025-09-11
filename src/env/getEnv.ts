import { ENV } from "@/env/env";
import { isLocal } from "@/env/isLocal";

export const getEnv = () => {
  if (isLocal()) return ENV.LOCAL;
  else return ENV.PROD;
};
