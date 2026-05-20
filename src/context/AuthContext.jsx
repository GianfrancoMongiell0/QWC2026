import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const initialized = useRef(false)

  // Cargar perfil desde users_profiles
  const loadProfile = async (userId) => {
    if (!userId) return null
    const { data } = await supabase
      .from('users_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()
    return data ?? null
  }

  // Crear perfil en users_profiles (sin depender del trigger)
  const createProfile = async (userId, username, fullName) => {
    const { data, error } = await supabase
      .from('users_profiles')
      .upsert({
        id:        userId,
        username:  username,
        full_name: fullName ?? '',
        role:      'user',
        total_points: 0,
      }, { onConflict: 'id' })
      .select()
      .single()

    if (error) console.error('createProfile error:', error.message)
    return data ?? null
  }

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    // Cargar sesión inicial
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user)
        const p = await loadProfile(session.user.id)
        setProfile(p)
      }
      setLoading(false)
    })

    // Escuchar cambios de sesión
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT') {
          setUser(null)
          setProfile(null)
          setLoading(false)
          return
        }

        if (event === 'TOKEN_REFRESHED') {
          // Solo refrescar token, no recargar perfil
          setLoading(false)
          return
        }

        if (event === 'SIGNED_IN') {
          if (session?.user) {
            setUser(session.user)
            // No cargar perfil aquí — lo maneja signIn/signUp directamente
          }
          setLoading(false)
          return
        }

        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // ── REGISTRO ──────────────────────────────────────────────
  const signUp = async ({ email, password, username, fullName }) => {
    const cleanUsername = username.toLowerCase().trim().replace(/\s+/g, '_')
    const cleanFullName = fullName?.trim() ?? ''

    // 1. Crear usuario en Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email:    email.trim(),
      password,
      options: {
        data: { username: cleanUsername, full_name: cleanFullName },
        // Sin emailRedirectTo para evitar el error 422
      },
    })

    if (error) return { data: null, error }
    if (!data.user) return { data: null, error: new Error('No se creó el usuario') }

    // 2. Crear perfil directamente desde el frontend (no dependemos del trigger)
    const newProfile = await createProfile(data.user.id, cleanUsername, cleanFullName)

    // 3. Actualizar estado
    setUser(data.user)
    setProfile(newProfile)

    return { data, error: null }
  }

  // ── LOGIN ─────────────────────────────────────────────────
  const signIn = async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email:    email.trim(),
      password,
    })

    if (error) return { data: null, error }
    if (!data.user) return { data: null, error: new Error('Error de autenticación') }

    // Cargar perfil después del login
    const p = await loadProfile(data.user.id)

    // Si no tiene perfil (caso de usuarios creados antes del fix), crearlo
    if (!p) {
      const meta     = data.user.user_metadata
      const username = meta?.username ?? email.split('@')[0]
      const fullName = meta?.full_name ?? ''
      const created  = await createProfile(data.user.id, username, fullName)
      setProfile(created)
    } else {
      setProfile(p)
    }

    setUser(data.user)
    return { data, error: null }
  }

  // ── LOGOUT ────────────────────────────────────────────────
  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    localStorage.clear()
    sessionStorage.clear()
    window.location.href = '/'
  }

  const isAdmin = profile?.role === 'admin'

  return (
    <AuthContext.Provider value={{ user, profile, loading, isAdmin, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
