# ফোন থেকে Live Deploy (Vercel)

## কেন 404 দেখাচ্ছিল?

Vercel `main` branch deploy করেছিল, কিন্তু app ছিল অন্য branch-এ।  
এখন `main`-এ merge করা হয়েছে।

---

## ধাপ ১ — Vercel-এ Redeploy

1. ফোনে https://vercel.com/dashboard খুলুন
2. **filo-nine** project-এ যান
3. **Deployments** → সবচেয়ে নতুন deployment
4. যদি fail হয় → **Settings** → **Git** → Production Branch = `main` নিশ্চিত করুন
5. **Redeploy** চাপুন

অথবা **Settings → Git → Redeploy**

---

## ধাপ ২ — Environment Variables (জরুরি)

Vercel → Project → **Settings** → **Environment Variables**

| Name | Value |
|------|-------|
| `JWT_SECRET` | যেকোনো লম্বা random string (যেমন: `mysecret123456789`) |
| `TURSO_DATABASE_URL` | Turso থেকে (নিচে দেখুন) |
| `TURSO_AUTH_TOKEN` | Turso থেকে |

**Save** করার পর **Redeploy** দিন।

---

## ধাপ ৩ — Free Database (Turso) — ফোন থেকে

1. https://turso.tech → Sign up
2. **Create Database** → নাম দিন `resellbd`
3. Database → **Connect** → copy:
   - `TURSO_DATABASE_URL` (libsql://...)
   - `TURSO_AUTH_TOKEN`
4. Vercel-এ paste করুন (ধাপ ২)

---

## ধাপ ৪ — Demo data (প্রথমবার)

Deploy সফল হলে browser-এ খুলুন:

```
https://filo-nine.vercel.app
```

Login:
- Admin: `admin@resellbd.com` / `admin123`
- Reseller: `reseller@demo.com` / `reseller123`

> প্রথম deploy-এ database খালি থাকতে পারে।  
> Turso dashboard → SQL → seed manually অথবা PC থেকে `npm run db:seed` চালান।

---

## ঠিকানা

```
https://filo-nine.vercel.app
```

Redeploy + env vars সেট করার পর 404 চলে যাবে।
