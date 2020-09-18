const express = require('express');
const { protect, restrictTo } = require('../controllers/auth');

const router = express.Router({ mergeParams: true });

const {
  createReview,
  getAllReviews,
  deleteReview,
  updateReview,
} = require('../controllers/reviewController');

router
  .route('/')
  .get(getAllReviews)
  .post(protect, restrictTo('user'), createReview);

router.route('/:id').patch(updateReview).delete(deleteReview);

module.exports = router;
