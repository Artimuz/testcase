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
    const busca = (searchParams.get("busca") || "").trim()
    const ordem = searchParams.get("ordem") || "novos"

    const cookieStore = await cookies()
    const token = cookieStore.get("token")?.value

    let userId = null
    let role = null
    let email = null

    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET)
        userId = decoded?.user?.id ?? decoded?.id ?? null
        role = decoded?.user?.role ?? decoded?.role ?? null
        email = decoded?.user?.email ?? decoded?.email ?? null
      } catch (err) {
        console.warn("JWT inválido em /api/products/list:", err.message || err)
      }
    }

    const where = {
      quantity: { gt: 0 },
      active: true,
    }

    if (busca) {
      where.OR = [
        { name: { contains: busca, mode: "insensitive" } },
        { description: { contains: busca, mode: "insensitive" } },
      ]
    }

    if (role === "VENDEDOR" && userId) {
      where.sellerId = userId
    }

    const orderBy =
      ordem === "antigos"
        ? { publishedAt: "asc" }
        : ordem === "maior_preco"
        ? { price: "desc" }
        : ordem === "menor_preco"
        ? { price: "asc" }
        : { publishedAt: "desc" }

    // Get total count for pagination
    const totalProdutos = await prisma.product.count({ where })
    const totalPaginas = Math.max(1, Math.ceil(totalProdutos / limit))
    
    // Calculate skip for pagination
    const skip = (page - 1) * limit

    const produtos = await prisma.product.findMany({
      where,
      include: {
        seller: { select: { email: true } },
        favorites: userId ? { where: { userId } } : false,
      },
      orderBy,
      skip,
      take: limit,
    })

    const produtosComFlag = produtos.map((p) => ({
      ...p,
      sellerEmail: p.seller?.email ?? null,
      isFavorite: Array.isArray(p.favorites) && p.favorites.length > 0,
    }))

    // Sort favorites first within the current page
    const favoritos = produtosComFlag.filter((p) => p.isFavorite)
    const naoFavoritos = produtosComFlag.filter((p) => !p.isFavorite)
    const produtosPagina = [...favoritos, ...naoFavoritos]

    return NextResponse.json({
      produtos: produtosPagina,
      totalPaginas,
      role: role ?? (userId ? "CLIENTE" : "VISITANTE"),
      email,
    })
  } catch (error) {
    console.error("Erro ao listar produtos:", error)
    return NextResponse.json({ error: "Erro ao listar produtos" }, { status: 500 })
  }
}
