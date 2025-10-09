import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { PrismaClient } from "@prisma/client"

const JWT_SECRET = process.env.JWT_SECRET
const prisma = new PrismaClient()

export function createSession(payload) {
  const expiresInSeconds = 3600 // 1 hour

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: `${expiresInSeconds}s` })

  const cookie = `token=${token}; HttpOnly; Path=/; Max-Age=${expiresInSeconds}; SameSite=Strict; Secure`

  return { token, cookie }
}

export async function validateAuth(options = {}) {
  try {
    const { allowedRoles = null, checkUserExists = false } = options
    
  const cookieStore = await cookies()
  const token = cookieStore.get("token")?.value
    if (!token) {
      return {
        success: false,
        error: "Token ausente",
        response: NextResponse.json({})
      }
    }

    let decoded
    try {
      decoded = jwt.verify(token, JWT_SECRET)
    } catch (err) {
      return {
        success: false,
        error: "Token inválido ou expirado",
        response: NextResponse.json({ error: "Token inválido ou expirado" }, { status: 401 })
      }
    }

    if (allowedRoles && !allowedRoles.includes(decoded.role)) {
      return {
        success: false,
        error: "Acesso negado",
        response: NextResponse.json({ error: "Acesso negado" }, { status: 403 })
      }
    }

    if (checkUserExists) {
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { id: true, email: true, role: true, active: true },
      })

      if (!user) {
        return {
          success: false,
          error: "Usuário não encontrado",
          response: NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
        }
      }
      
      return {
        success: true,
        user: { ...decoded, active: user.active }
      }
    }

    return {
      success: true,
      user: decoded
    }
  } catch (error) {
    console.error("Erro na validação de autenticação:", error)
    return {
      success: false,
      error: "Erro interno",
      response: NextResponse.json({ error: "Erro interno" }, { status: 500 })
    }
  }
}