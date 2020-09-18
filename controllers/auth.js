const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const AppError = require('../utils/appError');
const asyncHandler = require('../utils/asyncHandler');
const User = require('../models/userModel');

const sendEmail = require('../utils/email');

const { deleteOne, updateOne } = require('./handlersFactory');

const getNewToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

const sendJWTToken = (user, res, statusCode) => {
  const token = getNewToken(user.id);
  user.password = undefined;
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
  res.cookie('jwt', token, cookieOptions);
  res.status(statusCode).json({ status: 'success', token });
};

exports.protect = asyncHandler(async (req, res, next) => {
  let token;
  //todo: maybe I should check the token's length and sanitize it
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(new AppError('You need to login to access this page', 401));
  }

  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  const user = await User.findById(decoded.id);

  if (!user) {
    return next(new AppError('invalid credentials', 401));
  }

  //check if user changed their password after the token was issued
  if (user.passwordRecentlyChanged(decoded.iat)) {
    return next(new AppError('password changed please login again'));
  }

  res.locals.user = user;
  req.user = user;
  next();
});

//find out if there is a logged in user to render pages differently
//similar to protect middleware  but for all pages not only protected ones and doesn't throw errors
exports.isLoggedIn = asyncHandler(async (req, res, next) => {
  let token;
  //todo: maybe I should check the token's length and sanitize it
  if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  if (!token) {
    return next();
  }
  try {
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);  
    if (!user) {
      return next();
    }
    //check if user changed their password after the token was issued
    if (user.passwordRecentlyChanged(decoded.iat)) {
      return next();
    }
    //if all is OK
    res.locals.user = user;
    next();
  } catch (err) {
    return next();
  }
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have the permission to perform this action'),
        403
      );
    }
    next();
  };
};

exports.forgotPassword = asyncHandler(async (req, res, next) => {
  const { email } = req.body;
  if (!email)
    return next(
      new AppError('please enter your previously registered email', 400)
    );
  const user = await User.findOne({ email });
  if (!user)
    return next(
      new AppError('No user associated with the provided email', 404)
    );

  const resetToken = user.createPasswordResetToken();

  await user.save({ validateBeforeSave: false });

  const resetUrl = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/resetpassword/${resetToken}`;

  const message = `Forgot your password? submit a patch requrest with your new password 
  and password confiramation to ${resetUrl} if you didn't forget your password please ignore this message`;

  try {
    await sendEmail({
      subject: 'Password reset',
      email: user.email,
      message,
    });

    res.status(200).json({
      status: 'success',
      msg: 'a reset password link was sent to your email',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpiresIn = undefined;
    await user.save({ validateBeforeSave: false });
    return next(
      new AppError(
        'there was an error sending a reset password email, try again later',
        500
      )
    );
  }
});
exports.resetPassword = asyncHandler(async (req, res, next) => {

  //1. hash the token sent as param in the url
  const hashedPassword = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  // then get the user based on the token
  const user = await User.findOne({
    passwordResetToken: hashedPassword,
    passwordResetExpiresIn: { $gt: Date.now() },
  });

  // 2 if token is expired or invalid
  if (!user)
    return next(new AppError('the link is invalid or has expired', 400));

  const { password, passwordConfirm } = req.body;
  //3 update user's password
  user.password = password;
  user.passwordConfirm = passwordConfirm;
  // user.passwordResetToken = undefined;
  // user.passwordResetExpiresIn = undefined;
  await user.save();
  //4. update changedPasswordAt property for the user

  //5. log user in by sending jwt
  sendJWTToken(user, res, 200);

});


exports.signUp = asyncHandler(async (req, res, next) => {
  const {
    name,
    email,
    password,
    passwordConfirm,
    passwordChangeTime,
  } = req.body;
  const newUser = await User.create({
    name,
    email,
    password,
    passwordConfirm,
    passwordChangeTime,
  });
  sendJWTToken(newUser, res, 201);
});

exports.changePassword = asyncHandler(async (req, res, next) => {
  // get the old password , new password and new password confirmation
  //find by email of the logged in user
  const { password, newPassword, newPasswordConfirm } = req.body;
  const user = await User.findOne({ email: req.user.email }).select(
    '+password'
  );
  if (!user)
    return next(
      new AppError('you need to log in to change your password', 400)
    );

  //1. match the old password in DB
  //if password doesn't match the old one then send error
  if (!(await user.passwordsMatch(password, user.password))) {
    return next(new AppError('the password you provided is incorrect', 401));
    //todo:NOT ENOUGH the user should be logged out
  }

  // if match change password with new one

  user.password = newPassword;
  user.passwordConfirm = newPasswordConfirm;

  await user.save();
    sendJWTToken(user, res, 200);
});

exports.logIn = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password)
    return next(new AppError('please provide credentials', 400));
  const user = await User.findOne({ email }).select('+password');
  if (!user) return next(new AppError('email or password are invalid', 400));
  const passwordsMatch = await user.passwordsMatch(password, user.password);
  if (!passwordsMatch)
    return next(new AppError('email or password are invalid', 400));

  sendJWTToken(user, res, 200);
});

exports.logout = (req, res) => {
  res.cookie('jwt', 'Logged Out', {
    expires: new Date(Date.now() + 10 * 1000), //10 seconds,
    httpOnly: true,
  });
  res.status(200).json({
    status: 'success',
  });
};

//only admin is  authorized to delete a user

exports.deleteUser = deleteOne(User);
// don't use this to update password
exports.updateUser = updateOne(User);
