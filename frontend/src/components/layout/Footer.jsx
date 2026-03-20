// ============================================
// FOOTER COMPONENT
// ============================================
import { Link } from 'react-router-dom';
import { FiFacebook, FiInstagram, FiTwitter, FiMail, FiPhone, FiMapPin } from 'react-icons/fi';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-300">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <Link to="/" className="flex items-center gap-2 mb-4">
              <span className="text-2xl">🛒</span>
              <span className="text-xl font-bold text-white">
                Shop<span className="text-blue-400">Hub</span>
              </span>
            </Link>
            <p className="text-sm text-gray-400 mb-4">
              Your one-stop destination for quality products at amazing prices.
              Shop with confidence!
            </p>
            <div className="flex gap-3">
              <a href="#" className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center hover:bg-blue-600 transition">
                <FiFacebook className="w-4 h-4" />
              </a>
              <a href="#" className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center hover:bg-pink-600 transition">
                <FiInstagram className="w-4 h-4" />
              </a>
              <a href="#" className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center hover:bg-blue-400 transition">
                <FiTwitter className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className="hover:text-white transition">Home</Link></li>
              <li><Link to="/products" className="hover:text-white transition">All Products</Link></li>
              <li><Link to="/categories" className="hover:text-white transition">Categories</Link></li>
              <li><Link to="/products?isFeatured=true" className="hover:text-white transition">Featured</Link></li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h3 className="text-white font-semibold mb-4">My Account</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/profile" className="hover:text-white transition">Profile</Link></li>
              <li><Link to="/orders" className="hover:text-white transition">My Orders</Link></li>
              <li><Link to="/wishlist" className="hover:text-white transition">Wishlist</Link></li>
              <li><Link to="/cart" className="hover:text-white transition">Shopping Cart</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <FiMapPin className="w-4 h-4 text-blue-400" />
                <span>123 Main Street, Colombo, Sri Lanka</span>
              </li>
              <li className="flex items-center gap-2">
                <FiPhone className="w-4 h-4 text-blue-400" />
                <span>+94 77 123 4567</span>
              </li>
              <li className="flex items-center gap-2">
                <FiMail className="w-4 h-4 text-blue-400" />
                <span>support@shophub.com</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-center text-xs text-gray-500">
          <p>© 2024 ShopHub. All rights reserved.</p>
          <div className="flex gap-4 mt-2 sm:mt-0">
            <span>💳 Visa</span>
            <span>💳 MasterCard</span>
            <span>💳 Stripe</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;