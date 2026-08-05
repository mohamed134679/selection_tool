const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 50,
    },
    password_hash: {
      type: String,
      required: true,
    },
    accountType: {
      type: String,
      enum: ['employee', 'partner'],
      required: true,
      default: 'employee',
    },
    // Authorization role — separate from accountType, which describes
    // *why* someone has access, not what they're allowed to do.
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    // Not enforced yet (partner approval is instant for now), but having
    // the field means adding an approval step later is a one-line change
    // instead of a schema migration.
    status: {
      type: String,
      enum: ['active', 'pending', 'suspended'],
      default: 'active',
    },
    refreshTokenVersion: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Never leak the hash if a user document is ever serialized directly
userSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.password_hash;
    delete ret.refreshTokenVersion;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('User', userSchema);