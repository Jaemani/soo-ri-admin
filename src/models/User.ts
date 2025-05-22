import mongoose from 'mongoose';

export interface IUser {
  _id: string;
  firebaseUid: string;
  name: string;
  phoneNumber: string;
  role: 'user' | 'admin' | 'repairer' | 'guardian';
  recipientType: '일반' | '차상위' | '수급자' | '미등록';
  supportedDistrict: '강남구' | '강동구' | '강북구' | '강서구' | '관악구' | '광진구' | '구로구' | '금천구' | '노원구' | '도봉구' | '동대문구' | '동작구' | '마포구' | '서대문구' | '서초구' | '성동구' | '성북구' | '송파구' | '양천구' | '영등포구' | '용산구' | '은평구' | '종로구' | '중구' | '중랑구' | '서울 외';
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
  recipientType: { type: String, enum: ['일반', '차상위', '수급자', '미등록'], required: true },
  supportedDistrict: { type: String, enum: ['강남구', '강동구', '강북구', '강서구', '관악구', '광진구', '구로구', '금천구', '노원구', '도봉구', '동대문구', '동작구', '마포구', '서대문구', '서초구', '성동구', '성북구', '송파구', '양천구', '영등포구', '용산구', '은평구', '종로구', '중구', '중랑구', '서울 외'], required: true },
  smsConsent: { type: Boolean, default: false },
  guardianIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'guardians' }]
}, {
  timestamps: true,
  versionKey: false
});

// Check if the model is already defined to prevent OverwriteModelError
export const User = mongoose.models.users || mongoose.model<IUser>('users', UserSchema); 