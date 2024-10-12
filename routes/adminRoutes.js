import express from "express"

import multer from "multer"
import { CloudinaryStorage } from'multer-storage-cloudinary';
import {cloudinary} from "../utils/cloudinary.js";

import {
  newOutlet,
  createOutletPartner,
  deleteOutletPartner,
  customerInsights,
  deliveryInsights,
  getAllOutletsWithOrderAndPartners,
  getOneOutlet
} from "../controllers/adminController.js"
import authenicateUser from "../middleware/authHandler.js"
const router = express.Router()


const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'OutletB2C', // Folder where images will be stored in Cloudinary
       
    public_id: (req, file) => `${Date.now()}`, // Public ID (filename)
    transformation: [
      { width: 800, height: 600, crop: "limit" }, // Resize
      { quality: "auto:good" } // Automatically adjust quality
    ],
  },
  
});


const upload = multer({ storage });



router.route("/addOutlet").post( upload.single("img"),newOutlet) //authenicateUser,
router.route("/allOutlet").get(getAllOutletsWithOrderAndPartners) //authenicateUser,
router.route("/oneOutlet/:id").get(getOneOutlet) //authenicateUser,
router.route("/addOutletPartner").post( upload.single("img"),createOutletPartner) //authenicateUser,
router.route("/removeOutletPartner/:userId").delete(deleteOutletPartner) //authenicateUser,
router.route("/customerInsights").get(customerInsights)
router.route("/deliveryInsights").get(deliveryInsights)
export default router

