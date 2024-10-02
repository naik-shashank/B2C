import express from "express"
import authenicateUser from "../middleware/authHandler.js"
import { deliveryPartnerProfile } from "../controllers/deliveryController.js"
const router = express.Router()

router.route("/profile").post(authenicateUser, deliveryPartnerProfile)

export default router
