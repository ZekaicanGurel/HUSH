# HUSH Premium Subscription Plan

This document defines the pricing structure and product identifiers for the HUSH app. Use these details to configure **Google Play Console** and **RevenueCat**.

## 1. RevenueCat Configuration

*   **Project Name:** HUSH
*   **Entitlement Identifier:** `premium` (Unlocks all features)
*   **Offering Identifier:** `default` (The main offering displayed in the app)

## 2. Product Structure

All products should be added to the `default` Offering in RevenueCat.

| Plan Type | Product ID (Google Play) | Duration | Recommended Price (TR) | Recommended Price (US) | Priority | Description |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Weekly** | `prod5b2541032e` | 1 Week | **₺29.99** | **$1.99** | **High** | *Placeholder ID (Pre-Store)* |
| **Monthly** | `hush_premium_monthly` | 1 Month | **₺79.99** | **$5.99** | Medium | Popular choice for habit building. |
| **Yearly** | `hush_premium_yearly` | 1 Year | **₺499.99** | **$39.99** | Medium | Best value for long-term focus. |
| **Lifetime** | `hush_premium_lifetime` | Lifetime | **₺999.99** | **$99.99** | Low | One-time purchase, access forever. |

> **Note:** "Priority" indicates the order or emphasis. The app determines display order based on the RevenueCat Offering setup, but Weekly is intended to be the entry point.

## 3. Implementation Checklist

### Google Play Console
1.  Go to **Monetize > Products > Subscriptions**.
2.  Create a subscription (e.g., `hush_premium`).
3.  Add base plans for Weekly (`hush_premium_weekly`), Monthly (`hush_premium_monthly`), and Yearly (`hush_premium_yearly`).
4.  Go to **Monetize > Products > In-app products**.
5.  Create a managed product for Lifetime (`hush_premium_lifetime`).

### RevenueCat Dashboard
1.  Go to **Projects > [Hush] > Products**.
2.  Import products from Google Play.
3.  Go to **Entitlements** and create `premium`.
4.  Attach all 4 products to the `premium` entitlement.
5.  Go to **Offerings** and create `default`.
6.  Add all 4 products to the `default` offering.

## 4. UI Behavior

The app is already configured to dynamically display whatever packages are in the `default` offering.
*   **Ids:** The app does not hardcode these IDs, it reads them from the package.
*   **Prices:** Displayed exactly as formatted by the Store (e.g. "₺29,99").
*   **Labels:** Uses specific translations for Weekly/Monthly/etc. based on the package type detected.
