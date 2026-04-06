/**
 * Shared number / date formatters using the Austrian (de-AT) locale.
 */

export const eur = (v) =>
  new Intl.NumberFormat('de-AT', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(v);

/** @param {number} v - value already expressed as a percentage (e.g. 12.5 means 12.5 %) */
export const pct = (v) =>
  new Intl.NumberFormat('de-AT', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(v / 100);

export const dateLabel = (d) =>
  new Date(d).toLocaleDateString('de-AT', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

