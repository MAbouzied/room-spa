import type { APIRoute } from 'astro';
import { blogMutationCacheTags } from '../../../../modules/blog/cache.ts';
import {
  deleteAdminPost,
  getAdminPost,
  importAdminImageFromUrl,
  listAdminPosts,
  listAdminServices,
  reserveAdminDraft,
  saveAdminPost,
  setAdminPostStatus,
  uploadAdminImage,
} from '../../../../lib/admin/blog-admin.ts';
import { readAdminImportUrlBody, readAdminPostPayload } from '../../../../lib/admin/blog-admin-helpers.ts';
import { requireAdminApiAccess } from '../../../../lib/staff-access/admin-auth.ts';
import { adminApiError, hasSameOrigin } from '../../../../lib/staff-access/http.ts';

export const prerender = false;

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });
}

async function readPayload(request: Request) {
  const payload = await request.json() as Partial<Record<string, unknown>>;
  return readAdminPostPayload(payload);
}

async function invalidateBlogCache(context: Parameters<APIRoute>[0], postId: string): Promise<void> {
  if (!context.cache?.enabled) return;
  try {
    await context.cache.invalidate({ tags: blogMutationCacheTags(postId) });
  } catch (error) {
    console.error(`Blog cache invalidation failed for ${postId}`, error);
  }
}

export const GET: APIRoute = async ({ params, locals }) => {
  const denied = requireAdminApiAccess(locals);
  if (denied) return denied;
  const path = (params.path ?? '').split('/').filter(Boolean);
  if (path.length === 0 || path[0] === 'posts') {
    if (path[1]) return json(await getAdminPost(path[1]));
    return json({ posts: await listAdminPosts(), services: listAdminServices() });
  }
  if (path[0] === 'services') return json({ services: listAdminServices() });
  return json({ error: 'غير موجود' }, 404);
};

export const POST: APIRoute = async (context) => {
  const { params, locals, request } = context;
  const denied = requireAdminApiAccess(locals);
  if (denied) return denied;
  if (!hasSameOrigin(request)) return adminApiError('FORBIDDEN');
  const path = (params.path ?? '').split('/').filter(Boolean);
  try {
    if (path[0] === 'assets') {
      if (path[1] === 'import') {
        const payload = await request.json().catch(() => ({})) as Partial<Record<string, unknown>>;
        const { url } = readAdminImportUrlBody(payload);
        return json(await importAdminImageFromUrl(url), 201);
      }
      const formData = await request.formData();
      const file = formData.get('file');
      if (!(file instanceof File)) return json({ error: 'اختر ملف صورة أولاً.' }, 400);
      if (!file.type.startsWith('image/')) return json({ error: 'يسمح برفع ملفات الصور فقط.' }, 400);
      if (file.size > 10 * 1024 * 1024) return json({ error: 'حجم الصورة يجب ألا يتجاوز 10 ميجابايت.' }, 400);
      return json(await uploadAdminImage(file), 201);
    }
    if (path[0] === 'posts') {
      if (path[1] === 'reserve') {
        const payload = await request.json().catch(() => ({})) as { reservationId?: unknown };
        const reservationId = typeof payload.reservationId === 'string' ? payload.reservationId : '';
        return json(await reserveAdminDraft(reservationId), 201);
      }
      if (path[1] && path[2] === 'publish') {
        const post = await setAdminPostStatus(path[1], true);
        if (!post) return json({ error: 'المقال غير موجود' }, 404);
        await invalidateBlogCache(context, post.id);
        return json(post);
      }
      if (path[1] && path[2] === 'unpublish') {
        const post = await setAdminPostStatus(path[1], false);
        if (!post) return json({ error: 'المقال غير موجود' }, 404);
        await invalidateBlogCache(context, post.id);
        return json(post);
      }
      const post = await saveAdminPost(undefined, await readPayload(request), false);
      await invalidateBlogCache(context, post.id);
      return json(post, 201);
    }
    return json({ error: 'غير موجود' }, 404);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'تعذر حفظ المقال' }, 400);
  }
};

export const PUT: APIRoute = async (context) => {
  const { params, locals, request } = context;
  const denied = requireAdminApiAccess(locals);
  if (denied) return denied;
  if (!hasSameOrigin(request)) return adminApiError('FORBIDDEN');
  const path = (params.path ?? '').split('/').filter(Boolean);
  if (path[0] !== 'posts' || !path[1]) return json({ error: 'غير موجود' }, 404);
  try {
    const post = await saveAdminPost(path[1], await readPayload(request), false);
    await invalidateBlogCache(context, post.id);
    return json(post);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'تعذر تحديث المقال' }, 400);
  }
};

export const DELETE: APIRoute = async (context) => {
  const { params, locals, request } = context;
  const denied = requireAdminApiAccess(locals);
  if (denied) return denied;
  if (!hasSameOrigin(request)) return adminApiError('FORBIDDEN');
  const path = (params.path ?? '').split('/').filter(Boolean);
  if (path[0] !== 'posts' || !path[1]) return json({ error: 'غير موجود' }, 404);
  await deleteAdminPost(path[1]);
  await invalidateBlogCache(context, path[1]);
  return json({ ok: true });
};
