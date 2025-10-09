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

    const { name, price, description, quantity, urlImagem } = await req.json()
    console.log(req.json())

    if (!name || !price || !description || !quantity || !urlImagem)
        return NextResponse.json({ error: "Campos obrigatórios ausentes" }, { status: 400 })

    const novoProduto = await prisma.product.create({
      data: {
        name: name.trim(),
        description: description.trim(),
        price: parseFloat(price.toFixed(2)),
        quantity: parseInt(quantity),
        imageUrl: urlImagem.trim(),
        sellerId: decoded.id,
      },
    })

    return NextResponse.json({ success: true, produto: novoProduto })
  } catch (error) {
    console.error("Erro ao cadastrar produto:", error)
    return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 })
  }
}