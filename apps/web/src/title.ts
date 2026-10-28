import { useEffect } from "react";

/** The visible route appears first so browser tabs are distinguishable. */
export function buildDocumentTitle(section: string, assetCode?: string, openBreaks = 0): string {
  const context = assetCode ? `${section} - ${assetCode}` : section;
  const count = Number.isFinite(openBreaks) && openBreaks > 0 ? `(${openBreaks}) ` : "";
  return `${count}${context} - Concord`;
}

export function useDocumentTitle(title: string) {
  useEffect(() => {
    document.title = title;
  }, [title]);
}
