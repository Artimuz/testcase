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

    if (favorite) {
      await prisma.favorite.delete({
        where: { id: favorite.id },
      })
    }

    return NextResponse.json({
      success: true,
      message: "Removido dos favoritos",
    })
  } catch (error) {
    console.error("Erro ao remover favorito:", error)
    return NextResponse.json(
      { error: "Erro interno no servidor" },
      { status: 500 }
    )
  }
}
