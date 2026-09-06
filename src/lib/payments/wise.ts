import { config, isDemoMode } from "@/lib/config";
import { generateOrderNumber } from "@/lib/utils";

/**
 * Wise payment integration (configurable flow).
 *
 * Wise does not offer a drop-in hosted checkout for every use case, so we
 * support a transparent "manual" flow:
 *
 *  1. The customer is shown clear payment instructions (account/IBAN),
 *     a unique order reference, and the exact amount to send.
 *  2. The customer makes the transfer and submits their order/reference as
 *     proof of payment.
 *  3. A human verifies the payment and grants access (manual fulfilment),
 *     OR — if a real automated Wise integration is configured — fulfilment is
 *     automatic. We never claim automatic verification unless one exists.
 *
 * In DEMO mode the manual verification is auto-approved so the end-to-end flow
 * can be tested locally, clearly labelled as a demo.
 */

export interface WiseInstructions {
  flow: "manual" | "automated";
  reference: string;
  beneficiaryName: string;
  accountNumber: string;
  bankName: string;
  iban: string;
  swift: string;
  instructions: string;
  demo: boolean;
}

export function buildWiseInstructions(orderNumber: string): WiseInstructions {
  return {
    flow: config.payment.wise.flow,
    reference: orderNumber,
    beneficiaryName: config.payment.wise.beneficiaryName || "—",
    accountNumber: config.payment.wise.accountNumber || "—",
    bankName: config.payment.wise.bankName || "—",
    iban: config.payment.wise.iban || "—",
    swift: config.payment.wise.swift || "—",
    instructions:
      config.payment.wise.instructions ||
      "Pay the exact amount to the account shown, then submit your order reference as proof of payment. Your access is granted once payment is verified.",
    demo: isDemoMode(),
  };
}

export function wiseReferencePrefix(): string {
  return generateOrderNumber();
}
