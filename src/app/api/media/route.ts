import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { auth } from "@/lib/auth";
import { isR2Configured, r2Delete, r2List } from "@/lib/r2";

const ALLOWED_FOLDERS = ["blog", "pages", "seo", "gallery", "hero", "team", "temp"];
const IMAGE_FILE = /\.(jpg|jpeg|png|gif|webp|svg|avif)$/i;

const unauthorized = () =>
  NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return unauthorized();

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

    if (isR2Configured()) {
      const images = (await r2List(`uploads/${folder}/`))
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
        images,
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
      images,
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
    const session = await auth();
    if (!session?.user) return unauthorized();

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

    if (isR2Configured()) {
      await r2Delete(`uploads/${folder}/${name}`);

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
