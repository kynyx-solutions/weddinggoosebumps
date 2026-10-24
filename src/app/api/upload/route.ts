import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { auth } from "@/lib/auth";
import { isR2Configured, r2Put } from "@/lib/r2";

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
        message: "Upload failed",
      },
      { status: 500 }
    );
  }
}
