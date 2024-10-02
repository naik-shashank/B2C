import { getFirestore } from "firebase-admin/firestore"
import InternalError from "../errors/internalError.js"
import { getMessaging } from "firebase-admin/messaging"

const mainCollection = "Outlets"
const subCollection = "FCM_tokens"

const updateFcmToken = async (req, res) => {
  const { phone, token } = req.body

  const db = getFirestore()
  const resp = await db.collection("Delivery_partner").doc(phone).get()
  const outlets = resp.data().outlets
  if (!outlets) {
    throw new InternalError("No outlet assigned")
  }
  outlets.forEach((outlet) => {
    db.collection(mainCollection)
      .doc(outlet)
      .collection(subCollection)
      .doc("Tokens")
      .set({
        phone: token
      })
  })
  res.status(200).json({ message: "Token updated" })
}

const fetchTokens = async (outlet) => {
  const db = getFirestore()
  const resp = await db
    .collection(mainCollection)
    .doc(outlet)
    .collection(subCollection)
    .doc("Tokens")
    .get()
  if (!resp.exists) {
    throw new InternalError("Internal error")
  }
  const data = resp.data()
  const tokens = []
  for (const token of Object.values(data)) {
    tokens.push(token)
  }
  if (tokens.length == 0) {
    throw new InternalError("No tokens found")
  }
  return tokens
}

const sendNotification = async (outlet, address, id) => {
  const tokens = await fetchTokens(outlet)
  const message = {
    data: { outlet, address, id },
    tokens: tokens
  }

  const messaging = getMessaging()
  const resp = await messaging.sendEachForMulticast(message)
  console.log(`No of failed attempts = ${resp.failureCount}`)
}
export { updateFcmToken, sendNotification }
