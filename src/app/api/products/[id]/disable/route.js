import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function PATCH(req, { params }) {
  try {
    const { id } = params

    const product = await prisma.product.findUnique({ where: { id } })
    if (!product)
      return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 })

    await prisma.product.update({
      where: { id },
      data: { quantity: 0, active: false },
    })

    return NextResponse.json({ success: true, message: "Produto desativado (estoque zerado)" })
  } catch (error) {
    console.error("Erro ao desativar produto:", error)
    return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 })
  }
}
