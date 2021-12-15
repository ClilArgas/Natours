const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const xssClean = require('xss-clean');
const hpp = require('hpp');
const compression = require('compression');
const cors = require('cors');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const viewRouter = require('./routes/viewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const bookingController = require('./controllers/bookingController');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
//stat
const app = express();

app.enable('trust proxy');

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));
// Serving static files
app.use(express.static(path.join(__dirname, 'public')));
//creating the paths
const pathReviews = '/api/v1/reviews';
const pathTours = '/api/v1/tours';
const pathUsers = '/api/v1/users';
const pathBookings = '/api/v1/bookings';
//// Global middle wares
//Implement Cors
app.use(cors());

//Acces allow origin
//API: api.natours.com FrontEnd : natours.com
// app.use(
//   cors({
//     origin: 'https://www.natours.com',
//   })
// );
//ALLOW COMPLEX REQUESTS TO FOLLOW THE OPTIONS STAGE (PUT PATCH DELETE)
app.options('*', cors());
//Security http headers
// app.use(helmet());
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'", 'https:', 'http:', 'data:', 'ws:'],
      baseUri: ["'self'"],
      fontSrc: ["'self'", 'https:', 'http:', 'data:'],
      scriptSrc: ["'self'", 'https:', 'http:', 'blob:'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https:', 'http:'],
    },
  })
);
//Choosing between development and production
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));
//Security limit of requests from same IP
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many request from this IP, please try again in an hour',
});

app.use('/api', limiter);
app.post(
  '/webhook-checkout',
  express.raw({ type: 'application/json' }),
  bookingController.webhookCheckout
);
//Body parser, reading data into req.body
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());
//DATA Sanitization agains NoSQL query injection
app.use(mongoSanitize());
//DataSanitization against XSS attacks
app.use(xssClean());
//prevent Parameters pullution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  })
);

app.use(compression());

//TestMiddleWares
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});
// connects the paths to the app

app.use('/', viewRouter);
app.use(pathTours, tourRouter);
app.use(pathUsers, userRouter);
app.use(pathReviews, reviewRouter);
app.use(pathBookings, bookingRouter);
app.all('*', (req, res, next) => {
  // const err = new Error(`Cant find ${req.originalUrl} on this server!`);
  // err.status = 'fail';
  // err.statusCode = 404;
  next(new AppError(`Cant find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
