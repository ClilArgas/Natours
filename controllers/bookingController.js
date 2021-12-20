const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Tour = require('../models/tourModel');
const User = require('../models/userModel');
const Booking = require('./../models/bookingModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlersFactory');
const AppError = require('../utils/appError');
const Email = require('./../utils/email');

exports.checkIfBooked = catchAsync(async (req, res, next) => {
  const booking = await Booking.find({
    user: req.user.id,
    tour: req.body.tour,
  });
  if (booking.length === 0)
    return next(
      new AppError('You need to buy a tour before reviewing it', 401)
    );
  next();
});

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  //1) get the current tour & check if it fully booked
  const tour = await Tour.findById(req.params.tourId);
  // if (tour.spotsAvailable === 0)
  //   return next(
  //     new AppError(
  //       'There is no more room left on this tour.. Book next year',
  //       400
  //     )
  //   );
  // tour.spotsAvailable -= 1;
  // await tour.save({ validateBeforeSave: false });
  //2)create checout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    // success_url: `${req.protocol}://${req.get('host')}/?tour=${
    //   req.params.tourId
    // }&user=${req.user.id}&price=${tour.price}`,
    success_url: `${req.protocol}://${req.get('host')}/my-tours?alert=booking`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: `${req.params.tourId}-${req.params.tourDate}`,
    line_items: [
      {
        name: `${tour.name} Tour`,
        description: tour.summary,
        images: [
          `${req.protocol}://${req.get('host')}/img/tours/${tour.imageCover}`,
        ],
        amount: tour.price * 100,
        currency: 'usd',
        quantity: 1,
      },
    ],
  });
  //3)Create session as response
  res.status(200).json({
    status: 'success',
    session,
  });
});

// exports.createBookingCheckout = catchAsync(async (req, res, next) => {
//   //this is only temporary when the real site will be renderd we will change that through the accesss to the session
//   const { tour, user, price } = req.query;
//   if (!tour || !user || !price) return next();
//   await Booking.create({ tour, user, price });
//   res.redirect(req.originalUrl.split('?')[0]);
// });
const createBookingCheckout = catchAsync(async (session) => {
  // const strArr = session.client_reference_id.split('/');
  const dataArr = session.client_reference_id.split('-');
  const tour = dataArr[0];
  const tourDate = dataArr[1];
  const user = await User.findOne({ email: session.customer_email });
  const price = session.amount_total / 100;
  await Booking.create({ tour, user: user._id, price, tourDate });
  await new Email(
    user,
    session.success_url.split('?')[0]
  ).sendBookingConfirmation();
});

exports.webhookCheckout = async (req, res, next) => {
  const signature = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_SIGNING_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook error ${err.message}`);
  }
  if (event.type === 'checkout.session.completed')
    createBookingCheckout(event.data.object);
  res.status(200).json({
    received: true,
  });
};
exports.setTour = (req, res, next) => {
  if (!req.body.tour) req.body.tour = req.params.tourId;
  next();
};

exports.getAllBookings = factory.getAll(Booking);
exports.getBooking = factory.getOne(Booking);
exports.createBooking = factory.createOne(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);
