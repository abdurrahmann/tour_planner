const AppError = require('../utils/appError');
const asyncHandler = require('../utils/asyncHandler');
const User = require('../models/userModel');

exports.getAllUsers = asyncHandler(async (req, res, next) => {
  const users = await User.find();
  res.json({
    users,
  });
});

exports.updateMe = asyncHandler(async (req, res, next) => {
  const { name, email } = req.body;
  // if !name || !email
  

  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    { name, email },
    { new: true, runValidators: true }
  );
  res.json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});
exports.deleteMe = asyncHandler(async (req, res, next) => {
  console.log(req.user);
  await User.findByIdAndUpdate(req.user._id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.addUser = (req, res, next) => {
  res.send('Not Implemented Yet');
};
exports.getUser = (req, res, next) => {
  res.send('Not Implemented Yet');
};
exports.updateUser = (req, res, next) => {
  res.send('Not Implemented Yet');
};
exports.deleteUser = (req, res, next) => {
  res.send('Not Implemented Yet');
};
