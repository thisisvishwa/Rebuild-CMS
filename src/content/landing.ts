/**
 * Copy for the landing (sales) page, organised by section.
 *
 * This is deliberately the single place where the on-page narrative lives so
 * the copy can be refined without touching component code. All statements obey
 * the content rules: no unsupported claims, no fake numbers, no guarantees,
 * and no testimonials/statistics invented. Required disclaimers are present.
 */
import { config } from "@/lib/config";

export const hero = {
  eyebrow: "A structured recovery system",
  headline: "You lost the relationship. You don't have to lose yourself.",
  subhead:
    "A practical, step-by-step system designed to help you process the pain, rebuild your identity, regain your confidence, and create a stronger version of yourself after a breakup, separation, or divorce.",
  primaryCta: "Start Rebuilding Yourself",
  secondaryCta: "See what's inside",
  trustLine: "Instant digital access · Read anywhere · Private & self-paced",
};

export const problem = {
  eyebrow: "If you're struggling right now, you're not broken.",
  headline: "This is heavy. And you're not alone in carrying it.",
  intro:
    "When a relationship ends, the loss isn't just about missing one person. It can unsettle your routines, your sense of who you are, and your picture of what comes next. If any of this rings true, please know that what you're feeling is a normal response to a real loss — not a sign that something is wrong with you.",
  items: [
    "Waking up and thinking about them before your feet even hit the floor",
    "Replaying conversations, wondering what you could have said or done differently",
    "Feeling a quiet emptiness in spaces that used to be full",
    "Missing the person even when you know the relationship wasn't healthy",
    "Losing motivation for things you used to care about",
    "Checking their social media without really meaning to",
    "Wondering whether you should reach out — and what that would even achieve",
    "Feeling like no one quite understands what this is like",
    "Questioning your own worth",
    "Being afraid you'll never feel like yourself again",
    "Not knowing who you are without them",
  ],
  note: "Everyone's experience is different. This page doesn't assume yours is identical to anyone else's — it simply names some of the common threads so you can feel understood.",
};

export const transformation = {
  eyebrow: "The shift",
  headline: "This isn't about becoming who you were before.",
  subhead:
    "It's about becoming someone stronger, wiser, and more fully yourself. Recovery is less about erasing your past, and more about gently turning toward a future you actually want.",
  beforeTitle: "Where you might be now",
  before: [
    { title: "Emotional chaos", text: "Feelings coming in waves, hard to find steady ground." },
    { title: "Constant rumination", text: "Your mind keeps returning to the same moments and questions." },
    { title: "Loss of identity", text: "You're not sure who you are outside of the relationship." },
    { title: "Low confidence", text: "Self-doubt has a way of creeping into everything." },
    { title: "Attachment to the past", text: "Letting go feels impossible, even when you know it's needed." },
    { title: "An unclear future", text: "The path ahead looks blank and overwhelming." },
  ],
  afterTitle: "Where the work can lead",
  after: [
    { title: "Emotional clarity", text: "Understanding what you feel, and why — with less chaos." },
    { title: "Stronger boundaries", text: "Knowing where you end and others begin." },
    { title: "Rebuilt identity", text: "A clearer sense of who you are, independent of a partner." },
    { title: "Greater self-awareness", text: "Seeing your patterns with honesty and compassion." },
    { title: "Improved confidence", text: "Trusting yourself and your own judgment again." },
    { title: "Clearer goals", text: "Knowing what you value and where you're headed." },
  ],
  disclaimer:
    "These are possible directions the material can support — not guaranteed outcomes. You always move at your own pace, and your experience may differ.",
};

export const whatYouGet = {
  eyebrow: "What you get",
  headline: "A complete recovery system, not just a quick read.",
  intro:
    "Inside you'll find a structured framework and a set of exercises, prompts, and self-discovery activities designed to be worked through at your own pace.",
  features: [
    { title: "The complete digital eBook", text: "A thought-through guide you can read on any device." },
    { title: "A structured recovery framework", text: "Eight clear phases, from stabilising to moving forward." },
    { title: "Step-by-step exercises", text: "Practical, doable actions for each stage." },
    { title: "Reflection prompts", text: "Questions that help you understand your own experience." },
    { title: "Journaling exercises", text: "Guided space to process emotions on the page." },
    { title: "Emotional processing exercises", text: "Ways to feel and release rather than push aside." },
    { title: "Self-discovery activities", text: "Reconnect with your interests, values, and sense of self." },
    { title: "Identity rebuilding exercises", text: "Reconstruct who you are beyond a relationship." },
    { title: "Confidence rebuilding exercises", text: "Small, steady steps toward self-trust." },
    { title: "Boundary-setting guidance", text: "Clear language for healthy limits." },
    { title: "Future planning exercises", text: "Name what you want and map how to get there." },
    { title: "A personal transformation roadmap", text: "See the whole journey, and where you are in it." },
  ],
  note: "Added bonuses (if any) appear in their own editable section lower on this page.",
};

