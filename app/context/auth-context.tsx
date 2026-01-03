"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"

interface User {
  name: string 
  email: string 
  is_staff: boolean
  client_type: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (token: string, userData: any) => void
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check localStorage on load
    // KEY FIX: Changed "token" to "access_token" to match api.ts
    const storedToken = localStorage.getItem("access_token")
    const storedUser = localStorage.getItem("user")
    
    if (storedToken && storedUser) {
      setToken(storedToken)
      setUser(JSON.parse(storedUser))
    }
    setIsLoading(false)
  }, [])

  const login = (newToken: string, userData: any) => {
    const userObj = {
      name: userData.name,
      // Handle email if present in response, or fallback
      email: userData.email || userData.sub || "", 
      is_staff: userData.is_staff,
      client_type: userData.user_type
    }
    
    setToken(newToken)
    setUser(userObj)
    
    // KEY FIX: Changed "token" to "access_token"
    localStorage.setItem("access_token", newToken)
    localStorage.setItem("user", JSON.stringify(userObj))
    
    // Redirect logic
    if (userObj.is_staff) {
      router.push("/admin")
    } else {
      router.push("/client")
    }
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem("access_token")
    localStorage.removeItem("user")
    router.push("/login")
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)