type LogLevel = "debug" | "info" | "warn" | "error";

export function log(level: LogLevel, message: string, details?: Record<string, unknown> | unknown): void {
  const timestamp = new Date().toISOString();

  if (process.env.NODE_ENV === "production") {
    // Structured JSON logging for production monitoring (ELK, Loki, Datadog)
    console.log(
      JSON.stringify({
        timestamp,
        level: level.toUpperCase(),
        message,
        ...(details && typeof details === "object" ? { details } : details !== undefined ? { details } : {}),
      }),
    );
  } else {
    // Human-readable logging for local development
    const detailsStr = details ? ` | Details: ${JSON.stringify(details)}` : "";
    console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}${detailsStr}`);
  }
}
