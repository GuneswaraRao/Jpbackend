import { Router } from 'express';
import { Bill } from '../models/Bill.js';
import { requireAuth } from '../middleware/auth.js';
import { normalizePhoneForMatch } from '../utils/phone.js';

const router = Router();

function userFilter(user) {
  const key = normalizePhoneForMatch(
    user?.userId || user?.phone || user?.phoneNumber
  );
  if (!key || key.length < 10) return { _id: null };
  const regex = new RegExp(`${key}$`);
  return { $or: [{ userId: { $regex: regex } }, { userPhone: { $regex: regex } }] };
}

router.get('/', requireAuth, async (req, res) => {
  try {
    const filter = userFilter(req.user);
    const bills = await Bill.find(filter).sort({ createdAt: -1 });
    res.json(bills);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', requireAuth, async (req, res) => {
  try {
    const filter = { _id: req.params.id, ...userFilter(req.user) };
    const bill = await Bill.findOne(filter);
    if (!bill) return res.status(404).json({ error: 'Bill not found' });
    res.json(bill);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', requireAuth, async (req, res) => {
  try {
    const user = req.user;
    const userId = user?.userId || user?.phone || user?.phoneNumber;
    const body = {
      ...req.body,
      billNo: req.body.billNo || req.body.invoiceNo || `INV-${Date.now()}`,
      invoiceNumber: req.body.invoiceNumber ?? req.body.invoiceNo ?? '',
      userId: req.body.userId ?? userId,
      userPhone: req.body.userPhone ?? user?.phone ?? user?.phoneNumber ?? userId,
    };
    const bill = await Bill.create(body);
    res.status(201).json(bill);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', requireAuth, async (req, res) => {
  try {
    const filter = { _id: req.params.id, ...userFilter(req.user) };
    const bill = await Bill.findOneAndUpdate(
      filter,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!bill) return res.status(404).json({ error: 'Bill not found' });
    res.json(bill);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const filter = { _id: req.params.id, ...userFilter(req.user) };
    const bill = await Bill.findOneAndDelete(filter);
    if (!bill) return res.status(404).json({ error: 'Bill not found' });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
