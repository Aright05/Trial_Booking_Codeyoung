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

const mentorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Mentor name is required'],
      trim: true,
      minlength: [2, 'Mentor name must be at least 2 characters long'],
      maxlength: [100, 'Mentor name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Mentor email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please provide a valid email address for mentor',
      ],
    },
    timezone: {
      type: String,
      required: [true, 'Mentor timezone is required'],
      default: 'Asia/Kolkata',
      trim: true,
      validate: {
        validator: isValidIanaTimezone,
        message: (props) => `${props.value} is not a valid IANA timezone identifier`,
      },
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
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

export const Mentor = mongoose.models.Mentor || mongoose.model('Mentor', mentorSchema);
export default Mentor;
