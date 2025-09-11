import { ENV } from "@/env/env";
import { isServer } from "@/env/isServer";
import { env } from "std-env";

export const isLocal = (): boolean => {
  if (isServer()) {
    return (
      env.NODE_ENV === ENV.LOCAL ||
      env.TARGET_ENV === ENV.LOCAL ||
      env.VERCEL_TARGET_ENV === ENV.LOCAL ||
      env.MODE === ENV.LOCAL
    );
  }

  return (
    env.NODE_ENV === ENV.LOCAL ||
    env.NEXT_PUBLIC_VERCEL_TARGET_ENV === ENV.LOCAL ||
    globalThis.location?.hostname === "localhost" ||
    isIPAddress(globalThis.location?.hostname)
  );
};

const isIPAddress = (hostname: string) => {
  return /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname);
};
