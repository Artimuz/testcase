import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { validateAuth } from "@/lib/auth"

const prisma = new PrismaClient()

export async function GET(req) {
  try {
    const authResult = await validateAuth()
    if (!authResult.success) {
      return authResult.response
    }

    const decoded = authResult.user
    
    const url = new URL(req.url)
    const page = parseInt(url.searchParams.get("page")) || 1
    const limit = parseInt(url.searchParams.get("limit")) || 10
    const skip = (page - 1) * limit

    const totalOrders = await prisma.order.count({
      where: { customerId: decoded.id }
    })
    const totalPages = Math.ceil(totalOrders / limit)

    const orders = await prisma.order.findMany({
      where: { customerId: decoded.id },
      include: {
        items: {
          include: {
            product: {
              include: { seller: true }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit
    })

    return NextResponse.json({
      orders,
      totalPages
    })
  } catch (error) {
    console.error("Erro ao listar ordens:", error)
    return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 })
  }
}
