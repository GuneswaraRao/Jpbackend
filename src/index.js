import 'dotenv/config';
import { initFirebase } from './config/firebase.js';
initFirebase();

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcryptjs';
import { connectDB } from './config/db.js';
import { Product } from './models/Product.js';
import { User } from './models/User.js';
import productsRouter from './routes/products.js';
import billsRouter from './routes/bills.js';
import bottleOrdersRouter from './routes/bottleOrders.js';
import companyRouter from './routes/company.js';
import authRouter from './routes/auth.js';
import uploadRouter from './routes/upload.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

await connectDB();

// Seed sample products if none exist
const productCount = await Product.countDocuments();
if (productCount === 0) {
  const sampleProducts = [
    { name: '250Gram', price: 6.2, unit: 'pcs', category: '18Gauge' },
    { name: '250Gram', price: 6.2, unit: 'pcs', category: '19Gauge' },
    { name: '250Gram', price: 6.35, unit: 'pcs', category: '22Gauge' },
    { name: '500Gram', price: 6.6, unit: 'pcs', category: '22Gauge' },
    { name: '500Gram', price: 7.3, unit: 'pcs', category: '28Gauge' },
    { name: '1KG', price: 10.9, unit: 'pcs', category: '35Gauge' },
    { name: '2KG', price: 85, unit: 'pcs', category: '28Gauge' },
    { name: '5KG', price: 180, unit: 'pcs', category: '100Gauge' },
    { name: '10KG', price: 45, unit: 'pcs', category: '120Gauge' },
  ];
  await Product.insertMany(sampleProducts);
  console.log('Seeded', sampleProducts.length, 'sample products');
}

// Seed default admin user if none exists (email/password from env)
const adminEmail = (process.env.ADMIN_EMAIL || '').toLowerCase();
const adminPassword = process.env.ADMIN_PASSWORD;
if (adminEmail && adminPassword) {
  const existingAdmin = await User.findOne({ email: adminEmail });
  if (!existingAdmin) {
    const hash = await bcrypt.hash(adminPassword, 10);
    await User.create({
      name: 'Admin',
      email: adminEmail,
      passwordHash: hash,
      role: 'admin',
    });
    console.log('Created default admin user:', adminEmail);
  }
}

const app = express();
const PORT = process.env.PORT || 3001;

// Allow web, React Native dev, and mobile (no origin)
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:8080',
  'http://localhost:8081',
  'http://127.0.0.1:8081',
  'http://10.0.2.2:8081',
  'http://10.0.2.2:3001',
  'null',
  process.env.FRONTEND_ORIGIN,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.includes(origin)) {
        cb(null, origin || allowedOrigins[0]);
      } else {
        cb(null, true);
      }
    },
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/products', productsRouter);
app.use('/api/bills', billsRouter);
app.use('/api/bottle-orders', bottleOrdersRouter);
app.use('/api/company', companyRouter);
app.use('/api', uploadRouter);

// Serve uploaded product images with cache headers
app.use('/uploads', express.static(path.join(__dirname, '../uploads'), {
  maxAge: '7d',
  etag: true,
}));

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`API running at http://localhost:${PORT}`);
});
