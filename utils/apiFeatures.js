class ApiFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  pagination = {};

  filterResults() {
    const queryObj = { ...this.queryString };

    const excludedOptions = ['page', 'sort', 'limit', 'select'];

    excludedOptions.forEach((element) => {
      delete queryObj[element];
    });

    let queryStr = JSON.stringify(queryObj);

    queryStr = queryStr.replace(/\b(gt|gte|lt|lte)\b/g, (match) => `$${match}`);

    this.query = this.query.find(JSON.parse(queryStr));
    return this;
  }

  sortResults() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');

      this.query.sort(sortBy);
    } else {
      this.query.sort('-createdAt');
    }
    return this;
  }

  selectResultFields() {
    if (this.queryString.select) {
      const selectedFields = this.queryString.select.split(',').join(' ');
      this.query.select(selectedFields);
    } else {
      this.query.select('-__v');
    }
    return this;
  }

  paginateResults() {
    const page = +this.queryString.page || 1;
    const limit = +this.queryString.limit || 10;
    this.query.limit(limit);
    const skip = (page - 1) * limit;

    const endIndex = page * limit;
    this.query.skip(skip);

    return this;
  }
}

module.exports = ApiFeatures;
