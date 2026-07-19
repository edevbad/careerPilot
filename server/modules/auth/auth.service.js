const User = require('../../models/user.model');
const AppError = require('../../utils/appError');
const { asyncHandler } = require('../../utils/asyncHandler');
const { verifyRefreshToken, generateRefreshToken, generateAccessToken } = require('../../utils/jwt');
const crypto = require('crypto');

// Hash before storing so even a DB leak can't reuse raw tokens
const hashToken = (token) =>
    crypto.createHash('sha256').update(token).digest('hex')



exports.login = async (email, password) => {
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
        throw new AppError(404, 'User not found');
    }
    const isMatch = await user.verifyPassword(password);

    if (!isMatch) {
        throw new AppError(401, 'Invalid credentials');
    }

    const accessToken = generateAccessToken(user)
    const refreshToken = generateRefreshToken(user)

    user.refreshToken = hashToken(refreshToken)
    await user.save({ validateBeforeSave: false })
    return { accessToken, refreshToken, user };
};

exports.register = async (name, email, password, role) => {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        throw new AppError(400, 'User already exists');
    }
    const user = await User.create({ name, email, password, role });
    const refreshToken = generateRefreshToken(user)
    const accessToken = generateAccessToken(user)

    // Store hashed refresh token
    user.refreshToken = hashToken(refreshToken)

    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken, user };
};

exports.refreshToken = async (refreshToken) => {
    if (!refreshToken) {
        throw new AppError(400, 'Refresh token is required');
    }

    const { id } = verifyRefreshToken(refreshToken);    
    const user = await User.findOne({ _id: id }).select('+refreshToken');
    if (!user || !user.refreshToken) {
        throw new AppError(401, 'Session not found please login again');
    }
    const hashedToken = hashToken(refreshToken);
    if (hashedToken !== user.refreshToken) {
        user.refreshToken = null;
        await user.save({ validateBeforeSave: false });
        throw new AppError(401, 'Invalid refresh token');
    }
    const accessToken = generateAccessToken(user)
    const newRefreshToken = generateRefreshToken(user)

    user.refreshToken = hashToken(newRefreshToken)
    await user.save({ validateBeforeSave: false })
    return { accessToken, refreshToken: newRefreshToken, user };
};

const logout = async (userId) => {
  await User.findByIdAndUpdate(userId, { refreshToken: null })
}

exports.getProfile = async (userId) => {
    const user = await User.findById(userId)
    if (!user) throw new AppError(404, 'User not found')
    return user
}

exports.updateProfile = async (userId, updates) => {
    const allowedFields = ['name', 'careerGoal']
    const filtered = {}
    allowedFields.forEach((field) => {
        if (updates[field] !== undefined) filtered[field] = updates[field]
    })

    const user = await User.findByIdAndUpdate(userId, filtered, {
        new: true,
        runValidators: true,
    })
    if (!user) throw new AppError(404, 'User not found')
    return user
}
