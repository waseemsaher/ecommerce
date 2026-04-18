export function getProductImageUrl(product, size = 800) {
  const explicitImage = product?.image_path;

  if (typeof explicitImage === 'string' && explicitImage.trim() !== '') {
    return explicitImage;
  }

  const seedSource = product?.slug || product?.sku || product?.id || product?.name || 'product';
  const seed = encodeURIComponent(String(seedSource));

  return `https://picsum.photos/seed/${seed}/${size}/${size}`;
}