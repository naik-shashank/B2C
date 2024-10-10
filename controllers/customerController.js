import { getFirestore } from "firebase-admin/firestore"

const mainCollection = "Customer"

const newUser = async (req, res) => {
  
  try{
  let { name, phone, email, addresses, age, gender,totalOrders } = req.body;
  if(!phone) return res.status(400).json({message:"phone is a required attribute"})
  name=name || 'newUser '+phone
  email=email || ''
  addresses=addresses || []
  age=age || ''
  gender=gender || ''


  // Assuming `addresses` is an array of objects each containing the address and coordinates
  // Example: addresses = [{ fullAddress: '123 St', coordinates: { lat: 12.34, long: 56.78 } }]
  
  const db = getFirestore();

  //check if phone number already taken
  const customerRef = db.collection(mainCollection).doc(phone);  // Fetch document using customer ID
    const customerDoc = await customerRef.get();

    if (customerDoc.exists) {
      return res.status(400).json({ message: 'phone number allready taken'});
    }

  await db.collection(mainCollection).doc(phone).set({
    name,
    phone,
    email,
    age, // New field
    gender, // New field
    totalExpenditure: 0,
    totalOrders:0, // Initialize as 0 and update this with each new order
    addresses, // Array of address objects with full address and coordinates (lat, long)
    timeOfCreation: Date.now()
  });

  res.status(200).json({ message: "User created" });
} 
catch (err){
  res.status(400).json({
    message:"failed to create user"
    
  })
  console.error(err)
}

}

const getCustomerById = async (req, res) => {
  const { customerId } = req.params;  // Assuming customerId is passed in the URL as a param
  console.log(customerId)
  try {
    const db = getFirestore();
    const customerRef = db.collection(mainCollection).doc(customerId);  // Fetch document using customer ID
    const customerDoc = await customerRef.get();

    if (!customerDoc.exists) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Return the customer's data
    return res.status(200).json({
      id: customerDoc.id,
      ...customerDoc.data()
    });
  } catch (error) {
    console.error('Error getting customer:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};




const updateUser = async (req, res) => {
  try {
    const phone = req.params.phone;
    const { name, email, age, gender, removeAddr } = req.body;

    if (!phone) return res.status(400).json({ message: "Phone number is required" });

    // Parse addresses from JSON if it exists
    let addresses = req.body.addresses ? JSON.parse(req.body.addresses) : [];

    // Get Firestore instance
    const db = getFirestore();

    // Get the existing user document
    const userDocRef = db.collection(mainCollection).doc(phone);
    const userDoc = await userDocRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ message: "User not found" });
    }

    // Retrieve existing data
    const userData = userDoc.data();

    // Prepare updated fields (if values are provided in the request, they will be updated)
    const updatedData = {
      name: name || userData.name,
      email: email || userData.email,
      age: age || userData.age,
      gender: gender || userData.gender,
      addresses: userData.addresses || []
    };

    // Remove address at the specified index if `removeAddr` is provided
    
    if (removeAddr) {
      const ind = parseInt(removeAddr, 10);
      
      if (ind >= 0 && ind < updatedData.addresses.length) {
        updatedData.addresses.splice(ind, 1); // Remove the address at the index
      } else {
        return res.status(400).json({ message: "Invalid address index" });
      }
    }

    // Append new addresses to existing ones
    else if (addresses && addresses.length > 0) {
      updatedData.addresses = [
        ...updatedData.addresses, // Use the updatedData addresses for removal logic
        ...addresses
      ];
    }

    // Update Firestore document
    await userDocRef.update(updatedData);

    res.status(200).json({
      message: "User updated successfully",
      updatedData
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to update user", error: err.message });
    console.error(err);
  }
};



export { newUser,getCustomerById,updateUser};
