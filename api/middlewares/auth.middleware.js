const { asyncHandler } = require("../utils/asyncHandler");

exports.protect = asyncHandler(async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        throw new AppError('You are not logged in! Please log in to get access.', 401);
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    // Check if user still exists
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
        throw new AppError('The user belonging to this token does no longer exist.', 401);
    }

    // Grant access to protected route
    req.user = currentUser;
    next();
});