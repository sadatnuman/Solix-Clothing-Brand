const KEY = 'solix_guest_cart';
export function getGuestCart() {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
}
export function setGuestCart(items) {
  localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new Event('solix-cart-change'));
}
export function addGuestItem(productVariantId, quantity = 1) {
  const items = getGuestCart();
  const found = items.find((item) => item.productVariantId === productVariantId);
  if (found) found.quantity += quantity;
  else items.push({ productVariantId, quantity });
  setGuestCart(items);
}
export function updateGuestItem(productVariantId, quantity) {
  setGuestCart(quantity > 0 ? getGuestCart().map((item) => item.productVariantId === productVariantId ? { ...item, quantity } : item) : getGuestCart().filter((item) => item.productVariantId !== productVariantId));
}
export function clearGuestCart() { setGuestCart([]); }
