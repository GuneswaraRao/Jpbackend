import { Router } from 'express';
import { CompanyDetails } from '../models/CompanyDetails.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const doc = await CompanyDetails.findOne();
    if (!doc) {
      return res.json({
        name: 'Janvi Priya Enterprise',
        address: '',
        phone: '',
        email: '',
        gstin: '',
        tagline: '',
      });
    }
    res.json(doc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/', async (req, res) => {
  try {
    const doc = await CompanyDetails.findOneAndUpdate(
      {},
      { $set: req.body },
      { new: true, upsert: true, runValidators: true }
    );
    res.json(doc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
