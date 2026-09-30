import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import path from "path";
import fs from "fs";
import os from "os";

let cachedBundle: string | null = null;
let bundlingPromise: Promise<string> | null = null;

async function getBundleLocation(entryPoint: string): Promise<string> {
  if (cachedBundle) return cachedBundle;

  if (!bundlingPromise) {
    bundlingPromise = bundle({
      entryPoint,
      webpackOverride: (config) => config,
    }).then((loc) => {
      cachedBundle = loc;
      bundlingPromise = null;
      return loc;
    });
  }

  return bundlingPromise;
}

export const maxDuration = 300;

export async function POST(req: Request) {
  const encoder = new TextEncoder();
  const body = await req.json();
  const {
    compositionId = "ReelComposition",
    slides,
    photos,
    resolution = "1080p",
    audioUrl,
    audioVolume,
  } = body;

  const dimensions = {
    "1080p": { width: 1080, height: 1920 },
    "2k": { width: 1440, height: 2560 },
    "4k": { width: 2160, height: 3840 },
  }[resolution as "1080p" | "2k" | "4k"] || { width: 1080, height: 1920 };

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        sendEvent({
          status: "preparing",
          progress: 5,
          message: "Preparing render engine...",
        });

        const entryPoint = path.resolve("./src/remotion/index.ts");
        const bundleLocation = await getBundleLocation(entryPoint);

        const fps = 30;
        let totalFrames = 238;
        let inputProps: Record<string, any> = {};

        // Route to the proper preset composition logic
        if (compositionId === "SeamlessSwapComposition") {
          totalFrames = 238;
          inputProps = { photos: photos || [] };
        } else if (compositionId === "GrooveSwapComposition") {
          totalFrames = 229;
          inputProps = { photos: photos || [] };
        } else {
          totalFrames = Math.max(
            1,
            (slides || []).reduce(
              (acc: number, s: any) =>
                acc + Math.round((s.durationInSeconds || 4) * fps),
              0,
            ),
          );
          inputProps = {
            slides: slides || [],
            audioUrl: audioUrl || undefined,
            audioVolume: typeof audioVolume === "number" ? audioVolume : 0.8,
          };
        }

        sendEvent({
          status: "analyzing",
          progress: 12,
          message: "Analyzing composition & audio...",
        });

        const composition = await selectComposition({
          serveUrl: bundleLocation,
          id: compositionId,
          inputProps,
        });

        const outputDir = path.resolve("./public/renders");
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }

        const fileName = `${compositionId.toLowerCase()}-${resolution}-${Date.now()}.mp4`;
        const outputLocation = path.join(outputDir, fileName);

        sendEvent({
          status: "rendering",
          progress: 15,
          message: "Rendering video & mixing audio...",
        });

        const concurrency = Math.min(
          4,
          Math.max(2, Math.floor(os.cpus().length / 2)),
        );

        await renderMedia({
          composition: {
            ...composition,
            width: dimensions.width,
            height: dimensions.height,
            durationInFrames: totalFrames,
            fps,
          },
          serveUrl: bundleLocation,
          codec: "h264",
          outputLocation,
          inputProps,
          imageFormat: "jpeg",
          pixelFormat: "yuv420p",
          crf: 22,
          concurrency,
          onProgress: ({ renderedFrames }) => {
            const frameRatio = renderedFrames / totalFrames;
            const progress = Math.min(95, Math.round(15 + frameRatio * 80));
            sendEvent({
              status: "rendering",
              progress,
              message: `Rendering frames (${renderedFrames}/${totalFrames})...`,
            });
          },
          chromiumOptions: {
            enableMultiProcessOnLinux: true,
            gl: "angle",
          },
          verbose: false,
        });

        sendEvent({
          status: "complete",
          progress: 100,
          downloadUrl: `/renders/${fileName}`,
          message: "Video ready!",
        });

        controller.close();
      } catch (err: any) {
        console.error("Render error:", err);
        sendEvent({ status: "error", message: err.message || "Render failed" });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
