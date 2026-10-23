/** Change-order costs per $1M renovation, in thousands of dollars: unexpected existing conditions, design-related
 * changes, owner-requested changes. From a 2018 study of 161 school renovation projects (1.45%, 1.36%, 0.75% of
 * contract), scaled to $1M. Historical benchmarks, not quotes or MEP-only averages. */
export const COSTS=[14.5,13.6,7.5] as const;
export const TOTAL=35600;
/** Illustrative only: a third of unexpected-condition costs caught before construction (rounded to $5,000). */
export const SAVED=5000;
/** Where the cost story stands: how far each category's lines have risen (0–1), and the savings view (0–1). */
export type Story={rise:[number,number,number];save:number};
