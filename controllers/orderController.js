import { getFirestore } from "firebase-admin/firestore";
import { sendNotification } from "./outletController.js";

const mainCollection = "Order";

const newOrder = async (req, res) => {
  const {
    address, // Contains address and coordinates
    amount, // Total amount of the order
    products, // Object containing quantities of products
    outletId, // ID of the outlet
    customerId, // ID of the customer
    deliveryPartnerId // ID of the delivery partner
  } = req.body;
  
  const createdAt=Date.now();
  const updatedAt=createdAt
  const status="pending";

  // Generate a unique ID for the order
  const id = `${customerId}-${createdAt}`;

  const db = getFirestore();
  
  try {
    // 1. Create the new order in Firestore
    await db.collection(mainCollection).doc(id).set({
      address, // Address and coordinates
      amount, // Total amount of the order
      products, // Object with product quantities (E6, E12, E30)
      createdAt: new Date(createdAt), // Timestamp for order creation
      updatedAt: new Date(updatedAt), // Timestamp for order update
      outletId, // ID of the outlet
      customerId, // ID of the customer
      deliveryPartnerId, // ID of the delivery partner
      status
    });

    // 2. Fetch the customer by customerId
    const customerRef = db.collection("Customer").doc(customerId); // Fetch customer document using customer ID
    const customerDoc = await customerRef.get();

    // 3. Check if the customer exists
    if (customerDoc.exists) {
      // 4. If customer exists, increment their totalExpenditure by the order amount
      const customerData = customerDoc.data();
      const currentExpenditure = customerData.totalExpenditure || 0; // If totalExpenditure doesn't exist, default to 0

      await customerRef.update({
        totalExpenditure: currentExpenditure + amount
      });

      // Return success response
      return res.status(200).json({ message: "Order created and customer totalExpenditure updated" });
    } else {
      // 5. If customer does not exist, delete the created order
      await db.collection(mainCollection).doc(id).delete();
      
      // 6. Return an error message for customer not found
      return res.status(400).json({ message: 'Customer not found, order deleted' });
    }

    // (Optional) Sending notifications (Uncomment if needed)
    // sendNotification(outletId, address.fullAddress, id);

  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};



const getAllOrders = async (req, res) => {
  try {
    const { outletId, customerId, startDate, endDate } = req.query
    const db = getFirestore()
    let query = db.collection(mainCollection)

    // Apply filters if provided
    if (outletId) {
      query = query.where("outletId", "==", outletId)
    }

    if (customerId) {
      query = query.where("customerId", "==", customerId)
    }
    
    if (startDate && endDate) {
      query = query
        .where("createdAt", ">=", new Date(startDate))
        .where("createdAt", "<=", new Date(endDate))
    }

    // Default sorting by creation date
    query = query.orderBy("createdAt", "desc")

    const snapshot = await query.get()

    if (snapshot.empty) {
      return res.status(404).json({ message: "No orders found" })
    }

    const orders = []
    snapshot.forEach(doc => {
      orders.push({ id: doc.id, ...doc.data() })
    })

    res.status(200).json({size:orders.length,orders})
  } catch (err) {
    console.error("Error creating order:", err);
    res.status(500).json({ message: "Internal server error" });
  }
}





export { newOrder,getAllOrders }
