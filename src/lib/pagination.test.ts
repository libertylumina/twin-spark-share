import { describe, test } from "node:test";
import { deepStrictEqual, strictEqual } from "node:assert";
import { paginateItems } from "./pagination";

describe("admin pagination", () => {
  const items = Array.from({ length: 31 }, (_, i) => i + 1);

  test("shows exactly 10 items per complete page", () => {
    deepStrictEqual(paginateItems(items, 1).items, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    deepStrictEqual(paginateItems(items, 2).items, [11, 12, 13, 14, 15, 16, 17, 18, 19, 20]);
    deepStrictEqual(paginateItems(items, 3).items, [21, 22, 23, 24, 25, 26, 27, 28, 29, 30]);
  });

  test("keeps the remaining item on the fourth page", () => {
    deepStrictEqual(paginateItems(items, 4), { page: 4, totalPages: 4, items: [31], start: 31, end: 31 });
  });

  test("clamps pages after filtering or deletion", () => {
    strictEqual(paginateItems([1, 2], 4).page, 1);
    strictEqual(paginateItems(items, -1).page, 1);
    deepStrictEqual(paginateItems([], 4).items, []);
  });
});