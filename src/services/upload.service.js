/**
 * Upload service — handles storing profile photos and other user uploads.
 * Uses the same storage adapter as version files.
 */
const storage = require('../storage');
const User = require('../models/user.model');

async function uploadProfilePhoto(userId, buffer, filename, mimeType) {
  const { storageRef } = await storage.saveFile(buffer, {
    filename: filename || 'avatar.png',
    mimeType,
  });
  // Public URL that the frontend can fetch (served via local storage dir)
  const photoUrl = `/uploads/${storageRef}`;
  await User.findByIdAndUpdate(userId, { photoUrl, profileImage: photoUrl });
  return photoUrl;
}

/**
 * Remove a user's profile photo.
 */
async function removeProfilePhoto(userId) {
  await User.findByIdAndUpdate(userId, { photoUrl: null, profileImage: null });
  return null;
}

module.exports = { uploadProfilePhoto, removeProfilePhoto };
