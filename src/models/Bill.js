import mongoose from 'mongoose';

const billItemSchema = new mongoose.Schema(
  {
    id: String,
    product: {
      id: String,
      name: String,
      price: Number,
      unit: String,
      category: String,
    },
    quantity: Number,
    price: Number,
    total: Number,
  },
  { _id: false }
);

const billSchema = new mongoose.Schema(
  {
    billNo: { type: String, required: true },
    userId: { type: String, index: true },
    userPhone: { type: String, index: true },
    invoiceNumber: { type: String, default: '' },
    items: [billItemSchema],
    subtotal: Number,
    taxRate: Number,
    taxAmount: Number,
    gstType: { type: String, enum: ['igst', 'cgst'], default: 'cgst' },
    cgstRate: { type: Number, default: 9 },
    sgstRate: { type: Number, default: 9 },
    igstRate: { type: Number, default: 9 },
    cgstAmount: Number,
    sgstAmount: Number,
    igstAmount: Number,
    discountPercent: Number,
    discountAmount: Number,
    grandTotal: Number,
    customerName: String,
    customerAddress: String,
    customerPhone: String,
    status: { type: String, enum: ['draft', 'completed', 'cancelled'], default: 'completed' },
    orderId: String,
  },
  { timestamps: true }
);

billSchema.set('toJSON', {
  virtuals: false,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    ret.createdAt = ret.createdAt;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const Bill = mongoose.model('Bill', billSchema);
