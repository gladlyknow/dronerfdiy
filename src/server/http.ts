export const apiJson = (data: unknown, status = 200) =>
  Response.json(data, { status, headers: { 'cache-control': 'no-store' } });

export const apiError = (code: string, message: string, status: number) =>
  apiJson({ error: { code, message } }, status);
