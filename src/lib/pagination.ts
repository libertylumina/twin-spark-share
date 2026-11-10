export const ADMIN_PAGE_SIZE = 10;

export function paginateItems<T>(items: readonly T[], requestedPage: number) {
  const totalPages = Math.max(1, Math.ceil(items.length / ADMIN_PAGE_SIZE));
  const page = Math.min(totalPages, Math.max(1, Number.isSafeInteger(requestedPage) ? requestedPage : 1));
  const offset = (page - 1) * ADMIN_PAGE_SIZE;
  return {
    page,
    totalPages,
    items: items.slice(offset, offset + ADMIN_PAGE_SIZE),
    start: items.length ? offset + 1 : 0,
    end: Math.min(offset + ADMIN_PAGE_SIZE, items.length),
  };
}