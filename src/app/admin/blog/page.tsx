import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";
import PostsTable from "./PostsTable";

const TRASH_DAYS = 30;
const dateFormat = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeZone: "Asia/Kolkata" });

export default async function BlogList({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  await requireAdmin();
  const { view } = await searchParams;
  const trash = view === "trash";

  // Posts left in the trash for 30 days are deleted for good
  await prisma.blogPost.deleteMany({
    where: { deletedAt: { lt: new Date(Date.now() - TRASH_DAYS * 24 * 60 * 60 * 1000) } },
  });

  const [posts, activeCount, trashCount] = await Promise.all([
    prisma.blogPost.findMany({
      where: { deletedAt: trash ? { not: null } : null },
      orderBy: trash ? { deletedAt: "desc" } : { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        publishDate: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
        destination: { select: { name: true } },
        categories: { select: { category: { select: { name: true } } } },
      },
    }),
    prisma.blogPost.count({ where: { deletedAt: null } }),
    prisma.blogPost.count({ where: { deletedAt: { not: null } } }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Blog Posts</h1>
        <Link href="/admin/blog/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Post
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-0">
          <PostsTable
            trash={trash}
            activeCount={activeCount}
            trashCount={trashCount}
            posts={posts.map((post) => ({
              id: post.id,
              title: post.title,
              slug: post.slug,
              status: post.status,
              dateLabel: dateFormat.format(post.publishDate ?? post.createdAt),
              updatedLabel: dateFormat.format(post.updatedAt),
              trashedLabel: post.deletedAt ? dateFormat.format(post.deletedAt) : null,
              destination: post.destination?.name ?? null,
              categories: post.categories.map((c) => c.category.name),
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
