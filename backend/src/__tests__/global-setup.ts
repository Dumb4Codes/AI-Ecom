import { MongoMemoryServer } from "mongodb-memory-server";

let mongod: MongoMemoryServer | undefined;

/** Boots one in-memory MongoDB for the whole run; no external services needed. */
export async function setup() {
  mongod = await MongoMemoryServer.create();
  process.env.TEST_MONGO_URI = mongod.getUri("ai-ecom-test");
}

export async function teardown() {
  await mongod?.stop();
}
