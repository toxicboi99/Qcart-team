import { NextResponse } from "next/server";

export function errorResponse(message, status = 400, extra = {}) {
  return NextResponse.json({ error: message, ...extra }, { status });
}
