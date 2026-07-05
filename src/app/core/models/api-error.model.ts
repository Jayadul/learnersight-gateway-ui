/**
 * Backend error payload. The API returns ASP.NET ProblemDetails
 * (title/detail); `message`/`errors` cover other shapes.
 */
export interface ApiError {
  message?: string;
  title?: string;
  detail?: string;
  errors?: Record<string, string[]>;
}
