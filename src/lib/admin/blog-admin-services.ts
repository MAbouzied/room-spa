import { serviceCategories } from '../../data/services.ts';

/**
 * Stable admin "related service" IDs.
 * Keep previously persisted values like `massage-1` so existing Sanity posts
 * still match editor options after the public catalog was reordered.
 * Public page anchors use `ServiceItem.id` separately via `serviceAnchorId()`.
 */
const ADMIN_SERVICE_IDS: Record<string, string> = {
  'room-spa-massage': 'massage-1',
  'shiatsu-massage': 'massage-3',
  'relaxation-massage': 'massage-4',
  'reflexology-massage': 'massage-6',
  'hot-oil-massage': 'massage-7',
  'thai-massage': 'massage-8',
  'sports-massage': 'massage-9',
  'dead-sea-hammam': 'hammam-2',
  'classic-hammam': 'hammam-3',
  'hands-feet-pedicure': 'pedicure-1',
};

export function listAdminServices(): Array<{ id: string; title: string }> {
  return serviceCategories.flatMap((category) =>
    category.items.map((item) => {
      const id = ADMIN_SERVICE_IDS[item.id];
      if (!id) {
        throw new Error(`Missing stable admin service id for ${item.id}`);
      }

      return {
        id,
        title: `${category.title} — ${item.name}`,
      };
    }),
  );
}
