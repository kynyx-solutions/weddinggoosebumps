# Wedding Goosebumps CMS

This is a Next.js application with a custom CMS panel for managing content, SEO, leads, and activity logs.

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Variables**
   Copy the `.env.example` to `.env` and fill in the required variables:
   ```bash
   cp .env.example .env
   ```
   You will need to provide a valid MySQL `DATABASE_URL` (e.g., from a local XAMPP/Docker instance or managed database) and a random string for `NEXTAUTH_SECRET`.

3. **Database Initialization**
   Run the Prisma migration to create the tables in your database:
   ```bash
   npx prisma db push
   ```

4. **Seed the Database**
   Run the seed script to create the default Super Admin user and migrate the initial home page layout:
   ```bash
   npx tsx prisma/seed.ts
   ```
   *Note: If `npx tsx` is not installed, install it globally or run `npm i -D tsx` first.*

5. **Run the Development Server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000/admin](http://localhost:3000/admin) and log in with:
   - Email: `admin@example.com`
   - Password: `admin123`

## Features & Modules

- **Dynamic Page & Section Management:** Drag-and-drop page sections that seamlessly integrate with your existing frontend UI components.
- **Blog Management:** Full CRUD for blog posts with categories, tags, and scheduling.
- **Global SEO:** Manage Meta tags, Open Graph defaults, and analytics IDs (Google Analytics, GTM, Meta Pixel).
- **Leads Inbox:** Central inbox for capturing and tracking website form submissions.
- **Activity Logs:** Audit trail for administrative actions.

## API Documentation

The CMS exposes several RESTful endpoints used by the admin dashboard. All state-changing endpoints are protected and require a valid NextAuth session.

- `POST /api/pages` - Create a new page. (Body: `{ title, slug }`)
- `PUT /api/pages/[id]` - Update a page and its sections. (Body: `{ title, slug, sections: [...] }`)
- `POST /api/blog` - Create a new blog post. (Body: `{ title, slug }`)
- `POST /api/leads` - Public endpoint for lead submissions. (Body: `{ name, email, phone, message, sourcePage }`)
- `GET /api/seo` - Retrieve global SEO settings.
- `PUT /api/seo` - Update global SEO settings.

## Deployment Notes

- Ensure your hosting provider (e.g., Vercel) has all the environment variables set.
- Run `prisma generate` during the build step. This is usually handled automatically, but ensure it runs before `next build`.
- Set up a MySQL database provider (e.g., Aiven, PlanetScale, or self-hosted) and connect the `DATABASE_URL`.
