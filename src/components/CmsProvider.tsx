"use client";

import { createContext, useContext, type ReactNode } from "react";
import { defaultCms, type CmsContent } from "@/lib/cms-types";

type PublicCms = Pick<CmsContent, "contact" | "store" | "nav">;

const Ctx = createContext<PublicCms>(defaultCms);

/** Makes admin-edited content (contact details, store settings) available to interactive components. */
export function CmsProvider({ value, children }: { value: PublicCms; children: ReactNode }) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useCms = () => useContext(Ctx);
