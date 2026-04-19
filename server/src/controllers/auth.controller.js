const { User, RefreshToken } = require('../models');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const { sendSuccess, sendError } = require('../utils/response');

// POST /api/v1/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return sendError(res, 'Invalid email or password', 401);
    if (!user.isActive) return sendError(res, 'Account has been deactivated', 401);

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return sendError(res, 'Invalid email or password', 401);

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Store refresh token in DB
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await RefreshToken.create({ token: refreshToken, user: user._id, expiresAt });

    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    sendSuccess(res, {
      user: user.toJSON(),
      accessToken,
    }, 'Login successful');
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/auth/refresh
const refresh = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) return sendError(res, 'No refresh token provided', 401);

    const decoded = verifyRefreshToken(token);

    // Check if token exists in DB
    const storedToken = await RefreshToken.findOne({ token, user: decoded.id });
    if (!storedToken) return sendError(res, 'Invalid refresh token', 401);

    // Check expiration
    if (storedToken.expiresAt < new Date()) {
      await RefreshToken.deleteOne({ _id: storedToken._id });
      return sendError(res, 'Refresh token expired', 401);
    }

    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) return sendError(res, 'User not found or deactivated', 401);

    // Generate new tokens
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    // Replace old refresh token
    await RefreshToken.deleteOne({ _id: storedToken._id });
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await RefreshToken.create({ token: newRefreshToken, user: user._id, expiresAt });

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    sendSuccess(res, { accessToken: newAccessToken }, 'Token refreshed');
  } catch (err) {
    if (err.name === 'TokenExpiredError' || err.name === 'JsonWebTokenError') {
      return sendError(res, 'Invalid refresh token', 401);
    }
    next(err);
  }
};

// POST /api/v1/auth/logout
const logout = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;
    if (token) {
      await RefreshToken.deleteOne({ token });
    }
    res.clearCookie('refreshToken', { path: '/' });
    sendSuccess(res, null, 'Logged out successfully');
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/auth/me
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return sendError(res, 'User not found', 404);
    sendSuccess(res, user.toJSON());
  } catch (err) {
    next(err);
  }
};

module.exports = { login, refresh, logout, getMe };
