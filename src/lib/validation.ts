import { z } from "zod";

/** Zod schemas for every API input — centralises validation and sanitisation. */

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Please enter a valid email address.")
  .max(200);

export const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Please enter your name.")
    .max(120, "Name is too long."),
  email: emailSchema,
  country: z
    .string()
    .trim()
    .max(90, "Country is too long.")
    .optional()
    .default(""),
});

export const methodSchema = z.enum(["razorpay", "paypal", "wise"]);

export const createCheckoutSchema = contactSchema.extend({
  method: methodSchema.optional(),
});

export const razorpayCreateSchema = contactSchema.extend({});

export const razorpayVerifySchema = z.object({
  orderId: z.string().min(1),
  razorpayOrderId: z.string().min(1),
  razorpayPaymentId: z.string().min(1),
  razorpaySignature: z.string().min(1),
});

export const paypalCompleteSchema = z.object({
  token: z.string().min(1),
  orderId: z.string().min(1),
});

export const wiseSubmitSchema = contactSchema.extend({
  orderId: z.string().min(1),
  reference: z
    .string()
    .trim()
    .min(3, "Please provide the payment reference.")
    .max(100),
  note: z.string().trim().max(500).optional().default(""),
});

export const demoCompleteSchema = z.object({
  orderId: z.string().min(1),
});

export const accessSchema = z.object({
  orderNumber: z.string().min(1),
  email: emailSchema,
});

export const contactFormSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: emailSchema,
  orderNumber: z.string().trim().max(60).optional().default(""),
  subject: z.string().trim().min(1).max(160),
  message: z.string().trim().min(1).max(4000),
});
