import mongoose from 'mongoose';

// Business Hours Schema
const businessHoursSchema = new mongoose.Schema({
  dayOfWeek: {
    type: Number, // 0-6 (Sunday-Saturday)
    required: true,
    unique: true
  },
  dayName: {
    type: String,
    required: true
  },
  openTime: {
    type: String, // "09:00"
    default: null
  },
  closeTime: {
    type: String, // "18:00"
    default: null
  },
  isClosed: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

const BusinessHours = mongoose.models.BusinessHours || mongoose.model('BusinessHours', businessHoursSchema);

// Initialize default business hours
export const initializeBusinessHours = async () => {
  const days = [
    { dayOfWeek: 0, dayName: 'Sunday', isClosed: true },
    { dayOfWeek: 1, dayName: 'Monday', openTime: '09:00', closeTime: '18:00' },
    { dayOfWeek: 2, dayName: 'Tuesday', openTime: '09:00', closeTime: '18:00' },
    { dayOfWeek: 3, dayName: 'Wednesday', openTime: '09:00', closeTime: '18:00' },
    { dayOfWeek: 4, dayName: 'Thursday', openTime: '09:00', closeTime: '18:00' },
    { dayOfWeek: 5, dayName: 'Friday', openTime: '09:00', closeTime: '20:00' },
    { dayOfWeek: 6, dayName: 'Saturday', openTime: '10:00', closeTime: '16:00' }
  ];

  try {
    for (const day of days) {
      await BusinessHours.findOneAndUpdate(
        { dayOfWeek: day.dayOfWeek },
        day,
        { upsert: true, new: true }
      );
    }
    console.log('Business hours initialized');
  } catch (error) {
    console.error('Error initializing business hours:', error);
  }
};

export const getBusinessHours = async () => {
  try {
    const hours = await BusinessHours.find().sort({ dayOfWeek: 1 });
    return hours;
  } catch (error) {
    console.error('Error getting business hours:', error);
    throw error;
  }
};

export default BusinessHours;