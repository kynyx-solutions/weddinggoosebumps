import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import prisma from "@/lib/prisma";
import { authorize } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { r2Delete, r2List } from "@/lib/r2";
import { cloudinaryDelete, cloudinaryList } from "@/lib/cloudinary";
import { uploadStore } from "@/lib/storage";

const ALLOWED_FOLDERS = ["blog", "pages", "seo", "gallery", "hero", "team", "temp"];
const IMAGE_FILE = /\.(jpg|jpeg|png|gif|webp|svg|avif)$/i;

// Adds each image's saved description (alt text)
async function withAlt<T extends { url: string }>(images: T[]) {
  const assets = await prisma.mediaAsset.findMany({
    where: { url: { in: images.map((image) => image.url) } },
    select: { url: true, alt: true },
  });
  const alts = new Map(assets.map((asset) => [asset.url, asset.alt ?? ""]));
  return images.map((image) => ({ ...image, alt: alts.get(image.url) ?? "" }));
}

const unauthorized = () =>
  NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

export async function GET(req: NextRequest) {
  try {
    const access = await authorize(null);
    if ("denied" in access) return access.denied;

    const folder = req.nextUrl.searchParams.get("folder") || "blog";

    if (!ALLOWED_FOLDERS.includes(folder)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid folder",
        },
        { status: 400 }
      );
    }

    const store = uploadStore();
    if (store !== "local") {
      const objects =
        store === "cloudinary" ? await cloudinaryList(`uploads/${folder}/`) : await r2List(`uploads/${folder}/`);
      const images = objects
        .map((object) => ({
          name: object.key.slice(`uploads/${folder}/`.length),
          url: `/${object.key}`,
          size: object.size,
          createdAt: object.lastModified,
        }))
        .filter((image) => IMAGE_FILE.test(image.name) && !image.name.includes("/"))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      return NextResponse.json({
        success: true,
        images: await withAlt(images),
      });
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads", folder);

    if (!fs.existsSync(uploadDir)) {
      return NextResponse.json({
        success: true,
        images: [],
      });
    }

    const files = fs.readdirSync(uploadDir);

    const images = files
      .filter((file) => IMAGE_FILE.test(file))
      .map((file) => {
        const stat = fs.statSync(path.join(uploadDir, file));

        return {
          name: file,
          url: `/uploads/${folder}/${file}`,
          size: stat.size,
          createdAt: stat.birthtime,
        };
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({
      success: true,
      images: await withAlt(images),
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to load images",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const access = await authorize("content");
    if ("denied" in access) return access.denied;
    const { session } = access;

    const { folder, name } = await req.json();

    // `name` must be a bare file name, so "../" can't reach outside the uploads folder
    if (!ALLOWED_FOLDERS.includes(folder) || typeof name !== "string" || path.basename(name) !== name) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid folder or file name",
        },
        { status: 400 }
      );
    }

    const store = uploadStore();
    if (store !== "local") {
      if (store === "cloudinary") await cloudinaryDelete(`uploads/${folder}/${name}`);
      else await r2Delete(`uploads/${folder}/${name}`);
      await logActivity(session.user.id, `Deleted image ${name}`, "Media", { folder });

      return NextResponse.json({
        success: true,
        message: "Image deleted successfully",
      });
    }

    const filePath = path.join(process.cwd(), "public", "uploads", folder, name);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        {
          success: false,
          error: "Image not found",
        },
        { status: 404 }
      );
    }

    fs.unlinkSync(filePath);
    await logActivity(session.user.id, `Deleted image ${name}`, "Media", { folder });

    return NextResponse.json({
      success: true,
      message: "Image deleted successfully",
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to delete image",
      },
      { status: 500 }
    );
  }
}
