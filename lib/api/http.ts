import { NextResponse } from "next/server";

export interface ApiErrorBody {
  error: string;
  code: string;
}

export function jsonResponse<T>(data: T, status = 200): NextResponse<T> {
  return NextResponse.json(data, { status });
}

export function errorResponse(
  message: string,
  code: string,
  status = 400,
): NextResponse<ApiErrorBody> {
  return NextResponse.json({ error: message, code }, { status });
}

export async function parseJsonBody<T extends Record<string, unknown>>(
  request: Request,
): Promise<T | null> {
  try {
    const body = (await request.json()) as T;
    return body;
  } catch {
    return null;
  }
}
