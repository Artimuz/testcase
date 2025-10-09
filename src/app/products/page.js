"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { withAuth, useAuth } from "@/contexts/AuthContext"
import { formatCurrency, formatDate } from "@/lib/utils"

function ProductsPage() {
  const router = useRouter()
  const { user } = useAuth()

  const [produtos, setProdutos] = useState([])
  const [carregando, setCarregando] = useState(false)
  const [modalProduto, setModalProduto] = useState(null)

  const produtosPorPagina = 10 * 3

  const [busca, setBusca] = useState("")
  const [ordem, setOrdem] = useState("novos")
  const [paginaAtual, setPaginaAtual] = useState(1)
  const [totalPaginas, setTotalPaginas] = useState(1)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search)
      const q = sp.get("busca") || ""
      const o = sp.get("ordem") || "novos"
      const p = Number(sp.get("page")) || 1
      setBusca((prev) => prev || q)
      setOrdem((prev) => prev || o)
      setPaginaAtual((prev) => prev || p)
    }
  }, [])

  const carregarProdutos = useCallback(async () => {
    setCarregando(true)
    try {
      const res = await fetch(
        `/api/products/list?page=${paginaAtual}&limit=${produtosPorPagina}&busca=${encodeURIComponent(
          busca
        )}&ordem=${ordem}`,
        { cache: "no-store" }
      )
      const json = await res.json()

      if (!res.ok) {
        setProdutos([])
        setTotalPaginas(1)
        return
      }

      let list = Array.isArray(json.produtos) ? json.produtos : []
      list = list.map((p) => ({ ...p, isFavorite: !!p.isFavorite }))

      if (user?.role === "VENDEDOR") {
        if (user?.id) {
          list = list.filter((p) => p.sellerId === user.id)
        } else if (user?.email) {
          list = list.filter((p) => p.sellerEmail === user.email)
        } else {
          list = []
        }
      }
      
      setProdutos(list)
      setTotalPaginas(json.totalPaginas || Math.max(1, Math.ceil(list.length / produtosPorPagina)))
    } catch (err) {
    } finally {
      setCarregando(false)
    }
  }, [paginaAtual, produtosPorPagina, busca, ordem, user])

  useEffect(() => {
    const params = new URLSearchParams()
    if (busca) params.set("busca", busca)
    if (ordem !== "novos") params.set("ordem", ordem)
    if (paginaAtual > 1) params.set("page", paginaAtual)
    router.replace(`?${params.toString()}`, { scroll: false })
  }, [busca, ordem, paginaAtual, router])

  useEffect(() => {
    carregarProdutos()
  }, [carregarProdutos])

  useEffect(() => {
    if (modalProduto && produtos.length > 0) {
      const atualizado = produtos.find((p) => p.id === modalProduto.id)
      if (atualizado) {
        setModalProduto(atualizado)
      }
    }
  }, [produtos, modalProduto])

  function handleBuscar(e) {
    e.preventDefault()
    setPaginaAtual(1)
    carregarProdutos()
  }

  function abrirModal(produto) {
    setModalProduto(produto)
  }

  function fecharModal() {
    setModalProduto(null)
  }

  async function handleComprar(id) {
    try {
      const res = await fetch("/api/cart/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: id }),
      })
      alert(res.ok ? "Produto adicionado ao carrinho!" : "Erro ao adicionar ao carrinho")
    } catch {
      alert("Erro de rede ao adicionar ao carrinho")
    }
  }

  async function handleFavoritar(id) {
    try {
      const res = await fetch("/api/favorites/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: id }),
      })
      if (res.ok) {
        setProdutos((prev) => prev.map((p) => (p.id === id ? { ...p, isFavorite: true } : p)))
        setModalProduto((m) => (m && m.id === id ? { ...m, isFavorite: true } : m))
      }
    } catch {
      alert("Erro ao favoritar")
    }
  }

  async function handleRemoverFavorito(id) {
    try {
      const res = await fetch("/api/favorites/remove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: id }),
      })
      if (res.ok) {
        setProdutos((prev) => prev.map((p) => (p.id === id ? { ...p, isFavorite: false } : p)))
        setModalProduto((m) => (m && m.id === id ? { ...m, isFavorite: false } : m))
      }
    } catch {
      alert("Erro ao remover favorito")
    }
  }

  async function handleExcluir(id) {
    if (!confirm("Tem certeza que deseja excluir este produto?")) return
    try {
      const res = await fetch(`/api/products/${id}/disable`, { method: "PATCH" })
      if (res.ok) {
        alert("Produto desativado (estoque zerado)")
        setProdutos((prev) => prev.filter((p) => p.id !== id))
        setModalProduto(null)
      }
    } catch {
      alert("Erro ao excluir produto")
    }
  }

  function renderModalButtons(produto) {
    const isCliente = user?.role === "CLIENTE"
    const isVendedor = user?.role === "VENDEDOR"

    const actions = []

    if (isCliente || isVendedor) {
      if (produto.isFavorite) {
        actions.push({
          key: "remover-fav",
          label: "Remover dos Favoritos",
          icon: "💔",
          onClick: () => handleRemoverFavorito(produto.id),
          className: "btn--secondary",
        })
      } else {
        actions.push({
          key: "favoritar",
          label: "Adicionar aos Favoritos",
          icon: "❤️",
          onClick: () => handleFavoritar(produto.id),
          className: "btn--warning",
        })
      }
    }

    if (isCliente) {
      actions.push({
        key: "comprar",
        label: "Adicionar ao Carrinho",
        icon: "🛒",
        onClick: () => handleComprar(produto.id),
        className: "btn--success",
      })
    }

    if (isVendedor) {
      actions.push({
        key: "excluir",
        label: "Remover Produto",
        icon: "🗑️",
        onClick: () => handleExcluir(produto.id),
        className: "btn--danger",
      })
    }

    return (
      <div className="flex gap-md mt-6">
        {actions.map((a) => (
          <button
            key={a.key}
            onClick={(e) => {
              e.stopPropagation()
              a.onClick()
            }}
            className={`btn ${a.className} flex-1`}
            type="button"
          >
            <span className="mr-2">{a.icon}</span>
            {a.label}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className="page-container">
      <div className="fade-in">
        <div className="mb-6">
          <h1 className="heading-1">
            {user?.role === "VENDEDOR" ? "Meus Produtos" : "Produtos"}
          </h1>
          <p className="text-body">
            {user?.role === "VENDEDOR" 
              ? "Gerencie seus produtos e estoque" 
              : "Descubra e compre produtos incríveis"
            }
          </p>
        </div>

        {/* Search and Filter Section */}
        <div className="card mb-6">
          <div className="card__content">
            <form onSubmit={handleBuscar} className="flex gap-md items-end">
              <div className="form__field flex-1">
                <label htmlFor="search" className="form__label">Buscar Produtos</label>
                <input
                  id="search"
                  type="text"
                  placeholder="Busque por nome, descrição..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="form__input"
                />
              </div>
              <div className="form__field">
                <label htmlFor="sort" className="form__label">Ordenar por</label>
                <select
                  id="sort"
                  value={ordem}
                  onChange={(e) => {
                    setPaginaAtual(1)
                    setOrdem(e.target.value)
                  }}
                  className="form__input form__select"
                >
                  <option value="novos">Mais Novos</option>
                  <option value="antigos">Mais Antigos</option>
                  <option value="maior_preco">Maior Preço</option>
                  <option value="menor_preco">Menor Preço</option>
                </select>
              </div>
              <button type="submit" className="btn btn--primary">
                Buscar
              </button>
            </form>
          </div>
        </div>

        {/* Products Grid */}
        {carregando ? (
          <div className="loading">
            <div className="text-center">
              <div className="heading-3">Carregando produtos...</div>
              <p className="text-body">Buscando os produtos mais recentes...</p>
            </div>
          </div>
        ) : produtos.length === 0 ? (
          <div className="card">
            <div className="card__content text-center">
              <h3 className="heading-3">Nenhum Produto Encontrado</h3>
              <p className="text-body">
                {busca ? "Tente ajustar os termos de busca." : "Nenhum produto disponível no momento."}
              </p>
              {user?.role === "VENDEDOR" && (
                <a href="/addproducts" className="btn btn--primary mt-4">
                  Adicionar Primeiro Produto
                </a>
              )}
            </div>
          </div>
        ) : (
          <div className="products-grid">
            {produtos.map((p, index) => (
              <div
                key={p.id}
                className={`product-card ${p.isFavorite ? "product-card--favorite" : ""}`}
                onClick={() => abrirModal(p)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter") abrirModal(p)
                }}
              >
                <div className="product-card__image-container">
                  <Image 
                    src={p.imageUrl} 
                    alt={p.name} 
                    className="product-card__image" 
                    fill
                    style={{ objectFit: 'cover' }}
                    priority={index < 500}
                  />
                </div>
                <div className="product-card__content">
                  <h3 className="product-card__title">{p.name}</h3>
                  <p className="product-card__price">{formatCurrency(p.price)}</p>
                  <p className="product-card__quantity">
                    {p.quantity > 0 ? `${p.quantity} em estoque` : "Fora de estoque"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPaginas > 1 && (
          <div className="flex justify-center items-center gap-md mt-8">
            <button
              className="btn btn--secondary"
              disabled={paginaAtual === 1}
              onClick={() => setPaginaAtual((p) => p - 1)}
            >
              Anterior
            </button>
            <span className="text-body">
              Página {paginaAtual} de {totalPaginas}
            </span>
            <button
              className="btn btn--secondary"
              disabled={paginaAtual === totalPaginas}
              onClick={() => setPaginaAtual((p) => p + 1)}
            >
              Próxima
            </button>
          </div>
        )}

        {/* Product Modal */}
        {modalProduto && (
          <div className="modal-overlay" onClick={fecharModal}>
            <div className="modal modal--large" onClick={(e) => e.stopPropagation()}>
              <div className="modal__header">
                <h3 className="modal__title">{modalProduto.name}</h3>
                <button onClick={fecharModal} className="modal__close">
                  ✕
                </button>
              </div>
              
              <div className="modal__content">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Image
                      src={modalProduto.imageUrl}
                      alt={modalProduto.name}
                      width={400}
                      height={300}
                      className="w-full h-auto rounded-lg"
                      style={{ maxHeight: "300px", objectFit: "cover", height: "auto" }}
                      priority={true}
                    />
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="heading-4">Preço</h4>
                      <p className="text-lg font-semibold text-success-light">
                        {formatCurrency(modalProduto.price)}
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="heading-4">Descrição</h4>
                      <p className="text-body">{modalProduto.description}</p>
                    </div>
                    
                    <div>
                      <h4 className="heading-4">Estoque</h4>
                      <p className="text-body">
                        {modalProduto.quantity > 0 
                          ? `${modalProduto.quantity} itens disponíveis`
                          : "Fora de estoque"
                        }
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="heading-4">Publicado em</h4>
                      <p className="text-body">
                        {formatDate(modalProduto.publishedAt)}
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="heading-4">Vendedor</h4>
                      <p className="text-body">{modalProduto.sellerEmail}</p>
                    </div>
                    
                    {renderModalButtons(modalProduto)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default withAuth(ProductsPage, {
  allowedRoles: ["CLIENTE", "VENDEDOR"],
  requireActive: true
})
