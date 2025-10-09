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
    const { id, email, role } = decoded

    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, createdAt: true }
    })

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    }

    let estatisticas = {}

    if (role === "CLIENTE") {
      const orders = await prisma.order.findMany({
        where: { customerId: id },
        include: { items: true }
      })

      const favoritos = await prisma.favorite.findMany({
        where: { userId: id }
      })

      const carrinho = await prisma.cartItem.findMany({
        where: { cart: { userId: id } }
      })

      const totalPedidos = orders.length
      const totalGasto = orders.reduce(
        (sum, o) => sum + o.items.reduce((s, i) => s + i.price * i.quantity, 0),
        0
      )
      const totalFavoritos = favoritos.length
      const itensCarrinho = carrinho.reduce((sum, item) => sum + item.quantity, 0)

      estatisticas = { totalPedidos, totalGasto, totalFavoritos, itensCarrinho }
    } else if (role === "VENDEDOR") {
      // Only count products, don't fetch all data
      const totalProdutos = await prisma.product.count({
        where: { sellerId: id }
      })

      const orderItems = await prisma.orderItem.findMany({
        where: { product: { sellerId: id } },
        include: { product: true }
      })
      const totalVendas = orderItems.reduce((sum, i) => sum + i.quantity, 0)
      const receitaTotal = orderItems.reduce((sum, i) => sum + i.price * i.quantity, 0)

      const produtosAgrupados = {}
      for (const item of orderItems) {
        const produtoId = item.product.id
        const produtoNome = item.product.name
        
        if (!produtosAgrupados[produtoId]) {
          produtosAgrupados[produtoId] = {
            name: produtoNome,
            quantidade: 0
          }
        }
        produtosAgrupados[produtoId].quantidade += item.quantity
      }

      let produtoMaisVendido = null
      if (Object.keys(produtosAgrupados).length > 0) {
        const produtoIdMaisVendido = Object.keys(produtosAgrupados).reduce((a, b) =>
          produtosAgrupados[a].quantidade > produtosAgrupados[b].quantidade ? a : b
        )
        produtoMaisVendido = {
          name: produtosAgrupados[produtoIdMaisVendido].name,
          quantidade: produtosAgrupados[produtoIdMaisVendido].quantidade
        }
      }

      estatisticas = { totalProdutos, totalVendas, receitaTotal, produtoMaisVendido }
    }

    return NextResponse.json({ user, role, estatisticas })
  } catch (error) {
    console.error("Erro na rota /api/dashboard/data:", error)
    return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 })
  }
}
