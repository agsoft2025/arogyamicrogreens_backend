/**
 * Run this once from the backend folder:
 *   node add-company-address.js
 *
 * What it does:
 *  1. Finds the user by mobile number 8940891631
 *  2. Clears isDefault on all existing addresses
 *  3. Adds the company address as the new default
 */

require('dotenv').config();
const mongoose = require('./node_modules/mongoose');

const MONGO_URI = process.env.MONGO_URI;
const USER_PHONE = '8940891631';

const companyAddress = {
  label: 'Office',
  fullName: 'Nishanth Sekar',
  phone: '8940891631',
  addressLine1: 'Plot No 359, Gokul Plots, KPHB 9th Phase',
  addressLine2: '',
  city: 'Hyderabad',
  state: 'Telangana',
  postalCode: '500085',
  country: 'India',
  isDefault: true,
};

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  const db = mongoose.connection.db;
  const users = db.collection('users');

  const user = await users.findOne({ mobileNumber: USER_PHONE });
  if (!user) {
    console.error(`No user found with mobile ${USER_PHONE}`);
    process.exit(1);
  }

  console.log(`Found user: ${user.name} (${user._id})`);

  // Ensure savedAddresses field exists and clear current defaults
  await users.updateOne(
    { _id: user._id },
    {
      $set: {
        'savedAddresses.$[elem].isDefault': false,
        ...(user.savedAddresses ? {} : { savedAddresses: [] }),
      },
    },
    { arrayFilters: [{ 'elem.isDefault': true }] }
  );

  // Push the company address
  await users.updateOne(
    { _id: user._id },
    { $push: { savedAddresses: { ...companyAddress, _id: new mongoose.Types.ObjectId() } } }
  );

  const updated = await users.findOne({ _id: user._id });
  console.log('\nSaved addresses after update:');
  (updated.savedAddresses || []).forEach((a, i) => {
    console.log(`  [${i + 1}] ${a.label || 'No label'} — ${a.city}, ${a.state} — default: ${a.isDefault}`);
  });

  await mongoose.disconnect();
  console.log('\nDone.');
}

run().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
