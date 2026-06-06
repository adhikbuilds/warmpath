type Level = "info" | "warn" | "error";

interface LogCtx {
  route?: string;
  method?: string;
  status?: number;
  durationMs?: number;
  userId?: string;
  workspaceId?: string;
  error?: unknown;
  [key: string]: unknown;
}

function serialize(val: unknown): string {
  if (val instanceof Error) return `${val.name}: ${val.message}`;
  if (typeof val === "object" && val !== null) {
    try {
      return JSON.stringify(val);
    } catch {
      return String(val);
    }
  }
  return String(val);
}

function emit(level: Level, msg: string, ctx: LogCtx = {}) {
  const { error, ...rest } = ctx;
  const entry: Record<string, unknown> = {
    ts: new Date().toISOString(),
    level,
    msg,
    ...rest,
  };
  if (error !== undefined) {
    entry.error = serialize(error);
  }
  // Single-line JSON so Azure Log Analytics / CloudWatch can parse each line as a record
  const out = JSON.stringify(entry);
  if (level === "error") console.error(out);
  else if (level === "warn") console.warn(out);
  else console.log(out);
}

export const logger = {
  info: (msg: string, ctx?: LogCtx) => emit("info", msg, ctx),
  warn: (msg: string, ctx?: LogCtx) => emit("warn", msg, ctx),
  error: (msg: string, ctx?: LogCtx) => emit("error", msg, ctx),

  /** Wrap an async route handler — logs timing, catches unhandled errors */
  route<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = Date.now();
    return fn()
      .then((result) => {
        emit("info", `${name} ok`, { route: name, durationMs: Date.now() - start });
        return result;
      })
      .catch((err) => {
        emit("error", `${name} unhandled error`, {
          route: name,
          durationMs: Date.now() - start,
          error: err,
        });
        throw err;
      });
  },
};
