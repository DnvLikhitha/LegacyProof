export const SAMPLE_SNIPPETS = [
  {
    label: "jQuery Utility (Format Currency)",
    code: `function formatPrice(val, currency) {
  if (val === null || val === undefined) {
    return '$0.00';
  }
  var num = parseFloat(val);
  if (isNaN(num)) {
    return '$0.00';
  }
  var curr = currency || '$';
  var parts = num.toFixed(2).split('.');
  var integerPart = parts[0];
  var decimalPart = parts[1];
  var regex = /(\\d+)(\\d{3})/;
  while (regex.test(integerPart)) {
    integerPart = integerPart.replace(regex, '$1' + ',' + '$2');
  }
  return curr + integerPart + '.' + decimalPart;
}`
  },
  {
    label: "ES5 Array & Object Processor",
    code: `function calculateCartSummary(items) {
  if (!items || !items.length) {
    return { total: 0, itemCount: 0, hasDiscount: false };
  }
  var total = 0;
  var count = 0;
  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    if (item && typeof item.price === 'number') {
      var qty = item.quantity || 1;
      total += item.price * qty;
      count += qty;
    }
  }
  var hasDiscount = total > 100;
  if (hasDiscount) {
    total = total * 0.9;
  }
  return {
    total: Math.round(total * 100) / 100,
    itemCount: count,
    hasDiscount: hasDiscount
  };
}`
  },
  {
    label: "Legacy String Sanitizer",
    code: `function sanitizeSlug(text) {
  if (typeof text !== 'string') return '';
  var str = text.toLowerCase().trim();
  var res = '';
  for (var i = 0; i < str.length; i++) {
    var ch = str.charAt(i);
    if ((ch >= 'a' && ch <= 'z') || (ch >= '0' && ch <= '9') || ch === ' ' || ch === '-') {
      res += ch;
    }
  }
  while (res.indexOf('  ') !== -1) {
    res = res.replace('  ', ' ');
  }
  return res.split(' ').join('-');
}`
  }
];
