import customError from "../errors/customError.js"

const errorHandler = (err, req, res, next) => {
  console.log(err)
  if (err instanceof customError) {
    return res.status(err.statusCode).json(err.jsonMessage())
  }
  res.status(500).json({ message: "Internal server error " })
}
export default errorHandler
