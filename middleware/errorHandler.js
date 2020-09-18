const AppError = require('../utils/appError');

const sendDevError = (err, req, res) => {
  //api requests
  if (req.originalUrl.startsWith('/api')) {
    res.status(err.statusCode).json({
      msg: err.message,
      err,
      stack: err.stack,
    });
  } else {
    //rendered pages
    res.status(err.statusCode).render('error', {
      title: 'something went wronggg',
      message: err.message,
    });
  }
};

const handleJWTError = () => new AppError('You are not logged in', 401);
const handleJWTExpiredError = () => new AppError('please log in again', 401);

const handleDuplicatError = (err) => {
  const value = err.errmsg.match(/"(.*?)"/g);

  const message = `the value ${value} already exists`;
  return new AppError(message, 400);
};

const handleCastError = (err) => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

const handleValidationError = (err) => {
  const { errors } = err;
  let errMessages = Object.values(errors).map((el) => el.message);
  errMessages = errMessages.join('.');
  return new AppError(errMessages, 400);
};

const sendProductionError = (err, req, res) => {
  //api requests
  if (req.originalUrl.startsWith('/api')) {
    //known error. send msg to client
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        msg: err.message,
      });
    }
    console.error(err);
    //unknown error don't leak msg to client instead send generic msg
    return res.status(500).json({
      status: 'error',
      msg: 'error',
    });
  }

  //A) rendered pages
  //known error. send msg to client
  if (err.isOperational) {
    return res.status(err.statusCode).render('error', {
      title: 'something went wronggg',
      message: err.message,
    });
  }
  console.error(err);
  //unknown error don't leak msg to client instead send generic msg
  return res.status(500).render('error', {
    title: 'something went wronggg',
    message: 'Please Try Again Later',
  });
};

const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendDevError(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    //why still error !== err and error is missing the message property
    //a workaround
    error.message = err.message;

    if (error.name === 'CastError') error = handleCastError(error);
    if (error.code === 11000) error = handleDuplicatError(error);
    if (error.name === 'ValidationError') error = handleValidationError(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

    sendProductionError(error, req, res);
  }
};

module.exports = errorHandler;
