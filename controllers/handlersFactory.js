const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/appError');

exports.deleteOne = (model) =>
  asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const doc = await model.findByIdAndDelete(id);
    if (!doc) {
      return next(new AppError('cannot find this document', 404));
    }
    res.status(204).json({ status: 'success', data: {} });
  });

exports.updateOne = (model) =>
  asyncHandler(async (req, res, next) => {
    const { id } = req.params;

    const doc = await model.findByIdAndUpdate(id, req.body, {
      new: true,
      omitUndefined: true,
      runValidators: true,
    });
    if (!doc) {
      return next(new AppError('cannot find this document', 404));
    }
    res.json({
      status: 'success',
      data: doc,
    });
  });
