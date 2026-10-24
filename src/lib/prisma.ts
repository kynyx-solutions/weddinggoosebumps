import { PrismaClient } from '@prisma/client';
import { PrismaTiDBCloud } from '@tidbcloud/prisma-adapter';
import { getCloudflareContext } from '@opennextjs/cloudflare';

// Workers can't load Prisma's native query engine, so the Cloudflare build uses the
// WebAssembly client; the bundler would otherwise pick the Node build.
const isCloudflareWorker =
  typeof navigator !== 'undefined' && navigator.userAgent === 'Cloudflare-Workers';

// TiDB Cloud (Cloudflare beta) is reached over HTTPS through its Prisma adapter,
// since Workers can't open MySQL TCP connections. The local MariaDB in .env keeps
// using Prisma's normal connection.
const prismaClientSingleton = (): PrismaClient => {
  const url = process.env.DATABASE_URL ?? '';
  if (url.includes('.tidbcloud.com')) {
    const Client: typeof PrismaClient = isCloudflareWorker
      ? // `require` because the package's ESM entry (wasm.mjs) isn't generated
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        require('@prisma/client/wasm').PrismaClient
      : PrismaClient;
    return new Client({ adapter: new PrismaTiDBCloud({ url }) });
  }
  return new PrismaClient();
};

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

// On Cloudflare a client must not be shared between requests (Prisma batches queries,
// and Workers forbid I/O across requests), so each request gets its own.
const requestClients = new WeakMap<object, PrismaClient>();

function getClient(): PrismaClient {
  let requestCtx: object | undefined;
  try {
    requestCtx = getCloudflareContext().ctx;
  } catch {
    // Not inside a Cloudflare request: next dev, next build, next start
  }

  if (!requestCtx) {
    return (globalThis.prismaGlobal ??= prismaClientSingleton());
  }

  let client = requestClients.get(requestCtx);
  if (!client) {
    client = prismaClientSingleton();
    requestClients.set(requestCtx, client);
  }
  return client;
}

// Keeps every existing `import prisma from "@/lib/prisma"` call site unchanged
const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getClient();
    const value = Reflect.get(client, prop);
    return typeof value === 'function' ? value.bind(client) : value;
  },
});

export default prisma;
