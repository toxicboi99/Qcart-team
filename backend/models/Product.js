const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    offerPrice: { type: Number, required: true },
    image: { type: [String], default: [] },
    category: {
        type: String,
        enum: ['Earphone', 'Headphone', 'Watch', 'Smartphone', 'Laptop', 'Camera', 'Accessories'],
        required: true,
    },
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
