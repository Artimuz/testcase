"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth, useRedirectIfAuthenticated } from "@/contexts/AuthContext"
import { isValidEmail, validatePassword } from "@/lib/utils"

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    role: "CLIENTE"
  })
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  
  const router = useRouter()
  const { register, error: authError, clearError } = useAuth()
  const { loading: redirectLoading } = useRedirectIfAuthenticated("/products")

  const validateForm = () => {
    const newErrors = {}

    if (!formData.email) {
      newErrors.email = "Email é obrigatório"
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = "Por favor, insira um endereço de email válido"
    }

    if (!formData.password) {
      newErrors.password = "Senha é obrigatória"
    } else {
      const passwordValidation = validatePassword(formData.password)
      if (!passwordValidation.isValid) {
        newErrors.password = passwordValidation.errors[0]
      }
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Confirme sua senha"
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "As senhas não coincidem"
    }

    if (!formData.role) {
      newErrors.role = "Por favor, selecione um papel"
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

    if (successMessage) {
      setSuccessMessage("")
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsSubmitting(true)
    
    try {
      const result = await register({
        email: formData.email,
        password: formData.password,
        role: formData.role
      })
      
      if (result.success) {
        setSuccessMessage(result.message)
        setFormData({
          email: "",
          password: "",
          confirmPassword: "",
          role: "CLIENTE"
        })
        
        setTimeout(() => {
          router.push("/products")
        }, 1500)
      }
    } catch (err) {
      console.error("Registration error:", err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const navigateToLogin = () => {
    router.push("/login")
  }

  if (redirectLoading) {
    return (
      <div className="page-container flex items-center justify-center">
        <div className="loading">
          <div className="text-center">
            <div className="heading-3">Carregando...</div>
            <p className="text-body">Verificando status de autenticação...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container page-container--narrow flex items-center justify-center min-h-screen">
      <form onSubmit={handleSubmit} className="form fade-in">
        <div className="text-center mb-6">
          <h1 className="heading-2">Criar Conta</h1>
          <p className="text-body">Junte-se à nossa plataforma de e-commerce hoje</p>
        </div>

        {authError && (
          <div className="error-message">
            {authError}
          </div>
        )}

        {successMessage && (
          <div className="success-message">
            {successMessage}
            <br />
            <small>Redirecionando para produtos...</small>
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
            placeholder="Crie uma senha forte"
            className="form__input"
            value={formData.password}
            onChange={handleInputChange}
            disabled={isSubmitting}
            autoComplete="new-password"
            required
          />
          {errors.password && <div className="form__error">{errors.password}</div>}
          <small className="text-xs text-tertiary">
            A senha deve ter pelo menos 6 caracteres com maiúscula, minúscula e número
          </small>
        </div>

        <div className="form__field">
          <label htmlFor="confirmPassword" className="form__label">
            Confirmar Senha
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            placeholder="Confirme sua senha"
            className="form__input"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            disabled={isSubmitting}
            autoComplete="new-password"
            required
          />
          {errors.confirmPassword && <div className="form__error">{errors.confirmPassword}</div>}
        </div>

        <div className="form__field">
          <label htmlFor="role" className="form__label">
            Tipo de Conta
          </label>
          <select
            id="role"
            name="role"
            className="form__input form__select"
            value={formData.role}
            onChange={handleInputChange}
            disabled={isSubmitting}
            required
          >
            <option value="CLIENTE">Cliente</option>
            <option value="VENDEDOR">Vendedor</option>
          </select>
          {errors.role && <div className="form__error">{errors.role}</div>}
        </div>

        <div className="form__actions">
          <button
            type="submit"
            className="btn btn--primary btn--large"
            disabled={isSubmitting || successMessage}
            style={{ width: "100%" }}
          >
            {isSubmitting ? "Criando Conta..." : "Criar Conta"}
          </button>
        </div>

        <div className="text-center mt-6">
          <p className="text-body">
            Já tem uma conta?{" "}
            <button
              type="button"
              onClick={navigateToLogin}
              className="btn btn--ghost btn--small"
              disabled={isSubmitting}
            >
              Entrar
            </button>
          </p>
        </div>
      </form>
    </div>
  )
}
