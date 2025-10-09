import prisma from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { validateAuth } from "@/lib/auth"

const USER_REMOVED_KEY = process.env.USER_REMOVED_KEY

export async function POST(req) {
  try {
    const body = await req.json()
    const { senha } = body

    if (!senha) {
      return new Response(
        JSON.stringify({ error: "Senha é obrigatória" }),
        { status: 400 }
      )
    }

    const authResult = await validateAuth()
    if (!authResult.success) {
      return new Response(
        JSON.stringify({ error: authResult.error }),
        { status: authResult.response.status }
      )
    }

    const decoded = authResult.user
    const { id, email, role } = decoded

    const user = await prisma.user.findUnique({ where: { id } })
    if (!user) {
      return new Response(
        JSON.stringify({ error: "Usuário não encontrado" }),
        { status: 404 }
      )
    }

    const senhaValida = await bcrypt.compare(senha, user.password)
    if (!senhaValida) {
      return new Response(
        JSON.stringify({ error: "Senha incorreta" }),
        { status: 401 }
      )
    }

    const newPasswordHash = await bcrypt.hash(USER_REMOVED_KEY, 10)
    const newEmail = `${user.email}@DeletedUser`

    await prisma.user.update({
      where: { id: user.id },
      data: {
        active: false,
        email: newEmail,
        password: newPasswordHash
      }
    })

    return new Response(
      JSON.stringify({
        success: true,
        message: "Conta deletada/desativada com sucesso."
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    )
  } catch (error) {
    console.error("Erro ao deletar conta:", error)
    return new Response(
      JSON.stringify({ error: "Erro no servidor" }),
      { status: 500 }
    )
  }
}