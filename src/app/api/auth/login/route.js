import prisma from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { createSession } from "@/lib/auth"

export async function POST(req) {
  try {
    const body = await req.json()
    const { email, password } = body

    if (!email || !password) {
      return new Response(JSON.stringify({ error: "Dados incompletos" }), { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return new Response(JSON.stringify({ error: "Usuário não encontrado" }), { status: 404 })
    }

    const passwordMatch = await bcrypt.compare(password, user.password)
    if (!passwordMatch) {
      return new Response(JSON.stringify({ error: "Senha incorreta" }), { status: 401 })
    }

  const { cookie } = createSession({ id: user.id, role: user.role, email: user.email, active: user.active })

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: user.id,
          role: user.role,
          email: user.email,
          active: user.active
        }
      }),
      {
        status: 200,
        headers: {
          "Set-Cookie": cookie,
          "Content-Type": "application/json"
        }
      }
    )

  } catch (error) {
    console.error("Erro no login:", error)
    return new Response(JSON.stringify({ error: "Erro no servidor" }), { status: 500 })
  }
}
