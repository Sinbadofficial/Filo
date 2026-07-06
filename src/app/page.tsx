import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-slate-50">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 py-16">
        <p className="text-sm font-semibold uppercase tracking-wider text-emerald-600">
          Bangladesh Reseller Platform
        </p>
        <h1 className="mt-4 max-w-3xl text-5xl font-bold tracking-tight text-slate-900">
          আপনার পণ্য। তাদের বিক্রি। আপনি সব হ্যান্ডেল করুন।
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-slate-600">
          ResellBD lets resellers browse your catalog, add products to their shop,
          create orders with Pathao delivery, earn profit on delivery, and withdraw
          via bKash payment requests.
        </p>
        <div className="mt-10 flex flex-wrap gap-4">
          <Link href="/register" className="btn-primary px-6 py-3 text-base">
            Reseller হিসেবে জয়েন
          </Link>
          <Link href="/login" className="btn-secondary px-6 py-3 text-base">
            Login
          </Link>
        </div>
        <div className="mt-16 grid gap-4 md:grid-cols-3">
          {[
            ["ক্যাটালগ", "সব পণ্য দামসহ দেখুন"],
            ["আমার শপ", "পছন্দের পণ্য যোগ করুন"],
            ["অর্ডার + ওয়ালেট", "ডেলিভারি হলে প্রফিট, রিটার্নে চার্জ কাটা"],
          ].map(([title, desc]) => (
            <div key={title} className="card">
              <h3 className="font-semibold text-slate-900">{title}</h3>
              <p className="mt-2 text-sm text-slate-600">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
