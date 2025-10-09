import { NextResponse } from "next/server"
import { PrismaClient, Prisma } from "@prisma/client"
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

    const baseOrderBy =
      ordem === "antigos"
        ? { publishedAt: "asc" }
        : ordem === "maior_preco"
        ? { price: "desc" }
        : ordem === "menor_preco"
        ? { price: "asc" }
        : { publishedAt: "desc" }

    const totalProdutos = await prisma.product.count({ where })
    const totalPaginas = Math.max(1, Math.ceil(totalProdutos / limit))
    
    const skip = (page - 1) * limit

    let produtos = []

    if (userId) {
      const favoriteIds = await prisma.favorite.findMany({
        where: { userId },
        select: { productId: true }
      })
      const favoriteProductIds = favoriteIds.map(f => f.productId)

      const favoriteWhere = {
        ...where,
        id: { in: favoriteProductIds }
      }

      const nonFavoriteWhere = {
        ...where,
        id: { notIn: favoriteProductIds }
      }

      let favoriteProducts = []
      let nonFavoriteProducts = []
      let remainingLimit = limit
      let remainingSkip = skip

      if (remainingSkip < favoriteProductIds.length) {
        const favSkip = remainingSkip
        const favTake = Math.min(remainingLimit, favoriteProductIds.length - remainingSkip)
        
        if (favTake > 0) {
          favoriteProducts = await prisma.product.findMany({
            where: favoriteWhere,
            include: {
              seller: { select: { email: true } },
            },
            orderBy: baseOrderBy,
            skip: favSkip,
            take: favTake,
          })
          remainingLimit -= favoriteProducts.length
          remainingSkip = 0
        }
      } else {
        remainingSkip -= favoriteProductIds.length
      }

      if (remainingLimit > 0) {
        nonFavoriteProducts = await prisma.product.findMany({
          where: nonFavoriteWhere,
          include: {
            seller: { select: { email: true } },
          },
          orderBy: baseOrderBy,
          skip: remainingSkip,
          take: remainingLimit,
        })
      }

      const allProducts = [...favoriteProducts, ...nonFavoriteProducts]
      
      produtos = allProducts.map((p) => ({
        ...p,
        sellerEmail: p.seller?.email ?? null,
        isFavorite: favoriteProductIds.includes(p.id),
      }))
    } else {
      const produtosRaw = await prisma.product.findMany({
        where,
        include: {
          seller: { select: { email: true } },
        },
        orderBy: baseOrderBy,
        skip,
        take: limit,
      })

      produtos = produtosRaw.map((p) => ({
        ...p,
        sellerEmail: p.seller?.email ?? null,
        isFavorite: false,
      }))
    }

    const produtosPagina = produtos

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
