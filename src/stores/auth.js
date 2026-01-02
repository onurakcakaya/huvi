import { defineStore } from 'pinia'
import { supabase } from '../supabase'
import router from '../router'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,     // Supabase Auth kullanıcısı (email, id)
    profile: null,  // Bizim public.profiles tablosundaki veri (ad, soyad, rol)
    loading: true   // Sayfa yüklenirken "bekleyiniz" durumu için
  }),

  actions: {
    // 1. Uygulama açılınca: Kullanıcı var mı kontrol et
    async initialize() {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session) {
        this.user = session.user
        await this.fetchProfile() // Kullanıcı varsa profil detaylarını da çek
      } else {
        this.user = null
        this.profile = null
      }
      this.loading = false
    },

    // 2. Profil bilgilerini çek (Rolü öğrenmek için şart)
    async fetchProfile() {
      if (!this.user) return

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', this.user.id)
        .single()

      if (error) {
        console.error('Profil çekme hatası:', error)
      } else {
        this.profile = data
      }
    },

    // 3. Kayıt Ol (Register)
async register(email, password, fullName) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } }
  })
  if (error) throw error
  // Session varsa (mail onayı kapalıysa) kullanıcıyı güncelle
  if (data.session) {
    this.user = data.user
    await this.fetchProfile()
  }
  return { data, error } // <--- BU SATIR ÖNEMLİ, return etmeli
},

    // 4. Giriş Yap (Login)
    async login(email, password) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      if (error) throw error
      
      if (data.user) {
        this.user = data.user
        await this.fetchProfile()
        router.push('/') // Anasayfaya yönlendir
      }
    },

    // 5. Çıkış Yap (Logout)
    async logout() {
      await supabase.auth.signOut()
      this.user = null
      this.profile = null
      router.push('/login')
    },
    // 6. Profil Güncelle
    async updateProfile(updates) {
        const { user } = this
        const { error } = await supabase
          .from('profiles')
          .update(updates)
          .eq('id', user.id)
  
        if (error) throw error
        
        // Store'daki veriyi de güncelle ki sayfa yenilenmeden değişsin
        this.profile = { ...this.profile, ...updates }
      }
  }
})