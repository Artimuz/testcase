"use client"

import { useState, useEffect, useMemo } from "react"
import { withAuth } from "@/contexts/AuthContext"
import { formatCurrency, formatDateTime } from "@/lib/utils"

function OrdersPage() {
  const [orders, setOrders] = useState([])
  const [carregando, setCarregando] = useState(false)
  const [pagina, setPagina] = useState(1)
  const [totalPaginas, setTotalPaginas] = useState(1)
  const [expandidos, setExpandidos] = useState({})

  const ORDENS_POR_PAGINA = 10

  useEffect(() => {
    let mounted = true
    async function carregarOrdens() {
      setCarregando(true)
      try {
        const res = await fetch(`/api/orders/list?page=${pagina}&limit=${ORDENS_POR_PAGINA}`)
        const json = await res.json()
        if (!mounted) return
        if (res.ok) {
          setOrders(json.orders)
          setTotalPaginas(json.totalPages)
        } else {
          console.error(json.error)
        }
      } catch (err) {
        if (mounted) console.error("Erro ao carregar ordens:", err)
      } finally {
        if (mounted) setCarregando(false)
      }
    }

    carregarOrdens()
    return () => {
      mounted = false
    }
  }, [pagina])

  function toggleExpandir(orderId) {
    setExpandidos({ ...expandidos, [orderId]: !expandidos[orderId] })
  }

  const totalPedidos = useMemo(() => {
    return orders.reduce((total, order) => total + (order.total || 0), 0)
  }, [orders])

  return (
    <div className="page-container">
      <div className="fade-in">
        <div className="flex justify-between items-center mb-6">
          <h1 className="heading-1">Meus Pedidos</h1>
          <div className="stat-card" style={{ minWidth: "200px" }}>
            <div className="stat-card__value">{formatCurrency(totalPedidos)}</div>
            <div className="stat-card__label">Total Gasto</div>
          </div>
        </div>

        {carregando ? (
          <div className="loading">
            <div className="text-center">
              <div className="heading-3">Carregando pedidos...</div>
              <p className="text-body">Buscando histórico de compras...</p>
            </div>
          </div>
        ) : orders.length === 0 ? (
          <div className="card">
            <div className="card__content text-center">
              <h3 className="heading-3">Nenhum Pedido Encontrado</h3>
              <p className="text-body">Você ainda não fez nenhuma compra.</p>
              <a href="/products" className="btn btn--primary mt-4">
                Começar a Comprar
              </a>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="card">
                <div 
                  className="card__header cursor-pointer" 
                  onClick={() => toggleExpandir(order.id)}
                  style={{ cursor: "pointer" }}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="card__title">
                        Pedido realizado em {formatDateTime(order.createdAt)}
                      </h3>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-success-light">
                        {formatCurrency(order.total)}
                      </div>
                      <div className="text-xs text-tertiary">
                        {expandidos[order.id] ? "Clique para ocultar" : "Clique para ver detalhes"}
                      </div>
                    </div>
                  </div>
                </div>
                
                {expandidos[order.id] && (
                  <div className="card__content">
                    <div className="overflow-x-auto">
                      <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                          <tr style={{ borderBottom: "1px solid var(--border-primary)" }}>
                            <th style={{ padding: "var(--space-md)", textAlign: "left", color: "var(--text-primary)", fontWeight: "600" }}>Produto</th>
                            <th style={{ padding: "var(--space-md)", textAlign: "center", color: "var(--text-primary)", fontWeight: "600" }}>Qtd</th>
                            <th style={{ padding: "var(--space-md)", textAlign: "right", color: "var(--text-primary)", fontWeight: "600" }}>Valor Unitário</th>
                            <th style={{ padding: "var(--space-md)", textAlign: "left", color: "var(--text-primary)", fontWeight: "600" }}>Vendedor</th>
                          </tr>
                        </thead>
                        <tbody>
                          {order.items.map((item) => (
                            <tr key={item.id} style={{ borderBottom: "1px solid var(--border-primary)" }}>
                              <td style={{ padding: "var(--space-md)", color: "var(--text-primary)" }}>
                                {item.product.name}
                              </td>
                              <td style={{ padding: "var(--space-md)", textAlign: "center", color: "var(--text-secondary)" }}>
                                {item.quantity}
                              </td>
                              <td style={{ padding: "var(--space-md)", textAlign: "right", color: "var(--success-light)", fontWeight: "600" }}>
                                {formatCurrency(item.price)}
                              </td>
                              <td style={{ padding: "var(--space-md)", color: "var(--text-secondary)" }}>
                                {item.product.seller.email}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {totalPaginas > 1 && (
              <div className="flex justify-center items-center gap-md mt-6">
                <button
                  className="btn btn--secondary"
                  disabled={pagina <= 1}
                  onClick={() => setPagina((p) => p - 1)}
                >
                  Anterior
                </button>
                <span className="text-body">
                  Página {pagina} de {totalPaginas}
                </span>
                <button
                  className="btn btn--secondary"
                  disabled={pagina >= totalPaginas}
                  onClick={() => setPagina((p) => p + 1)}
                >
                  Próxima
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default withAuth(OrdersPage, {
  allowedRoles: ["CLIENTE"],
  requireActive: true
})
