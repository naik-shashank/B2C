import { getFirestore } from "firebase-admin/firestore";
import { sendNotification } from "./outletController.js";

const mainCollection = "Order";

// Haversine formula to calculate distance between two coordinates

function haversineDistance(coords1, coords2) {
  const toRad = (value) => (value * Math.PI) / 180;

  const lat1 = coords1.lat;
  const lon1 = coords1.long;
  const lat2 = coords2.lat;
  const lon2 = coords2.long;

  const R = 6371; // Radius of the Earth in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in kilometers
}

const newOrder = async (req, res) => {
  const {
    address, // Contains address and coordinates
    amount, // Total amount of the order
    products, // Object containing quantities of products
    // outletId, // ID of the outlet
    customerId, // ID of the customer
    deliveryPartnerId // ID of the delivery partner
  } = req.body;
  
  if(!address || !address.coordinates || !amount || !products || !customerId)
    return res.status(400).json({status:"fail",message:"please enter all details of order with lat,long in address"})

 

  // check for nearest outlet
 const orderCoordinates = { lat: parseFloat(address.coordinates.lat), long: parseFloat(address.coordinates.long)}; // Input coordinates
 let maxDistance = 3; // Maximum distance in kilometers
 let distance=3
 const outletsRef = db.collection('Outlets');
 const snapshot = await outletsRef.get();
 
 let nearbyOutlet ={};

 snapshot.forEach(doc => {
   const outletData = doc.data();
   const outletCoords = outletData.address.coordinates;
   
   distance = haversineDistance(orderCoordinates, {
     lat: parseFloat(outletCoords.lat),
     long: parseFloat(outletCoords.long)
   });
   
   if (distance < maxDistance) {
     maxDistance=distance
     nearbyOutlet={
       id:outletData.id || 'NA',
       name:outletData.name || 'NA',
       phNo:outletData.phNo || 'NA',
       img:outletData.img || 'NA',
       distance:distance.toFixed(2) + 'KM'
     };
   }
 });

 if (Object.keys(nearbyOutlet).length==0) {
   return res.status(404).json({status:"fail",message:'No nearby outlets, we will soon expand here!!'});
 }


  // creatig order for nearest outlet
  const outletId=nearbyOutlet.id
  const deleveryDistance=distance.toFixed(3) + "KM"
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
      status,
    });

    // 2. Fetch the customer by customerId
    const customerRef = db.collection("Customer").doc(customerId); // Fetch customer document using customer ID
    const customerDoc = await customerRef.get();

    // 3. Check if the customer exists
    if (customerDoc.exists) {
      // 4. If customer exists, increment their totalExpenditure by the order amount
      const customerData = customerDoc.data();
      const currentExpenditure = customerData.totalExpenditure || 0; // If totalExpenditure doesn't exist, default to 0
      const currentOrders=customerData.totalOrders || 0;

      await customerRef.update({
        totalExpenditure: currentExpenditure + amount,
        totalOrders:currentOrders+1
      });

    // 4. Changing total sale in Outlate 
    const outletRef = db.collection("Outlets").doc(outletId); // Fetch outlet document using outletId
    const outletDoc = await outletRef.get(); // Get the document snapshot

    if (outletDoc.exists) {
      const outletData = outletDoc.data(); // Get the document data
      await outletRef.update({
        totalSales:{
          E6: outletData.totalSales.E6 + (products.E6 || 0),
          E12: outletData.totalSales.E12 + (products.E12 || 0),
          E30: outletData.totalSales.E30 + (products.E30 || 0),
        }
      });
    }
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
    await db.collection(mainCollection).doc(id).delete();
    res.status(500).json({ message: "Internal server error" });
  }
};



const getAllOrders = async (req, res) => {
  try {
    const { outletId, customerId, startDate, endDate ,deliveryPartnerId} = req.query
    const db = getFirestore()
    let query = db.collection(mainCollection)

    // Apply filters if provided
    if (outletId) {
      query = query.where("outletId", "==", outletId)
    }

    if (customerId) {
      query = query.where("customerId", "==", customerId)
    }
    if (deliveryPartnerId) {
      query = query.where("deliveryPartnerId", "==", deliveryPartnerId)
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
