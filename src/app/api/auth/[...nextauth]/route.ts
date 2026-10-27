import { handlers } from "@/lib/auth";
export const runtime = 'edge'; // 👈 Forces this API route to use Cloudflare Workers
export const { GET, POST } = handlers;
