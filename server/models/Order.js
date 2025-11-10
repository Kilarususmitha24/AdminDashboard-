"use strict";

const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
	{
		userEmail: { type: String, required: true, trim: true },
		status: {
			type: String,
			enum: ["pending", "paid", "shipped", "completed", "cancelled"],
			default: "pending"
		},
		items: [
			{
				productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
				quantity: { type: Number, required: true, min: 1 }
			}
		],
		total: { type: Number, required: true, min: 0 }
	},
	{ timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);


