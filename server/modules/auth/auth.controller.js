const { asyncHandler } = require('../../utils/asyncHandler.js');
const authService = require('./auth.service.js');
const { sanitizeUser } = require('../../utils/sanitizeUser.js');
const {
    generateAccessToken,
    generateRefreshToken
} = require('../../utils/jwt.js');
const AppError = require('../../utils/appError.js');

exports.login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const user = await authService.login(email, password);
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });
    res.status(200).json({
        success: true,
        accessToken,
        user: sanitizeUser(user)
    });
});

exports.register = asyncHandler(async (req, res) => {
    const user = await authService.register(req.body.name, req.body.email, req.body.password, req.body.role);
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });
    res.status(201).json({
        success: true,
        accessToken,
        user: sanitizeUser(user)
    });
});

exports.logout = asyncHandler(async (req, res) => {
    res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
    });
    res.status(200).json({
        success: true,
        message: 'Logged out successfully',
    });
});

exports.refreshToken = asyncHandler(async (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
        throw new AppError('No refresh token provided', 401);
    }
    const user = await authService.refreshToken(refreshToken);
    const accessToken = generateAccessToken(user);
    res.status(200).json({
        success: true,
        accessToken,
        user: sanitizeUser(user)
    });
});