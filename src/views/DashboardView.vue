<script setup>
  import { onMounted, ref } from 'vue'
  import { supabase } from '../supabase'
  import { useAuthStore } from '../stores/auth'
  import { RouterLink } from 'vue-router'
  
  const authStore = useAuthStore()
  const loading = ref(true)
  
  // İstatistik Verileri
  const stats = ref({
    totalPosts: 0, totalLikes: 0, totalSaves: 0, totalComments: 0, followers: 0, following: 0
  })
  
  const recentPosts = ref([]) 
  
  // İşletme Durumları
  const hasBusiness = ref(false)
  const hasPendingApp = ref(false)
  
  const fetchDashboardData = async () => {
    try {
      loading.value = true
      const userId = authStore.user.id
  
      // 1. Post İstatistikleri
      const { data: postsData } = await supabase.from('posts').select('id, likes_count, saves_count, comments_count').eq('user_id', userId)
      if (postsData) {
        stats.value.totalPosts = postsData.length
        stats.value.totalLikes = postsData.reduce((a, b) => a + (b.likes_count || 0), 0)
        stats.value.totalSaves = postsData.reduce((a, b) => a + (b.saves_count || 0), 0)
        stats.value.totalComments = postsData.reduce((a, b) => a + (b.comments_count || 0), 0)
      }
  
      // 2. Profil Verisi
      const { data: profileData } = await supabase.from('profiles').select('followers_count, following_count').eq('id', userId).single()
      if (profileData) {
        stats.value.followers = profileData.followers_count || 0
        stats.value.following = profileData.following_count || 0
      }
  
      // 3. Son Postlar
      const { data: recent } = await supabase.from('posts').select('id, title, created_at, likes_count').eq('user_id', userId).order('created_at', { ascending: false }).limit(3)
      recentPosts.value = recent || []
  
      // 4. İŞLETME KONTROLÜ (GÜNCELLENDİ: SADELEŞTİRİLDİ)
      // Rol kontrolünü kaldırdık. Kullanıcı business_staff tablosunda var mı? Varsa göster.
      const { data: staffRecord, error: staffError } = await supabase
        .from('business_staff')
        .select('id')
        .eq('profile_id', userId)
        .maybeSingle()
      
      if (staffError) console.error('Staff Check Error:', staffError)
      
      if (staffRecord) {
        hasBusiness.value = true
        console.log('Kullanıcı bir işletmede yetkili, butonlar aktif.')
      }
  
      // 5. BAŞVURU KONTROLÜ
      // Eğer işletme personeli değilse başvuru durumuna bak
      if (!staffRecord) {
          const { data: appRecord } = await supabase.from('business_applications').select('id').eq('user_id', userId).eq('status', 'pending').maybeSingle()
          if (appRecord) hasPendingApp.value = true
      }
  
    } catch (error) {
      console.error('Genel Hata:', error)
    } finally {
      loading.value = false
    }
  }
  
  onMounted(() => {
    fetchDashboardData()
  })
  </script>
  
  <template>
    <div class="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
      
      <!-- Sidebar -->
      <aside class="w-64 bg-white border-r border-gray-200 hidden lg:block min-h-screen flex-shrink-0">
        <div class="p-6"><h2 class="text-xl font-bold text-primary-600 flex items-center gap-2"><span>⚡</span> Panel</h2></div>
        <nav class="mt-4 px-4 space-y-2">
          <RouterLink to="/dashboard" active-class="bg-primary-50 text-primary-700" class="flex items-center px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition"><span class="mr-3">📊</span> Genel Bakış</RouterLink>
          <RouterLink to="/dashboard/posts" active-class="bg-primary-50 text-primary-700" class="flex items-center px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition"><span class="mr-3">📝</span> Yayınlarım</RouterLink>
          <RouterLink to="/dashboard/settings" active-class="bg-primary-50 text-primary-700" class="flex items-center px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition"><span class="mr-3">⚙️</span> Profil Ayarları</RouterLink>
          
          <!-- Masaüstü İşletme Linki (Varsa) -->
          <RouterLink v-if="hasBusiness" to="/dashboard/business" class="flex items-center px-4 py-3 mt-4 text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-lg font-bold border border-gray-300 transition">
            <span class="mr-3">🏢</span> İşletmem
          </RouterLink>
  
          <!-- Masaüstü Personel Linki (Varsa) - Ekstra Kolaylık Olsun Diye -->
          <RouterLink v-if="hasBusiness" to="/dashboard/staff" class="flex items-center px-4 py-3 text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg font-bold border border-blue-200 transition mt-2">
            <span class="mr-3">👥</span> Ekip Yönetimi
          </RouterLink>
  
          <div class="border-t my-4"></div>
          <RouterLink to="/" class="flex items-center px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition"><span class="mr-3">🏠</span> Siteye Dön</RouterLink>
        </nav>
      </aside>
  
      <!-- Main Content -->
      <main class="flex-1 p-4 sm:p-8 overflow-x-hidden">
        <!-- Mobil Menü -->
        <div class="lg:hidden mb-6 overflow-x-auto pb-2 scrollbar-hide">
          <nav class="flex space-x-2">
            <RouterLink to="/dashboard" active-class="bg-primary-600 text-white" class="whitespace-nowrap px-4 py-2 rounded-full border bg-white text-gray-700 font-medium shadow-sm">📊 Genel</RouterLink>
            <RouterLink to="/dashboard/posts" active-class="bg-primary-600 text-white" class="whitespace-nowrap px-4 py-2 rounded-full border bg-white text-gray-700 font-medium shadow-sm">📝 Yayınlarım</RouterLink>
            <RouterLink to="/dashboard/settings" active-class="bg-primary-600 text-white" class="whitespace-nowrap px-4 py-2 rounded-full border bg-white text-gray-700 font-medium shadow-sm">⚙️ Ayarlar</RouterLink>
          </nav>
        </div>
  
        <!-- Başlık -->
        <div class="mb-8">
          <h1 class="text-2xl sm:text-3xl font-bold text-gray-800">Hoşgeldin, {{ authStore.profile?.full_name?.split(' ')[0] }}! 👋</h1>
          <div class="flex items-center gap-2 mt-2">
            <span class="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium border border-green-200">{{ authStore.profile?.profession || 'Yayıncı' }}</span>
          </div>
        </div>
  
        <div v-if="loading" class="flex justify-center py-20"><div class="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div></div>
  
        <div v-else>
          <!-- İstatistikler -->
          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between"><p class="text-xs font-medium text-gray-500 uppercase">Takipçi</p><p class="text-2xl font-bold text-gray-800">{{ stats.followers }}</p></div>
            <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between"><p class="text-xs font-medium text-gray-500 uppercase">Takip</p><p class="text-2xl font-bold text-gray-800">{{ stats.following }}</p></div>
            <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between"><p class="text-xs font-medium text-gray-500 uppercase">İçerik</p><p class="text-2xl font-bold text-gray-800">{{ stats.totalPosts }}</p></div>
            <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between"><p class="text-xs font-medium text-gray-500 uppercase">Beğeni</p><p class="text-2xl font-bold text-gray-800">{{ stats.totalLikes }}</p></div>
            <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between"><p class="text-xs font-medium text-gray-500 uppercase">Kaydetme</p><p class="text-2xl font-bold text-gray-800">{{ stats.totalSaves }}</p></div>
            <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between"><p class="text-xs font-medium text-gray-500 uppercase">Yorumlar</p><p class="text-2xl font-bold text-gray-800">{{ stats.totalComments }}</p></div>
          </div>
  
          <!-- Hızlı İşlemler -->
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div class="lg:col-span-1 space-y-6">
              <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 class="font-bold text-gray-800 mb-4">Hızlı İşlemler</h3>
                <div class="space-y-3">
                  <RouterLink to="/create-post" class="block w-full text-center bg-primary-600 text-white py-3 rounded-lg font-medium hover:bg-primary-700 transition shadow-sm flex items-center justify-center gap-2">
                    <span>➕</span> Yeni İçerik Paylaş
                  </RouterLink>
                  <RouterLink to="/dashboard/settings" class="block w-full text-center bg-white border border-gray-300 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-50 transition flex items-center justify-center gap-2">
                    <span>✏️</span> Profili Düzenle
                  </RouterLink>
                  
                  <!-- BAŞVURU VE İŞLETME BUTONLARI -->
                  <div class="mt-4 pt-4 border-t border-gray-100 space-y-3">
                    
                    <template v-if="hasBusiness">
                      <!-- Vitrin Yönetimi -->
                      <RouterLink to="/dashboard/business" class="block w-full text-center bg-gray-900 text-white py-3 rounded-lg font-medium hover:bg-black transition shadow-sm border border-gray-900 flex items-center justify-center gap-2">
                        <span>🏢</span> İşletmemi Yönet (Vitrin)
                      </RouterLink>
                      
                      <!-- YENİ BUTON: PERSONEL YÖNETİMİ -->
                      <RouterLink to="/dashboard/staff" class="block w-full text-center bg-blue-50 text-blue-700 border border-blue-200 py-3 rounded-lg font-medium hover:bg-blue-100 transition shadow-sm flex items-center justify-center gap-2">
                        <span>👥</span> Ekip & Personel Yönetimi
                      </RouterLink>
                    </template>
  
                    <div v-else-if="hasPendingApp" class="block w-full text-center bg-yellow-50 text-yellow-800 py-3 rounded-lg font-medium border border-yellow-200 flex items-center justify-center gap-2">
                      <span>⏳</span> Başvurunuz İnceleniyor
                    </div>
  
                    <RouterLink v-else to="/apply-business" class="block w-full text-center bg-white border border-gray-900 text-gray-900 py-3 rounded-lg font-bold hover:bg-gray-50 transition shadow-sm flex items-center justify-center gap-2">
                      <span>💼</span> İşletme Başvurusu Yap
                    </RouterLink>
  
                  </div>
  
                </div>
              </div>
            </div>
  
            <!-- Son Paylaşımlar -->
            <div class="lg:col-span-2">
              <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div class="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                  <h3 class="font-bold text-gray-800">Son Paylaşımlar</h3>
                  <RouterLink to="/dashboard/posts" class="text-sm text-primary-600 font-medium hover:underline">Tümünü Gör</RouterLink>
                </div>
                <div class="overflow-x-auto">
                  <div v-if="recentPosts.length === 0" class="p-8 text-center text-gray-400">Henüz veri yok.</div>
                  <table v-else class="w-full text-left whitespace-nowrap">
                    <thead class="bg-gray-50 text-xs uppercase text-gray-500">
                      <tr><th class="px-6 py-3">Başlık</th><th class="px-6 py-3 text-center">Beğeni</th><th class="px-6 py-3 text-right">Tarih</th></tr>
                    </thead>
                    <tbody class="divide-y divide-gray-100">
                      <tr v-for="post in recentPosts" :key="post.id" class="hover:bg-gray-50 transition">
                        <td class="px-6 py-4 font-medium text-gray-800 truncate max-w-[150px]">{{ post.title }}</td>
                        <td class="px-6 py-4 text-center"><span class="inline-flex items-center px-2 py-1 rounded bg-red-50 text-red-600 text-xs font-bold">{{ post.likes_count }}</span></td>
                        <td class="px-6 py-4 text-right text-gray-500 text-sm">{{ new Date(post.created_at).toLocaleDateString('tr-TR') }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  </template>