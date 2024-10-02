import { getAuth } from "firebase-admin/auth"
import Unauthorized from "../errors/unauthorized.js"
import InternalError from "../errors/internalError.js"

const authenicateUser = async (req, res, next) => {
  const { token } = req.body
  if (!token) {
    return next(new Unauthorized("Unauthorized user"))
  }
  try {
    const valid = await getAuth().verifyIdToken(token)
    if (!valid) {
      return next(new Unauthorized("Unauthorized user"))
    }
    next()
  } catch (err) {
    console.log(err)
    if (err instanceof Unauthorized) {
      next(new Unauthorized("Unauthorized user"))
    } else {
      next(new InternalError("Internal server error"))
    }
  }
}

export default authenicateUser
