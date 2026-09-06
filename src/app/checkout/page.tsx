import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CheckoutClient } from "@/components/checkout/CheckoutClient";
import { config, isDemoMode, availablePaymentMethods } from "@/lib/config";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return (
    <>
      <Header />
      <main className="bg-cream-50">
        <CheckoutClient
          productName={config.app.productName}
          priceDisplay={config.price.display}
          currency={config.price.currency}
          isDemo={isDemoMode()}
          availableMethods={availablePaymentMethods()}
        />
      </main>
      <Footer />
    </>
  );
}
