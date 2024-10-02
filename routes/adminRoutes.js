import express from "express"
import {
  newDeliveryPartner,
  newOutlet
} from "../controllers/adminController.js"
import authenicateUser from "../middleware/authHandler.js"
const router = express.Router()


router.route("/addOutlet").post( newOutlet) //authenicateUser,
router.route("/addDeliveryPartner").post(authenicateUser, newDeliveryPartner)

export default router
