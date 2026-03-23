import mongoose from 'mongoose';

// Define Store Status Schema
const storeStatusSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['OPEN', 'CLOSED', 'BREAK'],
    default: 'CLOSED'
  },
  autoMode: {
    type: Boolean,
    default: false
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  updatedBy: {
    type: String,
    default: 'system'
  }
}, {
  timestamps: true
});

// Create model
const StoreStatus = mongoose.models.StoreStatus || mongoose.model('StoreStatus', storeStatusSchema);

// Service functions
export const getStoreStatus = async () => {
  try {
    let status = await StoreStatus.findOne();
    
    // If no status exists, create one
    if (!status) {
      status = await StoreStatus.create({ status: 'CLOSED' });
    }
    
    return status;
  } catch (error) {
    console.error('Error getting store status:', error);
    throw error;
  }
};

export const updateStoreStatus = async (newStatus, updatedBy = 'user') => {
  try {
    let status = await StoreStatus.findOne();
    
    if (!status) {
      status = await StoreStatus.create({ status: newStatus, updatedBy });
    } else {
      status.status = newStatus;
      status.lastUpdated = new Date();
      status.updatedBy = updatedBy;
      await status.save();
    }
    
    return status;
  } catch (error) {
    console.error('Error updating store status:', error);
    throw error;
  }
};

export default StoreStatus;