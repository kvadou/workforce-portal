import { NextRequest, NextResponse } from "next/server";
import { verifyCertificate } from "@/lib/certificate-generator";

// GET /api/certificates/verify?number=XXX - Verify a certificate (public)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const certificateNumber = searchParams.get("number");

    if (!certificateNumber) {
      return NextResponse.json(
        { error: "Certificate number is required" },
        { status: 400 }
      );
    }

    const result = await verifyCertificate(certificateNumber);

    if (!result) {
      return NextResponse.json(
        { error: "Failed to verify certificate" },
        { status: 500 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to verify certificate:", error);
    return NextResponse.json(
      { error: "Failed to verify certificate" },
      { status: 500 }
    );
  }
}
