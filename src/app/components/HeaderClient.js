"use client"

import Header from "./headers"
import { usePathname } from "next/navigation"

export default function HeaderClient() {
  const pathname = usePathname()

  if (pathname === "/login" || pathname === "/register") return null

  return <Header />
}
