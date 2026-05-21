// utils/eligibility.ts

/**
 * Utility functions for Brand Ambassador eligibility checks.
 * The business rules are:
 * 1️⃣ One‑time payment of NT 98,000 (valid for 2 years).
 *    → Member must have a tier of "初潤知己" (or higher) and a total spend of at least 98,000.
 * 2️⃣ Rolling yearly cumulative spend of NT 294,000 (3 × 98,000).
 *    → Member must have a tier of "初潤知己" (or higher) and a total spend within the last year of at least 294,000.
 *
 * The functions below are deliberately lightweight – they operate on a plain Member
 * object that mirrors the shape returned from Supabase. Adjust the property names if
 * your schema differs.
 */

export interface Member {
  id: string;
  tier: string; // e.g. "初潤知己", "初潤靈魂伴侶", "ambassador", etc.
  total_spend?: number; // cumulative spend (NT)
  team_total_sales?: number;
  // You can extend this interface with fields like `yearly_spend` if needed.
}

/**
 * Checks if a member can manually apply for the Brand Ambassador role.
 * The rule is satisfied when the member's tier is "初潤知己" (or higher) **and**
 * they have already spent at least NT 98,000.
 */
export function canApplyForAmbassador(member: Member): boolean {
  const qualifyingTiers = ['初潤知己', '初潤靈魂伴侶', 'ambassador'];
  const hasTier = qualifyingTiers.includes(member.tier);
  const spentEnough = (member.team_total_sales ?? 0) >= 98_000;

  return hasTier && spentEnough;
}

/**
 * Checks if a member automatically qualifies for a 1‑year upgrade based on the
 * rolling‑year spend rule (NT 294,000).
 */
export function autoUpgradeEligibility(member: Member): boolean {
  const qualifyingTiers = ['初潤知己', '初潤靈魂伴侶', 'ambassador'];
  const hasTier = qualifyingTiers.includes(member.tier);
  const yearlySpentEnough = (member.total_spend ?? 0) >= 294_000;
  return hasTier && yearlySpentEnough;
}
