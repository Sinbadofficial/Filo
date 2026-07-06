export function formatCurrency(amount: number) {
  return `৳${amount.toLocaleString("en-BD")}`;
}

export function generateOrderNumber() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const random = Math.floor(Math.random() * 9000 + 1000);
  return `ORD-${date}-${random}`;
}

export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
