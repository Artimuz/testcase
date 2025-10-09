"use client"

import { useState, useEffect, useMemo } from "react"
import { withAuth } from "@/contexts/AuthContext"
import { formatCurrency, formatDateTime } from "@/lib/utils"

function SalesPage() {
  const [sales, setSales] = useState([])
  const [carregando, setCarregando] = useState(false)
  const [pagina, setPagina] = useState(1)
  const [totalPaginas, setTotalPaginas] = useState(1)

  const VENDAS_POR_PAGINA = 20

  useEffect(() => {
    let mounted = true
    async function carregarVendas() {
      setCarregando(true)
      try {
        const res = await fetch(`/api/sales/list?page=${pagina}&limit=${VENDAS_POR_PAGINA}`)
        const json = await res.json()
        if (!mounted) return
        if (res.ok) {
          setSales(json.sales)
          setTotalPaginas(json.totalPages)
        } else {
          console.error(json.error)
        }
      } catch (err) {
        if (mounted) console.error("Erro ao carregar vendas:", err)
      } finally {
        if (mounted) setCarregando(false)
      }
    }

    carregarVendas()
    return () => {
      mounted = false
    }
  }, [pagina])

  const totalVendas = useMemo(() => {
    return sales.reduce((total, sale) => {
      const totalSellerItems = sale.items.reduce(
        (sum, i) => sum + i.price * i.quantity,
        0
      )
      return total + totalSellerItems
    }, 0)
  }, [sales])

  return (
    <div className="page-container">
      <div className="fade-in">
        <div className="flex justify-between items-center mb-6">
          <h1 className="heading-1">Minhas Vendas</h1>
          <div className="stat-card" style={{ minWidth: "200px" }}>
            <div className="stat-card__value">{formatCurrency(totalVendas)}</div>
            <div className="stat-card__label">Receita Total</div>
          </div>
        </div>

        {carregando ? (
          <div className="loading">
            <div className="text-center">
              <div className="heading-3">Carregando vendas...</div>
              <p className="text-body">Buscando seus dados de vendas...</p>
            </div>
          </div>
        ) : sales.length === 0 ? (
          <div className="card">
            <div className="card__content text-center">
              <h3 className="heading-3">Nenhuma Venda Encontrada</h3>
              <p className="text-body">Você ainda não fez nenhuma venda.</p>
            </div>
          </div>
        ) : (
          <div className="card">
            <div className="card__header">
              <h2 className="card__title">Histórico de Vendas</h2>
            </div>
            <div className="card__content">
              <div className="overflow-x-auto">
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border-primary)" }}>
                      <th style={{ padding: "var(--space-md)", textAlign: "left", color: "var(--text-primary)", fontWeight: "600" }}>Produto</th>
                      <th style={{ padding: "var(--space-md)", textAlign: "center", color: "var(--text-primary)", fontWeight: "600" }}>Qtd</th>
                      <th style={{ padding: "var(--space-md)", textAlign: "right", color: "var(--text-primary)", fontWeight: "600" }}>Preço Unitário</th>
                      <th style={{ padding: "var(--space-md)", textAlign: "left", color: "var(--text-primary)", fontWeight: "600" }}>Data da Venda</th>
                      <th style={{ padding: "var(--space-md)", textAlign: "left", color: "var(--text-primary)", fontWeight: "600" }}>Cliente</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sales.flatMap((sale) =>
                      sale.items.map((item) => (
                        <tr key={item.id} style={{ borderBottom: "1px solid var(--border-primary)" }}>
                          <td style={{ padding: "var(--space-md)", color: "var(--text-primary)" }}>{item.product.name}</td>
                          <td style={{ padding: "var(--space-md)", textAlign: "center", color: "var(--text-secondary)" }}>{item.quantity}</td>
                          <td style={{ padding: "var(--space-md)", textAlign: "right", color: "var(--success-light)", fontWeight: "600" }}>{formatCurrency(item.price)}</td>
                          <td style={{ padding: "var(--space-md)", color: "var(--text-secondary)" }}>{formatDateTime(sale.createdAt)}</td>
                          <td style={{ padding: "var(--space-md)", color: "var(--text-secondary)" }}>{sale.customer.email}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {totalPaginas > 1 && (
          <div className="flex justify-center items-center gap-md mt-6">
            <button
              className="btn btn--secondary"
              disabled={pagina <= 1}
              onClick={() => setPagina((p) => p - 1)}
            >
              Previous
            </button>
            <span className="text-body">
              Page {pagina} of {totalPaginas}
            </span>
            <button
              className="btn btn--secondary"
              disabled={pagina >= totalPaginas}
              onClick={() => setPagina((p) => p + 1)}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default withAuth(SalesPage, {
  allowedRoles: ["VENDEDOR"],
  requireActive: true
})