export const phases = {
  eyebrow: "What's inside",
  headline: "Eight quiet phases, one clear path.",
  intro:
    "The material moves gradually, in the order that recovery tends to work best — without asking you to rush or to pretend the past doesn't matter.",
  items: [
    { n: "01", title: "Stabilize", text: "Understand what you're experiencing and create emotional stability." },
    { n: "02", title: "Understand", text: "Explore what happened and identify patterns without becoming trapped in the past." },
    { n: "03", title: "Heal", text: "Process emotions and begin releasing emotional weight." },
    { n: "04", title: "Detach", text: "Create healthy emotional distance and reduce dependence on the past relationship." },
    { n: "05", title: "Rebuild", text: "Reconnect with your identity, values, interests, routines, and personal goals." },
    { n: "06", title: "Strengthen", text: "Develop confidence, boundaries, emotional resilience, and self-trust." },
    { n: "07", title: "Reinvent", text: "Design a new vision for your life." },
    { n: "08", title: "Move Forward", text: "Create a practical roadmap for the next chapter." },
  ],
};

export const howItWorks = {
  eyebrow: "How it works",
  headline: "Three simple steps.",
  intro: "From payment to your first chapter — the process is straightforward.",
  steps: [
    { n: "01", title: "Get instant access", text: "Purchase the digital eBook securely through the checkout." },
    { n: "02", title: "Follow the journey", text: "Work through the structured material at your own pace, on your own schedule." },
    { n: "03", title: "Rebuild your life", text: "Use the exercises and frameworks to create your next chapter." },
  ],
};

export const whoFor = {
  eyebrow: "Who this is for",
  headline: "This was created for you if…",
  items: [
    "You recently went through a breakup.",
    "You're separated from your partner.",
    "You're navigating life after divorce.",
    "You can't stop thinking about your former partner.",
    "You feel like you've lost yourself.",
    "You want to rebuild your confidence.",
    "You want to stop living in the past.",
    "You want to understand yourself better.",
    "You want a structured process instead of random advice.",
    "You're ready to build a new chapter.",
  ],
};

export const whoNotFor = {
  eyebrow: "An honest word",
  headline: "This may not be the right fit if you…",
  items: [
    "Are looking for a way to manipulate an ex.",
    "Want guaranteed reconciliation.",
    "Expect instant emotional recovery.",
    "Want someone else to do the work for you.",
    "Are seeking emergency mental-health support.",
  ],
  note: "This is an educational, self-guided resource. It is not a replacement for professional care. If you need urgent support, see the disclaimer below and reach out to a qualified professional or crisis service in your area.",
};

export const preview = {
  eyebrow: "A look inside",
  headline: "Designed to be used, not just read.",
  intro:
    "You'll find working pages, guided reflections, and structured exercises — a system built to move with you, not sit on a shelf.",
  items: [
    { title: "Front cover", text: "A calm, considered cover." },
    { title: "Interior pages", text: "Clear, readable chapters." },
    { title: "Exercise pages", text: "Doable, concrete steps." },
    { title: "Journal & reflection pages", text: "Guided space for your own words." },
    { title: "The recovery roadmap", text: "The full journey at a glance." },
    { title: "Checklists", text: "A way to feel progress, step by step." },
  ],
};

export const pricing = {
  eyebrow: "Your copy",
  headline: "A complete recovery system. One simple price.",
  includesTitle: "What's included",
  includes: [
    "The complete digital eBook",
    "The full 8-phase recovery framework",
    "Practical exercises",
    "Reflection prompts",
    "Self-rebuilding exercises",
    "Lifetime access to the material",
    "Instant digital delivery",
  ],
  priceLabel: config.price.display,
  perLabel: "one-time payment",
  cta: "Get Instant Access",
  reassuring: "Instant access · Read on any device · Private & self-paced",
  guaranteeNote:
    "Purchases are covered by the refund policy shown on this page and in the checkout.",
};

export const testimonials = {
  eyebrow: "From readers",
  headline: "Real experiences will appear here.",
  intro:
    "We don't publish reviews until they're genuinely from customers with their permission. Once real testimonials are available, they'll appear in this space.",
  placeholder:
    "“Real experiences from readers will appear here.”",
};

export const finalCta = {
  eyebrow: "Your next chapter",
  headline: "Your story didn't end with the relationship.",
  subhead:
    "The relationship may have changed your life, but it doesn't have to define the rest of it. Start rebuilding your identity, your confidence, and your future — one step at a time.",
  primaryCta: "Start Rebuilding Yourself",
  secondaryCta: "Get Instant Access",
};

export const disclaimerText =
  "This eBook is an educational and self-guided personal-development resource. It is not medical, psychological, psychiatric, or emergency treatment, and it does not replace professional care. If you are experiencing severe distress, feel unsafe, or are considering harming yourself or someone else, seek immediate help from an appropriate qualified professional or emergency service in your area.";

export const stickyCta = {
  label: "Get the eBook",
  price: config.price.display,
  href: "/checkout",
};
