import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { validateAuth } from "@/lib/auth"

const prisma = new PrismaClient()

export async function GET() {
  try {
    const authResult = await validateAuth()
    if (!authResult.success) {
      return authResult.response
    }

    const decoded = authResult.user

    let cart = await prisma.cart.findUnique({
      where: { userId: decoded.id },
      include: {
        items: {
          include: {
            product: {
              include: {
                seller: true
              }
            }
          }
        }
      }
    })

    if (!cart) {
      cart = await prisma.cart.create({ data: { userId: decoded.id } })
    }

    const itensComEstoque = []
    for (const item of cart.items) {
      if (item.product.quantity > 0 && item.product.active == true) {
        itensComEstoque.push(item)
      } else {
        await prisma.cartItem.delete({ where: { id: item.id } })
      }
    }

    return NextResponse.json({
      items: itensComEstoque.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        product: {
          id: item.product.id,
          name: item.product.name,
          price: item.product.price,
          quantity: item.product.quantity,
          imageUrl: item.product.imageUrl,
          sellerEmail: item.product.seller.email,
        }
      })),
      role: decoded.role
    })
  } catch (error) {
    console.error("Erro ao listar carrinho:", error)
    return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 })
  }
}