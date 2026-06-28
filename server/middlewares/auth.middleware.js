const User = require("../models/user.model");
const AppError = require("../utils/appError");
const { asyncHandler } = require("../utils/asyncHandler");
const { verifyAccessToken } = require("../utils/jwt");

exports.protect = asyncHandler(async (req, res, next) => {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new AppError(401, 'Not authorized. No token provided.')
    }
    const token = authHeader.split(' ')[1];

    if (!token) {
        throw new AppError(401, 'You are not logged in! Please log in to get access.');
    }

    // Verify token
    const decoded = verifyAccessToken(token);

    // Check if user still exists
    const currentUser = await User.findById(decoded.id).select('-refreshToken').select('-password');
    if (!currentUser) {
        throw new AppError(401, 'The user belonging to this token does no longer exist.');
    }

    // Grant access to protected route
    req.user = currentUser;
    next();
});