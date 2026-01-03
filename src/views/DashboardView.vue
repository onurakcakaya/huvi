<script setup>
import { onMounted, ref } from 'vue'
import { supabase } from '../supabase'
import { useAuthStore } from '../stores/auth'
import { RouterLink } from 'vue-router'

const authStore = useAuthStore()
const loading = ref(true)

// İstatistik Verileri
const stats = ref({
  totalPosts: 0,
  totalLikes: 0,
  totalSaves: 0,
  totalComments: 0,
  followers: 0,
  following: 0
})

const recentPosts = ref([]) 

// İşletme Durumları
const hasBusiness = ref(false)
const hasPendingApp = ref(false)

const fetchDashboardData = async () => {
  try {
    loading.value = true
    const userId = authStore.user.id

    // 1. POST VERİLERİNİ ÇEK
    const { data: postsData, error: postsError } = await supabase
      .from('posts')
      .select('id, title, created_at, likes_count, saves_count, comments_count')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (postsError) throw postsError

    stats.value.totalPosts = postsData.length
    stats.value.totalLikes = postsData.reduce((sum, post) => sum + (post.likes_count || 0), 0)
    stats.value.totalSaves = postsData.reduce((sum, post) => sum + (post.saves_count || 0), 0)
    stats.value.totalComments = postsData.reduce((sum, post) => sum + (post.comments_count || 0), 0)

    // 2. PROFİL VERİLERİNİ ÇEK
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('followers_count, following_count')
      .eq('id', userId)
      .single()
    
    if (profileError) throw profileError

    stats.value.followers = profileData.followers_count || 0
    stats.value.following = profileData.following_count || 0

    // 3. SON 3 POSTU AL
    recentPosts.value = postsData.slice(0, 3)

    // 4. İŞLETME KONTROLÜ (Zaten patron mu?)
    const { data: staffRecord } = await supabase
      .from('business_staff')
      .select('id')
      .eq('profile_id', userId)
      .eq('role', 'owner')
      .maybeSingle()
    
    if (staffRecord) hasBusiness.value = true

    // 5. BAŞVURU KONTROLÜ (Bekleyen başvurusu var mı?)
    if (!staffRecord) {
        const { data: appRecord } = await supabase
          .from('business_applications')
          .select('id')
          .eq('user_id', userId)
          .eq('status', 'pending')
          .maybeSingle()
        
        if (appRecord) hasPendingApp.value = true
    }

  } catch (error) {
    console.error('Dashboard veri hatası:', error)
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
    
    <!-- 1. SOL MENÜ (Desktop) -->
    <aside class="w-64 bg-white border-r border-gray-200 hidden lg:block min-h-screen flex-shrink-0">
      <div class="p-6">
        <h2 class="text-xl font-bold text-primary-600 flex items-center gap-2">
          <span>⚡</span> Panel
        </h2>
      </div>
      <nav class="mt-4 px-4 space-y-2">
        <div class="px-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Yönetim</div>
        
        <RouterLink to="/dashboard" active-class="bg-primary-50 text-primary-700" class="flex items-center px-4 py-3 text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-lg font-medium transition">
          <span class="mr-3">📊</span> Genel Bakış
        </RouterLink>
        
        <RouterLink to="/dashboard/posts" active-class="bg-primary-50 text-primary-700" class="flex items-center px-4 py-3 text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition">
          <span class="mr-3">📝</span> Yayınlarım
        </RouterLink>

        <RouterLink to="/dashboard/settings" active-class="bg-primary-50 text-primary-700" class="flex items-center px-4 py-3 text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition">
          <span class="mr-3">⚙️</span> Profil Ayarları
        </RouterLink>

        <!-- İşletme Linki (Varsa) -->
        <RouterLink v-if="hasBusiness" to="/dashboard/business" active-class="bg-gray-800 text-white" class="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg font-bold transition mt-4 border border-gray-200">
          <span class="mr-3">🏢</span> İşletmem
        </RouterLink>

        <div class="border-t my-4"></div>

        <RouterLink to="/" class="flex items-center px-4 py-3 text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition">
          <span class="mr-3">🏠</span> Siteye Dön
        </RouterLink>
      </nav>
    </aside>

    <!-- ANA İÇERİK -->
    <main class="flex-1 p-4 sm:p-8 overflow-x-hidden">
      
      <!-- 2. MOBİL MENÜ -->
      <div class="lg:hidden mb-6 overflow-x-auto pb-2 scrollbar-hide">
        <nav class="flex space-x-2">
          <RouterLink to="/dashboard" active-class="bg-primary-600 text-white border-transparent" class="whitespace-nowrap px-4 py-2 rounded-full border border-gray-300 bg-white text-gray-700 text-sm font-medium flex items-center shadow-sm">
            📊 Genel
          </RouterLink>
          <RouterLink to="/dashboard/posts" active-class="bg-primary-600 text-white border-transparent" class="whitespace-nowrap px-4 py-2 rounded-full border border-gray-300 bg-white text-gray-700 text-sm font-medium flex items-center shadow-sm">
            📝 Yayınlarım
          </RouterLink>
          <RouterLink to="/dashboard/settings" active-class="bg-primary-600 text-white border-transparent" class="whitespace-nowrap px-4 py-2 rounded-full border border-gray-300 bg-white text-gray-700 text-sm font-medium flex items-center shadow-sm">
            ⚙️ Ayarlar
          </RouterLink>
           <RouterLink to="/create-post" class="whitespace-nowrap px-4 py-2 rounded-full border border-green-600 bg-green-50 text-green-700 text-sm font-bold flex items-center shadow-sm">
            ➕ Ekle
          </RouterLink>
        </nav>
      </div>

      <!-- Hoşgeldin Başlığı -->
      <div class="mb-8">
        <h1 class="text-2xl sm:text-3xl font-bold text-gray-800">
          Hoşgeldin, {{ authStore.profile?.full_name?.split(' ')[0] }}! 👋
        </h1>
        <div class="flex items-center gap-2 mt-2">
          <span class="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium border border-green-200">
            {{ authStore.profile?.profession || 'Yayıncı' }}
          </span>
          <p class="text-gray-500 text-sm">Panelin hazır.</p>
        </div>
      </div>

      <!-- Yükleniyor... -->
      <div v-if="loading" class="flex justify-center py-20">
        <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
      </div>

      <div v-else>
        <!-- 3. İSTATİSTİKLER -->
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
            <p class="text-xs font-medium text-gray-500 uppercase">Takipçi</p>
            <div class="flex items-end justify-between mt-2">
              <p class="text-2xl font-bold text-gray-800">{{ stats.followers }}</p> <span class="text-xl">👥</span>
            </div>
          </div>
          <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
            <p class="text-xs font-medium text-gray-500 uppercase">Takip</p>
            <div class="flex items-end justify-between mt-2">
              <p class="text-2xl font-bold text-gray-800">{{ stats.following }}</p> <span class="text-xl">👣</span>
            </div>
          </div>
          <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
            <p class="text-xs font-medium text-gray-500 uppercase">İçerik</p>
            <div class="flex items-end justify-between mt-2">
              <p class="text-2xl font-bold text-gray-800">{{ stats.totalPosts }}</p> <span class="text-xl">📝</span>
            </div>
          </div>
          <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
            <p class="text-xs font-medium text-gray-500 uppercase">Beğeni</p>
            <div class="flex items-end justify-between mt-2">
              <p class="text-2xl font-bold text-gray-800">{{ stats.totalLikes }}</p> <span class="text-xl">❤️</span>
            </div>
          </div>
          <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
            <p class="text-xs font-medium text-gray-500 uppercase">Kaydetme</p>
            <div class="flex items-end justify-between mt-2">
              <p class="text-2xl font-bold text-gray-800">{{ stats.totalSaves }}</p> <span class="text-xl">🔖</span>
            </div>
          </div>
           <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
            <p class="text-xs font-medium text-gray-500 uppercase">Yorumlar</p>
            <div class="flex items-end justify-between mt-2">
              <p class="text-2xl font-bold text-gray-800">{{ stats.totalComments }}</p> <span class="text-xl">💬</span>
            </div>
          </div>
        </div>

        <!-- 4. KISAYOLLAR & SON AKTİVİTELER -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <!-- Sol: Kısayollar -->
          <div class="lg:col-span-1 space-y-6">
            <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 class="font-bold text-gray-800 mb-4">Hızlı İşlemler</h3>
              <div class="space-y-3">
                <RouterLink to="/create-post" class="block w-full text-center bg-primary-600 text-white py-3 rounded-lg font-medium hover:bg-primary-700 transition shadow-sm hover:shadow-md">
                  ➕ Yeni İçerik Paylaş
                </RouterLink>
                <RouterLink to="/dashboard/settings" class="block w-full text-center bg-white border border-gray-300 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-50 transition">
                  ✏️ Profili Düzenle
                </RouterLink>
                <RouterLink to="/dashboard/posts" class="block w-full text-center bg-white border border-gray-300 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-50 transition">
                  📂 Tüm Yayınları Gör
                </RouterLink>

                <!-- DİNAMİK İŞLETME BUTONU -->
                <div class="mt-4 pt-4 border-t border-gray-100">
                  <RouterLink v-if="hasBusiness" to="/dashboard/business" class="block w-full text-center bg-gray-900 text-white py-3 rounded-lg font-medium hover:bg-black transition shadow-sm border border-gray-900">
                    🏢 İşletmemi Yönet
                  </RouterLink>

                  <div v-else-if="hasPendingApp" class="block w-full text-center bg-yellow-50 text-yellow-800 py-3 rounded-lg font-medium border border-yellow-200">
                    ⏳ Başvurunuz İnceleniyor
                  </div>

                  <RouterLink v-else to="/create-business" class="block w-full text-center bg-white border border-gray-900 text-gray-900 py-3 rounded-lg font-bold hover:bg-gray-50 transition shadow-sm">
                    💼 İşletme Başvurusu Yap
                  </RouterLink>
                </div>

              </div>
            </div>

            <!-- İpucu Kartı -->
            <div class="bg-gradient-to-br from-purple-500 to-primary-600 p-6 rounded-xl shadow-lg text-white">
              <h3 class="font-bold text-lg mb-2">💡 İpucu</h3>
              <p class="text-primary-100 text-sm opacity-90">
                Takipçilerin video içeriklerini %40 daha fazla beğeniyor. Bir sonraki paylaşımında video kullanmayı dene!
              </p>
            </div>
          </div>

          <!-- Sağ: Son Paylaşımlar Tablosu -->
          <div class="lg:col-span-2">
            <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div class="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                <h3 class="font-bold text-gray-800">Son Paylaşımlar</h3>
                <RouterLink to="/dashboard/posts" class="text-sm text-primary-600 font-medium hover:underline">Tümünü Gör</RouterLink>
              </div>

              <!-- Tabloyu Mobilde Kaydırılabilir Yap -->
              <div class="overflow-x-auto">
                <div v-if="recentPosts.length === 0" class="p-8 text-center text-gray-400">
                  Henüz veri yok.
                </div>

                <table v-else class="w-full text-left whitespace-nowrap">
                  <thead class="bg-gray-50 text-xs uppercase text-gray-500">
                    <tr>
                      <th class="px-6 py-3">Başlık</th>
                      <th class="px-6 py-3 text-center">Beğeni</th>
                      <th class="px-6 py-3 text-right">Tarih</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-100">
                    <tr v-for="post in recentPosts" :key="post.id" class="hover:bg-gray-50 transition">
                      <td class="px-6 py-4 font-medium text-gray-800 truncate max-w-[150px]">
                        {{ post.title }}
                      </td>
                      <td class="px-6 py-4 text-center">
                        <span class="inline-flex items-center px-2 py-1 rounded bg-red-50 text-red-600 text-xs font-bold">
                          {{ post.likes_count }}
                        </span>
                      </td>
                      <td class="px-6 py-4 text-right text-gray-500 text-sm">
                        {{ new Date(post.created_at).toLocaleDateString('tr-TR') }}
                      </td>
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