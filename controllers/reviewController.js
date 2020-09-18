const Review = require('../models/reviewModel');
const asyncHandler = require('../utils/asyncHandler');
const { deleteOne, updateOne } = require('./handlersFactory');
const AppError = require('../utils/appError');
// exports.FUNCTION_NAME = asyncHandler(async (req, res, next)=>{});

exports.createReview = asyncHandler(async (req, res, next) => {
  let { reviewText, rating, tour, author } = req.body;
  if (!reviewText || !rating) {
    return next(new AppError('please provide review and rating'));
  }
  if (!tour) {
    tour = req.params.tourId;
  } 
  if (!author) {
    author = req.user.id;
  } 
  const review = await Review.create({ reviewText, rating, tour, author });
  res.status(201).json({
    status: 'success',
    data: { review },
  });
});

exports.getAllReviews = asyncHandler(async (req, res, next) => {
  let filter = {};
  if (req.params.tourId) {
    filter = { tour: req.params.tourId };
  }
  const reviews = await Review.find(filter);
    res.status(201).json({
    status: 'success',
    results: reviews.length,
    data: { reviews },
  });
});

exports.deleteReview = deleteOne(Review);
exports.updateReview = updateOne(Review);
