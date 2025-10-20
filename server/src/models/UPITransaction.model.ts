import mongoose, { Document, Schema, Model } from 'mongoose';

/**
 * UPI Transaction Model
 * Manages UPI payment transactions through various gateways
 */

export enum UPIGatewayType {
  PHONEPE = 'PHONEPE',
  GOOGLEPAY = 'GOOGLEPAY',
  PAYTM = 'PAYTM',
  BHIM = 'BHIM',
  AMAZON_PAY = 'AMAZON_PAY',
}

export enum TransactionStatus {
  INITIATED = 'INITIATED',
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  TIMEOUT = 'TIMEOUT',
  CANCELLED = 'CANCELLED',
  REFUND_INITIATED = 'REFUND_INITIATED',
  REFUNDED = 'REFUNDED',
}

export interface IUPITransaction extends Document {
  transactionId: string;
  orderId: mongoose.Types.ObjectId;
  customerId: mongoose.Types.ObjectId;
  merchantId: mongoose.Types.ObjectId; // Retailer/Wholesaler
  amount: number;
  currency: string;
  status: TransactionStatus;
  gateway: UPIGatewayType;
  upiId?: string; // Customer's UPI ID (e.g., user@paytm)
  merchantTransactionId: string; // Gateway's transaction ID
  merchantVPA?: string; // Virtual Payment Address
  qrCode?: string; // QR code string for payment
  paymentLink?: string; // Deep link for UPI apps
  responseCode?: string;
  responseMessage?: string;
  bankReferenceNumber?: string;
  gatewayResponseData?: Map<string, any>;
  initiatedAt: Date;
  completedAt?: Date;
  expiresAt: Date;
  metadata?: {
    ipAddress?: string;
    userAgent?: string;
    deviceId?: string;
  };
  refund?: {
    refundId: string;
    amount: number;
    reason: string;
    status: 'PENDING' | 'COMPLETED' | 'FAILED';
    initiatedAt: Date;
    completedAt?: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

// UPI Transaction Schema
const UPITransactionSchema = new Schema<IUPITransaction>({
  transactionId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  orderId: {
    type: Schema.Types.ObjectId,
    ref: 'Order',
    required: [true, 'Order ID is required'],
    index: true,
  },
  customerId: {
    type: Schema.Types.ObjectId,
    ref: 'Customer',
    required: [true, 'Customer ID is required'],
    index: true,
  },
  merchantId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Merchant ID is required'],
    index: true,
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount cannot be negative'],
  },
  currency: {
    type: String,
    required: true,
    default: 'INR',
    uppercase: true,
  },
  status: {
    type: String,
    enum: Object.values(TransactionStatus),
    required: true,
    default: TransactionStatus.INITIATED,
    index: true,
  },
  gateway: {
    type: String,
    enum: Object.values(UPIGatewayType),
    required: [true, 'Gateway is required'],
    index: true,
  },
  upiId: {
    type: String,
    lowercase: true,
    trim: true,
    validate: {
      validator: function(v: string) {
        if (!v) return true; // Optional field
        return /^[\w.-]+@[\w.-]+$/.test(v);
      },
      message: 'Invalid UPI ID format',
    },
  },
  merchantTransactionId: {
    type: String,
    required: true,
    index: true,
  },
  merchantVPA: {
    type: String,
    lowercase: true,
    trim: true,
  },
  qrCode: String,
  paymentLink: String,
  responseCode: String,
  responseMessage: String,
  bankReferenceNumber: {
    type: String,
    index: true,
  },
  gatewayResponseData: {
    type: Map,
    of: Schema.Types.Mixed,
  },
  initiatedAt: {
    type: Date,
    required: true,
    default: Date.now,
    index: true,
  },
  completedAt: Date,
  expiresAt: {
    type: Date,
    required: true,
    index: true,
  },
  metadata: {
    ipAddress: String,
    userAgent: String,
    deviceId: String,
  },
  refund: {
    refundId: String,
    amount: {
      type: Number,
      min: 0,
    },
    reason: String,
    status: {
      type: String,
      enum: ['PENDING', 'COMPLETED', 'FAILED'],
    },
    initiatedAt: Date,
    completedAt: Date,
  },
}, {
  timestamps: true,
});

/**
 * Indexes
 */
UPITransactionSchema.index({ transactionId: 1 }, { unique: true });
UPITransactionSchema.index({ orderId: 1 });
UPITransactionSchema.index({ customerId: 1, createdAt: -1 });
UPITransactionSchema.index({ merchantId: 1, status: 1 });
UPITransactionSchema.index({ status: 1, createdAt: -1 });
UPITransactionSchema.index({ gateway: 1, status: 1 });
UPITransactionSchema.index({ merchantTransactionId: 1 });
UPITransactionSchema.index({ expiresAt: 1 }); // For TTL cleanup
UPITransactionSchema.index({ 'refund.refundId': 1 }, { sparse: true });

/**
 * Pre-save Middleware
 */
UPITransactionSchema.pre('save', function(next) {
  // Generate transaction ID if not exists
  if (!this.transactionId) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9).toUpperCase();
    this.transactionId = `TXN-${timestamp}-${random}`;
  }

