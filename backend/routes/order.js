const express = require('express');
const router = express.Router();
const { 
    createOrder, 
    getUserOrders, 
    getAllOrders, 
    updateOrderStatus 
} = require('../controllers/orderController');

router.post('/', createOrder);
router.get('/user/:userId', getUserOrders);
router.get('/all', getAllOrders);
router.patch('/:orderId/status', updateOrderStatus);

module.exports = router;
