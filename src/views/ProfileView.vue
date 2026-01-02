<script setup>
  import { onMounted, ref } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { supabase } from '../supabase'
  import DefaultLayout from '../layouts/DefaultLayout.vue'
  import PostCard from '../components/PostCard.vue'
  import { useAuthStore } from '../stores/auth'
  
  const route = useRoute()
  const router = useRouter()
  const authStore = useAuthStore()
  
  // State Verileri
  const profile = ref(null)
  const posts = ref([])
  const loading = ref(true)
  const isFollowing = ref(false) // Takip durumu
  const followLoading = ref(false) // Takip butonu yükleniyor mu?
  
  // Verileri Çek
  const fetchData = async () => {
    try {
      loading.value = true
      const userId = route.params.id
  
      // 1. Profil Bilgilerini Çek (Follower sayıları dahil)
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
  
      if (profileError) throw profileError
      profile.value = profileData
  
      // 2. Postları Çek
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select(`
          *,
          categories ( name ),
          profiles:user_id ( full_name, avatar_url )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
  
      if (postsError) throw postsError
      posts.value = postsData
  
      // 3. Takip Kontrolü (Eğer kendi profilim değilse ve giriş yapmışsam)
      if (authStore.user && authStore.user.id !== userId) {
        checkFollowStatus(userId)
      }
  
    } catch (error) {
      console.error('Veri hatası:', error.message)
    } finally {
      loading.value = false
    }
  }
  
  // Takip Ediyor muyum Kontrolü
  const checkFollowStatus = async (targetId) => {
    const { data } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', authStore.user.id)
      .eq('following_id', targetId)
      .maybeSingle()
    
    if (data) isFollowing.value = true
  }
  
  // Takip Et / Bırak Fonksiyonu
  const toggleFollow = async () => {
    if (!authStore.user) return router.push('/login')
    
    try {
      followLoading.value = true
      const targetId = profile.value.id
  
      if (isFollowing.value) {
        // --- TAKİBİ BIRAK ---
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', authStore.user.id)
          .eq('following_id', targetId)
        
        if (error) throw error
        
        isFollowing.value = false
        // Sayacı anlık düşür (Veritabanını tekrar sorgulamaya gerek yok)
        if (profile.value.followers_count > 0) profile.value.followers_count--
  
      } else {
        // --- TAKİP ET ---
        const { error } = await supabase
          .from('follows')
          .insert({
            follower_id: authStore.user.id,
            following_id: targetId
          })
        
        if (error) throw error
        
        isFollowing.value = true
        // Sayacı anlık arttır
        profile.value.followers_count++
      }
    } catch (error) {
      alert('İşlem başarısız: ' + error.message)
    } finally {
      followLoading.value = false
    }
  }
  
  onMounted(() => {
    fetchData()
  })
  </script>
  
  <template>
    <DefaultLayout>
      
      <!-- Yükleniyor -->
      <div v-if="loading" class="flex justify-center items-center h-96">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
  
      <!-- Profil Bulunamadı -->
      <div v-else-if="!profile" class="text-center py-20 text-gray-500">
        Kullanıcı bulunamadı.
      </div>
  
      <!-- PROFİL İÇERİĞİ -->
      <div v-else>
        
        <!-- 1. KARTVİZİT ALANI (Header) -->
        <div class="bg-white border-b mb-8">
          <div class="max-w-4xl mx-auto px-4 py-10 text-center">
            
            <!-- AVATAR KISMI -->
            <div class="mb-4 relative inline-block">
              <!-- Varsa Resim -->
              <img 
                v-if="profile.avatar_url" 
                :src="profile.avatar_url" 
                class="w-32 h-32 mx-auto rounded-full object-cover border-4 border-white shadow-lg"
                alt="Profil"
              >
              <!-- Yoksa Baş Harf -->
              <div 
                v-else 
                class="w-32 h-32 mx-auto bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-4xl font-bold border-4 border-white shadow-lg"
              >
                {{ profile.full_name?.[0] }}
              </div>
  
              <!-- Onay Rozeti (Eğer Unvan Varsa) -->
              <div v-if="profile.profession" class="absolute bottom-1 right-1 bg-green-500 text-white p-1.5 rounded-full border-2 border-white shadow-sm" title="Uzman">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>
              </div>
            </div>
  
            <!-- İsim -->
            <h1 class="text-3xl font-bold text-gray-900 mb-1">
              {{ profile.full_name }}
            </h1>
  
            <!-- Uzmanlık -->
            <div v-if="profile.profession" class="mb-4">
              <span class="bg-primary-50 text-primary-700 px-3 py-1 rounded-full text-sm font-medium">
                {{ profile.profession }}
              </span>
            </div>
  
            <!-- Bio -->
            <p v-if="profile.bio" class="text-gray-600 max-w-lg mx-auto mb-6 leading-relaxed">
              {{ profile.bio }}
            </p>
  
            <!-- AKSİYON BUTONLARI (Takip, WP, Mail) -->
<div class="mb-8 flex flex-wrap justify-center gap-3">
  
  <!-- 1. TAKİP BUTONU (Kendi profilim değilse) -->
  <button 
    v-if="authStore.user?.id !== profile.id"
    @click="toggleFollow" 
    :disabled="followLoading"
    class="px-6 py-2.5 rounded-full font-bold text-sm transition shadow-sm border focus:outline-none focus:ring-2 focus:ring-offset-2 flex items-center gap-2"
    :class="isFollowing 
      ? 'bg-white text-gray-700 border-gray-300 hover:bg-red-50 hover:text-red-600 hover:border-red-200' 
      : 'bg-primary-600 text-white border-transparent hover:bg-primary-700'"
  >
    <span>{{ isFollowing ? '✓ Takip Ediliyor' : '+ Takip Et' }}</span>
  </button>

  <!-- 2. WHATSAPP BUTONU (Varsa Göster) -->
  <a 
    v-if="profile.whatsapp"
    :href="`https://wa.me/${profile.whatsapp.replace(/[^0-9]/g, '')}`" 
    target="_blank"
    class="px-5 py-2.5 rounded-full font-bold text-sm bg-green-500 text-white hover:bg-green-600 transition shadow-sm flex items-center gap-2"
  >
    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
    WhatsApp
  </a>

  <!-- 3. MAIL BUTONU (Varsa Göster) -->
  <a 
    v-if="profile.contact_email"
    :href="`mailto:${profile.contact_email}`" 
    class="px-5 py-2.5 rounded-full font-bold text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 transition shadow-sm border border-gray-300 flex items-center gap-2"
  >
    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
    E-posta
  </a>

</div>
  
            <!-- İSTATİSTİKLER VE LINK -->
            <div class="flex items-center justify-center space-x-8 text-sm border-t border-b border-gray-100 py-4 mt-6 max-w-md mx-auto">
              <div class="text-center">
                <span class="block font-bold text-gray-900 text-lg">{{ posts.length }}</span>
                <span class="text-gray-500">Paylaşım</span>
              </div>
              <div class="text-center">
                <span class="block font-bold text-gray-900 text-lg">{{ profile.followers_count || 0 }}</span>
                <span class="text-gray-500">Takipçi</span>
              </div>
              <div class="text-center">
                <span class="block font-bold text-gray-900 text-lg">{{ profile.following_count || 0 }}</span>
                <span class="text-gray-500">Takip</span>
              </div>
              
              <!-- Websitesi Varsa -->
              <div v-if="profile.website" class="text-center border-l pl-8">
                <a :href="profile.website" target="_blank" class="text-primary-600 hover:underline font-medium flex flex-col items-center">
                  <span class="text-lg">🔗</span>
                  <span class="text-xs">Website</span>
                </a>
              </div>
            </div>
  
          </div>
        </div>
  
        <!-- 2. PORTFOLYO ALANI (Masonry Layout) -->
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          
          <div v-if="posts.length === 0" class="text-center py-20 bg-gray-50 rounded-xl border border-dashed border-gray-300">
            <p class="text-gray-500">Henüz hiç içerik paylaşmamış.</p>
          </div>
  
          <div v-else>
            <h2 class="text-xl font-bold text-gray-900 mb-6 border-l-4 border-primary-600 pl-3">
              Portfolyo / Paylaşımlar
            </h2>
            <!-- Masonry Sütunları -->
            <div class="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
              <PostCard v-for="post in posts" :key="post.id" :post="post" />
            </div>
          </div>
  
        </div>
  
      </div>
    </DefaultLayout>
  </template>