  // Generate merchant transaction ID if not exists
  if (!this.merchantTransactionId) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 12).toUpperCase();
    this.merchantTransactionId = `${this.gateway}-${timestamp}-${random}`;
  }

  // Set expiration time if not set (default 15 minutes)
  if (!this.expiresAt) {
    this.expiresAt = new Date(Date.now() + 15 * 60 * 1000);
  }

  next();
});

/**
 * Instance Methods
 */

// Update transaction status
UPITransactionSchema.methods.updateStatus = async function(
  newStatus: TransactionStatus,
  responseData?: {
    code?: string;
    message?: string;
    bankReference?: string;
    gatewayData?: any;
  }
): Promise<void> {
  this.status = newStatus;

  if (responseData) {
    if (responseData.code) this.responseCode = responseData.code;
    if (responseData.message) this.responseMessage = responseData.message;
    if (responseData.bankReference) this.bankReferenceNumber = responseData.bankReference;
    if (responseData.gatewayData) {
      this.gatewayResponseData = new Map(Object.entries(responseData.gatewayData));
    }
  }

  if (newStatus === TransactionStatus.SUCCESS ||
      newStatus === TransactionStatus.FAILED ||
      newStatus === TransactionStatus.CANCELLED) {
    this.completedAt = new Date();
  }

  await this.save();
};

