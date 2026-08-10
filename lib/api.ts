export function successResponse(data: unknown, message?: string) {
  return { success: true, data, message };
}

export function errorResponse(message: string, details?: unknown) {
  return { success: false, message, details };
}
