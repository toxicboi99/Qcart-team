// backend/models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    otp: { type: String },
    otpExpiry: { type: Date },
    isVerified: { type: Boolean, default: false },
    role: { type: String, enum: ['user', 'admin', 'seller'], default: 'user' }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
