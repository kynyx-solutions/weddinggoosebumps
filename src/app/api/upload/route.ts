import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { auth } from "@/lib/auth";
import { isR2Configured, r2Put, R2Error } from "@/lib/r2";

// Vercel and Cloudflare have no lasting disk, so uploads there only work through R2
const onServerlessHost = () =>
  Boolean(process.env.VERCEL) ||
  (typeof navigator !== "undefined" && navigator.userAgent === "Cloudflare-Workers");

const ALLOWED_FOLDERS = [
  "blog",
  "pages",
  "seo",
  "gallery",
  "hero",
  "team",
  "temp",
];

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const formData = await req.formData();

    const file = formData.get("file") as File;
    const folder = (formData.get("folder") as string) || "temp";

    if (!file) {
      return NextResponse.json(
        { success: false, message: "No file uploaded" },
        { status: 400 }
      );
    }

    if (!ALLOWED_FOLDERS.includes(folder)) {
      return NextResponse.json(
        { success: false, message: "Invalid folder" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();

    // Keep only a plain extension from the uploaded name
    const ext = path.extname(file.name).toLowerCase().replace(/[^a-z0-9.]/g, "");

    const filename =
      Date.now() +
      "-" +
      Math.random().toString(36).substring(2, 8) +
      ext;

    if (isR2Configured()) {
      // Served at /uploads/... through the CDN rewrite in next.config.ts
      await r2Put(`uploads/${folder}/${filename}`, bytes, file.type || "application/octet-stream");
    } else if (onServerlessHost()) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Image storage isn't set up on this server. Add R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY and R2_BUCKET to the hosting environment variables, then redeploy.",
        },
        { status: 500 }
      );
    } else {
      // Local development without R2 credentials: write into public/
      const uploadDir = path.join(
        process.cwd(),
        "public",
        "uploads",
        folder
      );

      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      fs.writeFileSync(path.join(uploadDir, filename), Buffer.from(bytes));
    }

    return NextResponse.json({
      success: true,
      url: `/uploads/${folder}/${filename}`,
      filename,
    });
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      {
        success: false,
        // admin-only route, so R2's error code is safe to show and says what to fix
        message: err instanceof R2Error ? err.message : "Upload failed",
      },
      { status: 500 }
    );
  }
}
