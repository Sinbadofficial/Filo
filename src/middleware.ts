import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || "dev-secret-change-in-production"
);

async function getUser(request: NextRequest) {
  const token = request.cookies.get("reseller_session")?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as { role?: string };
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const user = await getUser(request);

  const isAuthPage = pathname === "/login" || pathname === "/register";
  const isAdmin = pathname.startsWith("/admin");
  const isDashboard = pathname.startsWith("/dashboard");

  if ((isDashboard || isAdmin) && !user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isAdmin && user?.role !== "SUPER_ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (isDashboard && user?.role === "SUPER_ADMIN") {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  if (isAuthPage && user) {
    const dest = user.role === "SUPER_ADMIN" ? "/admin" : "/dashboard";
    return NextResponse.redirect(new URL(dest, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/login", "/register"],
};
