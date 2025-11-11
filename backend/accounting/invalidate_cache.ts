import { reportCache } from "./cache";

export function invalidateAccountingReports(): void {
  reportCache.invalidate('^(gl|bs|pl|tb|cb):');
}

export function invalidateSalesReports(): void {
  reportCache.invalidate('^(ar|sales):');
}

export function invalidatePurchasingReports(): void {
  reportCache.invalidate('^ap:');
}

export function invalidateAllReports(): void {
  reportCache.clear();
}
