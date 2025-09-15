import { memoize } from "@fxts/core";
import { UAParser } from "ua-parser-js";

export const getUA = memoize(() => new UAParser().getResult());

export const isMacOS = () => getUA().os.name?.includes("macOS");

export const isWindows = () => getUA().os.name?.includes("Windows");

export const isTouchDevice = () =>
  window.matchMedia("(pointer: coarse)").matches;
