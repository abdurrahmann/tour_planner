const mongoose = require('mongoose');
const slugify = require('slugify');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      // required: [true, 'please provide a name'],
      // unique: true,
    },

    slug: String,

    duration: {
      type: Number,
      // required: [true, 'please provide a duration '],
    },
    maxGroupSize: {
      type: Number,
      // required: [true, 'please provide a group size '],
    },

    difficulty: {
      type: String,
      // required: [true, 'please provide a difficlty '],
    },

    ratingsAverage: {
      type: Number,
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      // required: [true, 'please provide a price'],
    },
    priceDiscount: {
      type: Number,
    },
    summary: {
      type: String,
      trim: true,
      // required: [true, 'please provide a summary'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      trim: true,
      // required: [true, 'please provide a cover image'],
    },
    images: {
      type: [String],
    },
    createdAt: { type: Date, default: Date.now() },
    startDates: {
      type: [Date],
    },
    startLocation: {
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

tourSchema.virtual('durationInWeeks').get(function () {
  return this.duration / 7;
});

tourSchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'tour',
});

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
