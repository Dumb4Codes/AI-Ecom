import { Request, Response } from "express";
import mongoose from "mongoose";
import stripeClient from "../config/stripe.config";
import { envConfig } from "../config/env.config";
import OrderModel from "../models/order.model";
import CartModel from "../models/cart.model";
import ProductModel from "../models/product.model";
import {
  ORDER_STATUS,
  PAYMENT_STATUS,
} from "../constants/enums";

export const stripeWebhookHandler = async (req: Request, res: Response) => {
  const sig = req.headers["stripe-signature"] as string;

  let event;
  try {
    event = stripeClient.webhooks.constructEvent(
      req.body,
      sig,
      envConfig.STRIPE_WEBHOOK_SECRET
    );
  } catch {
    res.status(400).json({ message: "Webhook signature verification failed" });
    return;
  }

  const session = event.data.object as {
    metadata?: { orderId?: string };
  };
  const orderId = session.metadata?.orderId;

  if (!orderId || !mongoose.isValidObjectId(orderId)) {
    res.status(200).json({ received: true });
    return;
  }

  // Stripe retries and may deliver an event more than once. Each transition is
  // an atomic compare-and-set on `paymentStatus: pending`, so a replayed event
  // matches nothing and cannot double-decrement stock or flip a paid order.
  switch (event.type) {
    case "checkout.session.completed": {
      const order = await OrderModel.findOneAndUpdate(
        { _id: orderId, paymentStatus: PAYMENT_STATUS.PENDING },
        {
          $set: {
            paymentStatus: PAYMENT_STATUS.PAID,
            status: ORDER_STATUS.CONFIRMED,
          },
          $push: {
            statusHistory: { status: ORDER_STATUS.CONFIRMED, date: new Date() },
          },
        },
        { returnDocument: "after" }
      );

      if (order) {
        await CartModel.deleteOne({ userId: order.userId });

        await ProductModel.bulkWrite(
          order.items.map((item) => ({
            updateOne: {
              filter: { _id: item.productId },
              update: { $inc: { stockCount: -item.quantity } },
            },
          }))
        );

        console.log(`Order ${order.orderNo} paid and confirmed`);
      }
      break;
    }

    case "checkout.session.expired": {
      const order = await OrderModel.findOneAndUpdate(
        { _id: orderId, paymentStatus: PAYMENT_STATUS.PENDING },
        {
          $set: {
            paymentStatus: PAYMENT_STATUS.FAILED,
            status: ORDER_STATUS.CANCELLED,
          },
          $push: {
            statusHistory: { status: ORDER_STATUS.CANCELLED, date: new Date() },
          },
        },
        { returnDocument: "after" }
      );

      if (order) console.log(`Order ${order.orderNo} payment expired`);
      break;
    }
  }

  res.status(200).json({ received: true });
};
