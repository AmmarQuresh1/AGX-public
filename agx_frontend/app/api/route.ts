import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
    const body = await request.text();
    const backendURL = process.env.PYTHON_BACKEND_URL;

    // Get client IP from Next.js (Vercel) edge runtime
    const clientIP = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "";

    const backendRes = await fetch(`${backendURL}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-forwarded-for": clientIP, // Forward the client IP
        },
        body,
    });
    const text = await backendRes.text();
    return new NextResponse(text, {
        status: backendRes.status,
        headers: { "Content-Type": "text/plain" },
    });
}