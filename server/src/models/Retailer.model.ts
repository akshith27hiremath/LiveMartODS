import mongoose, { Schema } from 'mongoose';
import User, { IUser, UserType } from './User.model';

/**
 * Retailer Model
 * Extends base User model with retailer-specific fields
 */

export interface IStore {
  name: string;
  description?: string;
  operatingHours?: {
    [key: string]: { openTime: string; closeTime: string };
  };
  rating: number;
  reviewCount: number;
  deliveryRadius: number; // in kilometers
  isOpen: boolean;
}

export interface IRetailer extends IUser {
  store: IStore;
  inventory: mongoose.Types.ObjectId[]; // Inventory IDs
  customerBase: mongoose.Types.ObjectId[]; // Customer IDs
  wholesalerOrders: mongoose.Types.ObjectId[]; // WholesalerOrder IDs
  gstin?: string; // GST Identification Number
  businessLicense?: string;
  bankDetails?: {
    accountNumber: string;
    ifscCode: string;
    bankName: string;
    accountHolderName: string;
  };
}

// Store Schema
const StoreSchema = new Schema<IStore>({
  name: {
    type: String,
    required: [true, 'Store name is required'],
    trim: true,
    minlength: 2,
    maxlength: 100,
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500,
  },
  operatingHours: {
    type: Map,
    of: new Schema({
      openTime: { type: String, required: true },
      closeTime: { type: String, required: true },
    }, { _id: false }),
    default: new Map(),
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
  deliveryRadius: {
    type: Number,
    default: 5,
    min: 1,
    max: 50,
  },
  isOpen: {
    type: Boolean,
    default: true,
  },
}, { _id: false });

// Retailer-specific schema
const RetailerSchema = new Schema<IRetailer>({
  store: {
    type: StoreSchema,
    required: true,
  },
  inventory: [{
    type: Schema.Types.ObjectId,
    ref: 'Inventory',
  }],
  customerBase: [{
    type: Schema.Types.ObjectId,
    ref: 'Customer',
  }],
  wholesalerOrders: [{
    type: Schema.Types.ObjectId,
    ref: 'WholesalerOrder',
  }],
  gstin: {
    type: String,
    trim: true,
    uppercase: true,
    match: [/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GSTIN format'],
  },
  businessLicense: {
    type: String,
    trim: true,
  },
  bankDetails: {
    accountNumber: {
      type: String,
      required: false,
    },
    ifscCode: {
      type: String,
      required: false,
      uppercase: true,
    },
    bankName: {
      type: String,
      required: false,
    },
    accountHolderName: {
      type: String,
      required: false,
    },
  },
});

/**
 * Instance Methods
 */

// Update store rating
RetailerSchema.methods.updateStoreRating = async function(newRating: number): Promise<void> {
  const currentTotal = this.store.rating * this.store.reviewCount;
  this.store.reviewCount += 1;
  this.store.rating = (currentTotal + newRating) / this.store.reviewCount;
  await this.save();
};

// Add customer to customer base
RetailerSchema.methods.addCustomer = async function(customerId: mongoose.Types.ObjectId): Promise<void> {
  if (!this.customerBase.includes(customerId)) {
    this.customerBase.push(customerId);
    await this.save();
  }
};

// Toggle store open/close status
RetailerSchema.methods.toggleStoreStatus = async function(): Promise<boolean> {
  this.store.isOpen = !this.store.isOpen;
  await this.save();
  return this.store.isOpen;
};

/**
 * Static Methods
 */

// Find retailers near a location
RetailerSchema.statics.findNearby = function(
  latitude: number,
  longitude: number,
  maxDistance: number = 10000 // meters
) {
  return this.find({
    userType: UserType.RETAILER,
    isActive: true,
    'store.isOpen': true,
    'profile.location': {
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

// Find top-rated retailers
RetailerSchema.statics.findTopRated = function(limit: number = 10) {
  return this.find({
    userType: UserType.RETAILER,
    isActive: true,
    'store.reviewCount': { $gte: 5 }, // At least 5 reviews
  })
    .sort({ 'store.rating': -1 })
    .limit(limit);
};

/**
 * Indexes
 */
RetailerSchema.index({ 'store.rating': -1 });
RetailerSchema.index({ 'store.isOpen': 1 });
RetailerSchema.index({ gstin: 1 });

/**
 * Create Retailer model as a discriminator of User
 */
const Retailer = User.discriminator<IRetailer>(UserType.RETAILER, RetailerSchema);

export default Retailer;
