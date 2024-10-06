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
        ageGroup,
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



export { newOutlet, newDeliveryPartner, unlinkPartner, linkPartner ,customerInsights}
