/**
 * MongoDB -> Firestore migration helper.
 *
 * Usage:
 *   1. Create a Firebase service-account key (IAM & Admin > Service Accounts).
 *   2. Save the JSON locally and point GOOGLE_APPLICATION_CREDENTIALS at it.
 *   3. Ensure MongoDB credentials are available (env or .env.migration).
 *   4. Run: `node scripts/migrate-mongo-to-firestore.js`
 *
 * Environment variables:
 *   MONGO_USERNAME, MONGO_PASSWORD, MONGO_CLUSTER_URL, MONGO_DB_NAME
 *   FIREBASE_PROJECT_ID (optional – falls back to service account project_id)
 *   GOOGLE_APPLICATION_CREDENTIALS (path to service-account JSON)
 *
 * The script copies each collection listed in COLLECTIONS_TO_MIGRATE,
 * preserving document IDs and converting ObjectId/Date/Decimal128 values
 * into Firestore-friendly primitives.
 */

/* eslint-disable no-console */

require('dotenv').config();
const mongoose = require('mongoose');
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const REQUIRED_VARS = [
  'MONGO_USERNAME',
  'MONGO_PASSWORD',
  'MONGO_CLUSTER_URL',
  'MONGO_DB_NAME',
];

const missingVars = REQUIRED_VARS.filter((key) => !process.env[key]);
if (missingVars.length) {
  console.error(
    `Missing MongoDB env vars: ${missingVars.join(', ')}. ` +
      'Add them to .env.migration or export before running.',
  );
  process.exit(1);
}

if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.error(
    'GOOGLE_APPLICATION_CREDENTIALS is required (path to Firebase service-account JSON).',
  );
  process.exit(1);
}

const serviceAccountPath = path.resolve(process.env.GOOGLE_APPLICATION_CREDENTIALS);
if (!fs.existsSync(serviceAccountPath)) {
  console.error(`Service-account file not found: ${serviceAccountPath}`);
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: process.env.FIREBASE_PROJECT_ID || serviceAccount.project_id,
});

const firestore = admin.firestore();
firestore.settings({ ignoreUndefinedProperties: true });

const mongoUri = `mongodb+srv://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}` +
  `@${process.env.MONGO_CLUSTER_URL}/${process.env.MONGO_DB_NAME}?retryWrites=true&w=majority`;

const COLLECTIONS_TO_MIGRATE = [
  { mongo: 'guardians', firestore: 'guardians' },
  { mongo: 'repairStations', firestore: 'repairStations' },
  { mongo: 'repairstations', firestore: 'repairStationsLegacy' },
  { mongo: 'repairs', firestore: 'repairs' },
  { mongo: 'selfchecks', firestore: 'selfChecks' },
  { mongo: 'vehicles', firestore: 'vehicles' },
];

const isObjectId = (value) => value instanceof mongoose.Types.ObjectId;
const isDecimal128 = (value) => value instanceof mongoose.Types.Decimal128;

const convertValue = (value) => {
  if (isObjectId(value)) return value.toHexString();
  if (isDecimal128(value)) return Number.parseFloat(value.toString());
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(convertValue);
  if (value && typeof value === 'object') {
    return Object.keys(value).reduce((acc, key) => {
      acc[key] = convertValue(value[key]);
      return acc;
    }, {});
  }
  return value;
};

const migrateCollection = async (mongoName, firestoreName) => {
  const mongoCollection = mongoose.connection.collection(mongoName);
  const cursor = mongoCollection.find({});

  let batch = firestore.batch();
  let batchCount = 0;
  let processed = 0;

  while (await cursor.hasNext()) {
    const doc = await cursor.next();
    if (!doc) continue;

    const { _id, ...rest } = doc;
    const data = convertValue(rest);

    const docId = isObjectId(_id) ? _id.toHexString() : String(_id);
    const ref = firestore.collection(firestoreName).doc(docId);
    batch.set(ref, {
      ...data,
      _id: docId, // preserve original id for clients still expecting it
    });

    batchCount += 1;
    processed += 1;

    if (batchCount === 400) {
      await batch.commit();
      console.log(`[${mongoName}] committed batch – ${processed} documents migrated`);
      batch = firestore.batch();
      batchCount = 0;
    }
  }

  if (batchCount) {
    await batch.commit();
    console.log(`[${mongoName}] committed final batch – ${processed} documents migrated`);
  } else {
    console.log(`[${mongoName}] no remaining docs to commit`);
  }

  return processed;
};

async function migrateAll() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(mongoUri, {
    maxPoolSize: 5,
    serverSelectionTimeoutMS: 10_000,
  });
  console.log(`Connected to MongoDB database: ${process.env.MONGO_DB_NAME}`);

  const summary = {};

  for (const { mongo, firestore: target } of COLLECTIONS_TO_MIGRATE) {
    console.log(`\nMigrating collection: ${mongo} -> ${target}`);
    const count = await migrateCollection(mongo, target);
    summary[mongo] = count;
  }

  await mongoose.disconnect();
  console.log('\nMigration complete. Document counts:');
  Object.entries(summary).forEach(([collection, count]) => {
    console.log(`  ${collection}: ${count}`);
  });
}

migrateAll()
  .then(() => {
    console.log('\nAll collections migrated successfully.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });

