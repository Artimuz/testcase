import prisma from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { createSession } from "@/lib/auth"

export async function POST(req) {
  try {
    const body = await req.json()
    const { email, password, role } = body

    if (!email || !password || !role) {
      return new Response(JSON.stringify({ error: "Dados incompletos" }), { status: 400 })
    }

    const exists = await prisma.user.findUnique({ where: { email } })
    if (exists) {
      return new Response(JSON.stringify({ error: "Usuário já existe" }), { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role,
      }
    })

  const { cookie } = createSession({ id: user.id, role: user.role, email: user.email, active: user.active })

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Conta criada com sucesso!"
      }), 
      { 
        status: 201,
        headers: {
          "Set-Cookie": cookie,
          "Content-Type": "application/json"
        }
      }
    )

  } catch (error) {
    console.error(error)
    return new Response(JSON.stringify({ error: "Erro no servidor" }), { status: 500 })
  }
}
