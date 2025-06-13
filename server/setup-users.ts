import { hashPassword } from "./auth";
import { storage } from "./storage";

async function setupInitialUsers() {
  const defaultPassword = "Inktricate2024!";
  const hashedPassword = await hashPassword(defaultPassword);
  
  const users = [
    { id: "43458679", username: "admin", firstName: "Pooran", lastName: "Rajput" },
    { id: "founder_bindiya_rajput", username: "bindiya", firstName: "Bindiya", lastName: "Rajput" },
    { id: "emp_madhuri_mccartney", username: "madhuri", firstName: "Madhuri", lastName: "McCartney" },
    { id: "emp_alysha_mahagaonkar", username: "alysha", firstName: "Alysha", lastName: "Mahagaonkar" },
    { id: "emp_rhea_doshi", username: "rhea", firstName: "Rhea", lastName: "Doshi" },
  ];

  for (const user of users) {
    await storage.updateUserCredentials(user.id, user.username, hashedPassword);
    console.log(`Updated credentials for ${user.firstName} ${user.lastName} (username: ${user.username})`);
  }
  
  console.log(`\nAll users have been set up with username/password authentication.`);
  console.log(`Default password: ${defaultPassword}`);
  console.log(`Users must reset their password on first login.`);
}

setupInitialUsers().catch(console.error);