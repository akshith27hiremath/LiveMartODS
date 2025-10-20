import mongoose, { Schema } from 'mongoose';
import User, { IUser, UserType } from './User.model';

/**
 * Customer Model
 * Extends base User model with customer-specific fields
 */

export interface ICustomer extends IUser {
  wishlist: mongoose.Types.ObjectId[]; // Product IDs
  orderHistory: mongoose.Types.ObjectId[]; // Order IDs
  loyaltyPoints: number;
  cart?: mongoose.Types.ObjectId; // ShoppingCart ID (will be created later)
}

// Customer-specific schema (only additional fields)
const CustomerSchema = new Schema<ICustomer>({
  wishlist: [{
    type: Schema.Types.ObjectId,
    ref: 'Product',
  }],
  orderHistory: [{
    type: Schema.Types.ObjectId,
    ref: 'Order',
  }],
  loyaltyPoints: {
    type: Number,
    default: 0,
    min: 0,
  },
  cart: {
    type: Schema.Types.ObjectId,
    ref: 'ShoppingCart',
    default: null,
  },
});

/**
 * Instance Methods
 */

// Add product to wishlist
CustomerSchema.methods.addToWishlist = async function(productId: mongoose.Types.ObjectId): Promise<void> {
  if (!this.wishlist.includes(productId)) {
    this.wishlist.push(productId);
    await this.save();
  }
};

// Remove product from wishlist
CustomerSchema.methods.removeFromWishlist = async function(productId: mongoose.Types.ObjectId): Promise<void> {
  this.wishlist = this.wishlist.filter((id: mongoose.Types.ObjectId) => !id.equals(productId));
  await this.save();
};

// Add loyalty points
CustomerSchema.methods.addLoyaltyPoints = async function(points: number): Promise<void> {
  this.loyaltyPoints += points;
  await this.save();
};

// Redeem loyalty points
CustomerSchema.methods.redeemLoyaltyPoints = async function(points: number): Promise<boolean> {
  if (this.loyaltyPoints >= points) {
    this.loyaltyPoints -= points;
    await this.save();
    return true;
  }
  return false;
};

/**
 * Static Methods
 */

// Find customers with loyalty points above threshold
CustomerSchema.statics.findByLoyaltyPoints = function(minPoints: number) {
  return this.find({
    userType: UserType.CUSTOMER,
    loyaltyPoints: { $gte: minPoints },
    isActive: true,
  }).sort({ loyaltyPoints: -1 });
};

/**
 * Indexes
 */
CustomerSchema.index({ loyaltyPoints: -1 });
CustomerSchema.index({ 'wishlist': 1 });

/**
 * Create Customer model as a discriminator of User
 */
const Customer = User.discriminator<ICustomer>(UserType.CUSTOMER, CustomerSchema);

export default Customer;
