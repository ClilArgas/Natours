const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please tell us your name!'],
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email'],
  },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
    required: true,
  },
  password: {
    type: String,
    required: [true, 'Please use a password'],
    minlength: 8,
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'please confirm your password'],
    validate: {
      // only works on Save & Create!
      validator: function (el) {
        return el === this.password;
      },
      message: 'The passwords dont match..',
    },
  },
  photo: {
    type: String,
    default: 'default.jpg',
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
  numAttempts: {
    type: Number,
    default: 10,
  },
  waitTimeAfterFailedLogin: {
    type: Date,
    default: undefined,
  },
});
//   userSchema.virtual('bookings', {
//   ref: 'Booking',
//   foreignField: 'tour',
//   localField: '_id',
// });

userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;
  next();
});

userSchema.pre('save', async function (next) {
  // if the password is not modifed just exit
  if (!this.isModified('password')) return next();

  // we encryot the password with the 3rd part library and then we dont persist the passwordConfirm to the DB
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

userSchema.methods.generatePasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  console.log({ resetToken }, this.passwordResetToken);
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  return resetToken;
};

userSchema.methods.protectBruteAtt = function () {
  this.numAttempts -= 1;
  console.log(this.numAttempts);
  if (this.numAttempts === 0) {
    this.numAttempts = 10;
    this.waitTimeAfterFailedLogin = Date.now() + 15 * 1000;
  }
};

const User = mongoose.model('User', userSchema);
module.exports = User;
