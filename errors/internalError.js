import CustomError from "./customError.js"

class InternalError extends CustomError {
  constructor(message) {
    super(message)
    this.statusCode = 500
    this.message = message
  }
  jsonMessage() {
    return { message }
  }
}

export default InternalError
