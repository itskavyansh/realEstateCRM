/**
 * Consistent JSON response helpers.
 * Every API response follows: { success, data, message, errors }
 */

const sendSuccess = (res, data = null, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    data,
    message,
    errors: null,
  });
};

const sendError = (res, message = 'Something went wrong', statusCode = 500, errors = null) => {
  return res.status(statusCode).json({
    success: false,
    data: null,
    message,
    errors,
  });
};

module.exports = { sendSuccess, sendError };
