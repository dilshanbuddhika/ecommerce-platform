// ============================================
// ADMIN DASHBOARD CONTROLLER
// ============================================
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import Review from '../models/Review.js';
import Category from '../models/Category.js';
import ErrorResponse from '../utils/ErrorResponse.js';

// ══════════════════════════════════════════════
// @desc    Dashboard overview (summary cards)
// @route   GET /api/v1/admin/dashboard
// @access  Private/Admin
// ══════════════════════════════════════════════
export const getDashboard = async (req, res, next) => {
  try {
    // ── Total Revenue ──
    const revenueData = await Order.aggregate([
      {
        $match: {
          orderStatus: { $nin: ['cancelled', 'returned'] },
          'paymentInfo.status': { $in: ['paid', 'pending'] },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalPrice' },
          totalOrders: { $sum: 1 },
          avgOrderValue: { $avg: '$totalPrice' },
        },
      },
    ]);

    // ── Total Users ──
    const totalUsers = await User.countDocuments({ isActive: true });
    const totalAdmins = await User.countDocuments({ role: 'admin' });

    // ── Total Products ──
    const totalProducts = await Product.countDocuments({ isActive: true });
    const outOfStockProducts = await Product.countDocuments({
      stock: 0,
      isActive: true,
    });

    // ── Total Categories ──
    const totalCategories = await Category.countDocuments({ isActive: true });

    // ── Total Reviews ──
    const totalReviews = await Review.countDocuments();

    // ── Pending Orders ──
    const pendingOrders = await Order.countDocuments({
      orderStatus: { $in: ['pending', 'confirmed', 'processing'] },
    });

    // ── Today's Stats ──
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayOrders = await Order.countDocuments({
      createdAt: { $gte: today },
    });

    const todayRevenue = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: today },
          orderStatus: { $nin: ['cancelled', 'returned'] },
        },
      },
      {
        $group: {
          _id: null,
          revenue: { $sum: '$totalPrice' },
        },
      },
    ]);

    const todayNewUsers = await User.countDocuments({
      createdAt: { $gte: today },
    });

    // ── This Month Stats ──
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);

    const monthlyRevenue = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: thisMonth },
          orderStatus: { $nin: ['cancelled', 'returned'] },
        },
      },
      {
        $group: {
          _id: null,
          revenue: { $sum: '$totalPrice' },
          orders: { $sum: 1 },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      message: '✅ Dashboard data fetched!',
      dashboard: {
        revenue: {
          total: revenueData[0]?.totalRevenue || 0,
          today: todayRevenue[0]?.revenue || 0,
          thisMonth: monthlyRevenue[0]?.revenue || 0,
          avgOrderValue: Math.round(revenueData[0]?.avgOrderValue || 0),
        },
        orders: {
          total: revenueData[0]?.totalOrders || 0,
          today: todayOrders,
          thisMonth: monthlyRevenue[0]?.orders || 0,
          pending: pendingOrders,
        },
        users: {
          total: totalUsers,
          admins: totalAdmins,
          newToday: todayNewUsers,
        },
        products: {
          total: totalProducts,
          outOfStock: outOfStockProducts,
          categories: totalCategories,
        },
        reviews: {
          total: totalReviews,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// ══════════════════════════════════════════════
// @desc    Sales analytics (chart data)
// @route   GET /api/v1/admin/analytics/sales
// @access  Private/Admin
// ══════════════════════════════════════════════
export const getSalesAnalytics = async (req, res, next) => {
  try {
    const period = req.query.period || '7days';

    let startDate = new Date();
    let groupFormat = '%Y-%m-%d';

    switch (period) {
      case '7days':
        startDate.setDate(startDate.getDate() - 7);
        groupFormat = '%Y-%m-%d';
        break;
      case '30days':
        startDate.setDate(startDate.getDate() - 30);
        groupFormat = '%Y-%m-%d';
        break;
      case '6months':
        startDate.setMonth(startDate.getMonth() - 6);
        groupFormat = '%Y-%m';
        break;
      case '1year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        groupFormat = '%Y-%m';
        break;
      default:
        startDate.setDate(startDate.getDate() - 7);
    }

    // ── Daily/Monthly sales data ──
    const salesData = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          orderStatus: { $nin: ['cancelled', 'returned'] },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: groupFormat, date: '$createdAt' },
          },
          revenue: { $sum: '$totalPrice' },
          orders: { $sum: 1 },
          itemsSold: { $sum: { $size: '$orderItems' } },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // ── Total for period ──
    const periodTotal = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          orderStatus: { $nin: ['cancelled', 'returned'] },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalPrice' },
          totalOrders: { $sum: 1 },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      message: '✅ Sales analytics fetched!',
      period,
      summary: {
        totalRevenue: periodTotal[0]?.totalRevenue || 0,
        totalOrders: periodTotal[0]?.totalOrders || 0,
      },
      chartData: salesData.map((item) => ({
        date: item._id,
        revenue: item.revenue,
        orders: item.orders,
        itemsSold: item.itemsSold,
      })),
    });
  } catch (error) {
    next(error);
  }
};

