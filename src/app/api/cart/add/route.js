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
    const { productId, quantity = 1 } = await req.json()
    if (!productId)
      return NextResponse.json({ error: "ID do produto ausente" }, { status: 400 })

    const product = await prisma.product.findUnique({ where: { id: productId } })
    if (!product)
      return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 })

    if (quantity > product.quantity)
      return NextResponse.json({ error: "Quantidade solicitada maior que o estoque" }, { status: 400 })

    let cart = await prisma.cart.findUnique({ where: { userId: decoded.id } })
    if (!cart) {
      cart = await prisma.cart.create({ data: { userId: decoded.id } })
    }

    const cartItem = await prisma.cartItem.findFirst({
      where: { cartId: cart.id, productId }
    })

    if (cartItem) {
      await prisma.cartItem.update({
        where: { id: cartItem.id },
        data: { quantity },
      })
    } else {
      await prisma.cartItem.create({
        data: { cartId: cart.id, productId, quantity },
      })
    }

    return NextResponse.json({ success: true, message: "Produto adicionado ao carrinho" })
  } catch (error) {
    console.error("Erro ao adicionar ao carrinho:", error)
    return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 })
  }
}
