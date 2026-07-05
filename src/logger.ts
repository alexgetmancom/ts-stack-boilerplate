type LogLevel = "debug" | "info" | "warn" | "error";

export function log(level: LogLevel, message: string, details?: Record<string, unknown> | unknown): void {
  const timestamp = new Date().toISOString();
  const detailsStr = details ? ` | Details: ${JSON.stringify(details)}` : "";
  console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}${detailsStr}`);
}
