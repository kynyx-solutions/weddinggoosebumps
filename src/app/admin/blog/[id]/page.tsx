import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { notFound } from "next/navigation";
import BlogEditor from "@/components/admin/blog-editor";

export default async function EditBlogPost({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;

  const [post, destinations, categories] = await Promise.all([
    prisma.blogPost.findUnique({
      where: { id },
      include: {
        categories: { select: { categoryId: true } },
        tags: { select: { tag: { select: { name: true } } } },
      },
    }),
    prisma.destination.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select: { id: true, name: true },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  if (!post || post.deletedAt) {
    notFound();
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold">Edit Post</h1>
      <BlogEditor initialPost={post} destinations={destinations} categories={categories} />
    </div>
  );
}
