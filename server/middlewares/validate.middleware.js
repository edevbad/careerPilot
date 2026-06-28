const { validationResult } = require('express-validator')

const validate = (validations) => {
  return async (req, res, next) => {
    // Run all validators in parallel
    await Promise.all(validations.map((v) => v.run(req)))

    const errors = validationResult(req)
    if (errors.isEmpty()) return next()

    // Format errors: { field: 'email', message: 'Must be a valid email' }
    const formatted = errors.array().map((err) => ({
      field: err.path,
      message: err.msg,
    }))

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: formatted,
    })
  }
}

module.exports = validate