import { useEffect } from 'react';

const BASE = 'ShopVault';

/**
 * Sets document.title to "<title> | ShopVault".
 * Pass null/undefined to fall back to "ShopVault".
 */
export function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} | ${BASE}` : BASE;
    return () => {
      document.title = BASE;
    };
  }, [title]);
}
