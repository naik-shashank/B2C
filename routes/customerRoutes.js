import express from "express"
import multer from "multer"
import { newUser ,getCustomerById,updateUser} from "../controllers/customerController.js"
import authenicateUser from "../middleware/authHandler.js"
const router = express.Router()

const mult = multer(); 

router.route("/user").post(mult.any(),newUser) //authenicateUser,
router.route("/user/:phone").patch(mult.any(),updateUser) //authenicateUser,
router.route("/user/:customerId").get( getCustomerById)

export default router
