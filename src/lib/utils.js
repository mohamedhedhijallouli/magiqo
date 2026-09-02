export function cn(...args) {
  return args
    .flat()
    .filter(Boolean)
    .join(" ");
}

// Predefined categories/animal types/place types carry a label_key so their
// name follows the current UI language; custom ones added by a Game Master
// have no label_key and simply keep whatever free text was typed.
export function taxonomyLabel(item, t) {
  if (!item) return "";
  if (item.label_key) {
    const translated = t(item.label_key);
    if (translated && translated !== item.label_key) return translated;
  }
  return item.label;
}
