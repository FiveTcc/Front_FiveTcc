import { createContext, useContext, useEffect, useState } from 'react'
import { db } from '../services/storage'

const SESSION_KEY = 'torre_session_v1'
const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    const raw = localStorage.getItem(SESSION_KEY)
    if (raw) {
      try {
        setUsuario(JSON.parse(raw))
      } catch {
        localStorage.removeItem(SESSION_KEY)
      }
    }
    setCarregando(false)
  }, [])

  function login(email, senha) {
    const encontrado = db.autenticar(email, senha)
    if (!encontrado) return { ok: false, erro: 'E-mail ou senha incorretos.' }
    const sessao = {
      id: encontrado.id,
      nome: encontrado.nome,
      email: encontrado.email,
      perfil: encontrado.perfil,
      telefone: encontrado.telefone || '',
      setor: encontrado.setor || '',
      cargo: encontrado.cargo || '',
    }
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessao))
    setUsuario(sessao)
    return { ok: true }
  }

  function logout() {
    localStorage.removeItem(SESSION_KEY)
    setUsuario(null)
  }

  function atualizarSessao(dados) {
    setUsuario((atual) => {
      const proximo = atual ? { ...atual, ...dados } : dados
      localStorage.setItem(SESSION_KEY, JSON.stringify(proximo))
      return proximo
    })
  }

  return (
    <AuthContext.Provider value={{ usuario, login, logout, atualizarSessao, carregando }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return ctx
}
