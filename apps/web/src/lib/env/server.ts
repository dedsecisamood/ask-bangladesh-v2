import "server-only";
import { parseServerEnvironment } from "./schema";

export const serverEnvironment = parseServerEnvironment({
  APP_ORIGIN: process.env.APP_ORIGIN,
  CHAT_MODE: process.env.CHAT_MODE,
});
