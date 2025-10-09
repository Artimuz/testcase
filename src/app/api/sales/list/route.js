import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { cookies } from "next/headers"
import jwt from "jsonwebtoken"

const prisma = new PrismaClient()
const JWT_SECRET = process.env.JWT_SECRET

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get("page")) || 1
    const limit = parseInt(searchParams.get("limit")) || 20

    const cookieStore = await cookies()
    const token = cookieStore.get("token")?.value

    if (!token) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

    let decoded
    try {
      decoded = jwt.verify(token, JWT_SECRET)
    } catch (err) {
      console.warn("JWT inválido em /api/sales/list:", err.message || err)
      return NextResponse.json({ error: "Token inválido" }, { status: 401 })
    }

    const userId = decoded?.id ?? decoded?.user?.id
    if (!userId) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 401 })

    const totalSales = await prisma.order.count({
      where: {
        items: {
          some: {
            product: { sellerId: userId },
          },
        },
      },
    })

    const totalPages = Math.max(1, Math.ceil(totalSales / limit))

    const orders = await prisma.order.findMany({
      where: {
        items: {
          some: { product: { sellerId: userId } },
        },
      },
      include: {
        customer: { select: { email: true } },
        items: {
          include: {
            product: { select: { name: true, sellerId: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    })

    const sales = orders.map(order => ({
      ...order,
      items: order.items.filter(item => item.product.sellerId === userId),
    }))

    return NextResponse.json({ sales, totalPages })
  } catch (error) {
    console.error("Erro ao listar vendas:", error)
    return NextResponse.json({ error: "Erro ao listar vendas" }, { status: 500 })
  }
}
