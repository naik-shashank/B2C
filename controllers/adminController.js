import { FieldValue, getFirestore } from "firebase-admin/firestore"
import InternalError from "../errors/internalError.js"
import {removeImg} from "../utils/imageRemove.js"

const outletCollection = "Outlets"
const deliveryCollection = "Delivery_partner"

const newOutlet = async (req, res) => {
  try{
    const { name, phNo, location ,id,outletPartnerId,} = req.body
    if (!req.file) {
      return res
        .status(400)
        .json({ status: "fail", message: "No image file provided" });
    }
    const img=req.file.path || ''

    // Validate the input data
    if (!name || !phNo || !location || !id || !outletPartnerId) {
      await removeImg(req.file.path)
      throw new InternalError("All fields are required")
    }
    
    const db = getFirestore()

    //check if outlet id is unique
    const outletRef = db.collection('Outlets').doc(id);  // Fetch document using customer ID
    const outletDoc = await outletRef.get();

    if (outletDoc.exists) {
      await removeImg(req.file.path)
      return res.status(400).json({ message: 'id must be unique'});
    }

    const address=JSON.parse(location) || {}

    await db.collection(outletCollection).doc(id).set({
      id,
      name,
      phNo,
      // location: {
      //   address: location.address,
      //   coordinates: location.coordinates // Store as an object { lat: number, lng: number }
      // },
      address,
      outletPartnerId,
      deleveryPartners:req.body.deleveryPartners || [],
      img,
      //my changes
      totalSales:{E6:0,E12:0,E30:0}
    })
  
    res.status(200).json({ message: "Outlet created successfully",data:req.body })
}
catch (err){
  if(req.file)
  await removeImg(req.file.path)
  res.status(400).json({
    message:"failed to create outlet",
    err
  })
  console.log(err);
  
}
}

const createOutletPartner = async (req, res) => {
 
  const { firstName,lastName,aadharNo,password,phone } = req.body
   
  if (!req.file) {
    return res
      .status(400)
      .json({ status: "fail", message: "No image file provided" });
  }
  if(!aadharNo || !password || ! phone) {
    await removeImg(req.file.path)
    return res.status(400).json({
    message:"please enter adharNo, password & phone"
  })
}


const db = getFirestore()

const partnerRef = db.collection('Outlet_partner').doc(phone);  // Fetch document using customer ID
    const partnerDoc = await partnerRef.get();
     
    if (partnerDoc.exists) {
      await removeImg(req.file.path)
      return res.status(400).json({ message: 'phone number allready taken'});
    }

   const img=req.file.path || ''

  
  await db.collection('Outlet_partner').doc(phone).set({
    firstName,lastName,aadharNo,password,phone,img
  })

  res.status(200).json({ message: req.body })
}


const deleteOutletPartner=async (req,res)=>{
  try {
  
    const userId = req.params.userId;
    const db = getFirestore()

    // Reference to the Firestore document for the user
    const userRef = db.collection('Outlet_partner').doc(userId);
    const driverDoc = await userRef.get();


    await removeImg(driverDoc.data().img)
    await userRef.delete();
    
    // Send a response indicating the user was successfully deleted
    res.status(200).json({ message: `Partner with ID ${userId} deleted successfully.` });
  } catch (error) {
    // Handle errors (e.g., if user ID doesn't exist)
    console.error('Error deleting Partner:', error);
    res.status(500).json({ message: 'Error deleting partner', error: error.message });
  }
}



