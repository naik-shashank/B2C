//Custom error class
class CustomError extends Error {
  constructor(message) {
    super(message)
  }
  statusCode
  message
  jsonMessage() {}
}

export default CustomError
