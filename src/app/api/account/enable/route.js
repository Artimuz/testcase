import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { validateAuth } from "@/lib/auth"

const prisma = new PrismaClient()

export async function POST(req) {
  try {
    const authResult = await validateAuth({ allowedRoles: ["VENDEDOR"] })
    if (!authResult.success) {
      return authResult.response
    }

    const decoded = authResult.user
    const { id, role } = decoded

    const user = await prisma.user.findUnique({ where: { id } })
    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    }

    await prisma.product.updateMany({
      where: { sellerId: id, quantity: { gt: 0 } },
      data: { active: true }
    })

    await prisma.user.update({
      where: { id },
      data: { active: true }
    })

    return NextResponse.json({
      message: "Conta e produtos ativados com sucesso.",
      success: true
    })
  } catch (error) {
    console.error("Erro ao ativar conta:", error)
    return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 })
  }
}