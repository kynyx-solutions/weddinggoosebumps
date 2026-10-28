// Where the site's media lives: Cloudinary, or the R2 bucket behind img.weddinggoosebumps.com
// (public/uploads for admin uploads when neither is set up, in local development).
// With Cloudinary keys present, both the site's photos and videos (/gallery/..., /videos/...)
// and admin uploads (/uploads/...) are served from Cloudinary, which holds copies under the same
// paths. The addresses used in the code and saved in posts never change, so switching back is
// only a change of environment variables (plus copying any new uploads across).
// Reads environment variables only: next.config.ts and the Cloudflare worker import it too.

export type UploadStore = "cloudinary" | "r2" | "local";

export interface CloudinaryConfig {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
}

// CLOUDINARY_URL as shown on the Cloudinary dashboard (cloudinary://<key>:<secret>@<cloud name>),
// or the three separate variables
export function cloudinaryConfig(): CloudinaryConfig | null {
  const url = process.env.CLOUDINARY_URL?.trim();
  const match = url?.match(/^cloudinary:\/\/([^:]+):([^@]+)@(.+)$/);
  if (match) return { apiKey: match[1], apiSecret: match[2], cloudName: match[3] };

  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
  if (CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET) {
    return { cloudName: CLOUDINARY_CLOUD_NAME, apiKey: CLOUDINARY_API_KEY, apiSecret: CLOUDINARY_API_SECRET };
  }
  return null;
}

function r2Ready() {
  const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET } = process.env;
  return Boolean(R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_BUCKET);
}

// Cloudinary whenever its keys are present, unless switched off; then R2, then local files
export function uploadStore(): UploadStore {
  // UPLOAD_STORAGE=r2 turns Cloudinary off even while its keys are set: media is served from the
  // R2 CDN again (no keys needed to read it) and uploads go to R2 when its keys are set
  const cloudinaryOff = process.env.UPLOAD_STORAGE?.trim().toLowerCase() === "r2";
  if (!cloudinaryOff && cloudinaryConfig()) return "cloudinary";
  if (r2Ready()) return "r2";
  return "local";
}

// Folders holding video files; everything else is images (Cloudinary serves the two separately)
const VIDEO_PREFIXES = ["videos"];

// Where files under /<prefix>/ are served from: Cloudinary while it's the active store,
// otherwise the R2 CDN
export function mediaOrigin(prefix: string, r2Base: string) {
  const cloudinary = uploadStore() === "cloudinary" ? cloudinaryConfig() : null;
  if (!cloudinary) return r2Base;
  const type = VIDEO_PREFIXES.includes(prefix) ? "video" : "image";
  return `https://res.cloudinary.com/${cloudinary.cloudName}/${type}/upload`;
}
