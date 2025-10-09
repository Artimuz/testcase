import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { validateAuth } from "@/lib/auth"

const prisma = new PrismaClient()

export async function POST() {
  try {
    const authResult = await validateAuth()
    if (!authResult.success) {
      return authResult.response
    }

    const decoded = authResult.user
    const userId = decoded.id


    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: { items: { include: { product: true } } }
    })

    if (!cart || cart.items.length === 0)
      return NextResponse.json({ error: "Carrinho vazio" }, { status: 400 })

    let total = 0
    const orderItemsData = []

    for (const item of cart.items) {
      const produto = item.product

      if (item.quantity > produto.quantity)
        return NextResponse.json({
          error: `Produto ${produto.name} sem estoque suficiente`
        }, { status: 400 })

      total += produto.price * item.quantity

      orderItemsData.push({
        productId: produto.id,
        quantity: item.quantity,
        price: produto.price
      })
    }

    const order = await prisma.order.create({
      data: {
        customerId: userId,
        total,
        status: "COMPLETED",
        items: {
          create: orderItemsData
        }
      },
      include: { items: true }
    })

    for (const item of cart.items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: { quantity: item.product.quantity - item.quantity }
      })
    }

 
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } })

    return NextResponse.json({ success: true, order })
  } catch (error) {
    console.error("Erro ao finalizar pedido:", error)
    return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 })
  }
}
