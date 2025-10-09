"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth, withAuth } from "@/contexts/AuthContext"

function EnableAccountPage() {
  const router = useRouter()
  const { user, updateUser } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [reativando, setReativando] = useState(false)

  useEffect(() => {
    if (user) {
      setLoading(false)
      if (user.active) {
        router.replace("/products")
      }
    }
  }, [user, router])

  async function handleReativarConta() {
    if (!user) return
    setReativando(true)
    setError(null)
    
    try {
      const res = await fetch("/api/account/enable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      })
      const json = await res.json()
      
      if (!res.ok) {
        setError(json.error || "Erro ao reativar conta")
      } else {
        updateUser({ active: true })
        router.push("/products")
      }
    } catch (err) {
      console.error("Erro ao reativar conta:", err)
      setError("Erro de rede ao reativar conta")
    } finally {
      setReativando(false)
    }
  }

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading">
          <div className="text-center">
            <div className="heading-3">Carregando informações...</div>
            <p className="text-body">Verificando status da conta...</p>
          </div>
        </div>
      </div>
    )
  }

  if (user?.active) {
    return null
  }

  return (
    <div className="page-container">
      <div className="fade-in">
        <div className="mb-6">
          <h1 className="heading-1">Reativar Conta</h1>
          <p className="text-body">Sua conta está desabilitada. Você pode reativá-la aqui.</p>
        </div>

        {error && (
          <div className="error-message mb-6">
            {error}
          </div>
        )}

        <div className="card">
          <div className="card__header">
            <h2 className="card__title">Informações da Conta</h2>
          </div>
          <div className="card__content">
            <div className="space-y-4">
              <div>
                <h4 className="heading-4">E-mail</h4>
                <p className="text-body">{user?.email}</p>
              </div>

              <div>
                <h4 className="heading-4">Status da Conta</h4>
                <p className="text-body">
                  <span className="px-2 py-1 rounded text-xs font-semibold bg-red-900 text-red-100">
                    Conta Inativa
                  </span>
                </p>
              </div>

              <div>
                <h4 className="heading-4">Tipo de Conta</h4>
                <p className="text-body">
                  {user?.role === "CLIENTE" ? "Cliente" : "Vendedor"}
                </p>
              </div>

              <div className="border-t pt-6 mt-6" style={{ borderColor: "var(--border-primary)" }}>
                <h4 className="heading-4">Reativar Conta</h4>
                <p className="text-body mb-4">
                  {user?.role === "VENDEDOR" 
                    ? "Reativando sua conta, todos os seus produtos voltarão a ficar visíveis para os clientes."
                    : "Reative sua conta para continuar comprando em nossa plataforma."
                  }
                </p>
                
                <button
                  className="btn btn--success"
                  onClick={handleReativarConta}
                  disabled={reativando}
                >
                  {reativando ? "Reativando..." : "Reativar Minha Conta"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default withAuth(EnableAccountPage, {
  allowedRoles: ["VENDEDOR"],
  requireActive: false
})