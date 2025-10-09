import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { PrismaClient } from "@prisma/client"

const JWT_SECRET = process.env.JWT_SECRET || "default_secret_key_1234567890"
const prisma = new PrismaClient()

export function createSession(payload) {
  console.log("=== VERCEL DEBUG CREATE SESSION START ===")
  console.log("Environment:", process.env.NODE_ENV)
  console.log("Vercel:", !!process.env.VERCEL)
  console.log("Input payload:", payload)
  
  const expiresInSeconds = 3600 // 1 hour
  console.log("Expires in seconds:", expiresInSeconds)

  console.log("Checking JWT_SECRET...")
  console.log("JWT_SECRET exists:", !!JWT_SECRET)
  console.log("JWT_SECRET type:", typeof JWT_SECRET)
  console.log("JWT_SECRET length:", JWT_SECRET?.length)
  console.log("process.env.JWT_SECRET exists:", !!process.env.JWT_SECRET)
  console.log("process.env.JWT_SECRET length:", process.env.JWT_SECRET?.length)
  
  if (!JWT_SECRET) {
    console.error("❌ JWT_SECRET not configured")
    console.error("Available env vars:", Object.keys(process.env).filter(key => key.includes('JWT')))
    throw new Error("JWT_SECRET not configured")
  }
  console.log("✓ JWT_SECRET is available")

  console.log("Signing JWT token...")
  try {
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: `${expiresInSeconds}s` })
    console.log("✓ JWT token created successfully")
    console.log("Token length:", token.length)
    console.log("Token preview:", token.substring(0, 50) + "...")
    
    console.log("Creating cookie...")
    const cookie = `token=${token}; HttpOnly; Path=/; Max-Age=${expiresInSeconds}; SameSite=Strict; Secure`
    console.log("✓ Cookie created successfully")
    console.log("Cookie length:", cookie.length)
    console.log("Cookie preview:", cookie.substring(0, 100) + "...")

    const result = { token, cookie }
    console.log("✓ Session creation complete")
    console.log("Result keys:", Object.keys(result))
    console.log("=== VERCEL DEBUG CREATE SESSION SUCCESS ===")
    
    return result
  } catch (jwtError) {
    console.error("❌ JWT signing failed")
    console.error("JWT Error type:", jwtError.constructor.name)
    console.error("JWT Error message:", jwtError.message)
    console.error("JWT Error stack:", jwtError.stack)
    console.error("Payload used:", payload)
    console.error("JWT_SECRET used length:", JWT_SECRET?.length)
    throw jwtError
  }
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