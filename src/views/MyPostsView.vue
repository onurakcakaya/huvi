<script setup>
  import { onMounted, ref } from 'vue'
  import { supabase } from '../supabase'
  import { useAuthStore } from '../stores/auth'
  import DefaultLayout from '../layouts/DefaultLayout.vue'
  
  const authStore = useAuthStore()
  const posts = ref([])
  const loading = ref(true)
  
  // VERİLERİ ÇEK
  const fetchMyPosts = async () => {
    loading.value = true
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          categories ( name )
        `)
        .eq('user_id', authStore.user.id)
        .order('created_at', { ascending: false })
  
      if (error) throw error
      posts.value = data
  
    } catch (error) {
      console.error('Post hatası:', error.message)
    } finally {
      loading.value = false
    }
  }
  
  // POST SİLME
  const deletePost = async (id) => {
    if (!confirm('Bu içeriği silmek istediğinize emin misiniz? Geri alınamaz!')) return
  
    try {
      // 1. Önce veritabanından sil (Cascade ayarlıysa resimler de silinir, değilse Storage temizliği gerekebilir)
      // Bizim yapıda Cascade var demiştik (Security Definer fonksiyonu ile).
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', id)
  
      if (error) throw error
  
      // Listeden kaldır
      posts.value = posts.value.filter(p => p.id !== id)
  
    } catch (error) {
      alert('Silme hatası: ' + error.message)
    }
  }
  
  // Tarih Formatla
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
  }
  
  onMounted(() => {
    if (authStore.user) fetchMyPosts()
  })
  </script>
  
  <template>
    <DefaultLayout>
      <div class="max-w-6xl mx-auto px-4 py-8 pb-24">
        
        <!-- Başlık -->
        <div class="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
          <div>
            <h1 class="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <span class="text-3xl">📝</span> İçeriklerim
            </h1>
            <p class="text-gray-500 mt-1">Paylaştığınız gönderileri yönetin ve analiz edin.</p>
          </div>
          
          <router-link 
            to="/create-post" 
            class="bg-gray-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-black transition shadow-lg flex items-center gap-2"
          >
            <span>+</span> Yeni İçerik
          </router-link>
        </div>
  
        <!-- Loading -->
        <div v-if="loading" class="flex justify-center py-20">
          <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
        </div>
  
        <!-- Boş Durum -->
        <div v-else-if="posts.length === 0" class="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
          <div class="text-6xl mb-4">📸</div>
          <h3 class="text-xl font-bold text-gray-900">Henüz içerik paylaşmadınız.</h3>
          <p class="text-gray-500 mt-2">İlham verici ilk gönderinizi oluşturun.</p>
          <router-link to="/create-post" class="mt-6 inline-block text-primary-600 font-bold hover:underline">
            Hemen Paylaş →
          </router-link>
        </div>
  
        <!-- Liste (Tablo Görünümü) -->
        <div v-else class="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead class="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th class="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Görsel</th>
                  <th class="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Başlık & Kategori</th>
                  <th class="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">İstatistikler</th>
                  <th class="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Tarih</th>
                  <th class="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">İşlem</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <tr v-for="post in posts" :key="post.id" class="hover:bg-gray-50 transition group">
                  
                  <!-- Görsel -->
                  <td class="p-4 w-24">
                    <div class="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                      <img 
                        :src="post.media_url || 'https://via.placeholder.com/150'" 
                        class="w-full h-full object-cover"
                      >
                    </div>
                  </td>
  
                  <!-- Başlık -->
                  <td class="p-4">
                    <h3 class="font-bold text-gray-900 line-clamp-1">{{ post.title }}</h3>
                    <span class="inline-block mt-1 px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded font-medium">
                      {{ post.categories?.name || 'Genel' }}
                    </span>
                  </td>
  
                  <!-- İstatistikler -->
                  <td class="p-4">
                    <div class="flex gap-4 text-sm font-medium text-gray-600">
                      <span class="flex items-center gap-1" title="Beğeni">
                        ❤️ {{ post.likes_count || 0 }}
                      </span>
                      <span class="flex items-center gap-1" title="Kaydedilme">
                        🔖 {{ post.saves_count || 0 }}
                      </span>
                      <span class="flex items-center gap-1" title="Yorum">
                        💬 {{ post.comments_count || 0 }}
                      </span>
                    </div>
                  </td>
  
                  <!-- Tarih -->
                  <td class="p-4 text-sm text-gray-500">
                    {{ formatDate(post.created_at) }}
                  </td>
  
                  <!-- İşlemler -->
                  <td class="p-4 text-right">
                    <div class="flex items-center justify-end gap-2">
                      <router-link 
                        :to="`/post/${post.id}`" 
                        class="p-2 text-gray-400 hover:text-blue-600 transition hover:bg-blue-50 rounded-lg"
                        title="Görüntüle"
                      >
                        👁️
                      </router-link>
                      <!-- Düzenle (İleride yapılabilir) -->
                      <!-- <button class="p-2 text-gray-400 hover:text-orange-600 transition hover:bg-orange-50 rounded-lg">✏️</button> -->
                      
                      <button 
                        @click="deletePost(post.id)" 
                        class="p-2 text-gray-400 hover:text-red-600 transition hover:bg-red-50 rounded-lg"
                        title="Sil"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
  
                </tr>
              </tbody>
            </table>
          </div>
        </div>
  
      </div>
    </DefaultLayout>
  </template>