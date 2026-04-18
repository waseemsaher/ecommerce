import '../styles/pages/Products.css';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getProducts } from '../api/products';
import ProductCard from '../components/shared/ProductCard';
import { ProductGridSkeleton } from '../components/ui/Skeleton';
import Button from '../components/ui/Button';
import { Search, SlidersHorizontal, ChevronLeft, ChevronRight, X } from 'lucide-react';

export default function Products() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    sort: '',
    min_price: '',
    max_price: '',
  });

  // Build query params
  const params = { page, per_page: 12 };
  if (search) params.search = search;
  if (filters.sort) params.sort = filters.sort;
  if (filters.min_price) params.min_price = filters.min_price;
  if (filters.max_price) params.max_price = filters.max_price;

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['products', params],
    queryFn: () => getProducts(params),
    keepPreviousData: true,
    staleTime: 30000,
  });

  const products = data?.data || [];
  const meta = data?.meta || {};
  const hasActiveFilters = filters.sort || filters.min_price || filters.max_price;

  const clearFilters = () => {
    setFilters({ sort: '', min_price: '', max_price: '' });
    setSearch('');
    setPage(1);
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  return (
    <div className="products-page page-enter">
      <div className="products-page__inner container">
        {/* Header */}
        <div className="products-page__header">
          <div>
            <h1 className="products-page__title">Products</h1>
            <p className="products-page__count">
              {meta.total ? `${meta.total} products found` : 'Browse our collection'}
            </p>
          </div>
        </div>

        {/* Search + Filter Bar */}
        <div className="products-page__toolbar">
          <div className="products-page__search">
            <Search size={18} className="products-page__search-icon" />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="products-page__search-input"
              id="products-search"
            />
            {search && (
              <button
                className="products-page__search-clear"
                onClick={() => { setSearch(''); setPage(1); }}
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <button
            className={`products-page__filter-toggle ${showFilters ? 'products-page__filter-toggle--active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <SlidersHorizontal size={18} />
            <span>Filters</span>
            {hasActiveFilters && <span className="products-page__filter-dot" />}
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="products-page__filters glass">
            <div className="products-page__filter-group">
              <label className="products-page__filter-label">Sort By</label>
              <select
                className="products-page__select"
                value={filters.sort}
                onChange={(e) => handleFilterChange('sort', e.target.value)}
                id="filter-sort"
              >
                <option value="">Default</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="name_asc">Name: A-Z</option>
                <option value="created_desc">Newest First</option>
              </select>
            </div>

            <div className="products-page__filter-group">
              <label className="products-page__filter-label">Min Price</label>
              <input
                type="number"
                className="products-page__filter-input"
                placeholder="0"
                value={filters.min_price}
                onChange={(e) => handleFilterChange('min_price', e.target.value)}
                min="0"
                id="filter-min-price"
              />
            </div>

            <div className="products-page__filter-group">
              <label className="products-page__filter-label">Max Price</label>
              <input
                type="number"
                className="products-page__filter-input"
                placeholder="1000"
                value={filters.max_price}
                onChange={(e) => handleFilterChange('max_price', e.target.value)}
                min="0"
                id="filter-max-price"
              />
            </div>

            {hasActiveFilters && (
              <button className="products-page__clear-btn" onClick={clearFilters}>
                <X size={14} />
                <span>Clear all</span>
              </button>
            )}
          </div>
        )}

        {/* Product Grid */}
        {isLoading ? (
          <ProductGridSkeleton count={12} />
        ) : products.length === 0 ? (
          <div className="products-page__empty">
            <div className="products-page__empty-icon">🔍</div>
            <h3>No products found</h3>
            <p>Try adjusting your search or filters.</p>
            {(search || hasActiveFilters) && (
              <Button variant="secondary" onClick={clearFilters}>
                Clear Filters
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className={`product-grid ${isFetching ? 'product-grid--loading' : ''}`}>
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {/* Pagination */}
            {meta.last_page > 1 && (
              <div className="products-page__pagination">
                <Button
                  variant="secondary"
                  size="sm"
                  icon={ChevronLeft}
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>

                <div className="products-page__page-info">
                  <span className="products-page__page-current">{page}</span>
                  <span className="products-page__page-sep">of</span>
                  <span>{meta.last_page}</span>
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  icon={ChevronRight}
                  iconPosition="right"
                  disabled={page >= meta.last_page}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
