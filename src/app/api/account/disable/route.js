import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { validateAuth } from "@/lib/auth"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

export async function POST(req) {
  try {
    const authResult = await validateAuth({ allowedRoles: ["VENDEDOR"] })
    if (!authResult.success) {
      return authResult.response
    }

    const decoded = authResult.user
    const { id, email, role } = decoded

    const body = await req.json()
    const { senha } = body
    if (!senha) {
      return NextResponse.json({ error: "Senha é obrigatória" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { id } })
    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    }

    const senhaValida = await bcrypt.compare(senha, user.password)
    if (!senhaValida) {
      return NextResponse.json({ error: "Senha incorreta" }, { status: 401 })
    }

    await prisma.product.updateMany({
      where: { sellerId: id },
      data: { active: false }
    })

    await prisma.user.update({
      where: { id },
      data: { active: false }
    })

    return NextResponse.json({
      message: "Conta e produtos desativados com sucesso.",
      redirect: "/api/auth/logout"
    })
  } catch (error) {
    console.error("Erro ao desativar conta:", error)
    return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 })
  }
}
