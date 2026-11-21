import mongoose from 'mongoose';

// Address details saved by a user
const addressSchema = new mongoose.Schema(
  {
    street: {
      type: String,
      trim: true,
    },

    city: {
      type: String,
      trim: true,
    },

    state: {
      type: String,
      trim: true,
    },

    zip: {
      type: String,
      trim: true,
    },

    country: {
      type: String,
      trim: true,
    },

    phone: {
      type: String,
      trim: true,
    },

    // Allows the user to identify their primary delivery address
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

const userSchema = new mongoose.Schema(
  {
    // Public username used to identify the user's account
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    // Used for authentication and account communication
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    // Optional because Google-authenticated users don't need a local password
    // Passwords for local accounts must be hashed before being stored
    password: {
      type: String,
      select: false,
    },

    // Determines how the user authenticates with the application
    authProvider: {
      type: String,
      enum: ['local', 'google'],
      default: 'local',
    },

    // Google's stable subject identifier, used to identify Google accounts
    googleId: {
      type: String,
      sparse: true,
      unique: true,
    },

    // User's personal name
    fullName: {
      firstName: {
        type: String,
        required: true,
        trim: true,
      },

      lastName: {
        type: String,
        required: true,
        trim: true,
      },
    },

    // Controls the user's permissions within the application
    role: {
      type: String,
      enum: ['user', 'seller'],
      default: 'user',
    },

    // Saved delivery addresses belonging to this user
    addresses: {
      type: [addressSchema],
      default: [],
    },
  },
  {
    // Automatically maintain createdAt and updatedAt
    timestamps: true,
  },
);

// Validate that local accounts have a password.
// Google accounts can exist without one.
userSchema.pre('validate', function () {
  if (this.authProvider === 'local' && !this.password) {
    this.invalidate(
      'password',
      'Password is required for local authentication.',
    );
  }

  if (this.authProvider === 'google' && !this.googleId) {
    this.invalidate(
      'googleId',
      'Google ID is required for Google authentication.',
    );
  }
});

const User = mongoose.model('User', userSchema);

export default User;
