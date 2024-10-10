import CustomError from "./customError.js"

class Unauthorized extends CustomError {
  constructor(message) {
    super(message)
    this.statusCode = 401
    this.message = message
  }
  jsonMessage() {
    return { message }
  }
}

export default Unauthorized
