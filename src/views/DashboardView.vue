<script setup>
  import { onMounted, ref, computed } from 'vue'
  import { supabase } from '../supabase'
  import { useAuthStore } from '../stores/auth'
  import DefaultLayout from '../layouts/DefaultLayout.vue'
  
  const authStore = useAuthStore()
  const loading = ref(true)
  
  // Veriler
  const business = ref(null)
  const userRole = ref(null) // 'owner' veya 'staff'
  const publisherStats = ref(null) // Post varsa obje olacak, yoksa null
  
  const fetchDashboardData = async () => {
    loading.value = true
    const userId = authStore.user.id
  
    try {
      // ----------------------------------------------------
      // 1. İŞLETME KONTROLÜ
      // ----------------------------------------------------
      
      // A. Owner mı?
      let { data: bData } = await supabase
        .from('businesses')
        .select('*')
        .eq('owner_id', userId)
        .single()
  
      if (bData) {
        business.value = bData
        userRole.value = 'owner'
      } else {
        // B. Staff mı?
        const { data: sData } = await supabase
          .from('business_staff')
          .select('role, businesses (*)')
          .eq('user_id', userId)
          .single()
        
        if (sData) {
          business.value = sData.businesses
          userRole.value = sData.role
        }
      }
  
      // ----------------------------------------------------
      // 2. YAYINCI KONTROLÜ (Sadece postu varsa)
      // ----------------------------------------------------
      const { data: postsData } = await supabase
        .from('posts')
        .select('likes_count, saves_count')
        .eq('user_id', userId)
  
      // Eğer en az 1 postu varsa, bu adam bir yayıncıdır/aktif kullanıcıdır.
      if (postsData && postsData.length > 0) {
        publisherStats.value = {
          totalPosts: postsData.length,
          totalLikes: postsData.reduce((sum, p) => sum + (p.likes_count || 0), 0),
          totalSaves: postsData.reduce((sum, p) => sum + (p.saves_count || 0), 0)
        }
      }
  
    } catch (error) {
      console.error('Hata:', error)
    } finally {
      loading.value = false
    }
  }
  
  onMounted(() => {
    if (authStore.user) fetchDashboardData()
  })
  </script>
  
  <template>
    <DefaultLayout>
      <div class="max-w-7xl mx-auto px-4 py-8 pb-24">
        
        <!-- YÜKLENİYOR -->
        <div v-if="loading" class="flex justify-center py-20">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
  
        <!-- KAPSAYICI (Data geldiyse) -->
        <div v-else class="space-y-12">
  
          <!-- ========================================== -->
          <!-- DURUM A: İŞLETME YÖNETİMİ -->
          <!-- ========================================== -->
          <section v-if="business" class="animate-fade-in">
            <div class="flex items-center gap-3 mb-6">
              <span class="text-3xl">💼</span>
              <div>
                <h2 class="text-2xl font-bold text-gray-900">İşletme Paneli</h2>
                <p class="text-gray-500 text-sm">Randevu ve ekip yönetimi.</p>
              </div>
            </div>
  
            <!-- İşletme Kartı -->
            <div class="bg-gray-900 text-white rounded-2xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-center gap-6 shadow-xl">
              <div class="flex items-center gap-4 w-full md:w-auto">
                <!-- Logo -->
                <div class="w-16 h-16 rounded-lg bg-white/10 flex items-center justify-center shrink-0 overflow-hidden border border-white/10">
                  <img v-if="business.logo_url" :src="business.logo_url" class="w-full h-full object-cover">
                  <span v-else class="text-2xl">🏢</span>
                </div>
                
                <div>
                  <h1 class="text-2xl font-bold">{{ business.name }}</h1>
                  <p class="text-gray-400 text-sm mt-1 flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full bg-green-500"></span>
                    {{ userRole === 'owner' ? 'Yönetici Erişimi' : 'Personel Erişimi' }}
                  </p>
                </div>
              </div>
  
              <div class="flex gap-3 w-full md:w-auto">
                 <router-link :to="`/business/${business.slug}`" target="_blank" class="flex-1 md:flex-none text-center bg-white/10 hover:bg-white/20 text-white px-4 py-3 rounded-lg text-sm font-medium transition">
                  Vitrine Git
                </router-link>
                <router-link v-if="userRole === 'owner'" to="/settings/business" class="flex-1 md:flex-none text-center bg-white text-gray-900 hover:bg-gray-100 px-6 py-3 rounded-lg text-sm font-bold transition">
                  Ayarlar
                </router-link>
              </div>
            </div>
  
            <!-- Grid Menu -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div class="p-6 bg-white border border-gray-200 rounded-xl hover:border-primary-500 cursor-pointer transition group">
                <span class="text-3xl block mb-2 group-hover:scale-110 transition">📅</span>
                <span class="font-bold text-gray-900">Randevular</span>
              </div>
              
              <router-link v-if="userRole === 'owner'" to="/my-staff" class="p-6 bg-white border border-gray-200 rounded-xl hover:border-primary-500 cursor-pointer transition group block">
                <span class="text-3xl block mb-2 group-hover:scale-110 transition">👥</span>
                <span class="font-bold text-gray-900">Ekip Yönetimi</span>
              </router-link>
  
              <div class="p-6 bg-white border border-gray-200 rounded-xl hover:border-primary-500 cursor-pointer transition group">
                <span class="text-3xl block mb-2 group-hover:scale-110 transition">✂️</span>
                <span class="font-bold text-gray-900">Hizmetler</span>
              </div>
  
              <div class="p-6 bg-white border border-gray-200 rounded-xl hover:border-primary-500 cursor-pointer transition group">
                <span class="text-3xl block mb-2 group-hover:scale-110 transition">📊</span>
                <span class="font-bold text-gray-900">Raporlar</span>
              </div>
            </div>
          </section>
  
  
          <!-- ========================================== -->
          <!-- DURUM B: YAYINCI İSTATİSTİKLERİ (Varsa) -->
          <!-- ========================================== -->
          <section v-if="publisherStats" class="animate-fade-in">
            <div class="flex items-center justify-between mb-6">
              <div class="flex items-center gap-3">
                <span class="text-3xl">✨</span>
                <div>
                  <h2 class="text-2xl font-bold text-gray-900">İçerik Stüdyosu</h2>
                  <p class="text-gray-500 text-sm">Paylaşımlarının performansı.</p>
                </div>
              </div>
              <router-link to="/my-posts" class="text-primary-600 font-bold hover:underline text-sm">Tümünü Gör</router-link>
            </div>
  
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div class="bg-gradient-to-br from-purple-50 to-white p-6 rounded-2xl border border-purple-100 shadow-sm">
                <p class="text-purple-900 text-xs font-bold uppercase tracking-wider mb-1">Paylaşım</p>
                <p class="text-4xl font-bold text-gray-900">{{ publisherStats.totalPosts }}</p>
              </div>
              <div class="bg-gradient-to-br from-red-50 to-white p-6 rounded-2xl border border-red-100 shadow-sm">
                <p class="text-red-900 text-xs font-bold uppercase tracking-wider mb-1">Beğeni</p>
                <p class="text-4xl font-bold text-gray-900">{{ publisherStats.totalLikes }}</p>
              </div>
              <div class="bg-gradient-to-br from-blue-50 to-white p-6 rounded-2xl border border-blue-100 shadow-sm">
                <p class="text-blue-900 text-xs font-bold uppercase tracking-wider mb-1">Kaydedilme</p>
                <p class="text-4xl font-bold text-gray-900">{{ publisherStats.totalSaves }}</p>
              </div>
            </div>
          </section>
  
  
          <!-- ========================================== -->
          <!-- DURUM C: HİÇBİRİ YOKSA (HOŞGELDİN) -->
          <!-- ========================================== -->
          <div v-if="!business && !publisherStats" class="text-center py-20">
            <div class="bg-gray-50 rounded-3xl p-10 max-w-2xl mx-auto border border-dashed border-gray-300">
              <span class="text-6xl block mb-6">👋</span>
              <h1 class="text-3xl font-bold text-gray-900">HUVI'ye Hoşgeldin!</h1>
              <p class="text-gray-500 mt-3 text-lg">Henüz bir işletmen veya paylaşımın yok. Nereden başlamak istersin?</p>
              
              <div class="flex flex-col sm:flex-row gap-4 justify-center mt-8">
                <router-link to="/apply-business" class="bg-gray-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-black transition shadow-lg">
                  İşletme Oluştur 💼
                </router-link>
                <router-link to="/create-post" class="bg-white text-gray-900 border border-gray-300 px-8 py-3 rounded-xl font-bold hover:bg-gray-50 transition">
                  İçerik Paylaş ✨
                </router-link>
              </div>
            </div>
          </div>
  
        </div>
      </div>
    </DefaultLayout>
  </template>