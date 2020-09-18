const crypto = require('crypto');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'please provide your name'],
  },
  email: {
    type: String,
    required: [true, 'please provide an email'],
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: [true, 'please provide a password'],
    minlength: 8,
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'please confirm password '],
    validate: {
      validator: function (passwordConfirm) {
        return passwordConfirm === this.password;
      },
      message: 'passwords do not match',
    },
  },
  passwordChangeTime: { type: Date },
  photo: {
    type: String,
  },
  passwordResetToken: String,
  passwordResetExpiresIn: Date,
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
  },
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

userSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 12);
    this.passwordConfirm = undefined;
    next();
  }
});
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || this.isNew) return next();
  this.passwordChangeTime = Date.now() - 1000;
  next();
});
userSchema.pre(/^find/, async function (next) {
  this.find({ active: { $ne: false } });
  next();
});

userSchema.methods.passwordsMatch = async function (
  enteredPassword,
  userPassword
) {
  return await bcrypt.compare(enteredPassword, userPassword);
};

//returns true if password changed after provided jwt was issued
userSchema.methods.passwordRecentlyChanged = function (JWTTimestamp) {
  if (this.passwordChangeTime) {
    const changeTimestamp = this.passwordChangeTime.getTime() / 1000;

    return JWTTimestamp < changeTimestamp;
  }
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  //todo: random bytes should be async and promisified
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetExpiresIn = Date.now() + 1000 * 60 * 10; //10 min
  return resetToken;
};
const User = mongoose.model('User', userSchema);

module.exports = User;
