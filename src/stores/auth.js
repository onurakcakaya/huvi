import { defineStore } from 'pinia'
import { supabase } from '../supabase'
import router from '../router'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    profile: null,
    loading: true
  }),

  actions: {
    // App açılışında çalışır
    async initialize() {
      this.loading = true

      const { data } = await supabase.auth.getSession()

      if (data.session?.user) {
        this.user = data.session.user
        await this.fetchProfileSafe()
      } else {
        this.user = null
        this.profile = null
      }

      this.loading = false
    },

    // Profil çek – trigger gecikmesine dayanıklı
    async fetchProfileSafe() {
      if (!this.user) return

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', this.user.id)
        .maybeSingle()

      if (error) {
        console.warn('Profil henüz hazır değil:', error.message)
        return
      }

      this.profile = data
    },

    // Register
    async register(email, password, fullName) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName }
        }
      })

      if (error) throw error

      // Email onayı kapalıysa session gelir
      if (data.session) {
        this.user = data.user
        await this.fetchProfileSafe()
      }

      return { data }
    },

    // Login
    async login(email, password) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error

      this.user = data.user
      await this.fetchProfileSafe()

      router.push('/')
    },

    // Logout
    async logout() {
      await supabase.auth.signOut()
      this.user = null
      this.profile = null
      router.push('/login')
    },

    // ----------------------------------------------
    // EKSİK OLAN VE ŞİMDİ EKLENEN FONKSİYON 👇
    // ----------------------------------------------
    async updateProfile(updates) {
      const { user } = this
      if (!user) return

      // 1. Veritabanını Güncelle
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)

      if (error) throw error

      // 2. Store'daki veriyi de anlık güncelle (Sayfa yenilemeye gerek kalmasın)
      this.profile = { ...this.profile, ...updates }
    }
  }
})