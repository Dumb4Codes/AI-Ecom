/** Escapes user input so it can be embedded safely in a RegExp / Mongo `$regex`. */
export const escapeRegExp = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
