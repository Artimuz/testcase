"use client"

import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"

const navigation = [
  { 
    label: "Produtos", 
    path: "/products", 
    roles: ["CLIENTE", "VENDEDOR"],
    icon: "🛍️"
  },
  { 
    label: "Pedidos", 
    path: "/orders", 
    roles: ["CLIENTE"],
    icon: "📦"
  },
  { 
    label: "Carrinho", 
    path: "/cart", 
    roles: ["CLIENTE"],
    icon: "🛒"
  },
  { 
    label: "Adicionar Produtos", 
    path: "/addproducts", 
    roles: ["VENDEDOR"],
    icon: "➕"
  },
  { 
    label: "Vendas", 
    path: "/sales", 
    roles: ["VENDEDOR"],
    icon: "💰"
  },
  { 
    label: "Dashboard", 
    path: "/dashboard", 
    roles: ["CLIENTE", "VENDEDOR"],
    icon: "📊"
  },
]

export default function Header() {
  const router = useRouter()
  const pathname = usePathname()
  const { user, isAuthenticated, isAccountActive, logout } = useAuth()

  const allowedNavItems = navigation.filter(item => 
    user && item.roles.includes(user.role) && isAccountActive
  )

  const handleLogout = async () => {
    await logout()
  }

  const getRoleDisplayName = (role) => {
    return role === "CLIENTE" ? "Cliente" : "Vendedor"
  }

  return (
    <header className="header">
      <div className="header__container">
        <a href="/" className="header__brand">
          E-Commerce Store
        </a>

        {isAuthenticated && (
          <nav className="header__nav">
            {allowedNavItems.map(item => (
              <a
                key={item.path}
                href={item.path}
                className={`header__nav-item ${
                  pathname === item.path ? "header__nav-item--active" : ""
                } ${!isAccountActive ? "opacity-50 cursor-not-allowed" : ""}`}
                onClick={(e) => {
                  if (!isAccountActive) {
                    e.preventDefault()
                    return
                  }
                  e.preventDefault()
                  router.push(item.path)
                }}
                aria-disabled={!isAccountActive}
              >
                <span className="mr-1" aria-hidden="true">{item.icon}</span>
                {item.label}
              </a>
            ))}
          </nav>
        )}

        <div className="header__user">
          {isAuthenticated ? (
            <>
              <div className="header__user-info">
                <div className="header__user-role">
                  {getRoleDisplayName(user.role)}
                </div>
                <div className="header__user-email">
                  {user.email}
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="btn btn--small btn--ghost"
                aria-label="Sair"
              >
                Sair
              </button>
            </>
          ) : (
            <div className="header__auth-buttons">
              <button
                onClick={() => router.push("/login")}
                className="btn btn--small btn--ghost"
              >
                Entrar
              </button>
              <button
                onClick={() => router.push("/register")}
                className="btn btn--small btn--primary"
              >
                Cadastrar
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

