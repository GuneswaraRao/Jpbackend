import mongoose from 'mongoose';

const companyDetailsSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    address: { type: String, required: true },
    phone: { type: String, required: true },
    email: String,
    gstin: String,
    tagline: String,
    // New fields for GST invoice
    logoUrl: String,
    returnAddress: String,
    jurisdiction: String,
    upiId: String,
    bankName: String,
    accountNo: String,
    ifsc: String,
    branch: String,
  },
  { timestamps: true }
);

// Single-document collection; we use findOneAndUpdate with upsert
companyDetailsSchema.set('toJSON', {
  virtuals: false,
  transform: (doc, ret) => {
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const CompanyDetails = mongoose.model('CompanyDetails', companyDetailsSchema);
