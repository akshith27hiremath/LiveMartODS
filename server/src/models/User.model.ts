import mongoose, { Document, Schema, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

/**
 * Type Definitions for User and related schemas
 */

// User Types Enum
export enum UserType {
  CUSTOMER = 'CUSTOMER',
  RETAILER = 'RETAILER',
  WHOLESALER = 'WHOLESALER',
  ADMIN = 'ADMIN',
}

// GeoLocation Interface
export interface IGeoLocation {
  latitude: number;
  longitude: number;
}

// Address Interface
export interface IAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

// Notification Settings Interface
export interface INotificationSettings {
  emailEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;
  orderUpdates: boolean;
  promotions: boolean;
}

// User Preferences Interface
export interface IUserPreferences {
  categories?: string[];
  deliveryRadius?: number;
  notificationSettings: INotificationSettings;
  language?: string;
  currency?: string;
}

// User Profile Interface
export interface IUserProfile {
  name: string;
  address?: IAddress;
  location?: IGeoLocation;
  avatar?: string;
  preferences: IUserPreferences;
}

// Base User Interface
export interface IUser extends Document {
  email: string;
  phone: string;
  password: string;
  userType: UserType;
  profile: IUserProfile;
  isVerified: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastActive: Date;

  // Methods
  comparePassword(candidatePassword: string): Promise<boolean>;
  updateLastActive(): Promise<void>;
  getPublicProfile(): Partial<IUser>;
}

/**
 * Mongoose Schemas
 */

// GeoLocation Schema
const GeoLocationSchema = new Schema<IGeoLocation>({
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
}, { _id: false });

// Address Schema
const AddressSchema = new Schema<IAddress>({
  street: {
    type: String,
    required: true,
    trim: true,
  },
  city: {
    type: String,
    required: true,
    trim: true,
  },
  state: {
    type: String,
    required: true,
    trim: true,
  },
  zipCode: {
    type: String,
    required: true,
    trim: true,
  },
  country: {
    type: String,
    required: true,
    default: 'India',
    trim: true,
  },
}, { _id: false });

// Notification Settings Schema
const NotificationSettingsSchema = new Schema<INotificationSettings>({
  emailEnabled: {
    type: Boolean,
    default: true,
  },
  smsEnabled: {
    type: Boolean,
    default: true,
  },
  pushEnabled: {
    type: Boolean,
    default: true,
  },
  orderUpdates: {
    type: Boolean,
    default: true,
  },
  promotions: {
    type: Boolean,
    default: false,
  },
}, { _id: false });

// User Preferences Schema
const UserPreferencesSchema = new Schema<IUserPreferences>({
  categories: [String],
  deliveryRadius: {
    type: Number,
    default: 10, // km
    min: 1,
    max: 50,
  },
  notificationSettings: {
    type: NotificationSettingsSchema,
    default: () => ({}),
  },
  language: {
    type: String,
    default: 'en',
    enum: ['en', 'hi'],
  },
  currency: {
    type: String,
    default: 'INR',
  },
}, { _id: false });

// User Profile Schema
const UserProfileSchema = new Schema<IUserProfile>({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 100,
  },
  address: AddressSchema,
  location: GeoLocationSchema,
  avatar: {
    type: String,
    default: null,
  },
  preferences: {
    type: UserPreferencesSchema,
    default: () => ({}),
  },
}, { _id: false });

/**
 * Base User Schema
 * This serves as the base for Customer, Retailer, and Wholesaler models
 */
const UserSchema = new Schema<IUser>({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    index: true,
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    unique: true,
    trim: true,
    match: [/^\+?[1-9]\d{1,14}$/, 'Please provide a valid phone number'],
    index: true,
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false, // Don't return password by default
  },
  userType: {
    type: String,
    enum: Object.values(UserType),
    required: [true, 'User type is required'],
    index: true,
  },
  profile: {
    type: UserProfileSchema,
    required: true,
  },
  isVerified: {
    type: Boolean,
    default: false,
    index: true,
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },
  lastActive: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true, // Adds createdAt and updatedAt
  discriminatorKey: 'userType', // For model inheritance
});

/**
 * Indexes
 */
UserSchema.index({ email: 1, userType: 1 });
UserSchema.index({ phone: 1, userType: 1 });
UserSchema.index({ isVerified: 1, isActive: 1 });
UserSchema.index({ 'profile.location': '2dsphere' }); // Geospatial index

/**
 * Pre-save Middleware
 * Hash password before saving if it's modified
 */
UserSchema.pre('save', async function(next) {
  // Only hash password if it's modified or new
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

/**
 * Instance Methods
 */

// Compare password for authentication
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    return false;
  }
};

// Update last active timestamp
UserSchema.methods.updateLastActive = async function(): Promise<void> {
  this.lastActive = new Date();
  await this.save();
};

// Get public profile (remove sensitive data)
UserSchema.methods.getPublicProfile = function(): Partial<IUser> {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

/**
 * Static Methods
 */

// Find user by email
UserSchema.statics.findByEmail = function(email: string) {
  return this.findOne({ email: email.toLowerCase(), isActive: true });
};

// Find user by phone
UserSchema.statics.findByPhone = function(phone: string) {
  return this.findOne({ phone, isActive: true });
};

/**
 * Create and export User model
 */
const User: Model<IUser> = mongoose.model<IUser>('User', UserSchema);

export default User;
