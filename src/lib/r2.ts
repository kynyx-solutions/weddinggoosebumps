import { AwsClient } from "aws4fetch";

// Admin uploads go to the R2 bucket behind the CDN (ASSET_BASE) through R2's S3 API, since
// serverless hosts (Vercel, Cloudflare Workers) have no writable disk. Keys look like
// `uploads/<folder>/<file>` and are served at /uploads/... by the rewrite in next.config.ts.
// Env is read per call because Workers only populate process.env inside a request.
function getR2() {
  const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET } = process.env;
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET) return null;

  return {
    client: new AwsClient({
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
      service: "s3",
      region: "auto",
    }),
    bucketUrl: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${R2_BUCKET}`,
  };
}

export const isR2Configured = () => getR2() !== null;

const objectUrl = (bucketUrl: string, key: string) =>
  `${bucketUrl}/${key.split("/").map(encodeURIComponent).join("/")}`;

function requireR2() {
  const r2 = getR2();
  if (!r2) throw new Error("R2 is not configured");
  return r2;
}

export async function r2Put(key: string, body: ArrayBuffer, contentType: string) {
  const { client, bucketUrl } = requireR2();
  const res = await client.fetch(objectUrl(bucketUrl, key), {
    method: "PUT",
    body,
    headers: { "Content-Type": contentType },
  });
  if (!res.ok) throw new Error(`R2 upload failed (${res.status}): ${await res.text()}`);
}

export async function r2Delete(key: string) {
  const { client, bucketUrl } = requireR2();
  const res = await client.fetch(objectUrl(bucketUrl, key), { method: "DELETE" });
  if (!res.ok) throw new Error(`R2 delete failed (${res.status}): ${await res.text()}`);
}

const unescapeXml = (s: string) =>
  s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");

// ListObjectsV2 returns up to 1,000 objects, which is plenty for one media-library folder
export async function r2List(prefix: string) {
  const { client, bucketUrl } = requireR2();
  const res = await client.fetch(`${bucketUrl}?list-type=2&prefix=${encodeURIComponent(prefix)}`);
  if (!res.ok) throw new Error(`R2 list failed (${res.status}): ${await res.text()}`);
  const xml = await res.text();

  return [...xml.matchAll(/<Contents>([\s\S]*?)<\/Contents>/g)].map(([, entry]) => ({
    key: unescapeXml(entry.match(/<Key>([\s\S]*?)<\/Key>/)?.[1] ?? ""),
    size: Number(entry.match(/<Size>(\d+)<\/Size>/)?.[1] ?? 0),
    lastModified: entry.match(/<LastModified>([\s\S]*?)<\/LastModified>/)?.[1] ?? "",
  }));
}
