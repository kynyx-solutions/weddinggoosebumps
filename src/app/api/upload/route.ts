import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { authorize } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { r2Put, R2Error } from "@/lib/r2";
import { cloudinaryPut, CloudinaryError } from "@/lib/cloudinary";
import { uploadStore } from "@/lib/storage";

// Vercel and Cloudflare have no lasting disk, so uploads there need Cloudinary or R2
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
    const access = await authorize("content");
    if ("denied" in access) return access.denied;
    const { session } = access;

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

    const store = uploadStore();

    // Keep only a plain extension from the uploaded name. Cloudinary records .jpeg as jpg, so
    // those are named .jpg there and the address matches what Cloudinary serves.
    const rawExt = path.extname(file.name).toLowerCase().replace(/[^a-z0-9.]/g, "");
    const ext = store === "cloudinary" && rawExt === ".jpeg" ? ".jpg" : rawExt;

    const filename =
      Date.now() +
      "-" +
      Math.random().toString(36).substring(2, 8) +
      ext;

    // Either way the file is served at /uploads/... through the rewrite in next.config.ts
    if (store === "cloudinary") {
      await cloudinaryPut(`uploads/${folder}/${filename}`, bytes, file.type || "application/octet-stream");
    } else if (store === "r2") {
      await r2Put(`uploads/${folder}/${filename}`, bytes, file.type || "application/octet-stream");
    } else if (onServerlessHost()) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Image storage isn't set up on this server. Add CLOUDINARY_URL (or the four R2_ variables) to the hosting environment variables, then redeploy.",
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

    await logActivity(session.user.id, `Uploaded image ${filename}`, "Media", { folder });

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
        // admin-only route, so the storage service's error is safe to show and says what to fix
        message: err instanceof R2Error || err instanceof CloudinaryError ? err.message : "Upload failed",
      },
      { status: 500 }
    );
  }
}
