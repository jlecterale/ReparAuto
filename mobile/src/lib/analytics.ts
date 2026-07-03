/**
 * Firebase Analytics (GA4) helpers.
 *
 * Every helper is fire-and-forget: analytics must never break, block or slow a
 * user flow, so all calls swallow errors. Standard GA4 event names
 * (screen_view, login, sign_up, view_item, add_to_wishlist, …) are used where
 * one exists so the default Firebase/GA4 reports work without custom
 * definitions.
 *
 * Never send PII (email, phone, free text) as event params — GA4 forbids it
 * and param values are capped at 100 characters anyway.
 */
import { analytics } from './firebase';

/** Listing kinds a user can publish or interact with. */
export type AnalyticsListingType = 'carro' | 'peca' | 'oficina' | 'intencao';

type SignInMethod = 'password' | 'google' | 'apple';

export interface AnalyticsUser {
  uid: string;
  tipoConta?: string;
  role?: string;
}

/**
 * Ties subsequent events to the signed-in user (and clears the association on
 * sign-out when called with `null`). `tipoConta`/`role` become user properties
 * so audiences can be segmented by account type.
 */
export function setAnalyticsUser(user: AnalyticsUser | null): void {
  Promise.all([
    analytics.setUserId(user?.uid ?? null),
    analytics.setUserProperties({
      account_type: user?.tipoConta ?? null,
      role: user?.role ?? null,
    }),
  ]).catch(() => {});
}

/**
 * Records a screen view. Pass the route *pattern* (e.g. `/detalhes/[id]`), not
 * the concrete URL, to keep `screen_name` low-cardinality and free of ids.
 */
export function logScreenView(screenName: string): void {
  analytics
    .logScreenView({ screen_name: screenName, screen_class: screenName })
    .catch(() => {});
}

export function logLogin(method: SignInMethod): void {
  analytics.logLogin({ method }).catch(() => {});
}

export function logSignUp(method: SignInMethod): void {
  analytics.logSignUp({ method }).catch(() => {});
}

/** GA4 `view_item` — a listing detail screen was opened. */
export function logViewListing(
  type: AnalyticsListingType,
  id: string,
  name: string,
): void {
  analytics
    .logViewItem({
      items: [
        { item_id: id, item_name: name.slice(0, 100), item_category: type },
      ],
    })
    .catch(() => {});
}

/** GA4 `add_to_wishlist` — a listing was favourited (favourites are cars). */
export function logAddFavorite(id: string): void {
  analytics
    .logAddToWishlist({ items: [{ item_id: id, item_category: 'carro' }] })
    .catch(() => {});
}

/** Custom event — a new listing was submitted (status `pendente`). */
export function logPublishListing(
  type: AnalyticsListingType,
  id: string,
): void {
  analytics
    .logEvent('publish_listing', { listing_type: type, listing_id: id })
    .catch(() => {});
}

/** Custom event — a chat message was sent about a listing. */
export function logSendMessage(
  type: AnalyticsListingType,
  listingId: string,
): void {
  analytics
    .logEvent('send_message', { listing_type: type, listing_id: listingId })
    .catch(() => {});
}
