import { getFirestore } from "firebase-admin/firestore"

const mainCollection = "Delivery_partner"

const deliveryPartnerProfile = async (req, res) => {
  const { phone, name, imageLink } = req.body

  const db = getFirestore()
  await db.collection(mainCollection).doc(phone).set({
    name,
    imageLink,
    status: false
  })

  res.status(200).json({ message: "Profile created" })
}

export { deliveryPartnerProfile }
