# Janvi Priya Invoice – API (Node.js + MongoDB)

REST API for products, bills, bottle orders, and company details. Replaces localStorage with persistent storage.

## Setup

1. **MongoDB**  
   Install and run MongoDB locally, or use [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and put the connection string in `.env`.

2. **Environment**  
   Copy `env.example` to `.env` and set:

   ```env
   PORT=3001
   MONGODB_URI=mongodb://localhost:27017/janvipriya-invoice
   ```

3. **Install and run**

   ```bash
   cd server
   npm install
   npm run dev
   ```

   API base URL: `http://localhost:3001`

## Frontend

In the project root, set the API URL (e.g. in `.env`):

```env
VITE_API_URL=http://localhost:3001
```

Then run the frontend: `npm run dev`.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/products` | List products |
| POST | `/api/products` | Create product |
| PUT | `/api/products/:id` | Update product |
| DELETE | `/api/products/:id` | Delete product |
| GET | `/api/bills` | List bills |
| GET | `/api/bills/:id` | Get bill |
| POST | `/api/bills` | Create bill |
| DELETE | `/api/bills/:id` | Delete bill |
| GET | `/api/bottle-orders` | List bottle orders |
| GET | `/api/bottle-orders/:id` | Get bottle order |
| POST | `/api/bottle-orders` | Create bottle order |
| PUT | `/api/bottle-orders/:id` | Update bottle order |
| DELETE | `/api/bottle-orders/:id` | Delete bottle order |
| GET | `/api/company` | Get company details |
| PUT | `/api/company` | Update company details |

If the products collection is empty, the server seeds sample products on startup.
