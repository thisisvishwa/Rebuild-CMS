import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSettings, getSetting } from "@/lib/admin/settings";
import { config } from "@/lib/config";
import { computePricing } from "@/lib/pricing";

// The storefront must always reflect the latest CMS publish, so it can never be
// statically cached (Next would serve stale content after an admin edit).
export const dynamic = "force-dynamic";

/**
 * GET /api/storefront
 *
 * Serves the CMS-driven values the existing landing page needs, so the business
 * owner can change content/price/FAQs/testimonials from the admin dashboard.
 * The frontend reads this API and falls back to its bundled copy when the CMS
 * has no override — so the existing design stays intact either way.
 */
export async function GET() {
  const product = await prisma.product.findFirst({
    where: { isActive: true, isArchived: false },
    include: { features: { orderBy: { sortOrder: "asc" } }, versions: { where: { status: "active" }, orderBy: { uploadedAt: "desc" } } },
  });

  const sections = await prisma.websiteSection.findMany({
    where: { isEnabled: true, published: true },
    orderBy: { sortOrder: "asc" },
  });
  const sectionsByKey: Record<string, Record<string, unknown>> = {};
  for (const s of sections) {
    try { sectionsByKey[s.key] = JSON.parse(s.content || "{}"); } catch { sectionsByKey[s.key] = {}; }
  }

  const faqs = await prisma.faqItem.findMany({
    where: { isPublished: true },
    orderBy: { sortOrder: "asc" },
    select: { question: true, answer: true, category: true },
  });

  const testimonials = await prisma.testimonialItem.findMany({
    where: { isPublished: true },
    orderBy: { sortOrder: "asc" },
    select: { name: true, age: true, situation: true, location: true, quote: true, imageUrl: true },
  });

  const seo = await prisma.seoConfig.findUnique({ where: { slug: "home" } });

  const settings = await getSettings();
  const taxEnabled = settings["commerce.taxEnabled"] === "true";
  const taxRatePercent = Number(settings["commerce.taxRatePercent"] ?? 0);
  const taxInclusive = settings["commerce.taxInclusive"] === "true";
  const priceMinor = product?.priceMinor ?? Number(settings["commerce.priceMinor"] ?? config.price.amountMinor);
  const currency = settings["commerce.currency"] || config.price.currency;

  const pricing = computePricing(priceMinor, taxEnabled, taxRatePercent, taxInclusive);
  // Even when no product record exists, keep the pricing contract intact.

  const paymentProviders = await prisma.paymentProvider.findMany({
    where: { showOnCheckout: true },
    select: { key: true, name: true, environment: true },
  });
  const availableMethods = paymentProviders.map((p) => p.key);

  return NextResponse.json({
    ok: true,
    product: product
      ? {
          id: product.id,
          slug: product.slug,
          name: product.name,
          description: product.description,
          shortDescription: product.shortDescription,
          currency,
          price: pricing,
          features: product.features.map((f) => ({ title: f.title, text: f.text })),
          activeVersion: product.versions[0]
            ? { version: product.versions[0].version, fileSize: product.versions[0].fileSize, releaseNotes: product.versions[0].releaseNotes }
            : null,
          hasActiveVersion: product.versions.length > 0,
        }
      : null,
    sections: sectionsByKey,
    sectionOrder: sections.map((s) => s.key),
    faqs,
    testimonials,
    seo: seo
      ? { title: seo.title, description: seo.description, robots: seo.robots }
      : null,
    settings: {
      businessName: settings["business.name"],
      supportEmail: settings["business.email"],
      taxEnabled,
      taxRatePercent,
    },
    paymentMethods: {
      available: availableMethods,
      environment: paymentProviders[0]?.environment ?? "sandbox",
    },
    sources: {
      productName: settings["business.name"] || config.app.productName,
    },
  });
}


