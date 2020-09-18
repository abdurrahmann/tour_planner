const express = require('express');
const reviewRouter = require('./reviewsRoutes');

const router = express.Router();

router.use('/:tourId/reviews', reviewRouter);
const { protect, restrictTo } = require('../controllers/auth');
const {
  getAllTours,
  createTour,
  getTour,
  updateTour,
  deleteTour,
  checkId,
  checkBody,
  getTourStats,
  getMonthlyPlan,
} = require('../controllers/toursController');

router.param('id', checkId);

router.route('/').get(getAllTours).post(checkBody, createTour);

router.route('/tour-stats').get(getTourStats);
router.route('/monthly-plan/:year').get(getMonthlyPlan);
router
  .route('/:id')
  .get(getTour)
  .patch(updateTour)
  .delete(protect, restrictTo('admin', 'lead-guide'), deleteTour);

module.exports = router;
