import { cloudinaryConfig, type CloudinaryConfig } from "./storage";

// Admin uploads on Cloudinary, kept under the same keys as in R2 ("uploads/blog/123-abc.jpg" →
// public id "uploads/blog/123-abc"), so they're served at
// res.cloudinary.com/<cloud>/image/upload/uploads/blog/123-abc.jpg and /uploads/... keeps working.
// Uses Cloudinary's REST API directly (no SDK), which also runs on Cloudflare Workers.

export class CloudinaryError extends Error {}

function requireConfig(): CloudinaryConfig {
  const config = cloudinaryConfig();
  if (!config) throw new CloudinaryError("Cloudinary isn't set up on this server");
  return config;
}

const publicIdOf = (key: string) => key.replace(/\.[^./]+$/, "");

async function sha1Hex(text: string) {
  const hash = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(text));
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Cloudinary's signature: the parameters sorted by name as a query string, then the API secret
async function signedForm(params: Record<string, string>, config: CloudinaryConfig) {
  const toSign = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  const form = new FormData();
  for (const [key, value] of Object.entries(params)) form.append(key, value);
  form.append("api_key", config.apiKey);
  form.append("signature", await sha1Hex(toSign + config.apiSecret));
  return form;
}

async function ensureOk(res: Response, action: string) {
  if (res.ok) return;
  const data = await res.json().catch(() => null);
  const reason = data?.error?.message ?? `HTTP ${res.status}`;
  throw new CloudinaryError(`Cloudinary couldn't ${action}: ${reason}`);
}

const timestamp = () => String(Math.floor(Date.now() / 1000));

export async function cloudinaryPut(key: string, body: ArrayBuffer, contentType: string) {
  const config = requireConfig();
  const form = await signedForm({ public_id: publicIdOf(key), timestamp: timestamp() }, config);
  form.append("file", new Blob([body], { type: contentType }));
  const res = await fetch(`https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`, {
    method: "POST",
    body: form,
  });
  await ensureOk(res, "store the image");
}

export async function cloudinaryDelete(key: string) {
  const config = requireConfig();
  const form = await signedForm(
    { public_id: publicIdOf(key), timestamp: timestamp(), invalidate: "true" },
    config
  );
  const res = await fetch(`https://api.cloudinary.com/v1_1/${config.cloudName}/image/destroy`, {
    method: "POST",
    body: form,
  });
  await ensureOk(res, "delete the image");
}

// Images under a prefix ("uploads/blog/"), as keys with their extension, like the R2 listing
export async function cloudinaryList(prefix: string) {
  const config = requireConfig();
  const auth = `Basic ${btoa(`${config.apiKey}:${config.apiSecret}`)}`;
  const items: { key: string; size: number; lastModified: string }[] = [];
  let cursor: string | undefined;

  do {
    const url = new URL(`https://api.cloudinary.com/v1_1/${config.cloudName}/resources/image/upload`);
    url.searchParams.set("prefix", prefix);
    url.searchParams.set("max_results", "500");
    if (cursor) url.searchParams.set("next_cursor", cursor);

    const res = await fetch(url, { headers: { Authorization: auth } });
    await ensureOk(res, "list the images");
    const data = await res.json();
    for (const resource of data.resources ?? []) {
      items.push({
        key: `${resource.public_id}.${resource.format}`,
        size: resource.bytes,
        lastModified: resource.created_at,
      });
    }
    cursor = data.next_cursor;
  } while (cursor);

  return items;
}
