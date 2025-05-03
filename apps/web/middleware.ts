import { NextResponse, type NextRequest } from "next/server";

// Define allowed origins for your Expo app and web app
const allowedOrigins = [
  // Web app origins
  "https://neb-starter.vercel.app",
  "https://neb-starter.vercel.app/api/auth",
  // Expo app schemes and origins
  "mobile://",
  "exp+mobile://",
  "exp+mobile://expo-development-client",
  // Development origins - will be filtered out in production
  process.env.NODE_ENV === "development" && "http://localhost:3000",
  process.env.NODE_ENV === "development" && "http://192.168.1.84:3000",
  process.env.NODE_ENV === "development" && "http://192.168.1.84:8081",
].filter(Boolean);

// CORS headers to apply
const corsHeaders = {
  "Access-Control-Allow-Credentials": "true",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-CSRF-Token, Cookie, X-Requested-With, Accept, Origin",
  "Access-Control-Max-Age": "86400",
  Vary: "Origin",
};

export async function middleware(request: NextRequest) {
  const origin = request.headers.get("origin");

  // Handle CORS preflight OPTIONS requests
  if (request.method === "OPTIONS" && origin && allowedOrigins.includes(origin)) {
    return new NextResponse(null, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Access-Control-Allow-Origin": origin,
      },
    });
  }

  // For regular requests, proceed with normal flow
  const response = NextResponse.next();

  // Add CORS headers to the response if origin is allowed
  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin);

    // Apply all CORS headers
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
  }

  return response;
}

// Matcher configuration
export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
