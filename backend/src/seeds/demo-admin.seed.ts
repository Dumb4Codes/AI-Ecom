import "dotenv/config";
import mongoose from "mongoose";
import UserModel from "../models/user.model";
import { USER_ROLES } from "../constants/enums";

/**
 * Idempotently creates (or promotes) a demo admin so reviewers can explore the
 * admin dashboard on the live demo. Credentials come from the environment so
 * no password is ever committed:
 *
 *   DEMO_ADMIN_EMAIL=demo-admin@example.com DEMO_ADMIN_PASSWORD=... npm run seed:demo-admin
 */
const run = async () => {
  const email = process.env.DEMO_ADMIN_EMAIL;
  const password = process.env.DEMO_ADMIN_PASSWORD;
  const mongoUri = process.env.MONGO_URI;

  if (!email || !password || !mongoUri) {
    throw new Error("Set DEMO_ADMIN_EMAIL, DEMO_ADMIN_PASSWORD and MONGO_URI");
  }

  await mongoose.connect(mongoUri);

  const existing = await UserModel.findOne({ email });
  if (existing) {
    existing.role = USER_ROLES.ADMIN;
    existing.password = password; // re-hashed by the pre-save hook
    await existing.save();
    console.log(`Updated demo admin ${email}`);
  } else {
    await UserModel.create({
      name: "Demo Admin",
      email,
      password,
      role: USER_ROLES.ADMIN,
    });
    console.log(`Created demo admin ${email}`);
  }

  await mongoose.disconnect();
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
