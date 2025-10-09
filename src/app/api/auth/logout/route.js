import { cookies } from "next/headers"

export async function POST() {

  const cookieStore = await cookies()

  cookieStore.set({
    name: "token",
    value: "",
    path: "/",
    httpOnly: true,
    maxAge: 0,
    sameSite: "strict",
    secure: true,
  })

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  })
}
