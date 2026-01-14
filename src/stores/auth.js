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
    // Uygulama açılınca çalışır
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

    // Profil çek – trigger gecikmesine ve olmayan veriye dayanıklı
    async fetchProfileSafe() {
      if (!this.user) return

      // 'single' yerine 'maybeSingle' kullanıyoruz ki veri yoksa hata patlatmasın, null dönsün.
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', this.user.id)
        .maybeSingle()

      if (error) {
        console.warn('Profil verisi alınamadı (Henüz oluşmamış olabilir):', error.message)
        return
      }

      this.profile = data
    },

    // Kayıt Ol
    async register(email, password, fullName) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName }
        }
      })

      if (error) throw error

      // Eğer Supabase'de email onayı kapalıysa direkt session gelir
      if (data.session) {
        this.user = data.user
        await this.fetchProfileSafe()
      }

      return { data }
    },

    // Giriş Yap
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

    // Çıkış Yap
    async logout() {
      await supabase.auth.signOut()
      this.user = null
      this.profile = null
      router.push('/login')
    }
  }
})