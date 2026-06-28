const User = require('../../models/user.model');
const AppError = require('../../utils/appError');
const { asyncHandler } = require('../../utils/asyncHandler');
const { verifyRefreshToken } = require('../../utils/jwt');

exports.login = async(email, password) => {
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
        throw new AppError('User not found', 404);
    }
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
        throw new AppError('Invalid credentials', 401);
    }    
    return user;
};

exports.register = async(name, email, password, role) => {
    const existingUser = await User.findOne({ email });
    if (existingUser) {        
        throw new AppError('User already exists', 400);
    }
    const user = await User.create({ name, email, password, role });
    return user;
};

exports.refreshToken = async(refreshToken) => {
    const {id} = verifyRefreshToken(refreshToken);
    const user = await User.findOne({ _id : id });
    if (!user) {
        throw new AppError('Invalid refresh token', 401);
    }
    return user;
};
