import express from 'express';
import { getStoreStatus, updateStoreStatus } from '../services/storeStatusService.js';
import { getBusinessHours, initializeBusinessHours } from '../services/businessHoursService.js';

const router = express.Router();

// GET current store status
router.get('/status', async (req, res) => {
  try {
    const status = await getStoreStatus();
    res.json({
      success: true,
      status: status.status,
      lastUpdated: status.lastUpdated,
      updatedBy: status.updatedBy,
      autoMode: status.autoMode
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch store status'
    });
  }
});

// UPDATE store status
router.post('/status', async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['OPEN', 'CLOSED', 'BREAK'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Must be OPEN, CLOSED, or BREAK'
      });
    }
    
    const updatedStatus = await updateStoreStatus(status, req.user?.username || 'user');
    
    res.json({
      success: true,
      status: updatedStatus.status,
      lastUpdated: updatedStatus.lastUpdated,
      message: `Store status updated to ${status}`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update store status'
    });
  }
});

// GET business hours
router.get('/business-hours', async (req, res) => {
  try {
    const hours = await getBusinessHours();
    res.json({
      success: true,
      businessHours: hours
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch business hours'
    });
  }
});

// Initialize business hours (run once)
router.post('/initialize-hours', async (req, res) => {
  try {
    await initializeBusinessHours();
    res.json({
      success: true,
      message: 'Business hours initialized successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to initialize business hours'
    });
  }
});

export default router;