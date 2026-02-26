import mongoose from 'mongoose';

const phoneUserSchema = new mongoose.Schema(
  {
    phone: { type: String, required: true, unique: true, index: true },
    phoneNumber: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
  },
  { timestamps: true }
);

phoneUserSchema.set('toJSON', {
  virtuals: false,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    ret.uid = ret.phone;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const PhoneUser = mongoose.model('PhoneUser', phoneUserSchema);
