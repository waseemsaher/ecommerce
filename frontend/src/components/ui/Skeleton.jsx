import './Skeleton.css';

export function Skeleton({ width, height, radius, className = '' }) {
  return (
    <div
      className={`skeleton-block ${className}`}
      style={{
        width: width || '100%',
        height: height || '1rem',
        borderRadius: radius || 'var(--radius-md)',
      }}
    />
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="skeleton-product-card">
      <Skeleton height="220px" radius="var(--radius-lg) var(--radius-lg) 0 0" />
      <div className="skeleton-product-card__body">
        <Skeleton height="0.75rem" width="40%" />
        <Skeleton height="1.1rem" width="80%" />
        <Skeleton height="0.85rem" width="60%" />
        <div className="skeleton-product-card__footer">
          <Skeleton height="1.5rem" width="30%" />
          <Skeleton height="2.25rem" width="6rem" radius="var(--radius-md)" />
        </div>
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }) {
  return (
    <div className="product-grid">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}
