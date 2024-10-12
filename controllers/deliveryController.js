import { getFirestore } from "firebase-admin/firestore"
import {removeImg} from "../utils/imageRemove.js"
const mainCollection = "Delivery_partner"

const deliveryPartnerProfile = async (req, res) => {
 
  const { firstName,lastName,DLNo,password,phone } = req.body
   
  if (!req.file) {
    return res
      .status(400)
      .json({ status: "fail", message: "No image file provided" });
  }
  if(!DLNo || !password || ! phone) {
    await removeImg(req.file.path)
    return res.status(400).json({
    message:"please enter DLNo, password & phone"
  })
}


const db = getFirestore()

const driverRef = db.collection(mainCollection).doc(phone);  // Fetch document using customer ID
    const driverDoc = await driverRef.get();
     
    if (driverDoc.exists) {
      await removeImg(req.file.path)
      return res.status(400).json({ message: 'phone number allready taken'});
    }

   const img=req.file.path || ''

  
  await db.collection(mainCollection).doc(phone).set({
    firstName,lastName,DLNo,password,phone,img,totalDeliveries:0,ratings:4.5 
  })

  res.status(200).json({ message: req.body })
}


// const updateProfile=async (req,res)=>{
//   try{
//       res.status(200).json({status:"success"})
//   }
//   catch (err){
//     res.status(400).json({message:"failed to update"})
//   }
// }

const getDriverrById = async (req, res) => {
  try {
    // Assuming user ID (or phNo) is sent as a parameter in the request URL
    const userId = req.params.userId;
    const db = getFirestore()
    // Reference to the Firestore document for the user
    const userRef = db.collection(mainCollection).doc(userId);

    // Get the document snapshot
    const userDoc = await userRef.get();

    // Check if the document exists
    if (!userDoc.exists) {
      return res.status(404).json({ message: `driver with ID ${userId} not found.` });
    }

    // Send the user data back as the response
    res.status(200).json({ id: userId, ...userDoc.data() });
  } catch (error) {
    // Handle errors (e.g., Firestore connection issues)
    console.error('Error fetching driver:', error);
    res.status(500).json({ message: 'Error fetching driver', error: error.message });
  }
};



const deleteProfile=async (req,res)=>{
  try {
    
    const userId = req.params.userId;
    const db = getFirestore()

    // Reference to the Firestore document for the user
    const userRef = db.collection(mainCollection).doc(userId);
    const driverDoc = await userRef.get();


    await removeImg(driverDoc.data().img)
    await userRef.delete();
    
    // Send a response indicating the user was successfully deleted
    res.status(200).json({ message: `Driver with ID ${userId} deleted successfully.` });
  } catch (error) {
    // Handle errors (e.g., if user ID doesn't exist)
    console.error('Error deleting driver:', error);
    res.status(500).json({ message: 'Error deleting driver', error: error.message });
  }
}

export{ deliveryPartnerProfile,deleteProfile,getDriverrById}
