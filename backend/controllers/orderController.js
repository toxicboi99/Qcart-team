const Order = require('../models/Order');
const User = require('../models/User');

// Create Order
exports.createOrder = async (req, res) => {
    try {
        const { userId, items, amount, address } = req.body;

        // Validate required fields
        if (!userId || !items || !amount || !address) {
            return res.status(400).json({ error: 'All fields are required (userId, items, amount, address)' });
        }

        // Validate userId is a valid MongoDB ObjectId (24 hex chars)
        if (!/^[a-fA-F0-9]{24}$/.test(userId)) {
            return res.status(400).json({ error: 'Invalid user. Please sign in again.' });
        }

        // Verify user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Create order
        const order = await Order.create({
            userId,
            items,
            amount,
            address,
            status: 'Pending'
        });

        // (Optional) You can send order notifications via email from here in the future.

        res.status(201).json({
            message: 'Order created successfully',
            order
        });
    } catch (err) {
        console.error('Create order error:', err.message);
        res.status(400).json({ error: err.message || 'Failed to create order' });
    }
};

// Get User Orders
exports.getUserOrders = async (req, res) => {
    try {
        const { userId } = req.params;
        const orders = await Order.find({ userId }).sort({ createdAt: -1 });
        res.status(200).json(orders);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// Get All Orders (for seller)
exports.getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 }).populate('userId', 'name email');
        res.status(200).json(orders);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// Update Order Status
exports.updateOrderStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status } = req.body;

        const order = await Order.findById(orderId).populate('userId', 'name email phoneNumber');
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        const oldStatus = order.status;
        order.status = status;
        await order.save();

        // Notification sending (e.g. via email) can be added here if needed.

        res.status(200).json({
            message: 'Order status updated successfully',
            order
        });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};
