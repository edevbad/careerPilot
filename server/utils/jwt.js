const jwt = require("jsonwebtoken");

exports.generateAccessToken = (user) => {    
  const payload = {
    id: user._id,
    role: user.role,
  };
  const token = jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
    expiresIn: '15m', // Access token expires in 15 minutes
  });

  return token;
};
exports.generateRefreshToken = (user) => {
  const payload = {
    id: user._id,
    role: user.role,
  };

  const token = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: '7d', // Refresh token expires in 7 days
  });

  return token;
};

exports.verifyAccessToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    return decoded;
  } catch (error) {
    throw new Error("Invalid or expired token");
  }
};
exports.verifyRefreshToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    return decoded;
  } catch (error) {
    throw new Error("Invalid or expired token");
  }
};