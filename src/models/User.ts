import mongoose from 'mongoose';

export interface IUser {
  _id: string;
  firebaseUid: string;
  name: string;
  phoneNumber: string;
  role: 'user' | 'admin' | 'repairer' | 'guardian';
  recipientType: 'general' | 'lowIncome' | 'welfare' | 'unregistered';
  smsConsent: boolean;
  guardianIds: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new mongoose.Schema({
  firebaseUid: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin', 'repairer', 'guardian'], default: 'user' },
  recipientType: { type: String, enum: ['general', 'lowIncome', 'welfare', 'unregistered'], required: true },
  smsConsent: { type: Boolean, default: false },
  guardianIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'guardians' }]
}, {
  timestamps: true,
  versionKey: false
});

// Check if the model is already defined to prevent OverwriteModelError
export const User = mongoose.models.users || mongoose.model<IUser>('users', UserSchema); 