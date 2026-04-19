const { sendError } = require('../utils/response');

/**
 * Middleware factory: Validate request body/query/params against a Zod schema.
 * Usage: validate(schema, 'body') or validate(schema, 'query')
 */
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const errors = result.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      return sendError(res, 'Validation failed', 400, errors);
    }
    req[source] = result.data;
    next();
  };
};

module.exports = validate;
