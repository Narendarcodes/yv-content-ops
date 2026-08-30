const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true },
    disabled: { type: Boolean, default: false },
    photoUrl: { type: String, default: null },
    profileImage: { type: String, default: null },
    // default organization membership will be created separately
  },
  { timestamps: true }
);

// Keep photoUrl and profileImage in sync — both are the same avatar URL
UserSchema.pre('save', function (next) {
  if (this.isModified('photoUrl') && this.photoUrl !== this.profileImage) {
    this.profileImage = this.photoUrl;
  } else if (this.isModified('profileImage') && this.profileImage !== this.photoUrl) {
    this.photoUrl = this.profileImage;
  }
  next();
});

UserSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  // Ensure both aliases are present for frontend compatibility
  if (obj.photoUrl && !obj.profileImage) obj.profileImage = obj.photoUrl;
  if (obj.profileImage && !obj.photoUrl) obj.photoUrl = obj.profileImage;
  return obj;
};

const User = mongoose.model('User', UserSchema);
module.exports = User;
