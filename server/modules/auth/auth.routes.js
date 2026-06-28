const express = require('express');
const authController = require('./auth.controller.js');
const { registerValidation, loginValidation } = require('./auth.validator.js');

const router = express.Router();

// Define the routes for authentication
router.post('/login',loginValidation, authController.login);
router.post('/register', registerValidation, authController.register);
router.post('/logout', authController.logout);
router.post('/refresh-token', authController.refreshToken);

module.exports = router;