import mongoose, { Document, Schema, Model } from 'mongoose';

/**
 * Order Model
 * Represents customer orders in the system
 */

export enum OrderType {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
}

export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  RETURNED = 'RETURNED',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  CANCELLED = 'CANCELLED',
}

export interface IOrderItem {
  productId: mongoose.Types.ObjectId;
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  discounts?: number;
}

export interface ITrackingInfo {
  currentStatus: OrderStatus;
  statusHistory: {
    status: OrderStatus;
    timestamp: Date;
    notes?: string;
  }[];
  estimatedDelivery?: Date;
  deliveryPersonId?: mongoose.Types.ObjectId;
}

export interface IOrder extends Document {
  orderId: string;
  customerId: mongoose.Types.ObjectId;
  retailerId: mongoose.Types.ObjectId;
  items: IOrderItem[];
  orderType: OrderType;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  totalAmount: number;
  deliveryAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  scheduledDate?: Date;
  trackingInfo: ITrackingInfo;
  upiTransactionId?: mongoose.Types.ObjectId;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Order Item Schema
const OrderItemSchema = new Schema<IOrderItem>({
  productId: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  subtotal: {
    type: Number,
    required: true,
    min: 0,
  },
  discounts: {
    type: Number,
    default: 0,
    min: 0,
  },
}, { _id: false });

// Tracking Info Schema
const TrackingInfoSchema = new Schema<ITrackingInfo>({
  currentStatus: {
    type: String,
    enum: Object.values(OrderStatus),
    required: true,
    default: OrderStatus.PENDING,
  },
  statusHistory: [{
    status: {
      type: String,
      enum: Object.values(OrderStatus),
      required: true,
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
    },
    notes: String,
  }],
  estimatedDelivery: Date,
  deliveryPersonId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
}, { _id: false });

// Order Schema
const OrderSchema = new Schema<IOrder>({
  orderId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  customerId: {
    type: Schema.Types.ObjectId,
    ref: 'Customer',
    required: [true, 'Customer ID is required'],
    index: true,
  },
  retailerId: {
    type: Schema.Types.ObjectId,
    ref: 'Retailer',
    required: [true, 'Retailer ID is required'],
    index: true,
  },
  items: {
    type: [OrderItemSchema],
    required: true,
    validate: [
      (v: IOrderItem[]) => v.length > 0,
      'Order must have at least one item',
    ],
  },
  orderType: {
    type: String,
    enum: Object.values(OrderType),
    required: true,
    default: OrderType.ONLINE,
  },
  status: {
    type: String,
    enum: Object.values(OrderStatus),
    required: true,
    default: OrderStatus.PENDING,
    index: true,
  },
  paymentStatus: {
    type: String,
    enum: Object.values(PaymentStatus),
    required: true,
    default: PaymentStatus.PENDING,
    index: true,
  },
  totalAmount: {
    type: Number,
    required: [true, 'Total amount is required'],
    min: 0,
  },
  deliveryAddress: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    country: { type: String, required: true, default: 'India' },
  },
  scheduledDate: Date,
  trackingInfo: {
    type: TrackingInfoSchema,
    required: true,
    default: () => ({
      currentStatus: OrderStatus.PENDING,
      statusHistory: [{
        status: OrderStatus.PENDING,
        timestamp: new Date(),
      }],
    }),
  },
  upiTransactionId: {
    type: Schema.Types.ObjectId,
    ref: 'UPITransaction',
  },
  notes: String,
}, {
  timestamps: true,
});

/**
 * Indexes
 */
OrderSchema.index({ customerId: 1, createdAt: -1 });
OrderSchema.index({ retailerId: 1, status: 1 });
OrderSchema.index({ orderId: 1 }, { unique: true });
OrderSchema.index({ status: 1, paymentStatus: 1 });
OrderSchema.index({ createdAt: -1 });

/**
 * Pre-save Middleware
 */
OrderSchema.pre('save', function(next) {
  // Generate order ID if not exists
  if (!this.orderId) {
    this.orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  }
  next();
});

/**
 * Instance Methods
 */

// Update order status
OrderSchema.methods.updateStatus = async function(newStatus: OrderStatus, notes?: string): Promise<void> {
  this.status = newStatus;
  this.trackingInfo.currentStatus = newStatus;
  this.trackingInfo.statusHistory.push({
    status: newStatus,
    timestamp: new Date(),
    notes,
  });
  await this.save();
};

// Calculate total
OrderSchema.methods.calculateTotal = function(): number {
  return this.items.reduce((total, item) => total + item.subtotal, 0);
};

// Cancel order
OrderSchema.methods.cancel = async function(reason?: string): Promise<void> {
  if (this.status === OrderStatus.DELIVERED) {
    throw new Error('Cannot cancel delivered order');
  }
  await this.updateStatus(OrderStatus.CANCELLED, reason);
  this.paymentStatus = PaymentStatus.CANCELLED;
  await this.save();
};

// Mark as paid
OrderSchema.methods.markAsPaid = async function(): Promise<void> {
  this.paymentStatus = PaymentStatus.COMPLETED;
  await this.save();
};

/**
 * Static Methods
 */

// Find orders by customer
OrderSchema.statics.findByCustomer = function(customerId: mongoose.Types.ObjectId) {
  return this.find({ customerId })
    .populate('retailerId', 'profile.name store')
    .sort({ createdAt: -1 });
};

// Find orders by retailer
OrderSchema.statics.findByRetailer = function(retailerId: mongoose.Types.ObjectId, status?: OrderStatus) {
  const query: any = { retailerId };
  if (status) query.status = status;
  return this.find(query)
    .populate('customerId', 'profile.name profile.phone')
    .sort({ createdAt: -1 });
};

// Find pending orders
OrderSchema.statics.findPending = function() {
  return this.find({
    status: { $in: [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PROCESSING] },
  })
    .populate('customerId retailerId')
    .sort({ createdAt: -1 });
};

// Get order statistics
OrderSchema.statics.getStatistics = async function(retailerId: mongoose.Types.ObjectId, dateRange?: { start: Date; end: Date }) {
  const match: any = { retailerId };
  if (dateRange) {
    match.createdAt = { $gte: dateRange.start, $lte: dateRange.end };
  }

  return this.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalRevenue: { $sum: '$totalAmount' },
      },
    },
  ]);
};

/**
 * Virtual fields
 */
OrderSchema.virtual('itemCount').get(function() {
  return this.items.reduce((sum, item) => sum + item.quantity, 0);
});

OrderSchema.virtual('canCancel').get(function() {
  return ![OrderStatus.DELIVERED, OrderStatus.CANCELLED, OrderStatus.RETURNED].includes(this.status);
});

/**
 * Create and export Order model
 */
const Order: Model<IOrder> = mongoose.model<IOrder>('Order', OrderSchema);

export default Order;
