const Tour = require('../models/tourModel');
const ApiFeatures = require('../utils/apiFeatures');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/appError');
const { deleteOne, updateOne } = require('../controllers/handlersFactory');

exports.getAllTours = asyncHandler(async (req, res, next) => {
  const features = new ApiFeatures(Tour.find(), req.query);
  features.filterResults().sortResults().selectResultFields().paginateResults();

  const tours = await features.query; //todo check if !tours

  res.json({
    status: 'success',
    data: { count: tours.length, tours },
  });
});

exports.createTour = asyncHandler(async (req, res, next) => {
  const {
    name,
    price,
    duration,
    maxGroupSize,
    difficulty,
    summary,
    description,
    coverImage,
    images,
    startDate,
    guides, 
  } = req.body;
  const newtour = await Tour.create({
    name,
    price,
    duration,
    maxGroupSize,
    difficulty,
    summary,
    description,
    coverImage,
    images,
    startDate,
    guides,
  }); //todo check if !newTour
  res.json({
    status: 'success',
    data: newtour,
  });
});
exports.getTour = asyncHandler(async (req, res, next) => {
  const { id } = req.params; //todo validate id in a param middleware
  const tour = await Tour.findById(id).populate('reviews');
  
  if (!tour) {
    return next(new AppError('cannot find this tour', 404));
  }
  res.json({
    status: 'success',
    data: { tour },
  });
});
exports.updateTour = updateOne(Tour); //not tested yet
exports.deleteTour = deleteOne(Tour);

exports.getTourStats = asyncHandler(async (req, res, next) => {
  const tourStats = await Tour.aggregate([
    {
      $match: {
        ratingsAverage: { $gt: 4.5 },
      },
    },
    {
      $group: {
        _id: '$ratingsAverage',
        ratingsCount: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
  ]);
  res.json({ status: 'success', data: { tourStats } });
});

exports.getMonthlyPlan = asyncHandler(async (req, res, next) => {
  const { year } = req.params;
  const tours = await Tour.aggregate([
    {
      $unwind: '$startDates',
    },
    {
      $match: {
        startDates: {
          $gt: new Date(`${year}-1-1`),
          $lt: new Date(`${year}-4-1`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        toursCount: { $sum: 1 },
      },
    },
    {
      $addFields: {
        month: '$_id',
      },
    },
    {
      $project: { _id: 0 },
    },
    {
      $sort: { toursCount: -1 },
    },
  ]);
  res.json({ status: 'success', data: { tours } });
});

exports.checkId = (req, res, next, id) => {
  console.log(` id "${id}" NOT Checked`);
  next();
};

exports.checkBody = (req, res, next) => {
  console.log('Body NOT Checked');
  next();
};
