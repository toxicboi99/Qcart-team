const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [{
        product: {
            _id: { type: mongoose.Schema.Types.ObjectId, required: true },
            name: { type: String, required: true },
            description: { type: String },
            price: { type: Number, required: true },
            offerPrice: { type: Number, required: true },
            image: [String],
            category: { type: String }
        },
        quantity: { type: Number, required: true }
    }],
    amount: { type: Number, required: true },
    address: {
        fullName: { type: String, required: true },
        phoneNumber: { type: String, required: true },
        pincode: { type: String },
        area: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true }
    },
    status: { 
        type: String, 
        enum: ['Pending', 'Processing', 'Completed', 'Cancelled'],
        default: 'Pending' 
    },
    paymentMethod: { type: String, default: 'COD' },
    paymentStatus: { type: String, default: 'Pending' }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
