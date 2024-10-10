import express from "express"
import authenicateUser from "../middleware/authHandler.js"
import { deliveryPartnerProfile,deleteProfile, getDriverrById} from "../controllers/deliveryController.js"

import multer from "multer"
import { CloudinaryStorage } from'multer-storage-cloudinary';
import {cloudinary} from "../utils/cloudinary.js";

const router = express.Router()

// Image storage engine

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'deliveryPartnerB2C', // Folder where images will be stored in Cloudinary
         
      public_id: (req, file) => `${Date.now()}`, // Public ID (filename)
      transformation: [
        { width: 800, height: 600, crop: "limit" }, // Resize
        { quality: "auto:good" } // Automatically adjust quality
      ],
    },
    
  });

const upload = multer({ storage });

router.route("/profile").post(upload.single("img"),deliveryPartnerProfile) //authenicateUser, 
router.route("/profile/:userId").delete(deleteProfile)
                                .get(getDriverrById)

export default router
