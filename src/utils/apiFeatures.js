class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    const queryObj = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'limit', 'fields', 'month'];
    excludedFields.forEach((el) => delete queryObj[el]);
    // 1. Filtering
    if (this.queryString.month <= 11) {
      this.query = this.query.where('month').equals(this.queryString.month);
    }
    this.query = this.query.find(queryObj);
    return this;
  }

  // 2. Sorting
  sort() {
    if (this.queryString.sort) {
      this.query = this.query.sort(this.queryString.sort);
    } else {
      this.query = this.query.sort('-createdAt');
    }
    return this;
  }

  // // 3. Field Limiting
  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v');
    }
    return this;
  }

  // // 4. Pagination
  paginate() {
    // if (this.queryString.page) {
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 4;
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);
    // }
    return this;
  }
}
module.exports = APIFeatures;
