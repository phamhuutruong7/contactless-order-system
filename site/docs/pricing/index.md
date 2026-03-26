# Pricing & Fee Estimation

## Overview

This page provides a transparent breakdown of all costs involved in deploying the Contactless Order System for a restaurant, along with a recommended pricing model for charging restaurant owners as a SaaS provider.

---

## One-Time Hardware Costs (per restaurant)

Each restaurant requires two printers: one for the **kitchen** (food) and one for the **bar** (drinks).

| Item | Qty | Unit Price | Total |
|------|-----|------------|-------|
| Star mC-Print3 (Ethernet + WiFi) | 2 | €299–349 | **€598–698** |
| Thermal paper rolls 80mm × 80mm (20 rolls) | 1 box | ~€20 | **€20** |
| Ethernet cables (Cat6, 3m) | 2 | ~€5 | **€10** |
| QR code stands / table holders | 10–20 | ~€1 | **€10–20** |

**Estimated hardware total: €638–748 per restaurant**

> Hardware can be sold at cost (pass-through) or with a small margin. Recommended: pass-through to reduce your financial risk.

---

## Monthly Infrastructure Costs (whole platform)

These costs are shared across **all restaurants** on the platform and scale gradually.

| Service | Spec | Monthly Cost |
|---------|------|-------------|
| Civo Production VM | 2 vCPU / 4 GB RAM | ~€20 |
| Civo Development VM | 1 vCPU / 2 GB RAM | ~€10 |
| Supabase Pro (PostgreSQL + Auth + Storage) | Managed | ~€23 |
| Domain (.com via Cloudflare) | 1 domain | ~€1 |
| GitHub Pages (VitePress docs) | — | **Free** |
| SSL certificate (Let's Encrypt / Caddy) | — | **Free** |

**Total infrastructure: ~€54/month** (for 1–5 restaurants)

As you grow:

| Restaurants | Recommended VM | Est. Infra Cost |
|------------|----------------|-----------------|
| 1–5 | Civo 2 vCPU / 4 GB | ~€54/mo |
| 6–15 | Civo 4 vCPU / 8 GB | ~€80/mo |
| 16–30 | Civo 8 vCPU / 16 GB | ~€120/mo |
| 30+ | Civo Kubernetes cluster | €180+/mo |

---

## Recommended Pricing to Charge Restaurant Owners

Based on market research and the actual cost structure above, here is the recommended pricing model:

### Pricing Model

| Fee | Amount | Notes |
|-----|--------|-------|
| **One-time Setup Fee** | **€299** | Covers onboarding, hardware configuration, staff training, and first-month support |
| **Hardware (pass-through)** | **€650–750** | Restaurant purchases directly; you don't carry inventory risk |
| **Monthly SaaS Fee** | **€79/month** | Hosting, maintenance, updates, and email support |

### Why €79/month?

| Competitor | Monthly Price |
|-----------|--------------|
| Lightspeed Restaurant | €79/month |
| TouchBistro | €69/month |
| Square for Restaurants | €60/month |
| **Your system** | **€79/month** |

At €79/month, the system is priced at the premium tier — **justified by the self-hosted architecture** (no third-party data sharing), CloudPRNT integration, and the fact that restaurants pay per usage rather than per terminal.

---

## Break-Even Analysis

| Restaurants | Monthly Revenue | Monthly Infra Cost | Gross Profit |
|------------|----------------|-------------------|--------------|
| 1 | €79 | €54 | **€25** |
| 3 | €237 | €54 | **€183** |
| 5 | €395 | €54 | **€341** |
| 10 | €790 | €80 | **€710** |
| 20 | €1,580 | €120 | **€1,460** |

> Setup fees (€299 × number of restaurants) are additional one-time revenue. Hardware is pass-through — zero cost to you.

**Break-even point: as soon as you onboard your first paying customer.**

---

## Total Cost for a Restaurant Owner (First Year)

| Item | Cost |
|------|------|
| Setup fee | €299 |
| Hardware (2× Star mC-Print3 + accessories) | ~€700 |
| Monthly SaaS (12 months) | 12 × €79 = **€948** |
| **Year 1 total** | **~€1,947** |
| **Year 2+ (monthly only)** | **€79/month** |

Compared to a traditional POS system (€2,000–5,000 upfront + €100–200/month), this pricing is **significantly competitive**.

---

## Optional Add-Ons (future upsell opportunities)

| Feature | Suggested Price |
|---------|----------------|
| Additional printer (e.g., express counter) | €49 one-time setup + hardware cost |
| Advanced analytics dashboard | +€19/month |
| Custom branding (white-label QR menus) | +€29/month |
| Priority support SLA (4-hour response) | +€39/month |
| Multi-location bundle (2nd restaurant) | 10% discount on monthly fee |
