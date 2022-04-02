const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

const tourRoutes = require('./routes/tourRoutes');
const userRoutes = require('./routes/userRoutes');
const reviewRoutes = require('./routes/reviewRoutes');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const app = express();

// Set Header Security HTTP
app.use(helmet());

app.use(express.json({ limit: '10kb' }));
app.use(morgan('dev'));

// Set limit request
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many request form this IP, please try again an hour!',
});
app.use('/api', limiter);

// Data Sanitize - prevent injection query
app.use(mongoSanitize());

// Data Sanitize - prevent html/js
app.use(xss());

// Two params
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsAverage',
      'ratingsQuantity',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  })
);

// Router
app.use('/api/v1/reviews', reviewRoutes);
app.use('/api/v1/tours', tourRoutes);
app.use('/api/v1/users', userRoutes);

app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`), 404);
});

// Global Error Middleware
app.use(globalErrorHandler);

module.exports = app;
