import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import path from "path";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { assets } = await request.json();

    // 1. Bundle your Remotion code
    const bundleLocation = await bundle({
      entryPoint: path.resolve("./src/remotion/index.ts"),
      webpackOverride: (config: any) => config,
    });

    // 2. Select the specific composition we built
    const composition = await selectComposition({
      serveUrl: bundleLocation,
      id: "ParallelParallax", // CRITICAL: This must match the ID in your Root.tsx
      inputProps: { assets },
    });

    // 3. Define where to save the actual MP4
    const outputLocation = path.resolve("./public/parallel-parallax.mp4");

    // 4. Fire up the local rendering engine!
    await renderMedia({
      composition,
      serveUrl: bundleLocation,
      codec: "h264",
      outputLocation,
      inputProps: { assets },
    });

    // 5. Send the download link back to the browser
    return NextResponse.json({ success: true, url: "/parallel-parallax.mp4" });
  } catch (error) {
    console.error("Render failed:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 },
    );
  }
}
