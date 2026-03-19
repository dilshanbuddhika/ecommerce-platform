// ============================================
// API FEATURES - Search, Filter, Sort, Pagination
// ============================================

class ApiFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
    this.totalCount = 0;
  }

  // ──────────────────────────────────────
  // 1. SEARCH - name, description වලින් search
  // Usage: ?search=iphone
  // ──────────────────────────────────────
  search() {
    if (this.queryString.search) {
      const searchRegex = {
        $or: [
          { name: { $regex: this.queryString.search, $options: 'i' } },
          { description: { $regex: this.queryString.search, $options: 'i' } },
          { brand: { $regex: this.queryString.search, $options: 'i' } },
          { tags: { $regex: this.queryString.search, $options: 'i' } },
        ],
      };
      this.query = this.query.find(searchRegex);
    }
    return this;
  }

  // ──────────────────────────────────────
  // 2. FILTER - price, rating, category, etc.
  // Usage: ?price[gte]=100&price[lte]=500&category=abc123
  // ──────────────────────────────────────
  filter() {
    const queryObj = { ...this.queryString };

    // Remove fields that are NOT filters
    const excludeFields = ['search', 'sort', 'page', 'limit', 'fields'];
    excludeFields.forEach((field) => delete queryObj[field]);

    // MongoDB operators add කරන්න (gte, gt, lte, lt, in)
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(
      /\b(gte|gt|lte|lt|in)\b/g,
      (match) => `$${match}`
    );

    const parsedQuery = JSON.parse(queryStr);

    // Active products only (unless admin specifically asks)
    if (!queryObj.isActive) {
      parsedQuery.isActive = true;
    }

    this.query = this.query.find(parsedQuery);
    return this;
  }

  // ──────────────────────────────────────
  // 3. SORT
  // Usage: ?sort=price (ascending)
  //        ?sort=-price (descending)
  //        ?sort=-price,ratingsAverage (multiple)
  // ──────────────────────────────────────
  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      // Default: newest first
      this.query = this.query.sort('-createdAt');
    }
    return this;
  }

  // ──────────────────────────────────────
  // 4. FIELD SELECTION
  // Usage: ?fields=name,price,category
  // ──────────────────────────────────────
  selectFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v');
    }
    return this;
  }

  // ──────────────────────────────────────
  // 5. PAGINATION
  // Usage: ?page=2&limit=10
  // ──────────────────────────────────────
  paginate() {
    const page = parseInt(this.queryString.page) || 1;
    const limit = parseInt(this.queryString.limit) || 12;
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);
    this.page = page;
    this.limit = limit;

    return this;
  }
}

export default ApiFeatures;