import mongoose from 'mongoose';

/**
 * Validate IANA timezone identifier
 */
const isValidIanaTimezone = (tz) => {
  if (!tz || typeof tz !== 'string') return false;
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch (ex) {
    return false;
  }
};

const bookingSchema = new mongoose.Schema(
  {
    parentName: {
      type: String,
      required: [true, 'Parent name is required'],
      trim: true,
      minlength: [2, 'Parent name must be at least 2 characters long'],
      maxlength: [100, 'Parent name cannot exceed 100 characters'],
    },
    parentEmail: {
      type: String,
      required: [true, 'Parent email is required'],
      trim: true,
      lowercase: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please provide a valid parent email address',
      ],
      index: true,
    },
    parentTimezone: {
      type: String,
      required: [true, 'Parent timezone is required'],
      trim: true,
      validate: {
        validator: isValidIanaTimezone,
        message: (props) => `${props.value} is not a valid IANA timezone identifier`,
      },
    },
    mentor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Mentor',
      required: [true, 'Mentor reference is required for trial booking'],
      index: true,
    },
    startAt: {
      type: Date,
      required: [true, 'Trial class start time (UTC) is required'],
      index: true,
    },
    endAt: {
      type: Date,
      required: [true, 'Trial class end time (UTC) is required'],
      validate: {
        validator: function (value) {
          // endAt must be strictly greater than startAt
          return !this.startAt || value > this.startAt;
        },
        message: 'Trial class end time must be after the start time',
      },
    },
    demoClassLink: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: {
        values: ['confirmed', 'cancelled', 'completed'],
        message: 'Status must be confirmed, cancelled, or completed',
      },
      default: 'confirmed',
      index: true,
    },
    notification: {
      sent: {
        type: Boolean,
        default: false,
      },
      sentAt: {
        type: Date,
        default: null,
      },
      messageId: {
        type: String,
        default: null,
      },
      error: {
        type: String,
        default: null,
      },
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes useful for querying mentor bookings by date window and status
bookingSchema.index({ mentor: 1, startAt: 1, status: 1 });
bookingSchema.index({ parentEmail: 1, startAt: 1 });
bookingSchema.index({ startAt: 1, status: 1 });

export const Booking = mongoose.models.Booking || mongoose.model('Booking', bookingSchema);
export default Booking;
