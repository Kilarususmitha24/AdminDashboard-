"use strict";

require("dotenv").config();
const path = require("path");
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const Product = require("./models/Product");
const Order = require("./models/Order");

const app = express();
const PORT = process.env.PORT || 4000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/admin_dashboard";

app.use(cors());
app.use(express.json());

// Health
app.get("/api/health", (_req, res) => {
	res.json({ ok: true, time: new Date().toISOString() });
});

// Products
app.get("/api/products", async (_req, res) => {
	try {
		const products = await Product.find().sort({ createdAt: -1 });
		res.json(products);
	} catch (err) {
		res.status(500).json({ error: "Failed to fetch products" });
	}
});

app.post("/api/products", async (req, res) => {
	try {
		const { name, price, stock } = req.body;
		const created = await Product.create({ name, price, stock });
		res.status(201).json(created);
	} catch (err) {
		res.status(400).json({ error: "Failed to create product" });
	}
});

app.put("/api/products/:id", async (req, res) => {
	try {
		const { id } = req.params;
		const { name, price, stock } = req.body;
		const updated = await Product.findByIdAndUpdate(
			id,
			{ name, price, stock },
			{ new: true, runValidators: true }
		);
		if (!updated) return res.status(404).json({ error: "Product not found" });
		res.json(updated);
	} catch (_err) {
		res.status(400).json({ error: "Failed to update product" });
	}
});

app.delete("/api/products/:id", async (req, res) => {
	try {
		const { id } = req.params;
		const deleted = await Product.findByIdAndDelete(id);
		if (!deleted) return res.status(404).json({ error: "Product not found" });
		res.json({ ok: true });
	} catch (_err) {
		res.status(400).json({ error: "Failed to delete product" });
	}
});

// Orders (update/delete examples)
app.put("/api/orders/:id", async (req, res) => {
	try {
		const { id } = req.params;
		const payload = req.body || {};
		const updated = await Order.findByIdAndUpdate(id, payload, {
			new: true,
			runValidators: true
		});
		if (!updated) return res.status(404).json({ error: "Order not found" });
		res.json(updated);
	} catch (_err) {
		res.status(400).json({ error: "Failed to update order" });
	}
});

app.delete("/api/orders/:id", async (req, res) => {
	try {
		const { id } = req.params;
		const deleted = await Order.findByIdAndDelete(id);
		if (!deleted) return res.status(404).json({ error: "Order not found" });
		res.json({ ok: true });
	} catch (_err) {
		res.status(400).json({ error: "Failed to delete order" });
	}
});

// Serve static frontend
app.use(express.static(path.join(__dirname, "..", "public")));

async function start() {
	try {
		await mongoose.connect(MONGODB_URI, { autoIndex: true });
		console.log("Connected to MongoDB");
		app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
	} catch (err) {
		console.error("Failed to start server:", err);
		process.exit(1);
	}
}

start();


