"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"

export default function Home() {
  const router = useRouter()
  const { isAuthenticated, loading } = useAuth()

  useEffect(() => {
    if (!loading) {
      if (isAuthenticated) {
        router.replace("/products")
      } else {
        router.replace("/login")
      }
    }
  }, [isAuthenticated, loading, router])

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading">
          <div className="text-center">
            <div className="heading-3">Carregando...</div>
            <p className="text-body">Verificando autenticação...</p>
          </div>
        </div>
      </div>
    )
  }

  return null
}
