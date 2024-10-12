import express from "express"
import authenicateUser from "../middleware/authHandler.js"
import { newOrder,getAllOrders } from "../controllers/orderController.js"
const router = express.Router()

router.route("/order").post( newOrder) //authenicateUser,
router.route("/order").get(getAllOrders);

export default router
