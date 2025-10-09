
export function formatCurrency(amount, currency = "BRL") {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2
  }).format(amount)
}


export function formatDate(date, options = {}) {
  const defaultOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "America/Sao_Paulo"
  }
  
  return new Intl.DateTimeFormat("pt-BR", { ...defaultOptions, ...options }).format(new Date(date))
}


export function formatDateTime(date) {
  return formatDate(date, {
    hour: "2-digit",
    minute: "2-digit"
  })
}


export function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}


export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}


export function safeJSONParse(str, fallback = null) {
  try {
    return JSON.parse(str)
  } catch {
    return fallback
  }
}


export function generateId() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}


export function clamp(number, min, max) {
  return Math.max(min, Math.min(number, max))
}


export function getPaginationInfo(currentPage, totalItems, itemsPerPage = 10) {
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems)
  
  return {
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    startIndex,
    endIndex,
    hasPrevious: currentPage > 1,
    hasNext: currentPage < totalPages,
    isFirstPage: currentPage === 1,
    isLastPage: currentPage === totalPages
  }
}


export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}


export function validatePassword(password) {
  const errors = []
  
  if (password.length < 6) {
    errors.push("Password must be at least 6 characters long")
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter")
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter")
  }
  
  if (!/\d/.test(password)) {
    errors.push("Password must contain at least one number")
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}


export function truncate(text, length = 100, suffix = "...") {
  if (text.length <= length) return text
  return text.substring(0, length).trim() + suffix
}


export function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "")
}


export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj))
}


export function isEmpty(obj) {
  if (obj == null) return true
  if (Array.isArray(obj) || typeof obj === "string") return obj.length === 0
  return Object.keys(obj).length === 0
}


export function cn(...classes) {
  return classes.filter(Boolean).join(" ")
}


export function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return "0 Bytes"
  
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ["Bytes", "KB", "MB", "GB"]
  
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i]
}


export function getInitials(name) {
  return name
    .split(" ")
    .map(part => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join("")
}


export function downloadData(data, filename, type = "application/json") {
  const blob = new Blob([data], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}


export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (err) {
    console.error("Failed to copy text: ", err)
    return false
  }
}


export function getContrastColor(hexColor) {
  const hex = hexColor.replace("#", "")
  
  const r = parseInt(hex.substr(0, 2), 16)
  const g = parseInt(hex.substr(2, 2), 16)
  const b = parseInt(hex.substr(4, 2), 16)
  
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  
  return luminance > 0.5 ? "#000000" : "#ffffff"
}


export function parseCSV(csvText, delimiter = ",") {
  const lines = csvText.trim().split("\n")
  const headers = lines[0].split(delimiter).map(h => h.trim().replace(/"/g, ""))
  
  return lines.slice(1).map(line => {
    const values = line.split(delimiter).map(v => v.trim().replace(/"/g, ""))
    const obj = {}
    headers.forEach((header, index) => {
      obj[header] = values[index] || ""
    })
    return obj
  })
}


export function generateCSV(data, headers = null) {
  if (!data.length) return ""
  
  const keys = headers || Object.keys(data[0])
  const csvHeaders = keys.join(",")
  
  const csvRows = data.map(row => 
    keys.map(key => {
      const value = row[key] || ""
      if (typeof value === "string" && (value.includes(",") || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`
      }
      return value
    }).join(",")
  )
  
  return [csvHeaders, ...csvRows].join("\n")
}


export async function retry(fn, maxAttempts = 3, delay = 1000) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      if (attempt === maxAttempts) throw error
      await sleep(delay * Math.pow(2, attempt - 1))
    }
  }
}


export function createLoadingState() {
  const states = new Map()
  
  return {
    setLoading: (key, loading) => {
      states.set(key, loading)
    },
    isLoading: (key) => states.get(key) || false,
    isAnyLoading: () => Array.from(states.values()).some(Boolean),
    clear: () => states.clear()
  }
}