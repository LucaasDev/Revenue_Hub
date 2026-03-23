/**
 * Root page — delegates to (marketing)/page.tsx which handles:
 * - Auth check: redirects authenticated users to their workspace dashboard
 * - Landing page: shows marketing content for unauthenticated visitors
 *
 * Having this re-export avoids the Next.js route-group conflict where
 * both app/page.tsx and app/(marketing)/page.tsx would map to '/'.
 */
export { default } from './(marketing)/page'
