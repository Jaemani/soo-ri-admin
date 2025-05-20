import mongoose from 'mongoose';

const uri = `mongodb+srv://${process.env.REACT_APP_MONGO_USERNAME}:${process.env.REACT_APP_MONGO_PASSWORD}@${process.env.REACT_APP_MONGO_CLUSTER_URL}/${process.env.REACT_APP_MONGO_DB_NAME}?retryWrites=true&w=majority&appName=Cluster0`;

let cached = { conn: null as mongoose.Connection | null, promise: null as Promise<mongoose.Connection> | null };

export async function connectToMongoose() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
    }).then((mongooseInstance) => {
      console.log('✅ Mongoose connected to', mongooseInstance.connection.name);
      return mongooseInstance.connection;
    }).catch((err) => {
      console.error('❌ Mongoose connection failed:', err.message);
      throw err;
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
} 