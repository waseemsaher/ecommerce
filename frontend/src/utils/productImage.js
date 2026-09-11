const CURATED_PRODUCT_IMAGES = {
  'wireless-headphones': 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
  'mechanical-keyboard': 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80',
  'usb-c-hub': 'https://images.unsplash.com/photo-1625842268584-8f3296236761?auto=format&fit=crop&w=800&q=80',
  'webcam-1080p': 'https://images.unsplash.com/photo-1587826080692-f439cd0b70da?auto=format&fit=crop&w=800&q=80',
  'desk-lamp-led': 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80',
  'mouse-pad-xl': 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=800&q=80',
  'laptop-stand': 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=800&q=80',
  'portable-ssd-1tb': 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=800&q=80',
  'bluetooth-speaker': 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=800&q=80',
  'monitor-27-4k': 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=800&q=80',
};

export function getProductImageUrl(product, size = 800) {
  const explicitImage = product?.image_path;

  // If explicit image exists and is NOT a legacy Picsum placeholder, use it
  if (typeof explicitImage === 'string' && explicitImage.trim() !== '' && !explicitImage.includes('picsum.photos')) {
    return explicitImage;
  }

  // Lookup curated high-res photo by slug or name
  const slug = (product?.slug || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  if (CURATED_PRODUCT_IMAGES[slug]) {
    return CURATED_PRODUCT_IMAGES[slug];
  }

  // Try matching by name
  const nameSlug = (product?.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  if (CURATED_PRODUCT_IMAGES[nameSlug]) {
    return CURATED_PRODUCT_IMAGES[nameSlug];
  }

  // Fallback to high-quality tech Unsplash image
  return `https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=${size}&q=80`;
}