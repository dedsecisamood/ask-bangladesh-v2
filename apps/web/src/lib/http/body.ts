import "server-only";

export class BodyError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
  ) {
    super(code);
  }
}

/** Fixed byte and wall-clock budgets, including chunked/no-Content-Length bodies.
 * Never await an uncooperative cancellation callback or return raw parse errors.
 */
export async function readBodyText(
  request: Request,
  maxBytes = 4096,
  timeoutMs = 2000,
) {
  const reader = request.body?.getReader();
  if (!reader) throw new BodyError(400, "INVALID_REQUEST");
  let timer: ReturnType<typeof setTimeout> | undefined;
  let abort: (() => void) | undefined;
  const stop = () => {
    void reader.cancel().catch(() => undefined);
  };
  try {
    const work = async () => {
      const chunks: Uint8Array[] = [];
      let bytes = 0;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        bytes += value.byteLength;
        if (bytes > maxBytes) throw new BodyError(413, "REQUEST_TOO_LARGE");
        chunks.push(value);
      }
      try {
        return new TextDecoder("utf-8", { fatal: true }).decode(
          Buffer.concat(chunks),
        );
      } catch {
        throw new BodyError(400, "INVALID_REQUEST");
      }
    };
    const deadline = new Promise<never>((_, reject) => {
      abort = () => reject(new BodyError(408, "REQUEST_TIMEOUT"));
      request.signal.addEventListener("abort", abort, { once: true });
      if (request.signal.aborted) abort();
      timer = setTimeout(abort, timeoutMs);
    });
    return await Promise.race([work(), deadline]);
  } finally {
    if (timer) clearTimeout(timer);
    if (abort) request.signal.removeEventListener("abort", abort);
    stop();
  }
}
