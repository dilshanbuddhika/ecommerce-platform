// ============================================
// HOME PAGE
// ============================================
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../utils/axios';
import Loader from '../components/common/Loader';
import { FiShoppingBag, FiTruck, FiShield, FiHeadphones, FiArrowRight, FiStar } from 'react-icons/fi';

const HomePage = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [latestProducts, setLatestProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [featuredRes, latestRes, catRes] = await Promise.all([
        API.get('/products?isFeatured=true&limit=4').catch(() => ({ data: { products: [] } })),
        API.get('/products?limit=8&sort=-createdAt').catch(() => ({ data: { products: [] } })),
        API.get('/categories').catch(() => ({ data: { categories: [] } })),
      ]);

      setFeaturedProducts(featuredRes.data.products || []);
      setLatestProducts(latestRes.data.products || []);
      setCategories(catRes.data.categories || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader size="lg" text="Loading..." />;

  return (
    <div className="animate-fadeIn">
      {/* ══════════════════════════════════ */}
      {/* HERO SECTION                       */}
      {/* ══════════════════════════════════ */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-700 text-white">
        <div className="max-w-7xl mx-auto px-4 py-16 md:py-24">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
                Shop The Best
                <br />
                <span className="text-yellow-300">Deals Online</span>
              </h1>
              <p className="text-lg md:text-xl text-blue-100 mb-8 max-w-lg">
                Discover amazing products at unbeatable prices. Free shipping on
                orders over $5,000!
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                <Link
                  to="/products"
                  className="inline-flex items-center justify-center gap-2 bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-yellow-300 hover:text-gray-800 transition text-lg"
                >
                  <FiShoppingBag /> Shop Now
                </Link>
                <Link
                  to="/products?isFeatured=true"
                  className="inline-flex items-center justify-center gap-2 border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition text-lg"
                >
                  Featured <FiArrowRight />
                </Link>
              </div>
            </div>
            <div className="flex-1 text-center">
              <div className="text-8xl md:text-9xl">🛍️</div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════ */}
      {/* FEATURES SECTION                   */}
      {/* ══════════════════════════════════ */}
      <section className="bg-white py-8 border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="flex items-center gap-3 p-3">
              <FiTruck className="w-8 h-8 text-blue-600 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-sm text-gray-800">Free Shipping</h4>
                <p className="text-xs text-gray-500">On orders over $5,000</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3">
              <FiShield className="w-8 h-8 text-green-600 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-sm text-gray-800">Secure Payment</h4>
                <p className="text-xs text-gray-500">100% protected</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3">
              <FiHeadphones className="w-8 h-8 text-purple-600 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-sm text-gray-800">24/7 Support</h4>
                <p className="text-xs text-gray-500">Dedicated support</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3">
              <FiShoppingBag className="w-8 h-8 text-orange-600 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-sm text-gray-800">Easy Returns</h4>
                <p className="text-xs text-gray-500">30 days return</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════ */}
      {/* CATEGORIES SECTION                 */}
      {/* ══════════════════════════════════ */}
      {categories.length > 0 && (
        <section className="py-12 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-800">
                Shop by Category
              </h2>
              <Link
                to="/categories"
                className="text-blue-600 hover:text-blue-700 flex items-center gap-1 text-sm font-medium"
              >
                View All <FiArrowRight />
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {categories.map((cat) => (
                <Link
                  key={cat._id}
                  to={`/products?category=${cat._id}`}
                  className="bg-white rounded-xl p-6 text-center hover:shadow-lg transition group border"
                >
                  <div className="text-4xl mb-3">📦</div>
                  <h3 className="font-semibold text-gray-800 group-hover:text-blue-600 transition">
                    {cat.name}
                  </h3>
                  {cat.description && (
                    <p className="text-xs text-gray-500 mt-1">{cat.description}</p>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════ */}
      {/* LATEST PRODUCTS SECTION            */}
      {/* ══════════════════════════════════ */}
      {latestProducts.length > 0 && (
        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-800">
                Latest Products
              </h2>
              <Link
                to="/products"
                className="text-blue-600 hover:text-blue-700 flex items-center gap-1 text-sm font-medium"
              >
                View All <FiArrowRight />
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {latestProducts.map((product) => (
                <Link
                  key={product._id}
                  to={`/product/${product._id}`}
                  className="bg-white rounded-xl overflow-hidden hover:shadow-lg transition group border"
                >
                  {/* Product Image */}
                  <div className="relative h-48 bg-gray-100 flex items-center justify-center overflow-hidden">
                    <img
                      src={product.images?.[0]?.url || '/placeholder.png'}
                      alt={product.name}
                      className="w-full h-full object-contain p-4 group-hover:scale-105 transition"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/300x300?text=Product';
                      }}
                    />
                    {product.comparePrice > product.price && (
                      <span className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                        -{product.discountPercentage}%
                      </span>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="p-4">
                    <h3 className="text-sm font-medium text-gray-800 group-hover:text-blue-600 transition line-clamp-2 mb-2">
                      {product.name}
                    </h3>

                    {/* Rating */}
                    <div className="flex items-center gap-1 mb-2">
                      <FiStar className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                      <span className="text-xs text-gray-600">
                        {product.ratingsAverage || 0} ({product.ratingsCount || 0})
                      </span>
                    </div>

                    {/* Price */}
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-gray-800">
                        ${product.price}
                      </span>
                      {product.comparePrice > product.price && (
                        <span className="text-sm text-gray-400 line-through">
                          ${product.comparePrice}
                        </span>
                      )}
                    </div>

                    {/* Stock */}
                    <p
                      className={`text-xs mt-1 ${
                        product.stock > 0 ? 'text-green-600' : 'text-red-500'
                      }`}
                    >
                      {product.stock > 0 ? '✅ In Stock' : '❌ Out of Stock'}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════ */}
      {/* CTA SECTION                        */}
      {/* ══════════════════════════════════ */}
      <section className="bg-gradient-to-r from-gray-800 to-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Start Shopping? 🛍️
          </h2>
          <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
            Join thousands of happy customers. Create your account today and get
            exclusive deals!
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition text-lg"
          >
            Create Account <FiArrowRight />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default HomePage;