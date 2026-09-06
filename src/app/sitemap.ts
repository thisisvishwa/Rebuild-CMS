import type { MetadataRoute } from "next";
import { config } from "@/lib/config";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = config.app.url;
  const last = new Date().toISOString();

  const now = () => last;

  return [
    { url: base, lastModified: now(), changeFrequency: "weekly", priority: 1 },
    { url: `${base}/checkout`, lastModified: now(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/contact`, lastModified: now(), changeFrequency: "yearly", priority: 0.5 },
    { url: `${base}/privacy-policy`, lastModified: now(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/terms`, lastModified: now(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/refund-policy`, lastModified: now(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/disclaimer`, lastModified: now(), changeFrequency: "yearly", priority: 0.3 },
  ];
}
