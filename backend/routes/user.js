const express = require('express');
const router = express.Router();
const { signup, verifyOTP, signin, adminLogin } = require('../controllers/userController');

router.post('/signup', signup);
router.post('/verify-otp', verifyOTP);
router.post('/signin', signin);
router.post('/admin-login', adminLogin);

module.exports = router;
