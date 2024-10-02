import { FieldValue, getFirestore } from "firebase-admin/firestore"
import InternalError from "../errors/internalError.js"

const outletCollection = "Outlets"
const deliveryCollection = "Delivery_partner"

const newOutlet = async (req, res) => {
  try{
    const { name, phNo, location ,id} = req.body

    // Validate the input data
    if (!name || !phNo || !location || !location.address || !location.coordinates || !id) {
      throw new InternalError("All fields are required")
    }
  
    const db = getFirestore()
    await db.collection(outletCollection).doc(id).set({
      name,
      phNo,
      location: {
        address: location.address,
        coordinates: location.coordinates // Store as an object { lat: number, lng: number }
      },
      outletPartners:[],
      deleveryPartners:[]
    })
  
    res.status(200).json({ message: "Outlet created successfully",data:req.body })
}
catch (err){
  res.status(400).json({
    message:"failed to create outlet",
    err
  })
}
}

const newDeliveryPartner = async (req, res) => {
  const { phone, timeOfCreation, outlets } = req.body

  const db = getFirestore()
  await db.collection(deliveryCollection).doc(phone).set({
    phone,
    timeOfCreation,
    outlets //Array of items which identify each outlet(Doc id in firebase)
  })

  res.status(200).json({ message: "User created" })
}

const unlinkPartner = async (req, res) => {
  const { phone, outlet } = req.body

  const db = getFirestore()
  var resp = await db
    .collection(deliveryCollection)
    .doc(phone)
    .update({
      outlets: FieldValue.arrayRemove(outlet)
    })
  if (!resp) {
    throw new InternalError("Internal server error")
  }
  resp = await db
    .collection(outletCollection)
    .doc(outlet)
    .collection("FCM_tokens")
    .doc("Tokens")
    .update({
      phone: FieldValue.delete()
    })
  if (!resp) {
    throw new InternalError("Internal server error")
  }
  res.status(200).json({ message: "Partner unlinked from outlet" })
}

const linkPartner = async (req, res) => {
  const { phone, outlet } = req.body

  const db = getFirestore()
  var resp = await db
    .collection(deliveryCollection)
    .doc(phone)
    .update({
      outlets: FieldValue.arrayUnion(outlet)
    })
  if (!resp) {
    throw new InternalError("Internal server error")
  }
  res.status(200).json({ message: "Outlet added" })
  //Whenever token is updated next time , Partener will then receive notfications from particular outletß
}
export { newOutlet, newDeliveryPartner, unlinkPartner, linkPartner }
