import { Router } from 'express';
import { BottleOrder } from '../models/BottleOrder.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const orders = await BottleOrder.find().sort({ orderDate: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const order = await BottleOrder.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Bottle order not found' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const order = await BottleOrder.create(req.body);
    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const order = await BottleOrder.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!order) return res.status(404).json({ error: 'Bottle order not found' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const order = await BottleOrder.findByIdAndDelete(req.params.id);
    if (!order) return res.status(404).json({ error: 'Bottle order not found' });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
