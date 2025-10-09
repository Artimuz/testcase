"use client"

import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { useRouter, usePathname } from "next/navigation"

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  const checkAuth = useCallback(async (options = {}) => {
    const { suppressErrors = false } = options
    
    try {
      const response = await fetch("/api/auth/me", {
        credentials: "include",
        cache: "no-store"
      })

      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
        setError(null)
      } else {
        setUser(null)
        setError(null)
        
        if (response.status !== 401 && !suppressErrors) {
          console.log(`Falha na autenticação: ${response.status}`)
        }
      }
    } catch (err) {
      setUser(null)
      setError(null)
      
      if (!suppressErrors) {
        console.error("Falha na verificação de autenticação:", err)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  const login = useCallback(async (credentials) => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
        credentials: "include"
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setUser(data.user)
        return { success: true }
      } else {
        setError(data.error || "Login falhou")
        return { success: false, error: data.error || "Login falhou" }
      }
    } catch (err) {
      console.error("Login error:", err)
      const errorMessage = "Falha na rede durante o login"
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }, [])

  const register = useCallback(async (userData) => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData)
      })

      const data = await response.json()

      if (response.ok) {
        if (data.user) {
          setUser(data.user)
          setError(null)
        }
        return { success: true, message: data.message || "Conta criada com sucesso!" }
      } else {
        setError(data.error || "Falha no registro")
        return { success: false, error: data.error || "Falha no registro" }
      }
    } catch (err) {
      console.error("Falha na verificação de registro:", err)
      const errorMessage = "Falha na rede durante o registro"
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include"
      })
    } catch (err) {
      console.error("Logout error:", err)
    } finally {
      setUser(null)
      setError(null)
      router.replace("/login")
    }
  }, [router])

  const updateUser = useCallback((userData) => {
    setUser(current => current ? { ...current, ...userData } : null)
  }, [])

  const hasRole = useCallback((role) => {
    return user?.role === role
  }, [user])

  const isAuthenticated = Boolean(user)

  const isAccountActive = Boolean(user?.active)

  useEffect(() => {
    if (!mounted) return

    const isAuthPage = pathname === '/login' || pathname === '/register'
    
    if (isAuthPage) {
      const silentAuthCheck = async () => {
        try {
          const response = await fetch("/api/auth/me", {
            credentials: "include",
            cache: "no-store"
          })
          
          if (response.ok) {
            const data = await response.json()
            setUser(data.user)
          } else {
            setUser(null)
          }
        } catch {
          setUser(null)
        } finally {
          setLoading(false)
        }
      }
      
      silentAuthCheck()
    } else {
      checkAuth({ suppressErrors: false })
    }
  }, [checkAuth, pathname, mounted])

  const value = {
    user,
    loading,
    error,
    isAuthenticated,
    isAccountActive,
    login,
    register,
    logout,
    updateUser,
    hasRole,
    checkAuth,
    clearError: () => setError(null)
  }

  if (!mounted) {
    return (
      <AuthContext.Provider value={{
        user: null,
        loading: true,
        error: null,
        isAuthenticated: false,
        isAccountActive: false,
        login: async () => ({ success: false, error: "Not mounted" }),
        register: async () => ({ success: false, error: "Not mounted" }),
        logout: async () => {},
        updateUser: () => {},
        hasRole: () => false,
        checkAuth: async () => {},
        clearError: () => {}
      }}>
        {children}
      </AuthContext.Provider>
    )
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export function withAuth(Component, options = {}) {
  const { 
    redirectTo = "/login", 
    allowedRoles = [], 
    requireActive = true 
  } = options

  return function AuthenticatedComponent(props) {
    const { user, loading, isAuthenticated, isAccountActive } = useAuth()
    const router = useRouter()

    useEffect(() => {
      if (loading) return

      if (!isAuthenticated) {
        router.replace(redirectTo)
        return
      }

      if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        router.replace("/products")
        return
      }

      if (requireActive && !isAccountActive) {
        if (user.role === "VENDEDOR") {
          router.replace("/enableAccount")
        } else {
          router.replace("/login")
        }
        return
      }
    }, [user, loading, isAuthenticated, isAccountActive, router])

    if (loading) {
      return (
        <div className="loading">
          <div className="text-center">
            <div className="heading-3">Carregando...</div>
            <p className="text-body">Verificando autenticação...</p>
          </div>
        </div>
      )
    }

    if (!isAuthenticated) {
      return null
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
      return null
    }

    if (requireActive && !isAccountActive) {
      return null
    }

    return <Component {...props} />
  }
}

export function useRedirectIfAuthenticated(redirectTo = "/products") {
  const { isAuthenticated, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.replace(redirectTo)
    }
  }, [isAuthenticated, loading, router, redirectTo])

  return { loading, isAuthenticated }
}