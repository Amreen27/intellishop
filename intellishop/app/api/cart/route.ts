import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ message: "Cart API" });
}

export async function POST() {
  return NextResponse.json({ message: "Cart API POST" });
}
