import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { validateAuth } from "@/lib/auth"

const prisma = new PrismaClient()

export async function POST(req) {
  try {
    const authResult = await validateAuth()
    if (!authResult.success) {
      return authResult.response
    }

    const decoded = authResult.user
    const { productId } = await req.json()
    if (!productId) return NextResponse.json({ error: "ID do produto ausente" }, { status: 400 })

    const cart = await prisma.cart.findUnique({ where: { userId: decoded.id } })
    if (!cart) return NextResponse.json({ error: "Carrinho não encontrado" }, { status: 404 })

    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id, productId }
    })

    return NextResponse.json({ success: true, message: "Item removido do carrinho" })
  } catch (error) {
    console.error("Erro ao remover item do carrinho:", error)
    return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 })
  }
}