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

    const { products } = await req.json()
    if (!Array.isArray(products) || products.length === 0)
      return NextResponse.json({ error: "Nenhum produto recebido" }, { status: 400 })

    const produtosValidos = products
      .filter(p =>
        p.name && p.price && p.description && p.quantity !== undefined && p.imageUrl
      )
      .map(p => ({
        name: String(p.name).trim(),
        description: String(p.description).trim(),
        price: parseFloat(p.price.toFixed(2)),
        quantity: parseInt(p.quantity),
        imageUrl: String(p.imageUrl).trim(),
        sellerId: decoded.id,
      }))

    if (produtosValidos.length === 0)
      return NextResponse.json({ error: "Nenhum produto válido encontrado" }, { status: 400 })

    const resultado = await prisma.product.createMany({
      data: produtosValidos,
    })

    return NextResponse.json({
      success: true,
      insertedCount: resultado.count,
    })
  } catch (error) {
    console.error("Erro no upload em massa:", error)
    return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 })
  }
}
