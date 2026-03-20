// ============================================
// 404 NOT FOUND PAGE
// ============================================
import { Link } from 'react-router-dom';
import { FiHome, FiArrowLeft } from 'react-icons/fi';

const NotFoundPage = () => {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-8xl font-bold text-gray-200">404</h1>
        <h2 className="text-2xl font-bold text-gray-800 mt-4">
          Page Not Found
        </h2>
        <p className="text-gray-500 mt-2 mb-8">
          The page you are looking for does not exist.
        </p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
          >
            <FiArrowLeft /> Go Back
          </button>
          <Link
            to="/"
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
          >
            <FiHome /> Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;