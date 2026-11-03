import "server-only";
import { getCms } from "../cms";
import type { CmsCategory } from "../cms-types";

// The shop's categories come from the admin panel (Website → Categories):
// "live" ones are on sale, "soon" ones show as coming soon, "hidden" ones don't appear.

export const ALL_HANDLE = "all";

export interface Catalogue {
  allHandle: string;
  categories: CmsCategory[];
  comingSoon: CmsCategory[];
  all: CmsCategory[];
  zodiacHandle: string;
}

export async function getCatalogue(): Promise<Catalogue> {
  const cms = await getCms();
  return {
    allHandle: ALL_HANDLE,
    categories: cms.categories.filter((c) => c.status === "live"),
    comingSoon: cms.categories.filter((c) => c.status === "soon"),
    all: cms.categories,
    zodiacHandle: cms.store.zodiacCategory,
  };
}
