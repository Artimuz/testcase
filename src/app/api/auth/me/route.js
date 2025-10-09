import { validateAuth } from "@/lib/auth"

export async function GET() {
  try {
    const authResult = await validateAuth({ checkUserExists: true })
    if (!authResult.success) {
      return new Response(JSON.stringify({ error: authResult.error }), { 
        status: authResult.response.status 
      })
    }

    const user = authResult.user

    return new Response(
      JSON.stringify({
        success: true,
        user,
      }),
      { status: 200 }
    )
  } catch (err) {
    console.error("Erro inesperado ao validar token:", err)
    return new Response(JSON.stringify({ error: "Erro interno" }), { status: 500 })
  }
}