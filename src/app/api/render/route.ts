import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({
    message:
      "Rendering is performed client-side via WebCodecs (@remotion/web-renderer).",
  });
}
