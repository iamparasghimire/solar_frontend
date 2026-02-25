'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import { addToCart, fetchCategories, fetchProducts, type Category, type Product } from '@/lib/api';

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
});

function toNumber(value: string | number) {
  return typeof value === 'number' ? value : Number(value);
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [priceRange, setPriceRange] = useState(20000);
  const [searchQuery, setSearchQuery] = useState('');

  const [accessToken, setAccessToken] = useState(
    () => (typeof window !== 'undefined' ? localStorage.getItem('solar_access_token') || '' : ''),
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cartMessage, setCartMessage] = useState('');

  useEffect(() => {
    fetchCategories()
      .then((rows) => setCategories(rows))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    let active = true;

    fetchProducts({
      search: searchQuery || undefined,
      categorySlug: selectedCategory,
    })
      .then((data) => {
        if (!active) return;
        setError('');
        setProducts(data.results);
        setTotalCount(data.count);
      })
      .catch((err: Error) => {
        if (!active) return;
        setProducts([]);
        setTotalCount(0);
        setError(err.message || 'Failed to load products');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [searchQuery, selectedCategory]);

  const filteredProducts = useMemo(
    () => products.filter((product) => toNumber(product.discounted_price) <= priceRange),
    [products, priceRange],
  );

  const handleAddToCart = async (productId: string) => {
    if (!accessToken.trim()) {
      setCartMessage('Paste a JWT access token to add products to cart.');
      return;
    }

    try {
      await addToCart({
        productId,
        quantity: 1,
        accessToken: accessToken.trim(),
      });
      setCartMessage('Product added to cart.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not add product to cart.';
      setCartMessage(message);
    }
  };

  const persistToken = (value: string) => {
    setAccessToken(value);
    localStorage.setItem('solar_access_token', value);
  };

  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="font-bold text-2xl text-blue-600">EcoPlanet Solar</Link>
            <div className="flex gap-8">
              <Link href="/" className="text-gray-700 hover:text-blue-600">Home</Link>
              <Link href="/products" className="text-gray-700 hover:text-blue-600 font-bold border-b-2 border-blue-600">Products</Link>
              <Link href="/about" className="text-gray-700 hover:text-blue-600">About</Link>
              <Link href="/contact" className="text-gray-700 hover:text-blue-600">Contact</Link>
            </div>
          </div>
        </div>
      </nav>

      <section className="bg-gradient-to-r from-blue-50 to-indigo-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Solar Products</h1>
          <p className="text-lg text-gray-600">Live catalog from Django backend API</p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <label className="block text-sm font-bold text-gray-900 mb-2">JWT Access Token (for Add to Cart)</label>
          <input
            type="text"
            value={accessToken}
            onChange={(e) => persistToken(e.target.value)}
            placeholder="Paste token from /api/auth/login/"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {cartMessage ? <p className="mt-2 text-sm text-gray-700">{cartMessage}</p> : null}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="bg-gray-50 p-6 rounded-lg h-fit">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Filters</h3>

            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-900 mb-2">Search</label>
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="mb-6">
              <h4 className="font-bold text-gray-900 mb-3">Category</h4>
              <div className="space-y-2">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`block w-full text-left px-3 py-2 rounded-lg transition ${
                    selectedCategory === 'all' ? 'bg-blue-600 text-white font-bold' : 'text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All
                </button>
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.slug)}
                    className={`block w-full text-left px-3 py-2 rounded-lg transition ${
                      selectedCategory === category.slug
                        ? 'bg-blue-600 text-white font-bold'
                        : 'text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">Max Price: {currency.format(priceRange)}</label>
              <input
                type="range"
                min="0"
                max="20000"
                step="100"
                value={priceRange}
                onChange={(e) => setPriceRange(Number(e.target.value))}
                className="w-full"
              />
            </div>
          </div>

          <div className="md:col-span-3">
            <div className="mb-6">
              <p className="text-gray-600">
                Showing {filteredProducts.length} products (API total: {totalCount})
              </p>
            </div>

            {loading ? <p className="text-gray-600">Loading products...</p> : null}
            {error ? <p className="text-red-600">{error}</p> : null}

            {!loading && !error && filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => {
                  const originalPrice = toNumber(product.price);
                  const discountedPrice = toNumber(product.discounted_price);

                  return (
                    <div key={product.id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition">
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 h-48 flex items-center justify-center border-b border-gray-200 overflow-hidden">
                        {product.primary_image ? (
                          <img src={product.primary_image} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="text-6xl">☀️</div>
                        )}
                      </div>
                      <div className="p-6">
                        <p className="text-xs text-gray-500 font-bold uppercase mb-2">{product.category_name}</p>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">{product.name}</h3>
                        <p className="text-sm text-gray-600 mb-2">Brand: {product.brand || 'N/A'}</p>
                        <p className="text-sm text-gray-600 mb-4">Capacity: {product.capacity || 'N/A'}</p>

                        <div className="flex justify-between items-center mb-2">
                          <span className="text-2xl font-bold text-blue-600">{currency.format(discountedPrice)}</span>
                          <div className="flex items-center gap-1">
                            <span className="text-yellow-500">★</span>
                            <span className="text-sm font-bold text-gray-900">{product.average_rating}</span>
                            <span className="text-xs text-gray-500">({product.review_count})</span>
                          </div>
                        </div>

                        {discountedPrice < originalPrice ? (
                          <p className="text-sm text-gray-500 line-through mb-4">{currency.format(originalPrice)}</p>
                        ) : (
                          <div className="mb-4" />
                        )}

                        <button
                          onClick={() => handleAddToCart(product.id)}
                          disabled={!product.in_stock}
                          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded-lg transition"
                        >
                          {product.in_stock ? 'Add to Cart' : 'Out of Stock'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}

            {!loading && !error && filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-xl text-gray-600">No products found matching your filters</p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
