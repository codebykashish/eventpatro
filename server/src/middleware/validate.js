// Middleware factory: Validates request body using a Zod schema
const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body)

  // If validation fails, return 400 Bad Request with field-specific errors
  if (!result.success) {
    const issues = result.error.issues || result.error.errors || []
    const formattedErrors = {}
    issues.forEach((err) => {
      const field = err.path.join('.') || 'general'
      formattedErrors[field] = err.message
    })

    const firstErrorMessage = issues[0]?.message || 'Invalid input data'

    return res.status(400).json({
      success: false,
      message: firstErrorMessage,
      errors: formattedErrors,
    })
  }

  // Replace req.body with the sanitized/parsed data from Zod
  req.body = result.data
  next()
}

module.exports = validate