const newDeliveryPartner = async (req, res) => {
  let { phone, timeOfCreation, outlets } = req.body
  timeOfCreation=timeOfCreation || Date.now()
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


const customerInsights = async (req, res) => {
  try {
    const db = getFirestore();

    // Fetch customers ordered by totalOrders in descending order
    const customersSnapshot = await db.collection('Customer')
      .orderBy('totalOrders', 'desc')  // Order by totalOrders in descending order
      .get();

    const totalCustomers = customersSnapshot.size
    const ageGroup=[0,0,0,0,0,0] // [0-25,25-35,35,45,45-60,60+,notDefined]
    let inactiveCust=0,newCust=0,returningCust=0,male=0,female=0,others=0;

    // Map the snapshot to extract specific fields
    const customers = customersSnapshot.docs.map(doc => {
      const data = doc.data();

      //aggregating age groups
      let age=parseInt(data.age,10)
      if(age<=25) ageGroup[0]++;
      else if(age<=35) ageGroup[1]++;
      else if(age<=45) ageGroup[2]++;
      else if(age<=60) ageGroup[3]++;
      else if(age<=100)ageGroup[4]++;
      else ageGroup[5]++;
      
      //agregating old,new & inactive customers
      const totalOrders=data.totalOrders
      if(totalOrders==0) inactiveCust++;
      else if(totalOrders==1) newCust++;
      else returningCust++;

      //male or female
      if(data.gender.toLowerCase()==="male") male++;
      else if(data.gender.length==0) others++;
      else female++

      //returning onle name,phone,orders and expenditure to req
      return {
        name: data.name,
        phone:data.phone,
        totalOrders: data.totalOrders,
        totalExpenditure: data.totalExpenditure
      };
    });
    
    
    //converting data into %

    for(let k=0;k<6;k++){
      ageGroup[k]=ageGroup[k]*100.0/totalCustomers;
    }
    male=male*100.0/totalCustomers;
    female=female*100.0/totalCustomers;
    others=others*100.0/totalCustomers;
    inactiveCust=inactiveCust*100.0/totalCustomers;
    newCust=newCust*100.0/totalCustomers;
    returningCust=returningCust*100.0/totalCustomers


    // Send the extracted data as a JSON response
    res.status(200).json({
      customers,
      aggergation:{
        ageGroup:{
          "<25":ageGroup[0],
          "<35":ageGroup[1],
          "<45":ageGroup[2],
          "<60":ageGroup[3],
          "60+":ageGroup[4],
          "oth":ageGroup[5],

        },
        totalCustomers,
        inactiveCust,
        custEnquiry:0,
        newCust,
        returningCust,
        male,
        female,
        others
      }
    });
  } catch (error) {
    console.error('Error getting customers:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};



const deliveryInsights = async (req,res)=>{
  try {
    const db = getFirestore();

    const driversCollection = db.collection('Delivery_partner'); // Replace with your collection name
    const snapshot = await driversCollection.get();
    const totalDrivers=snapshot.size
    let totalDeliveries=0
    
    if (snapshot.empty) {
      return res.status(404).json({ message: 'No delivery drivers found' });
    }

    const drivers = [];
    snapshot.forEach(doc => {
      totalDeliveries+=doc.data().totalDeliveries
      drivers.push(
        { 
          id: doc.id,
          name:doc.data().firstName,
          password: doc.data().password,
          ratings: doc.data().ratings,
          totalDeliveries: doc.data().totalDeliveries
         });
    });

    return res.status(200).json({totalDeliveries,totalDrivers,drivers});
  } catch (error) {
    console.error('Error fetching delivery drivers:', error);
    return res.status(500).json({ message: 'Error fetching delivery drivers', error });
  }
}




// Handler function to fetch outlets, orders, and partners
const getAllOutletsWithOrderAndPartners = async (req, res) => {
  try {

    const db = getFirestore();
    // Fetch all outlets from the Outlet collection
    const outlets = await db.collection('Outlets').get();
    const totalOutlets=outlets.size
    const outletData = outlets.docs.map(doc => (
      { 
        id: doc.id,
        name:doc.data().name,
        area:doc.data().address.fullAddress.area,
        outletPartnerId:doc.data().outletPartnerId,
        contact:doc.data().phNo
      }));

    // Fetch total number of orders from the Order collection
    const orders = await db.collection('Order').get();
    const totalOrders = orders.size; // size gives the count of documents in the collection
    let revenue=0;
    orders.docs.forEach(doc =>{
        revenue+=doc.data().amount
    });  //doc.data()

    // Fetch all outlet partners from the OutletPartner collection
    const partners = await db.collection('Delivery_partner').get();
    const totalPartners=partners.size

    // Create the response object with all the data
    const response = {
      revenue,
      totalOrders,      // Send total number of orders
      totalOutlets,
      totalPartners,
      outlets: outletData
    };

    // Send the combined response
    return res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching data:', error.message);
    return res.status(500).json({ error: 'Failed to fetch data' });
  }
};


const getOneOutlet = async (req, res) => {
  try {
    const db = getFirestore();
    const id = req.params.id;

    // Fetch outlet details by id
    const outletDoc = db.collection('Outlets').doc(id);  
    const outletSnapshot = await outletDoc.get();

    if (!outletSnapshot.exists) {
      return res.status(404).json({ message: 'Outlet not found' });
    }

    const outletData = outletSnapshot.data();

    // Fetch orders for the outlet and calculate revenue
    let revenue = 0;
    let totalOrders = 0;

    const ordersQuery = await db.collection('Order').where("outletId", "==", id).get();

    ordersQuery.docs.forEach(doc => {
      revenue += doc.data().amount || 0; // Sum up the order amounts
      totalOrders++; // Count total orders
    });

    // Fetch outlet partner (assuming the partner's document ID is stored in the outlet)
    const partnerId = outletData.outletPartnerId; // Assuming `outletPartnerId` is stored in outlet data
    const partnersDoc = db.collection('Outlet_partner').doc(partnerId);  
    const partnerSnapshot = await partnersDoc.get();

    let outletPartnerData = {};
    if (partnerSnapshot.exists) {
      outletPartnerData = partnerSnapshot.data();
    }

    // Fetch delivery partner details based on delivery partner IDs
    const deliveryPartnerIds = outletData.deleveryPartners || [];
    const deliveryPartnerDetails = [];

    for (const partnerId of deliveryPartnerIds) {
      const deliveryPartnerDoc = db.collection('Delivery_partner').doc(partnerId);
      const deliveryPartnerSnapshot = await deliveryPartnerDoc.get();

      if (deliveryPartnerSnapshot.exists) {
        deliveryPartnerDetails.push(deliveryPartnerSnapshot.data());
      }
    }

    // Create the response object with all the data
    const response = {
      revenue,
      totalOrders,
      totalDeleveryPartners: deliveryPartnerIds.length,
      outlet: outletData,
      outletPartner: outletPartnerData,
      deliveryPartners: deliveryPartnerDetails // Adding delivery partners details to the response
    };

    // Send the combined response
    return res.status(200).json(response);

  } catch (error) {
    console.error('Error fetching data:', error.message);
    return res.status(500).json({ error: 'Failed to fetch data' });
  }
};


export { newOutlet,createOutletPartner,deleteOutletPartner, newDeliveryPartner, unlinkPartner, linkPartner ,customerInsights,deliveryInsights,getAllOutletsWithOrderAndPartners,getOneOutlet}
