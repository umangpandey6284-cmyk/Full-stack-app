import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("ecommerce.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    image TEXT,
    category TEXT,
    stock INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    total REAL NOT NULL,
    status TEXT DEFAULT 'pending',
    payment_method TEXT DEFAULT 'COD',
    address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER,
    product_id INTEGER,
    quantity INTEGER,
    price REAL,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
  );

  CREATE TABLE IF NOT EXISTS gallery (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    image_url TEXT NOT NULL,
    caption TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Seed some products if empty
const productCount = db.prepare("SELECT COUNT(*) as count FROM products").get() as { count: number };
if (productCount.count === 0) {
  const insertProduct = db.prepare("INSERT INTO products (name, description, price, image, category, stock) VALUES (?, ?, ?, ?, ?, ?)");
  insertProduct.run("Silk Saree", "Traditional Indian Silk Saree with gold border", 2499, "https://picsum.photos/seed/saree/400/600", "Clothing", 50);
  insertProduct.run("Copper Water Bottle", "Handcrafted pure copper bottle 1L", 899, "https://picsum.photos/seed/bottle/400/600", "Home", 100);
  insertProduct.run("Spices Combo Box", "Organic Indian spice set (Turmeric, Cumin, Cardamom)", 450, "https://picsum.photos/seed/spices/400/600", "Grocery", 200);
  insertProduct.run("Handmade Diya Set", "Set of 12 clay diyas for festivals", 199, "https://picsum.photos/seed/diya/400/600", "Decor", 500);
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // Auth Routes
  app.post("/api/register", (req, res) => {
    const { name, email, password } = req.body;
    const role = email === "admin@bharatshop.com" ? "admin" : "user";
    try {
      const info = db.prepare("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)").run(name, email, password, role);
      const user = db.prepare("SELECT id, name, email, role FROM users WHERE id = ?").get(info.lastInsertRowid);
      res.json(user);
    } catch (e) {
      res.status(400).json({ error: "Email already exists" });
    }
  });

  app.post("/api/login", (req, res) => {
    const { email, password } = req.body;
    const user = db.prepare("SELECT id, name, email, role FROM users WHERE email = ? AND password = ?").get(email, password);
    if (user) {
      res.json(user);
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });

  // Product Routes
  app.get("/api/products", (req, res) => {
    const products = db.prepare("SELECT * FROM products").all();
    res.json(products);
  });

  app.post("/api/admin/products", (req, res) => {
    const { name, description, price, image, category, stock } = req.body;
    const info = db.prepare("INSERT INTO products (name, description, price, image, category, stock) VALUES (?, ?, ?, ?, ?, ?)").run(name, description, price, image, category, stock);
    res.json({ id: info.lastInsertRowid });
  });

  app.delete("/api/admin/products/:id", (req, res) => {
    db.prepare("DELETE FROM products WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Order Routes
  app.post("/api/orders", (req, res) => {
    const { userId, total, address, items } = req.body;
    const info = db.prepare("INSERT INTO orders (user_id, total, address) VALUES (?, ?, ?)").run(userId, total, address);
    const orderId = info.lastInsertRowid;

    const insertItem = db.prepare("INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)");
    for (const item of items) {
      insertItem.run(orderId, item.id, item.quantity, item.price);
    }
    res.json({ id: orderId });
  });

  app.get("/api/orders/:userId", (req, res) => {
    const orders = db.prepare("SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC").all(req.params.userId);
    res.json(orders);
  });

  app.get("/api/admin/orders", (req, res) => {
    const orders = db.prepare(`
      SELECT orders.*, users.name as user_name 
      FROM orders 
      JOIN users ON orders.user_id = users.id 
      ORDER BY created_at DESC
    `).all();
    res.json(orders);
  });

  app.patch("/api/admin/products/:id", (req, res) => {
    const { name, description, price, image, category, stock } = req.body;
    db.prepare("UPDATE products SET name = ?, description = ?, price = ?, image = ?, category = ?, stock = ? WHERE id = ?")
      .run(name, description, price, image, category, stock, req.params.id);
    res.json({ success: true });
  });

  app.get("/api/admin/users", (req, res) => {
    const users = db.prepare("SELECT id, name, email, role, created_at FROM users").all();
    res.json(users);
  });

  app.get("/api/admin/reports", (req, res) => {
    const totalSales = db.prepare("SELECT SUM(total) as total FROM orders WHERE status = 'delivered'").get() as { total: number };
    const totalOrders = db.prepare("SELECT COUNT(*) as count FROM orders").get() as { count: number };
    const pendingOrders = db.prepare("SELECT COUNT(*) as count FROM orders WHERE status = 'pending'").get() as { count: number };
    const topProducts = db.prepare(`
      SELECT products.name, SUM(order_items.quantity) as sold 
      FROM order_items 
      JOIN products ON order_items.product_id = products.id 
      GROUP BY products.id 
      ORDER BY sold DESC 
      LIMIT 5
    `).all();
    
    res.json({
      totalRevenue: totalSales.total || 0,
      totalOrders: totalOrders.count,
      pendingOrders: pendingOrders.count,
      topProducts
    });
  });

  // Order Details (Tracking)
  app.get("/api/orders/details/:orderId", (req, res) => {
    const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(req.params.orderId);
    if (!order) return res.status(404).json({ error: "Order not found" });
    
    const items = db.prepare(`
      SELECT order_items.*, products.name, products.image 
      FROM order_items 
      JOIN products ON order_items.product_id = products.id 
      WHERE order_id = ?
    `).all(req.params.orderId);
    
    res.json({ ...order, items });
  });

  // Gallery Routes
  app.get("/api/gallery", (req, res) => {
    const images = db.prepare("SELECT * FROM gallery ORDER BY created_at DESC").all();
    res.json(images);
  });

  app.post("/api/gallery", (req, res) => {
    const { image_url, caption } = req.body;
    const info = db.prepare("INSERT INTO gallery (image_url, caption) VALUES (?, ?)").run(image_url, caption);
    res.json({ id: info.lastInsertRowid });
  });

  app.delete("/api/admin/gallery/:id", (req, res) => {
    db.prepare("DELETE FROM gallery WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  const PORT = 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