// Initiate refund
UPITransactionSchema.methods.initiateRefund = async function(amount: number, reason: string): Promise<void> {
  if (this.status !== TransactionStatus.SUCCESS) {
    throw new Error('Can only refund successful transactions');
  }

  if (amount > this.amount) {
    throw new Error('Refund amount cannot exceed transaction amount');
  }

  if (this.refund && this.refund.status === 'PENDING') {
    throw new Error('Refund already in progress');
  }

  const refundId = `REF-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

  this.refund = {
    refundId,
    amount,
    reason,
    status: 'PENDING',
    initiatedAt: new Date(),
  };

  this.status = TransactionStatus.REFUND_INITIATED;
  await this.save();
};

// Complete refund
UPITransactionSchema.methods.completeRefund = async function(success: boolean): Promise<void> {
  if (!this.refund || this.refund.status !== 'PENDING') {
    throw new Error('No pending refund found');
  }

  this.refund.status = success ? 'COMPLETED' : 'FAILED';
  this.refund.completedAt = new Date();

  if (success) {
    this.status = TransactionStatus.REFUNDED;
  } else {
    this.status = TransactionStatus.SUCCESS; // Revert to success if refund failed
  }

  await this.save();
};

// Check if transaction is expired
UPITransactionSchema.methods.isExpired = function(): boolean {
  return new Date() > this.expiresAt;
};

// Mark transaction as expired
UPITransactionSchema.methods.markExpired = async function(): Promise<void> {
  if (this.status === TransactionStatus.INITIATED || this.status === TransactionStatus.PENDING) {
    this.status = TransactionStatus.TIMEOUT;
    this.completedAt = new Date();
    await this.save();
  }
};

// Verify transaction (to be implemented with actual gateway APIs)
UPITransactionSchema.methods.verify = async function(): Promise<boolean> {
  // This will be implemented with actual gateway verification APIs
  // For now, just return the current status
  return this.status === TransactionStatus.SUCCESS;
};

/**
 * Static Methods
 */

// Find transactions by order
UPITransactionSchema.statics.findByOrder = function(orderId: mongoose.Types.ObjectId) {
  return this.find({ orderId }).sort({ createdAt: -1 });
};

// Find transactions by customer
UPITransactionSchema.statics.findByCustomer = function(customerId: mongoose.Types.ObjectId, status?: TransactionStatus) {
  const query: any = { customerId };
  if (status) query.status = status;
  return this.find(query)
    .populate('orderId', 'orderId totalAmount')
    .sort({ createdAt: -1 });
};

// Find transactions by merchant
UPITransactionSchema.statics.findByMerchant = function(merchantId: mongoose.Types.ObjectId, status?: TransactionStatus) {
  const query: any = { merchantId };
  if (status) query.status = status;
  return this.find(query)
    .populate('customerId', 'profile.name profile.phone')
    .populate('orderId', 'orderId totalAmount')
    .sort({ createdAt: -1 });
};

// Find pending transactions
UPITransactionSchema.statics.findPending = function() {
  return this.find({
    status: { $in: [TransactionStatus.INITIATED, TransactionStatus.PENDING, TransactionStatus.PROCESSING] },
  }).sort({ createdAt: 1 });
};

// Find expired transactions
UPITransactionSchema.statics.findExpired = function() {
  return this.find({
    expiresAt: { $lt: new Date() },
    status: { $in: [TransactionStatus.INITIATED, TransactionStatus.PENDING] },
  });
};

// Get transaction statistics
UPITransactionSchema.statics.getStatistics = async function(
  merchantId: mongoose.Types.ObjectId,
  dateRange?: { start: Date; end: Date }
) {
  const match: any = { merchantId };
  if (dateRange) {
    match.createdAt = { $gte: dateRange.start, $lte: dateRange.end };
  }

  return this.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        avgAmount: { $avg: '$amount' },
      },
    },
  ]);
};

// Get gateway statistics
UPITransactionSchema.statics.getGatewayStats = async function(
  merchantId: mongoose.Types.ObjectId,
  dateRange?: { start: Date; end: Date }
) {
  const match: any = { merchantId, status: TransactionStatus.SUCCESS };
  if (dateRange) {
    match.createdAt = { $gte: dateRange.start, $lte: dateRange.end };
  }

  return this.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$gateway',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        avgAmount: { $avg: '$amount' },
      },
    },
    { $sort: { totalAmount: -1 } },
  ]);
};

/**
 * Virtual fields
 */
UPITransactionSchema.virtual('isSuccess').get(function() {
  return this.status === TransactionStatus.SUCCESS;
});

UPITransactionSchema.virtual('isFailed').get(function() {
  return this.status === TransactionStatus.FAILED || this.status === TransactionStatus.TIMEOUT;
});

UPITransactionSchema.virtual('isPending').get(function() {
  return [TransactionStatus.INITIATED, TransactionStatus.PENDING, TransactionStatus.PROCESSING].includes(this.status);
});

UPITransactionSchema.virtual('canRefund').get(function() {
  return this.status === TransactionStatus.SUCCESS &&
         (!this.refund || this.refund.status === 'FAILED');
});

UPITransactionSchema.virtual('processingTime').get(function() {
  if (this.completedAt) {
    return this.completedAt.getTime() - this.initiatedAt.getTime();
  }
  return null;
});

/**
 * Create and export UPITransaction model
 */
const UPITransaction: Model<IUPITransaction> = mongoose.model<IUPITransaction>('UPITransaction', UPITransactionSchema);

export default UPITransaction;
