import prisma from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { createSession } from "@/lib/auth"

export async function POST(req) {
  try {
    console.log("=== VERCEL DEBUG LOGIN START ===")
    console.log("Environment:", process.env.NODE_ENV)
    console.log("Vercel:", !!process.env.VERCEL)
    console.log("Request URL:", req.url)
    console.log("Request method:", req.method)
    
    console.log("1. Parsing request body...")
    const body = await req.json()
    console.log("1. ✓ Body parsed:", { hasEmail: !!body.email, hasPassword: !!body.password })
    
    const { email, password } = body
    console.log("1. ✓ Extracted - Email:", email, "Password length:", password?.length)

    if (!email || !password) {
      console.log("1. ❌ Missing data - Email:", !!email, "Password:", !!password)
      return new Response(JSON.stringify({ error: "Dados incompletos" }), { status: 400 })
    }

    console.log("2. Environment variables check...")
    console.log("2. DATABASE_URL exists:", !!process.env.DATABASE_URL)
    console.log("2. JWT_SECRET exists:", !!process.env.JWT_SECRET)
    console.log("2. JWT_SECRET length:", process.env.JWT_SECRET?.length)

    console.log("3. Looking up user in database...")
    console.log("3. Email to search:", email)
    
    const user = await prisma.user.findUnique({ where: { email } })
    console.log("3. Database query result:", user ? "USER FOUND" : "USER NOT FOUND")
    
    if (!user) {
      console.log("3. ❌ User not found for email:", email)
      return new Response(JSON.stringify({ error: "Usuário não encontrado" }), { status: 404 })
    }

    console.log("3. ✓ User found:")
    console.log("   - ID:", user.id)
    console.log("   - Email:", user.email)
    console.log("   - Role:", user.role)
    console.log("   - Active:", user.active)
    console.log("   - Password hash exists:", !!user.password)
    console.log("   - Password hash length:", user.password?.length)

    console.log("4. Comparing passwords...")
    console.log("4. Input password:", password)
    console.log("4. Stored hash (first 30 chars):", user.password?.substring(0, 30) + "...")
    
    const passwordMatch = await bcrypt.compare(password, user.password)
    console.log("4. Password comparison result:", passwordMatch)
    
    if (!passwordMatch) {
      console.log("4. ❌ Password mismatch")
      return new Response(JSON.stringify({ error: "Senha incorreta" }), { status: 401 })
    }

    console.log("4. ✓ Password matches!")

    console.log("5. Creating session...")
    const sessionPayload = { id: user.id, role: user.role, email: user.email, active: user.active }
    console.log("5. Session payload:", sessionPayload)
    
    console.log("5. Calling createSession...")
    const sessionResult = createSession(sessionPayload)
    console.log("5. Session result type:", typeof sessionResult)
    console.log("5. Session result keys:", Object.keys(sessionResult || {}))
    
    const { cookie } = sessionResult
    console.log("5. ✓ Cookie extracted:", !!cookie)
    console.log("5. Cookie length:", cookie?.length)
    console.log("5. Cookie preview:", cookie?.substring(0, 50) + "...")

    console.log("6. Preparing response...")
    const responseData = {
      success: true,
      user: {
        id: user.id,
        role: user.role,
        email: user.email,
        active: user.active
      }
    }
    console.log("6. Response data:", responseData)

    console.log("6. Creating Response object...")
    const response = new Response(
      JSON.stringify(responseData),
      {
        status: 200,
        headers: {
          "Set-Cookie": cookie,
          "Content-Type": "application/json"
        }
      }
    )
    
    console.log("6. ✓ Response created successfully")
    console.log("=== VERCEL DEBUG LOGIN SUCCESS ===")
    
    return response

  } catch (error) {
    console.error("=== VERCEL DEBUG LOGIN ERROR ===")
    console.error("Error type:", error.constructor.name)
    console.error("Error message:", error.message)
    console.error("Error stack:", error.stack)
    console.error("Environment:", process.env.NODE_ENV)
    console.error("Vercel:", !!process.env.VERCEL)
    console.error("DATABASE_URL exists:", !!process.env.DATABASE_URL)
    console.error("JWT_SECRET exists:", !!process.env.JWT_SECRET)
    console.error("=== VERCEL DEBUG LOGIN ERROR END ===")
    return new Response(JSON.stringify({ 
      error: "Erro no servidor",
      debug: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }), { status: 500 })
  }
}
