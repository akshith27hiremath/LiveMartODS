import mongoose, { Document, Schema, Model } from 'mongoose';

/**
 * Product Model
 * Represents products in the Live MART platform
 */

export interface ICategory {
  categoryId: string;
  name: string;
  parentCategory?: string;
  icon?: string;
}

export interface IProduct extends Document {
  name: string;
  description: string;
  category: ICategory;
  specifications: Map<string, string>;
  images: string[];
  basePrice: number;
  unit: string; // kg, liter, piece, etc.
  tags: string[];
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId; // Wholesaler/Retailer ID
  averageRating: number;
  reviewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// Category Schema
const CategorySchema = new Schema<ICategory>({
  categoryId: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
  },
  parentCategory: {
    type: String,
    default: null,
  },
  icon: {
    type: String,
    default: null,
  },
}, { _id: false });

// Product Schema
const ProductSchema = new Schema<IProduct>({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    minlength: [2, 'Product name must be at least 2 characters'],
    maxlength: [200, 'Product name cannot exceed 200 characters'],
    index: true,
  },
  description: {
    type: String,
    required: [true, 'Product description is required'],
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters'],
  },
  category: {
    type: CategorySchema,
    required: [true, 'Category is required'],
  },
  specifications: {
    type: Map,
    of: String,
    default: new Map(),
  },
  images: [{
    type: String,
    validate: {
      validator: function(v: string) {
        return /^https?:\/\/.+/.test(v);
      },
      message: 'Invalid image URL format',
    },
  }],
  basePrice: {
    type: Number,
    required: [true, 'Base price is required'],
    min: [0, 'Price cannot be negative'],
    index: true,
  },
  unit: {
    type: String,
    required: [true, 'Unit is required'],
    enum: ['kg', 'gram', 'liter', 'ml', 'piece', 'dozen', 'packet', 'box'],
    default: 'piece',
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true,
  }],
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Creator is required'],
    index: true,
  },
  averageRating: {
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
}, {
  timestamps: true,
});

/**
 * Indexes
 */
ProductSchema.index({ name: 'text', description: 'text', tags: 'text' });
ProductSchema.index({ 'category.name': 1 });
ProductSchema.index({ basePrice: 1 });
ProductSchema.index({ averageRating: -1 });
ProductSchema.index({ isActive: 1, averageRating: -1 });
ProductSchema.index({ createdBy: 1, isActive: 1 });

/**
 * Instance Methods
 */

// Update product rating
ProductSchema.methods.updateRating = async function(newRating: number): Promise<void> {
  const currentTotal = this.averageRating * this.reviewCount;
  this.reviewCount += 1;
  this.averageRating = (currentTotal + newRating) / this.reviewCount;
  await this.save();
};

// Toggle active status
ProductSchema.methods.toggleActive = async function(): Promise<boolean> {
  this.isActive = !this.isActive;
  await this.save();
  return this.isActive;
};

// Add image
ProductSchema.methods.addImage = async function(imageUrl: string): Promise<void> {
  if (!this.images.includes(imageUrl)) {
    this.images.push(imageUrl);
    await this.save();
  }
};

// Remove image
ProductSchema.methods.removeImage = async function(imageUrl: string): Promise<void> {
  this.images = this.images.filter(img => img !== imageUrl);
  await this.save();
};

/**
 * Static Methods
 */

// Search products
ProductSchema.statics.searchProducts = function(query: string, filters?: any) {
  const searchQuery: any = {
    $text: { $search: query },
    isActive: true,
  };

  if (filters) {
    if (filters.category) searchQuery['category.name'] = filters.category;
    if (filters.minPrice) searchQuery.basePrice = { $gte: filters.minPrice };
    if (filters.maxPrice) searchQuery.basePrice = { ...searchQuery.basePrice, $lte: filters.maxPrice };
    if (filters.minRating) searchQuery.averageRating = { $gte: filters.minRating };
  }

  return this.find(searchQuery).sort({ score: { $meta: 'textScore' } });
};

// Find products by category
ProductSchema.statics.findByCategory = function(categoryName: string) {
  return this.find({
    'category.name': categoryName,
    isActive: true,
  }).sort({ averageRating: -1 });
};

// Find top-rated products
ProductSchema.statics.findTopRated = function(limit: number = 10) {
  return this.find({
    isActive: true,
    reviewCount: { $gte: 5 },
  })
    .sort({ averageRating: -1 })
    .limit(limit);
};

// Find products by creator
ProductSchema.statics.findByCreator = function(creatorId: mongoose.Types.ObjectId) {
  return this.find({
    createdBy: creatorId,
  }).sort({ createdAt: -1 });
};

/**
 * Virtual fields
 */
ProductSchema.virtual('isPopular').get(function() {
  return this.reviewCount >= 10 && this.averageRating >= 4.0;
});

/**
 * Create and export Product model
 */
const Product: Model<IProduct> = mongoose.model<IProduct>('Product', ProductSchema);

export default Product;
