const arabicDateFormatter = new Intl.DateTimeFormat('ar-SA', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  timeZone: 'Asia/Riyadh',
});

export function parseBlogDate(value: string): Date {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid blog date: ${value}`);
  }
  return date;
}

export function formatBlogDateAr(value: string): string {
  return arabicDateFormatter.format(parseBlogDate(value));
}

export function toDateTimeAttribute(value: string): string {
  return parseBlogDate(value).toISOString();
}

/** True when updatedAt is at least one calendar day after publishedAt. */
export function isMeaningfullyUpdated(publishedAt: string, updatedAt?: string): boolean {
  if (!updatedAt) return false;
  const published = parseBlogDate(publishedAt).getTime();
  const updated = parseBlogDate(updatedAt).getTime();
  return updated - published >= 24 * 60 * 60 * 1000;
}

export function lastmodForPost(publishedAt: string, updatedAt?: string): string {
  const value = updatedAt && isMeaningfullyUpdated(publishedAt, updatedAt) ? updatedAt : publishedAt;
  return parseBlogDate(value).toISOString().slice(0, 10);
}
