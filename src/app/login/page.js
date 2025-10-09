"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth, useRedirectIfAuthenticated } from "@/contexts/AuthContext"
import { isValidEmail } from "@/lib/utils"

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  })
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const router = useRouter()
  const { login, error: authError, clearError } = useAuth()
  const { loading: redirectLoading } = useRedirectIfAuthenticated("/products")

  const validateForm = () => {
    const newErrors = {}

    if (!formData.email) {
      newErrors.email = "Email is required"
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = "Please enter a valid email address"
    }

    if (!formData.password) {
      newErrors.password = "Password is required"
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }))
    }
    
    if (authError) {
      clearError()
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsSubmitting(true)
    
    try {
      const result = await login(formData)
      
      if (result.success) {
        router.push("/products")
      }
    } catch (err) {
      console.error("Login error:", err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const navigateToRegister = () => {
    router.push("/register")
  }

  if (redirectLoading) {
    return (
      <div className="page-container flex items-center justify-center">
        <div className="loading">
          <div className="text-center">
            <div className="heading-3">Loading...</div>
            <p className="text-body">Checking authentication status...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container page-container--narrow flex items-center justify-center min-h-screen">
      <form onSubmit={handleSubmit} className="form fade-in">
        <div className="text-center mb-6">
          <h1 className="heading-2">Bem-vindo de Volta</h1>
          <p className="text-body">Entre na sua conta para continuar</p>
        </div>

        {authError && (
          <div className="error-message">
            {authError}
          </div>
        )}

        <div className="form__field">
          <label htmlFor="email" className="form__label">
            Endereço de Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="Digite seu email"
            className="form__input"
            value={formData.email}
            onChange={handleInputChange}
            disabled={isSubmitting}
            autoComplete="email"
            required
          />
          {errors.email && <div className="form__error">{errors.email}</div>}
        </div>

        <div className="form__field">
          <label htmlFor="password" className="form__label">
            Senha
          </label>
          <input
            id="password"
            name="password"
            type="password"
            placeholder="Digite sua senha"
            className="form__input"
            value={formData.password}
            onChange={handleInputChange}
            disabled={isSubmitting}
            autoComplete="current-password"
            required
          />
          {errors.password && <div className="form__error">{errors.password}</div>}
        </div>

        <p></p>

        <div className="form__actions">
          <button
            type="submit"
            className="btn btn--primary btn--large"
            disabled={isSubmitting}
            style={{ width: "100%" }}
          >
            {isSubmitting ? "Entrando..." : "Entrar"}
          </button>
        </div>

        <div className="text-center mt-6">
          <p className="text-body">
            Não tem uma conta?{" "}
            <button
              type="button"
              onClick={navigateToRegister}
              className="btn btn--ghost btn--small"
              disabled={isSubmitting}
            >
              Criar Conta
            </button>
          </p>
        </div>
      </form>
    </div>
  )
}