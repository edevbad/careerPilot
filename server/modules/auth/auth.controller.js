const { asyncHandler } = require('../../utils/asyncHandler.js');
const authService = require('./auth.service.js');
const { sanitizeUser } = require('../../utils/sanitizeUser.js');
const {
    generateAccessToken,
    generateRefreshToken
} = require('../../utils/jwt.js');
const AppError = require('../../utils/appError.js');
const ApiResponse = require('../../utils/apiResponse.js');

// Cookie config — httpOnly so JS can never read it
const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',  // HTTPS only in prod
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,               // 7 days in ms
}

exports.login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const { accessToken, refreshToken, user } = await authService.login(email, password);
    res.cookie("refreshToken", refreshToken, COOKIE_OPTIONS);
    res.status(200).json(new ApiResponse(200, { accessToken, user: sanitizeUser(user) }));
});

exports.register = asyncHandler(async (req, res) => {
    const { accessToken, refreshToken, user } = await authService.register(req.body.name, req.body.email, req.body.password, req.body.role);
    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });
    res.status(201).json(new ApiResponse(201, { accessToken, user: sanitizeUser(user) }));
});

exports.logout = asyncHandler(async (req, res) => {
    await authService.logout(req.user._id);
    res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
    });
    res.status(200).json(new ApiResponse(200, null, 'Logged out successfully'));
});

exports.refreshToken = asyncHandler(async (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
        throw new AppError(401,'No refresh token provided');
    }
    const { accessToken, user } = await authService.refreshToken(refreshToken);
    res.status(200).json(new ApiResponse(200, { accessToken, user: sanitizeUser(user) }));
});

exports.getProfile = asyncHandler(async (req, res) => {
    const user = await authService.getProfile(req.user._id)
    res.status(200).json(new ApiResponse(200, { user }))
})

exports.updateProfile = asyncHandler(async (req, res) => {
    const user = await authService.updateProfile(req.user._id, req.body)
    res.status(200).json(new ApiResponse(200, { user }, 'Profile updated'))
})
