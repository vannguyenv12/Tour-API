const { promisify } = require('util');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const sendEmail = require('./../utils/email');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true, // not modified token
  };
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true; // https

  res.cookie('jwt', token, cookieOptions);

  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangeAt: req.body.passwordChangeAt,
  });

  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1. Check user have provide email & password

  if (!email || !password) {
    return next(new AppError('Please provide email and password'), 401);
  }
  // 2. Check user exits && password correct
  const user = await User.findOne({ email }).select('+password');
  const correct = await user.correctPassword(password, user.password);

  if (!user || !correct) {
    return next(new AppError('Email or password is not correct'));
  }

  // 3. Everything Ok. Send token
  createSendToken(user, 200, res);
});

exports.protect = catchAsync(async (req, res, next) => {
  // 1. Get token from headers & check its
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('You are not logged in, Please try again!'));
  }

  // 2. Verification Token
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  // 3. Check user is still exits
  const currentUser = await User.findById(decoded.id);

  if (!currentUser) {
    return next(
      new AppError(
        'The user with token no longer exits. Please login again!',
        401
      )
    );
  }

  // 4. Check if user changed password after token was issued
  if (!currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User was changed password. Please login again!', 401)
    );
  }

  // Everything ok
  req.user = currentUser;
  next();
});

exports.restrictTo = (...roles) => {
  // roles is ['admin', 'lead-guide']
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(
          'You do not have permission to perform action. Please try again!'
        )
      );
    }

    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1. Get email user
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    next(new AppError('There is no user with email address', 401));
  }

  // 2. Create reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // 3. Send to email
  const resetUrl = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `You forgot password? Please use PATCH methods on ${resetUrl} and provide password & passwordConfirm to reset password`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Your password reset token (valid for 10m)',
      message,
    });

    res.status(200).json({
      status: 'success',
      message: 'Token was sent to email',
    });
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save({ validateBeforeSave: false });

    next(
      new AppError(
        'There was an error to sending email. Please try again later',
        500
      )
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1. Find user with reset token
  const hashResetToken = crypto
    .createHash('sha256')
    .update(req.params.resetToken)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashResetToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    next(new AppError('Token is in-valid or expires', 400));
  }

  // 2. Update new password for user
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // 3. Update changedPasswordAt

  // 4. Send token
  createSendToken(user, 201, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1. Get User
  const user = await User.findById(req.user.id).select('+password');

  // 2. Check password is correct
  const isMatch = await user.correctPassword(
    req.body.passwordCurrent,
    user.password
  );

  if (!isMatch) {
    return next(new AppError('Current password is not match'));
  }

  // 3. Update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  // 4. Send JWT
  createSendToken(user, 201, res);
});
