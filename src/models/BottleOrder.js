import mongoose from 'mongoose';

const bottleOrderItemSchema = new mongoose.Schema(
  {
    productId: String,
    productName: String,
    category: String,
    gauge: String,
    price: Number,
    quantity: Number,
    total: Number,
  },
  { _id: false }
);

const bottleOrderSchema = new mongoose.Schema(
  {
    orderNo: { type: String, required: true },
    userId: { type: String, index: true },
    userPhone: { type: String, index: true },
    billId: String,
    customerName: { type: String, required: true },
    customerPhone: { type: String, required: true },
    customerAddress: String,
    items: [bottleOrderItemSchema],
    bottleType: String,
    quantity: Number,
    depositAmount: Number,
    status: {
      type: String,
      enum: ['pending', 'accepted', 'ready_to_dispatch', 'completed', 'delivered', 'returned', 'cancelled', 'Pending', 'Processing', 'Delivered', 'Complete', 'Cancelled'],
      default: 'pending',
    },
    orderDate: { type: Date, default: Date.now },
    deliveryDate: Date,
    returnDate: Date,
    notes: String,
  },
  { timestamps: true }
);

bottleOrderSchema.set('toJSON', {
  virtuals: false,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    ret.orderDate = ret.orderDate;
    ret.deliveryDate = ret.deliveryDate;
    ret.returnDate = ret.returnDate;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const BottleOrder = mongoose.model('BottleOrder', bottleOrderSchema);
