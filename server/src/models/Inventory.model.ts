import mongoose, { Document, Schema, Model } from 'mongoose';

/**
 * Inventory Model
 * Manages stock levels for products owned by retailers/wholesalers
 */

export interface IDiscount {
  discountId: string;
  code: string;
  type: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'BUY_ONE_GET_ONE' | 'FREE_SHIPPING';
  value: number;
  minPurchase: number;
  maxDiscount: number;
  validFrom: Date;
  validUntil: Date;
  isActive: boolean;
}

export interface IInventory extends Document {
  productId: mongoose.Types.ObjectId;
  ownerId: mongoose.Types.ObjectId; // Retailer or Wholesaler ID
  currentStock: number;
  reservedStock: number;
  reorderLevel: number;
  sellingPrice: number;
  discounts: IDiscount[];
  availability: boolean;
  lastRestocked: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Discount Schema
const DiscountSchema = new Schema<IDiscount>({
  discountId: {
    type: String,
    required: true,
    unique: true,
  },
  code: {
    type: String,
    required: true,
    uppercase: true,
    trim: true,
  },
  type: {
    type: String,
    enum: ['PERCENTAGE', 'FIXED_AMOUNT', 'BUY_ONE_GET_ONE', 'FREE_SHIPPING'],
    required: true,
  },
  value: {
    type: Number,
    required: true,
    min: 0,
  },
  minPurchase: {
    type: Number,
    default: 0,
    min: 0,
  },
  maxDiscount: {
    type: Number,
    default: 0,
    min: 0,
  },
  validFrom: {
    type: Date,
    required: true,
    default: Date.now,
  },
  validUntil: {
    type: Date,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, { _id: false });

// Inventory Schema
const InventorySchema = new Schema<IInventory>({
  productId: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product ID is required'],
    index: true,
  },
  ownerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Owner ID is required'],
    index: true,
  },
  currentStock: {
    type: Number,
    required: [true, 'Current stock is required'],
    min: [0, 'Stock cannot be negative'],
    default: 0,
  },
  reservedStock: {
    type: Number,
    default: 0,
    min: [0, 'Reserved stock cannot be negative'],
  },
  reorderLevel: {
    type: Number,
    required: [true, 'Reorder level is required'],
    min: [0, 'Reorder level cannot be negative'],
    default: 10,
  },
  sellingPrice: {
    type: Number,
    required: [true, 'Selling price is required'],
    min: [0, 'Price cannot be negative'],
  },
  discounts: [DiscountSchema],
  availability: {
    type: Boolean,
    default: true,
    index: true,
  },
  lastRestocked: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

/**
 * Indexes
 */
InventorySchema.index({ productId: 1, ownerId: 1 }, { unique: true });
InventorySchema.index({ ownerId: 1, availability: 1 });
InventorySchema.index({ currentStock: 1 });
InventorySchema.index({ 'discounts.code': 1 });

/**
 * Instance Methods
 */

// Update stock
InventorySchema.methods.updateStock = async function(quantity: number): Promise<void> {
  this.currentStock += quantity;
  if (this.currentStock < 0) {
    throw new Error('Insufficient stock');
  }
  if (quantity > 0) {
    this.lastRestocked = new Date();
  }
  await this.save();
};

// Reserve stock
InventorySchema.methods.reserveStock = async function(quantity: number): Promise<boolean> {
  const availableStock = this.currentStock - this.reservedStock;
  if (availableStock >= quantity) {
    this.reservedStock += quantity;
    await this.save();
    return true;
  }
  return false;
};

// Release reserved stock
InventorySchema.methods.releaseReservedStock = async function(quantity: number): Promise<void> {
  this.reservedStock = Math.max(0, this.reservedStock - quantity);
  await this.save();
};

// Confirm reserved stock (convert to sold)
InventorySchema.methods.confirmReservedStock = async function(quantity: number): Promise<void> {
  if (this.reservedStock >= quantity) {
    this.reservedStock -= quantity;
    this.currentStock -= quantity;
    await this.save();
  } else {
    throw new Error('Insufficient reserved stock');
  }
};

// Check if stock is low
InventorySchema.methods.isLowStock = function(): boolean {
  return this.currentStock <= this.reorderLevel;
};

// Calculate final price with discounts
InventorySchema.methods.calculateFinalPrice = function(quantity: number = 1): number {
  let finalPrice = this.sellingPrice * quantity;
  const now = new Date();

  // Apply active discounts
  const activeDiscounts = this.discounts.filter(
    d => d.isActive && d.validFrom <= now && d.validUntil >= now
  );

  for (const discount of activeDiscounts) {
    if (finalPrice >= discount.minPurchase) {
      let discountAmount = 0;

      if (discount.type === 'PERCENTAGE') {
        discountAmount = (finalPrice * discount.value) / 100;
      } else if (discount.type === 'FIXED_AMOUNT') {
        discountAmount = discount.value;
      }

      if (discount.maxDiscount > 0) {
        discountAmount = Math.min(discountAmount, discount.maxDiscount);
      }

      finalPrice -= discountAmount;
    }
  }

  return Math.max(0, finalPrice);
};

// Add discount
InventorySchema.methods.addDiscount = async function(discount: IDiscount): Promise<void> {
  this.discounts.push(discount);
  await this.save();
};

// Remove discount
InventorySchema.methods.removeDiscount = async function(discountId: string): Promise<void> {
  this.discounts = this.discounts.filter(d => d.discountId !== discountId);
  await this.save();
};

/**
 * Static Methods
 */

// Find low stock items for an owner
InventorySchema.statics.findLowStock = function(ownerId: mongoose.Types.ObjectId) {
  return this.find({
    ownerId,
    $expr: { $lte: ['$currentStock', '$reorderLevel'] },
  }).populate('productId');
};

// Find available inventory for a product
InventorySchema.statics.findAvailableByProduct = function(productId: mongoose.Types.ObjectId) {
  return this.find({
    productId,
    availability: true,
    $expr: { $gt: ['$currentStock', '$reservedStock'] },
  })
    .populate('productId')
    .populate('ownerId', 'profile.name profile.location');
};

// Find inventory by owner
InventorySchema.statics.findByOwner = function(ownerId: mongoose.Types.ObjectId) {
  return this.find({ ownerId }).populate('productId').sort({ currentStock: 1 });
};

/**
 * Virtual fields
 */
InventorySchema.virtual('availableStock').get(function() {
  return this.currentStock - this.reservedStock;
});

InventorySchema.virtual('stockStatus').get(function() {
  if (this.currentStock === 0) return 'OUT_OF_STOCK';
  if (this.isLowStock()) return 'LOW_STOCK';
  return 'IN_STOCK';
});

/**
 * Create and export Inventory model
 */
const Inventory: Model<IInventory> = mongoose.model<IInventory>('Inventory', InventorySchema);

export default Inventory;
