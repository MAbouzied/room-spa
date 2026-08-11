import { serviceCategories } from '../../data/services.ts';

/**
 * Admin "related service" options.
 * Keep `${category.id}-${index + 1}` IDs stable so existing Sanity posts that
 * stored values like `massage-1` continue to match editor options. Public page
 * anchors use `ServiceItem.id` separately via `serviceAnchorId()`.
 */
export function listAdminServices(): Array<{ id: string; title: string }> {
  return serviceCategories.flatMap((category) =>
    category.items.map((item, index) => ({
      id: `${category.id}-${index + 1}`,
      title: `${category.title} — ${item.name}`,
    })),
  );
}
