const mongoose = require('mongoose');
const Tour = require('./tourModel');
const AppError = require('./../utils/appError');

const bookingSchema = new mongoose.Schema({
  tour: {
    type: mongoose.Schema.ObjectId,
    ref: 'Tour',
    required: [true, 'A Booking must belong to a tour'],
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'A Booking must belong to auser'],
  },
  price: {
    type: Number,
    required: [true, 'Booking must have a price'],
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  paid: {
    type: Boolean,
    default: true,
  },
  tourDate: String,
});

bookingSchema.pre(/^find/, function (next) {
  this.populate('user').populate({
    path: 'tour',
    select: 'name',
  });
  next();
});
bookingSchema.pre('save', async function (next) {
  try {
    const tour = await Tour.findById(this.tour);
    const startDate = tour.startDates.filter(
      (date) => date._id == this.tourDate
    );
    // const startDate = tour.startDates.id(this.date);
    if (startDate[0].participants >= startDate[0].maxParticipants)
      return next(new AppError('Tour is fully book on this date...', 401));
    startDate[0].participants += 1;
    await tour.save();
    next();
  } catch (err) {
    console.log(err);
  }
});

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