// ══════════════════════════════════════════════
// @desc    Order status distribution
// @route   GET /api/v1/admin/analytics/orders
// @access  Private/Admin
// ══════════════════════════════════════════════
export const getOrderAnalytics = async (req, res, next) => {
  try {
    // ── Orders by status ──
    const ordersByStatus = await Order.aggregate([
      {
        $group: {
          _id: '$orderStatus',
          count: { $sum: 1 },
          revenue: { $sum: '$totalPrice' },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // ── Orders by payment method ──
    const ordersByPayment = await Order.aggregate([
      {
        $group: {
          _id: '$paymentInfo.method',
          count: { $sum: 1 },
          revenue: { $sum: '$totalPrice' },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // ── Recent orders ──
    const recentOrders = await Order.find()
      .sort('-createdAt')
      .limit(10)
      .populate('user', 'name email')
      .select('orderNumber user totalPrice orderStatus paymentInfo createdAt');

    res.status(200).json({
      success: true,
      message: '✅ Order analytics fetched!',
      analytics: {
        byStatus: ordersByStatus.map((item) => ({
          status: item._id,
          count: item.count,
          revenue: item.revenue,
        })),
        byPaymentMethod: ordersByPayment.map((item) => ({
          method: item._id,
          count: item.count,
          revenue: item.revenue,
        })),
        recentOrders,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ══════════════════════════════════════════════
// @desc    Top selling products
// @route   GET /api/v1/admin/analytics/top-products
// @access  Private/Admin
// ══════════════════════════════════════════════
export const getTopProducts = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    // ── Top selling by soldCount ──
    const topSelling = await Product.find({ isActive: true })
      .sort('-soldCount')
      .limit(limit)
      .select('name price stock soldCount ratingsAverage images category')
      .populate('category', 'name');

    // ── Top rated ──
    const topRated = await Product.find({
      isActive: true,
      ratingsCount: { $gt: 0 },
    })
      .sort('-ratingsAverage -ratingsCount')
      .limit(limit)
      .select('name price ratingsAverage ratingsCount images category')
      .populate('category', 'name');

    // ── Most reviewed ──
    const mostReviewed = await Product.find({
      isActive: true,
      ratingsCount: { $gt: 0 },
    })
      .sort('-ratingsCount')
      .limit(limit)
      .select('name price ratingsAverage ratingsCount images')
      .populate('category', 'name');

    res.status(200).json({
      success: true,
      message: '✅ Top products fetched!',
      topSelling,
      topRated,
      mostReviewed,
    });
  } catch (error) {
    next(error);
  }
};

// ══════════════════════════════════════════════
// @desc    Revenue by category
// @route   GET /api/v1/admin/analytics/categories
// @access  Private/Admin
// ══════════════════════════════════════════════
export const getCategoryAnalytics = async (req, res, next) => {
  try {
    // Products per category
    const categoryStats = await Product.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$category',
          totalProducts: { $sum: 1 },
          totalStock: { $sum: '$stock' },
          avgPrice: { $avg: '$price' },
          totalSold: { $sum: '$soldCount' },
        },
      },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: '_id',
          as: 'categoryInfo',
        },
      },
      { $unwind: '$categoryInfo' },
      {
        $project: {
          category: '$categoryInfo.name',
          totalProducts: 1,
          totalStock: 1,
          avgPrice: { $round: ['$avgPrice', 2] },
          totalSold: 1,
        },
      },
      { $sort: { totalSold: -1 } },
    ]);

    res.status(200).json({
      success: true,
      message: '✅ Category analytics fetched!',
      categories: categoryStats,
    });
  } catch (error) {
    next(error);
  }
};

// ══════════════════════════════════════════════
// @desc    User analytics
// @route   GET /api/v1/admin/analytics/users
// @access  Private/Admin
// ══════════════════════════════════════════════
export const getUserAnalytics = async (req, res, next) => {
  try {
    // ── New users over time ──
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const newUsersData = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // ── Users by role ──
    const usersByRole = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
        },
      },
    ]);

    // ── Users by auth provider ──
    const usersByProvider = await User.aggregate([
      {
        $group: {
          _id: '$authProvider',
          count: { $sum: 1 },
        },
      },
    ]);

    // ── Top customers (most orders) ──
    const topCustomers = await Order.aggregate([
      {
        $match: {
          orderStatus: { $nin: ['cancelled', 'returned'] },
        },
      },
      {
        $group: {
          _id: '$user',
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: '$totalPrice' },
        },
      },
      { $sort: { totalSpent: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userInfo',
        },
      },
      { $unwind: '$userInfo' },
      {
        $project: {
          name: '$userInfo.name',
          email: '$userInfo.email',
          totalOrders: 1,
          totalSpent: 1,
        },
      },
    ]);

    // ── Total stats ──
    const totalActive = await User.countDocuments({ isActive: true });
    const totalInactive = await User.countDocuments({ isActive: false });
    const verifiedEmails = await User.countDocuments({ isEmailVerified: true });

    res.status(200).json({
      success: true,
      message: '✅ User analytics fetched!',
      analytics: {
        total: {
          active: totalActive,
          inactive: totalInactive,
          verifiedEmails,
        },
        byRole: usersByRole,
        byProvider: usersByProvider,
        newUsersChart: newUsersData,
        topCustomers,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ══════════════════════════════════════════════
// @desc    Inventory alerts
// @route   GET /api/v1/admin/inventory
// @access  Private/Admin
// ══════════════════════════════════════════════
export const getInventoryAlerts = async (req, res, next) => {
  try {
    const lowStockThreshold = parseInt(req.query.threshold) || 5;

    // ── Out of stock ──
    const outOfStock = await Product.find({
      stock: 0,
      isActive: true,
    })
      .select('name sku stock price category')
      .populate('category', 'name')
      .sort('name');

    // ── Low stock ──
    const lowStock = await Product.find({
      stock: { $gt: 0, $lte: lowStockThreshold },
      isActive: true,
    })
      .select('name sku stock price category')
      .populate('category', 'name')
      .sort('stock');

    // ── Inventory summary ──
    const inventorySummary = await Product.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          totalStock: { $sum: '$stock' },
          totalValue: { $sum: { $multiply: ['$price', '$stock'] } },
          avgStock: { $avg: '$stock' },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      message: '✅ Inventory alerts fetched!',
      inventory: {
        summary: {
          totalProducts: inventorySummary[0]?.totalProducts || 0,
          totalStock: inventorySummary[0]?.totalStock || 0,
          totalValue: Math.round(inventorySummary[0]?.totalValue || 0),
          avgStock: Math.round(inventorySummary[0]?.avgStock || 0),
        },
        outOfStock: {
          count: outOfStock.length,
          products: outOfStock,
        },
        lowStock: {
          threshold: lowStockThreshold,
          count: lowStock.length,
          products: lowStock,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// ══════════════════════════════════════════════
// @desc    Revenue report (export data)
// @route   GET /api/v1/admin/reports/revenue
// @access  Private/Admin
// ══════════════════════════════════════════════
export const getRevenueReport = async (req, res, next) => {
  try {
    const startDate = req.query.startDate
      ? new Date(req.query.startDate)
      : new Date(new Date().setMonth(new Date().getMonth() - 1));

    const endDate = req.query.endDate
      ? new Date(req.query.endDate)
      : new Date();

    // ── Orders in date range ──
    const orders = await Order.find({
      createdAt: { $gte: startDate, $lte: endDate },
      orderStatus: { $nin: ['cancelled', 'returned'] },
    })
      .sort('-createdAt')
      .populate('user', 'name email')
      .select(
        'orderNumber user totalPrice subtotal shippingCost orderStatus paymentInfo createdAt'
      );

    // ── Summary ──
    const summary = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          orderStatus: { $nin: ['cancelled', 'returned'] },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalPrice' },
          totalOrders: { $sum: 1 },
          totalShipping: { $sum: '$shippingCost' },
          avgOrderValue: { $avg: '$totalPrice' },
          minOrder: { $min: '$totalPrice' },
          maxOrder: { $max: '$totalPrice' },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      message: '✅ Revenue report generated!',
      report: {
        dateRange: {
          from: startDate,
          to: endDate,
        },
        summary: {
          totalRevenue: summary[0]?.totalRevenue || 0,
          totalOrders: summary[0]?.totalOrders || 0,
          totalShipping: summary[0]?.totalShipping || 0,
          avgOrderValue: Math.round(summary[0]?.avgOrderValue || 0),
          minOrder: summary[0]?.minOrder || 0,
          maxOrder: summary[0]?.maxOrder || 0,
        },
        orders,
      },
    });
  } catch (error) {
    next(error);
  }
};