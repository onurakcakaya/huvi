<script setup>
import { onMounted, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../supabase'
import { useAuthStore } from '../stores/auth'
import DefaultLayout from '../layouts/DefaultLayout.vue'

const authStore = useAuthStore()
const router = useRouter()
const loading = ref(true)

// Görüntüleme Durumları
const showBusinessSection = ref(false)
const showPublisherSection = ref(false)

// Veriler
const business = ref(null)
const userRole = ref(null) // 'owner' | 'staff'
const publisherStats = ref({
  totalPosts: 0,
  totalLikes: 0,
  totalSaves: 0,
  followers: 0
})

// --- AKILLI ÖNERİ SİSTEMİ (YENİ) ---
const dailyTip = computed(() => {
  const stats = publisherStats.value
  
  if (stats.totalPosts === 0) {
    return {
      title: "Sahne Senin! 🎤",
      text: "Henüz hiç içerik paylaşmadın. İlk gönderini oluşturarak topluluğa merhaba de.",
      action: "/create-post",
      btnText: "İlk İçeriğini Oluştur"
    }
  }
  
  if (stats.followers < 10) {
    return {
      title: "Kendini Tanıt 👋",
      text: "Daha fazla takipçi kazanmak için profilini düzenle ve sosyal medyada paylaş.",
      action: "/settings/publisher",
      btnText: "Profili Düzenle"
    }
  }

  if (stats.totalLikes > 50) {
    return {
      title: "Alev Aldın! 🔥",
      text: "Etkileşim oranların harika gidiyor. Takipçilerinle yorumlarda konuşmayı unutma.",
      action: null,
      btnText: null
    }
  }

  // Varsayılan
  return {
    title: "İpucu 💡",
    text: "Düzenli içerik paylaşmak, keşfete düşme şansını %60 artırır.",
    action: "/create-post",
    btnText: "Yeni Post Paylaş"
  }
})

const fetchDashboardData = async () => {
  loading.value = true
  const userId = authStore.user.id

  try {
    // ---------------------------------------------
    // 1. İŞLETME YETKİSİ KONTROLÜ
    // ---------------------------------------------
    let { data: bData } = await supabase.from('businesses').select('*').eq('owner_id', userId).maybeSingle()
    
    if (bData) {
      business.value = bData
      userRole.value = 'owner'
      showBusinessSection.value = true
    } else {
      const { data: sData } = await supabase.from('business_staff').select('role, businesses (*)').eq('user_id', userId).maybeSingle()
      if (sData) {
        business.value = sData.businesses
        userRole.value = sData.role
        showBusinessSection.value = true
      }
    }

    // ---------------------------------------------
    // 2. YAYINCI YETKİSİ KONTROLÜ
    // ---------------------------------------------
    if (authStore.profile?.role === 'publisher') {
      showPublisherSection.value = true
      
      // Profildeki takipçi sayısını al (Auth store'dan gelmesi lazım, yoksa 0)
      publisherStats.value.followers = authStore.profile.followers_count || 0

      // Post İstatistiklerini Çek
      const { data: posts } = await supabase.from('posts').select('likes_count, saves_count').eq('user_id', userId)
      if (posts) {
        publisherStats.value.totalPosts = posts.length
        publisherStats.value.totalLikes = posts.reduce((a, b) => a + (b.likes_count || 0), 0)
        publisherStats.value.totalSaves = posts.reduce((a, b) => a + (b.saves_count || 0), 0)
      }
    }

    // ---------------------------------------------
    // 3. YETKİ YOKSA -> ŞUTLA 🚫
    // ---------------------------------------------
    if (!showBusinessSection.value && !showPublisherSection.value) {
      // İşletme Başvuru banner'ı bilerek kaldırıldı.
      // Sadece yetkisiz kullanıcıyı anasayfaya atıyoruz.
      router.replace('/') 
    }

  } catch (error) {
    console.error('Dashboard hatası:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (authStore.user) {
    fetchDashboardData()
  } else {
    router.replace('/login')
  }
})
</script>

<template>
  <DefaultLayout>
    <div class="max-w-7xl mx-auto px-4 py-8 pb-24">
      
      <!-- YÜKLENİYOR -->
      <div v-if="loading" class="flex justify-center py-20">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>

      <div v-else class="space-y-12">

        <!-- ================================================= -->
        <!-- BÖLÜM 1: YÖNETİM PANELİ (İşletme) -->
        <!-- ================================================= -->
        <section v-if="showBusinessSection" class="animate-fade-in">
          <div class="flex items-center gap-3 mb-6">
            <span class="text-3xl">💼</span>
            <div>
              <h2 class="text-2xl font-bold text-gray-900">Yönetim Paneli</h2>
              <p class="text-gray-500 text-sm">İşletmenizin kontrol merkezi.</p>
            </div>
          </div>

          <!-- İşletme Kartı -->
          <div class="bg-gray-900 text-white rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-center gap-6 relative overflow-hidden">
            <!-- Dekoratif Glow -->
            <div class="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none"></div>

            <div class="w-16 h-16 rounded-lg bg-white/10 flex items-center justify-center shrink-0 border border-white/20 overflow-hidden relative z-10">
              <img v-if="business?.logo_url" :src="business.logo_url" class="w-full h-full object-cover">
              <span v-else class="text-2xl">🏢</span>
            </div>
            <div class="flex-1 text-center md:text-left relative z-10">
              <h1 class="text-2xl font-bold">{{ business?.name }}</h1>
              <p class="text-gray-400 text-xs mt-1 uppercase tracking-wide font-bold">
                {{ userRole === 'owner' ? 'Yönetici' : 'Personel' }} Modu
              </p>
            </div>
            <div class="flex gap-3 relative z-10">
              <router-link :to="`/business/${business?.slug}`" target="_blank" class="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-sm font-bold transition">Vitrin</router-link>
              <router-link v-if="userRole === 'owner'" to="/settings/business" class="bg-white text-gray-900 hover:bg-gray-100 px-4 py-2 rounded-lg text-sm font-bold transition">Ayarlar</router-link>
            </div>
          </div>

          <!-- Araçlar Menüsü (Grid) -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            
            <!-- Randevular -->
            <router-link 
              to="/business/appointments" 
              class="p-5 bg-white border border-gray-200 rounded-xl hover:border-primary-500 hover:shadow-md transition text-left group"
            >
              <span class="text-2xl mb-2 block group-hover:scale-110 transition">📅</span>
              <span class="font-bold text-gray-900 block text-sm">Randevular</span>
            </router-link>

            <!-- Ekip (Sadece Owner) -->
            <router-link 
              v-if="userRole === 'owner'" 
              to="/my-staff" 
              class="p-5 bg-white border border-gray-200 rounded-xl hover:border-primary-500 hover:shadow-md transition text-left group"
            >
              <span class="text-2xl mb-2 block group-hover:scale-110 transition">👥</span>
              <span class="font-bold text-gray-900 block text-sm">Ekip & Uzmanlar</span>
            </router-link>
            
            <!-- Hizmetler (Sadece Owner) -->
            <router-link 
              v-if="userRole === 'owner'"
              to="/my-services" 
              class="p-5 bg-white border border-gray-200 rounded-xl hover:border-primary-500 hover:shadow-md transition text-left group"
            >
              <span class="text-2xl mb-2 block group-hover:scale-110 transition">✂️</span>
              <span class="font-bold text-gray-900 block text-sm">Hizmetler</span>
            </router-link>

            <!-- Raporlar (Sadece Owner) -->
            <router-link 
              v-if="userRole === 'owner'"
              to="/business/reports" 
              class="p-5 bg-white border border-gray-200 rounded-xl hover:border-primary-500 hover:shadow-md transition text-left group"
            >
              <span class="text-2xl mb-2 block group-hover:scale-110 transition">📈</span>
              <span class="font-bold text-gray-900 block text-sm">Kasa & Raporlar</span>
            </router-link>

          </div>
        </section>

        <!-- ================================================= -->
        <!-- BÖLÜM 2: İÇERİK STÜDYOSU (Yayıncı - YENİLENMİŞ) -->
        <!-- ================================================= -->
        <section v-if="showPublisherSection" class="animate-fade-in">
          
          <div class="flex items-center justify-between mb-6">
            <div class="flex items-center gap-3">
              <span class="text-3xl">✨</span>
              <div>
                <h2 class="text-2xl font-bold text-gray-900">İçerik Stüdyosu</h2>
                <p class="text-gray-500 text-sm">Yayıncı performans özeti.</p>
              </div>
            </div>
            
            <!-- Hızlı Eylem Butonu -->
            <router-link to="/create-post" class="hidden sm:flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-800 transition shadow-lg">
              <span>+</span> Yeni İçerik
            </router-link>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            <!-- SOL: İSTATİSTİK KARTLARI (Grid) -->
            <div class="lg:col-span-2 grid grid-cols-2 gap-4">
              
              <!-- Takipçi Kartı (Mor) -->
              <div class="bg-gradient-to-br from-purple-50 to-white p-5 rounded-xl border border-purple-100 shadow-sm flex flex-col justify-between">
                <div class="flex justify-between items-start">
                  <p class="text-purple-900 text-xs font-bold uppercase tracking-wider">Takipçi</p>
                  <span class="text-xl">👥</span>
                </div>
                <p class="text-3xl font-bold text-gray-900 mt-2">{{ publisherStats.followers }}</p>
              </div>

              <!-- Beğeni Kartı (Kırmızı) -->
              <div class="bg-gradient-to-br from-red-50 to-white p-5 rounded-xl border border-red-100 shadow-sm flex flex-col justify-between">
                <div class="flex justify-between items-start">
                  <p class="text-red-900 text-xs font-bold uppercase tracking-wider">Beğeni</p>
                  <span class="text-xl">❤️</span>
                </div>
                <p class="text-3xl font-bold text-gray-900 mt-2">{{ publisherStats.totalLikes }}</p>
              </div>

              <!-- Kaydedilme Kartı (Mavi) -->
              <div class="bg-gradient-to-br from-blue-50 to-white p-5 rounded-xl border border-blue-100 shadow-sm flex flex-col justify-between">
                <div class="flex justify-between items-start">
                  <p class="text-blue-900 text-xs font-bold uppercase tracking-wider">Kaydedilme</p>
                  <span class="text-xl">🔖</span>
                </div>
                <p class="text-3xl font-bold text-gray-900 mt-2">{{ publisherStats.totalSaves }}</p>
              </div>

              <!-- Yönetim Kısayolu (Beyaz) -->
              <div class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between cursor-pointer hover:border-gray-400 transition group" @click="router.push('/my-posts')">
                <div class="flex justify-between items-start">
                  <p class="text-gray-500 text-xs font-bold uppercase tracking-wider">Toplam Paylaşım</p>
                  <span class="text-xl group-hover:scale-110 transition">📸</span>
                </div>
                <p class="text-3xl font-bold text-gray-900 mt-2">{{ publisherStats.totalPosts }}</p>
                <p class="text-xs text-primary-600 mt-1 font-bold group-hover:underline">Listeyi Yönet &rarr;</p>
              </div>

            </div>

            <!-- SAĞ: AKILLI ÖNERİ KUTUSU (Smart Tip) -->
            <div class="bg-yellow-50 border border-yellow-200 rounded-xl p-6 flex flex-col justify-center relative overflow-hidden">
              <div class="absolute top-0 right-0 -mr-4 -mt-4 text-yellow-200 opacity-50">
                <svg class="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
              </div>
              
              <div class="relative z-10">
                <h3 class="font-bold text-yellow-900 text-lg mb-2">{{ dailyTip.title }}</h3>
                <p class="text-yellow-800 text-sm mb-6 leading-relaxed">
                  {{ dailyTip.text }}
                </p>
                
                <router-link 
                  v-if="dailyTip.btnText" 
                  :to="dailyTip.action" 
                  class="bg-yellow-100 text-yellow-900 px-4 py-2 rounded-lg text-sm font-bold border border-yellow-300 hover:bg-yellow-200 transition inline-block"
                >
                  {{ dailyTip.btnText }} →
                </router-link>
              </div>
            </div>

          </div>
        </section>

      </div>
    </div>
  </DefaultLayout>
</template>