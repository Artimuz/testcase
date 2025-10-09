"use client"

import { useState, useEffect, useMemo } from "react"
import Image from "next/image"
import { withAuth } from "@/contexts/AuthContext"
import { formatCurrency } from "@/lib/utils"

function CartPage() {
  const [itens, setItens] = useState([])
  const [quantidades, setQuantidades] = useState({})
  const [carregando, setCarregando] = useState(false)

  useEffect(() => {
    carregarCarrinho()
  }, [])

  async function carregarCarrinho() {
    setCarregando(true)
    try {
      const res = await fetch("/api/cart/list")
      const json = await res.json()
      if (res.ok) {
        setItens(json.items)
        const q = {}
        json.items.forEach((item) => {
          q[item.product.id] = Math.min(item.quantity, item.product.quantity)
        })
        setQuantidades(q)
      } else {
        console.error(json.error)
      }
    } catch (err) {
      console.error("Erro ao carregar carrinho:", err)
    } finally {
      setCarregando(false)
    }
  }

  function handleQuantidade(itemId, novaQuantidade, estoque) {
    if (novaQuantidade < 1) return
    const quantidadeFinal = Math.min(novaQuantidade, estoque)
    setQuantidades({ ...quantidades, [itemId]: quantidadeFinal })
  }

  async function atualizarQuantidade(itemId) {
    const novaQuantidade = quantidades[itemId]
    try {
      const res = await fetch("/api/cart/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: itemId, quantity: novaQuantidade }),
      })
      if (!res.ok) alert("Erro ao atualizar quantidade")
      else carregarCarrinho()
    } catch {
      alert("Erro de rede ao atualizar quantidade")
    }
  }

  async function handleRemover(itemId) {
    try {
      const res = await fetch("/api/cart/remove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: itemId }),
      })
      if (res.ok) carregarCarrinho()
      else alert("Erro ao remover item")
    } catch {
      alert("Erro de rede ao remover item")
    }
  }

  async function handleFinalizar() {
    if (!confirm("Deseja finalizar o pedido?")) return
    try {
      const res = await fetch("/api/cart/checkout", { method: "POST" })
      if (res.ok) {
        alert("Pedido finalizado!")
        carregarCarrinho()
      } else {
        alert("Erro ao finalizar pedido")
      }
    } catch {
      alert("Erro de rede ao finalizar pedido")
    }
  }

  const valorTotal = useMemo(() => {
    return itens.reduce((total, item) => {
      const qtd = quantidades[item.product.id] || item.quantity || 0
      const preco = item.product.price || 0
      return total + qtd * preco
    }, 0)
  }, [itens, quantidades])

  return (
    <div className="page-container">
      <div className="fade-in">
        <div className="flex justify-between items-center mb-6">
          <h1 className="heading-1">Meu Carrinho</h1>
          <div className="stat-card" style={{ minWidth: "200px" }}>
            <div className="stat-card__value">{formatCurrency(valorTotal)}</div>
            <div className="stat-card__label">Total</div>
          </div>
        </div>

        {carregando ? (
          <div className="loading">
            <div className="text-center">
              <div className="heading-3">Carregando Carrinho...</div>
              <p className="text-body">Buscando os itens do seu carrinho...</p>
            </div>
          </div>
        ) : itens.length === 0 ? (
          <div className="card">
            <div className="card__content text-center">
              <h3 className="heading-3">Carrinho Vazio</h3>
              <p className="text-body">Adicione alguns produtos ao seu carrinho para vê-los aqui.</p>
              <a href="/products" className="btn btn--primary mt-4">
                Navegar Produtos
              </a>
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {itens.map((item, index) => (
                <div key={item.id} className="cart-item">
                  <Image
                    src={item.product.imageUrl}
                    alt={item.product.name}
                    className="cart-item__image"
                    width={80}
                    height={80}
                    priority={index < 3}
                  />
                  <div className="cart-item__info">
                    <h3 className="cart-item__title">{item.product.name}</h3>
                    <p className="text-small">
                      <strong>Vendedor:</strong> {item.product.sellerEmail}
                    </p>
                    <p className="text-small">
                      <strong>Disponível:</strong> {item.product.quantity} em estoque
                    </p>
                    <p className="cart-item__price">
                      {formatCurrency(item.product.price)} cada
                    </p>
                  </div>
                  <div className="cart-item__actions">
                    <div className="cart-item__quantity">
                      <input
                        type="number"
                        min={1}
                        max={item.product.quantity}
                        value={quantidades[item.product.id] || 1}
                        onChange={(e) =>
                          handleQuantidade(
                            item.product.id,
                            parseInt(e.target.value) || 1,
                            item.product.quantity
                          )
                        }
                        onBlur={() => atualizarQuantidade(item.product.id)}
                        className="cart-item__quantity-value"
                        style={{ 
                          background: "transparent", 
                          border: "none", 
                          color: "var(--text-primary)",
                          textAlign: "center",
                          width: "2rem"
                        }}
                      />
                    </div>
                    <button
                      className="btn btn--danger btn--small"
                      onClick={() => handleRemover(item.product.id)}
                    >
                      Remover
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 text-center">
              <button 
                className="btn btn--success btn--large" 
                onClick={handleFinalizar}
                style={{ minWidth: "200px" }}
              >
                Completar Pedido
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default withAuth(CartPage, {
  allowedRoles: ["CLIENTE"],
  requireActive: true
})
