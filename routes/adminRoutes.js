import express from "express"
import {
  newDeliveryPartner,
  newOutlet,
  customerInsights
} from "../controllers/adminController.js"
import authenicateUser from "../middleware/authHandler.js"
const router = express.Router()


router.route("/addOutlet").post( newOutlet) //authenicateUser,
router.route("/addDeliveryPartner").post(authenicateUser, newDeliveryPartner)
router.route("/customerInsights").get(customerInsights)
export default router

