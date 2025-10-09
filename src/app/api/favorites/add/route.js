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
    if (!productId)
      return NextResponse.json({ error: "ID do produto ausente" }, { status: 400 })

    const favorite = await prisma.favorite.findFirst({
      where: { userId: decoded.id, productId },
    })

    if (!favorite) {
      await prisma.favorite.create({
        data: { userId: decoded.id, productId },
      })
    }

    return NextResponse.json({
      success: true,
      message: "Adicionado aos favoritos",
    })
  } catch (error) {
    console.error("Erro ao adicionar favorito:", error)
    return NextResponse.json(
      { error: "Erro interno no servidor" },
      { status: 500 }
    )
  }
}
