const express = require('express');
const authController = require('./auth.controller.js');
const { registerValidator, loginValidator, updateProfileValidator } = require('./auth.validators.js');
const { protect } = require('../../middlewares/auth.middleware.js');
const validate = require('../../middlewares/validate.middleware.js');

const router = express.Router();

// Define the routes for authentication
router.post('/login',validate(loginValidator), authController.login);
router.post('/register', validate(registerValidator), authController.register);
router.post('/refresh-token', authController.refreshToken);
const res = await nodeAPI.post('/auth/refresh-token')
// Protected
router.post('/logout', protect,authController.logout);
router.get('/profile',  protect, authController.getProfile)
router.put('/profile',  protect,validate(updateProfileValidator), authController.updateProfile)

module.exports = router;