exports.sanitizeUser = (user)=>{
    const { password, ...sanitizedUser } = user.toObject();
    return sanitizedUser;
}