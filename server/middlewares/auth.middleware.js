const User = require("../models/user.model");
const AppError = require("../utils/appError");
const { asyncHandler } = require("../utils/asyncHandler");
const { verifyAccessToken } = require("../utils/jwt");

exports.protect = asyncHandler(async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        throw new AppError('You are not logged in! Please log in to get access.', 401);
    }

    // Verify token
    const decoded = verifyAccessToken(token);

    // Check if user still exists
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
        throw new AppError('The user belonging to this token does no longer exist.', 401);
    }

    // Grant access to protected route
    req.user = currentUser;
    next();
});