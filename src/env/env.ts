export const ENV = {
  PROD: "production",
  PREVIEW: "preview",
  LOCAL: "development",
} as const;

export type Env = (typeof ENV)[keyof typeof ENV];
