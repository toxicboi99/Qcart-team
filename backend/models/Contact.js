const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
    type: { type: String, enum: ['sales', 'support'], required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    phoneNumber: { type: String },
    message: { type: String },
    status: { type: String, enum: ['new', 'read', 'replied'], default: 'new' }
}, { timestamps: true });

module.exports = mongoose.model('Contact', contactSchema);
