import mongoose, { Schema } from 'mongoose';
import User, { IUser, UserType } from './User.model';

/**
 * Wholesaler Model
 * Extends base User model with wholesaler-specific fields
 */

export interface IDistributionCenter {
  name: string;
  address: string;
  location: {
    latitude: number;
    longitude: number;
  };
  capacity: number; // in tons or units
  manager?: string;
  isOperational: boolean;
}

export interface IPricingStrategy {
  type: 'FIXED' | 'DYNAMIC' | 'VOLUME_BASED' | 'SEASONAL';
  baseMargin: number; // percentage
  volumeDiscounts?: {
    minQuantity: number;
    discount: number; // percentage
  }[];
}

export interface IWholesaler extends IUser {
  businessName: string;
  retailerNetwork: mongoose.Types.ObjectId[]; // Retailer IDs
  bulkInventory: mongoose.Types.ObjectId[]; // BulkInventory IDs
  distributionCenters: IDistributionCenter[];
  pricingStrategy: IPricingStrategy;
  creditLimit: number; // maximum credit allowed to retailers
  minimumOrderValue: number;
  gstin: string;
  panNumber?: string;
  bankDetails: {
    accountNumber: string;
    ifscCode: string;
    bankName: string;
    accountHolderName: string;
  };
  rating: number;
  reviewCount: number;
}

// Distribution Center Schema
const DistributionCenterSchema = new Schema<IDistributionCenter>({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  address: {
    type: String,
    required: true,
    trim: true,
  },
  location: {
    latitude: {
      type: Number,
      required: true,
      min: -90,
      max: 90,
    },
    longitude: {
      type: Number,
      required: true,
      min: -180,
      max: 180,
    },
  },
  capacity: {
    type: Number,
    required: true,
    min: 0,
  },
  manager: {
    type: String,
    trim: true,
  },
  isOperational: {
    type: Boolean,
    default: true,
  },
}, { _id: true });

// Pricing Strategy Schema
const PricingStrategySchema = new Schema<IPricingStrategy>({
  type: {
    type: String,
    enum: ['FIXED', 'DYNAMIC', 'VOLUME_BASED', 'SEASONAL'],
    default: 'FIXED',
  },
  baseMargin: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
    default: 10,
  },
  volumeDiscounts: [{
    minQuantity: {
      type: Number,
      required: true,
      min: 0,
    },
    discount: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
  }],
}, { _id: false });

// Wholesaler-specific schema
const WholesalerSchema = new Schema<IWholesaler>({
  businessName: {
    type: String,
    required: [true, 'Business name is required'],
    trim: true,
    minlength: 2,
    maxlength: 200,
    index: true,
  },
  retailerNetwork: [{
    type: Schema.Types.ObjectId,
    ref: 'Retailer',
  }],
  bulkInventory: [{
    type: Schema.Types.ObjectId,
    ref: 'BulkInventory',
  }],
  distributionCenters: [DistributionCenterSchema],
  pricingStrategy: {
    type: PricingStrategySchema,
    required: true,
    default: () => ({
      type: 'FIXED',
      baseMargin: 10,
    }),
  },
  creditLimit: {
    type: Number,
    default: 100000, // Default credit limit in INR
    min: 0,
  },
  minimumOrderValue: {
    type: Number,
    default: 5000, // Minimum order value in INR
    min: 0,
  },
  gstin: {
    type: String,
    required: [true, 'GSTIN is required for wholesalers'],
    trim: true,
    uppercase: true,
    unique: true,
    match: [/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GSTIN format'],
    index: true,
  },
  panNumber: {
    type: String,
    trim: true,
    uppercase: true,
    match: [/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN format'],
  },
  bankDetails: {
    accountNumber: {
      type: String,
      required: [true, 'Bank account number is required'],
    },
    ifscCode: {
      type: String,
      required: [true, 'IFSC code is required'],
      uppercase: true,
    },
    bankName: {
      type: String,
      required: [true, 'Bank name is required'],
    },
    accountHolderName: {
      type: String,
      required: [true, 'Account holder name is required'],
    },
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
  },
  reviewCount: {
    type: Number,
    default: 0,
    min: 0,
  },
});

/**
 * Instance Methods
 */

// Add retailer to network
WholesalerSchema.methods.addRetailer = async function(retailerId: mongoose.Types.ObjectId): Promise<void> {
  if (!this.retailerNetwork.includes(retailerId)) {
    this.retailerNetwork.push(retailerId);
    await this.save();
  }
};

// Remove retailer from network
WholesalerSchema.methods.removeRetailer = async function(retailerId: mongoose.Types.ObjectId): Promise<void> {
  this.retailerNetwork = this.retailerNetwork.filter((id: mongoose.Types.ObjectId) => !id.equals(retailerId));
  await this.save();
};

// Update rating
WholesalerSchema.methods.updateRating = async function(newRating: number): Promise<void> {
  const currentTotal = this.rating * this.reviewCount;
  this.reviewCount += 1;
  this.rating = (currentTotal + newRating) / this.reviewCount;
  await this.save();
};

// Add distribution center
WholesalerSchema.methods.addDistributionCenter = async function(center: IDistributionCenter): Promise<void> {
  this.distributionCenters.push(center);
  await this.save();
};

// Calculate discount based on quantity
WholesalerSchema.methods.calculateDiscount = function(quantity: number): number {
  if (this.pricingStrategy.type !== 'VOLUME_BASED' || !this.pricingStrategy.volumeDiscounts) {
    return 0;
  }

  const applicableDiscounts = this.pricingStrategy.volumeDiscounts
    .filter((d: { minQuantity: number; discount: number }) => quantity >= d.minQuantity)
    .sort((a: { minQuantity: number; discount: number }, b: { minQuantity: number; discount: number }) => b.discount - a.discount);

  return applicableDiscounts.length > 0 ? applicableDiscounts[0].discount : 0;
};

/**
 * Static Methods
 */

// Find wholesalers by product category
WholesalerSchema.statics.findByCategory = function(category: string) {
  return this.find({
    userType: UserType.WHOLESALER,
    isActive: true,
  }).populate({
    path: 'bulkInventory',
    match: { category },
  });
};

// Find top-rated wholesalers
WholesalerSchema.statics.findTopRated = function(limit: number = 10) {
  return this.find({
    userType: UserType.WHOLESALER,
    isActive: true,
    reviewCount: { $gte: 5 },
  })
    .sort({ rating: -1 })
    .limit(limit);
};

// Find wholesalers with operational distribution centers near location
WholesalerSchema.statics.findNearby = function(
  latitude: number,
  longitude: number,
  maxDistance: number = 50000 // meters (50km)
) {
  return this.find({
    userType: UserType.WHOLESALER,
    isActive: true,
    'distributionCenters.isOperational': true,
    'distributionCenters.location': {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude],
        },
        $maxDistance: maxDistance,
      },
    },
  });
};

/**
 * Indexes
 */
WholesalerSchema.index({ businessName: 'text' });
WholesalerSchema.index({ rating: -1 });
WholesalerSchema.index({ gstin: 1 }, { unique: true });
WholesalerSchema.index({ 'retailerNetwork': 1 });
WholesalerSchema.index({ 'distributionCenters.location': '2dsphere' });

/**
 * Create Wholesaler model as a discriminator of User
 */
const Wholesaler = User.discriminator<IWholesaler>(UserType.WHOLESALER, WholesalerSchema);

export default Wholesaler;
