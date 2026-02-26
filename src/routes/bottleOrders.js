import { Router } from 'express';
import { BottleOrder } from '../models/BottleOrder.js';
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
    const orders = await BottleOrder.find(filter).sort({ orderDate: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', requireAuth, async (req, res) => {
  try {
    const filter = { _id: req.params.id, ...userFilter(req.user) };
    const order = await BottleOrder.findOne(filter);
    if (!order) return res.status(404).json({ error: 'Bottle order not found' });
    res.json(order);
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
      orderNo: req.body.orderNo || req.body.id || `BOT-${Date.now()}`,
      userId: req.body.userId ?? userId,
      userPhone: req.body.userPhone ?? user?.phone ?? user?.phoneNumber ?? userId,
    };
    const order = await BottleOrder.create(body);
    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', requireAuth, async (req, res) => {
  try {
    const filter = { _id: req.params.id, ...userFilter(req.user) };
    const order = await BottleOrder.findOneAndUpdate(
      filter,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!order) return res.status(404).json({ error: 'Bottle order not found' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const filter = { _id: req.params.id, ...userFilter(req.user) };
    const order = await BottleOrder.findOneAndDelete(filter);
    if (!order) return res.status(404).json({ error: 'Bottle order not found' });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
