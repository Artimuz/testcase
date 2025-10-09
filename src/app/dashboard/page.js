"use client"

import { useState, useEffect } from "react"
import { useAuth, withAuth } from "@/contexts/AuthContext"
import { formatCurrency } from "@/lib/utils"

function DashboardPage() {
  const { user, logout, updateUser } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [statistics, setStatistics] = useState({})
  const [showModal, setShowModal] = useState(false)
  const [password, setPassword] = useState("")
  const [modalLoading, setModalLoading] = useState(false)
  const [modalError, setModalError] = useState(null)

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const res = await fetch("/api/dashboard/data", { cache: "no-store" })
        const json = await res.json()

        if (!res.ok) {
          console.error("Dashboard loading error:", json)
          setError("Falha ao carregar informações do dashboard.")
          return
        }

        setStatistics(json.estatisticas || {})
      } catch (e) {
        console.error("Dashboard error:", e)
        setError("Erro ao buscar dados do dashboard.")
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [])

  const getRoleDisplayName = (role) => {
    return role === "CLIENTE" ? "Cliente" : "Vendedor"
  }

  const getActionButtonText = (role) => {
    return role === "CLIENTE" ? "Excluir Conta" : "Desativar conta"
  }

  const getActionDescription = (role) => {
    if (role === "CLIENTE") {
      return "Isso irá excluir permanentemente sua conta."
    }
    return "Isso irá desativar sua conta e ocultar todos os seus produtos dos clientes.Você pode reativar sua conta a qualquer momento fazendo login novamente."
  }

  const handleCriticalAction = async () => {
    try {
      setModalError(null)
      setModalLoading(true)

      const endpoint = user.role === "CLIENTE" 
        ? "/api/account/delete"
        : "/api/account/disable"

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senha: password }),
        credentials: "include",
      })

      const data = await res.json()

      if (res.ok) {
        if (user.role === "CLIENTE") {
          await logout()
        } else {
          updateUser({ active: false })
          setShowModal(false)
          await logout()
        }
      } else {
        setModalError(data.error || "Falha ao executar ação")
      }
    } catch (err) {
      console.error("Critical action error:", err)
      setModalError("Erro de conexão")
    } finally {
      setModalLoading(false)
    }
  }

  const openCriticalActionModal = () => {
    setShowModal(true)
    setPassword("")
    setModalError(null)
  }

  const closeCriticalActionModal = () => {
    setShowModal(false)
    setPassword("")
    setModalError(null)
  }

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading">
          <div className="text-center">
            <div className="heading-3">Carregando Dashboard...</div>
            <p className="text-body">Buscando seus dados...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="error-message">
          {error}
        </div>
      </div>
    )
  }

  return (
    <div className="page-container fade-in">
      <div className="mb-8">
        <h1 className="heading-1">Dashboard</h1>
        <p className="text-body">
          Bem-vindo de volta, {getRoleDisplayName(user.role)}! Aqui está uma visão geral da sua conta.
        </p>
      </div>

      <div className="card mb-8">
        <div className="card__header">
          <h2 className="card__title">Informações da Conta</h2>
        </div>
        <div className="card__content">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="heading-4">Detalhes do Perfil</h3>
              <div className="space-y-2">
                <p className="text-body">
                  <strong>Email:</strong> {user.email}
                </p>
                <p className="text-body">
                  <strong>Tipo de Conta:</strong> {getRoleDisplayName(user.role)}
                </p>
                <p className="text-body">
                  <strong>Status:</strong> 
                  <span className={`ml-2 px-2 py-1 rounded text-xs font-semibold ${
                    user.active 
                      ? "bg-green-900 text-green-100" 
                      : "bg-red-900 text-red-100"
                  }`}>
                    {user.active ? "Ativo" : "Inativo"}
                  </span>
                </p>
              </div>
            </div>

            <div>
              <h3 className="heading-4">Ações da Conta</h3>
              <p className="text-body mb-4">
                {getActionDescription(user.role)}
              </p>
              <button
                onClick={openCriticalActionModal}
                className="btn btn--danger"
                disabled={!user.active}
              >
                {getActionButtonText(user.role)}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      {statistics && Object.keys(statistics).length > 0 && (
        <div className="dashboard-grid">
          {user.role === "VENDEDOR" && (
            <>
              <div className="stat-card">
                <div className="stat-card__value">
                  {statistics.totalProdutos || 0}
                </div>
                <div className="stat-card__label">Total de Produtos</div>
              </div>

              <div className="stat-card">
                <div className="stat-card__value">
                  {statistics.totalVendas || 0}
                </div>
                <div className="stat-card__label">Total de Vendas</div>
              </div>

              <div className="stat-card">
                <div className="stat-card__value">
                  {formatCurrency(statistics.receitaTotal || 0)}
                </div>
                <div className="stat-card__label">Receita Total</div>
              </div>

              {statistics.produtoMaisVendido && (
                <div className="stat-card">
                  <div className="stat-card__value text-sm">
                    {statistics.produtoMaisVendido.name}
                  </div>
                  <div className="stat-card__label">Mais Vendido</div>
                </div>
              )}
            </>
          )}

          {user.role === "CLIENTE" && (
            <>
              <div className="stat-card">
                <div className="stat-card__value">
                  {statistics.totalPedidos || 0}
                </div>
                <div className="stat-card__label">Total de Pedidos</div>
              </div>

              <div className="stat-card">
                <div className="stat-card__value">
                  {formatCurrency(statistics.totalGasto || 0)}
                </div>
                <div className="stat-card__label">Total Gasto</div>
              </div>

              <div className="stat-card">
                <div className="stat-card__value">
                  {statistics.totalFavoritos || 0}
                </div>
                <div className="stat-card__label">Favoritos</div>
              </div>

              <div className="stat-card">
                <div className="stat-card__value">
                  {statistics.itensCarrinho || 0}
                </div>
                <div className="stat-card__label">Itens no Carrinho</div>
              </div>
            </>
          )}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal modal--small">
            <div className="modal__header">
              <h3 className="modal__title">Confirmar {getActionButtonText(user.role)}</h3>
              <button
                onClick={closeCriticalActionModal}
                className="modal__close"
                disabled={modalLoading}
              >
                ✕
              </button>
            </div>

            <div className="modal__content">
              <p className="text-body mb-4">
                {getActionDescription(user.role)}
              </p>

              <p className="text-body mb-6">
                <strong>Para confirmar esta ação, digite sua senha:</strong>
              </p>

              {modalError && (
                <div className="error-message mb-4">
                  {modalError}
                </div>
              )}

              <div className="form__field">
                <label htmlFor="confirmPassword" className="form__label">
                  Senha
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  placeholder="Digite sua senha"
                  className="form__input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={modalLoading}
                  autoComplete="current-password"
                  required
                />
              </div>
            </div>

            <div className="modal__footer">
              <button
                onClick={closeCriticalActionModal}
                className="btn btn--secondary"
                disabled={modalLoading}
              >
                Cancelar
              </button>
              <button
                onClick={handleCriticalAction}
                className="btn btn--danger"
                disabled={modalLoading || !password.trim()}
              >
                {modalLoading ? "Processando..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default withAuth(DashboardPage, {
  allowedRoles: ["CLIENTE", "VENDEDOR"],
  requireActive: true
})