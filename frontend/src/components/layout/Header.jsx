// ============================================
// HEADER / NAVBAR COMPONENT
// ============================================
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../redux/slices/authSlice';
import {
  FiShoppingCart,
  FiHeart,
  FiUser,
  FiMenu,
  FiX,
  FiSearch,
  FiLogOut,
  FiPackage,
  FiSettings,
} from 'react-icons/fi';

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const { totalItems } = useSelector((state) => state.cart);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    setProfileOpen(false);
    navigate('/');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${searchQuery.trim()}`);
      setSearchQuery('');
      setSearchOpen(false);
    }
  };

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      {/* Top Bar */}
      <div className="bg-gray-900 text-white text-xs py-1.5">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
          <span>🚚 Free shipping on orders over $5,000</span>
          <span>📞 Support: +94 77 123 4567</span>
        </div>
      </div>

      {/* Main Header */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl">🛒</span>
            <span className="text-xl font-bold text-gray-800">
              Shop<span className="text-blue-600">Hub</span>
            </span>
          </Link>

          {/* Search Bar - Desktop */}
          <form
            onSubmit={handleSearch}
            className="hidden md:flex items-center flex-1 max-w-lg mx-8"
          >
            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
              <button
                type="submit"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600"
              >
                <FiSearch className="w-4 h-4" />
              </button>
            </div>
          </form>

          {/* Right Icons */}
          <div className="flex items-center gap-4">
            {/* Mobile Search */}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="md:hidden text-gray-600 hover:text-blue-600"
            >
              <FiSearch className="w-5 h-5" />
            </button>

            {/* Wishlist */}
            <Link
              to="/wishlist"
              className="text-gray-600 hover:text-blue-600 hidden sm:block"
            >
              <FiHeart className="w-5 h-5" />
            </Link>

            {/* Cart */}
            <Link to="/cart" className="relative text-gray-600 hover:text-blue-600">
              <FiShoppingCart className="w-5 h-5" />
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                  {totalItems}
                </span>
              )}
            </Link>

            {/* Profile / Auth */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 text-gray-600 hover:text-blue-600"
                >
                  <FiUser className="w-5 h-5" />
                  <span className="hidden sm:block text-sm font-medium">
                    {user?.name?.split(' ')[0]}
                  </span>
                </button>

                {/* Profile Dropdown */}
                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border py-2 animate-slideDown">
                    <div className="px-4 py-2 border-b">
                      <p className="text-sm font-semibold text-gray-800">
                        {user?.name}
                      </p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                    </div>

                    <Link
                      to="/profile"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <FiUser className="w-4 h-4" /> My Profile
                    </Link>

                    <Link
                      to="/orders"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <FiPackage className="w-4 h-4" /> My Orders
                    </Link>

                    <Link
                      to="/wishlist"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <FiHeart className="w-4 h-4" /> Wishlist
                    </Link>

                    {user?.role === 'admin' && (
                      <Link
                        to="/admin"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50"
                      >
                        <FiSettings className="w-4 h-4" /> Admin Dashboard
                      </Link>
                    )}

                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full"
                    >
                      <FiLogOut className="w-4 h-4" /> Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="text-sm font-medium text-gray-600 hover:text-blue-600"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="text-sm font-medium bg-blue-600 text-white px-4 py-1.5 rounded-lg hover:bg-blue-700 hidden sm:block"
                >
                  Register
                </Link>
              </div>
            )}

            {/* Mobile Menu */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden text-gray-600"
            >
              {menuOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Search */}
        {searchOpen && (
          <form onSubmit={handleSearch} className="md:hidden pb-3 animate-slideDown">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                autoFocus
              />
              <button
                type="submit"
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <FiSearch className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Navigation Bar */}
      <nav className="bg-gray-50 border-t hidden md:block">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-8 h-10 text-sm">
            <Link to="/" className="text-gray-700 hover:text-blue-600 font-medium">
              Home
            </Link>
            <Link to="/products" className="text-gray-700 hover:text-blue-600 font-medium">
              All Products
            </Link>
            <Link
              to="/products?isFeatured=true"
              className="text-gray-700 hover:text-blue-600 font-medium"
            >
              Featured
            </Link>
            <Link to="/categories" className="text-gray-700 hover:text-blue-600 font-medium">
              Categories
            </Link>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t animate-slideDown">
          <div className="px-4 py-3 space-y-2">
            <Link
              to="/"
              onClick={() => setMenuOpen(false)}
              className="block py-2 text-gray-700 hover:text-blue-600"
            >
              🏠 Home
            </Link>
            <Link
              to="/products"
              onClick={() => setMenuOpen(false)}
              className="block py-2 text-gray-700 hover:text-blue-600"
            >
              🛍️ All Products
            </Link>
            <Link
              to="/categories"
              onClick={() => setMenuOpen(false)}
              className="block py-2 text-gray-700 hover:text-blue-600"
            >
              📂 Categories
            </Link>
            <Link
              to="/wishlist"
              onClick={() => setMenuOpen(false)}
              className="block py-2 text-gray-700 hover:text-blue-600"
            >
              ❤️ Wishlist
            </Link>
            <Link
              to="/cart"
              onClick={() => setMenuOpen(false)}
              className="block py-2 text-gray-700 hover:text-blue-600"
            >
              🛒 Cart ({totalItems})
            </Link>

            {!isAuthenticated && (
              <div className="pt-2 border-t flex gap-2">
                <Link
                  to="/login"
                  onClick={() => setMenuOpen(false)}
                  className="flex-1 text-center py-2 border border-blue-600 text-blue-600 rounded-lg text-sm"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMenuOpen(false)}
                  className="flex-1 text-center py-2 bg-blue-600 text-white rounded-lg text-sm"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;