<script setup>
    import { onMounted, ref } from 'vue'
    import { supabase } from '../supabase'
    import { useAuthStore } from '../stores/auth'
    import { RouterLink } from 'vue-router'
    
    const authStore = useAuthStore()
    const posts = ref([])
    const loading = ref(true)
    
    // Kendi postlarını çek
    const fetchMyPosts = async () => {
      try {
        loading.value = true
        const userId = authStore.user.id
    
        const { data, error } = await supabase
          .from('posts')
          .select(`
            *,
            categories ( name )
          `)
          .eq('user_id', userId) // Sadece BENİM postlarım
          .order('created_at', { ascending: false })
    
        if (error) throw error
        posts.value = data
    
      } catch (error) {
        console.error('Hata:', error.message)
      } finally {
        loading.value = false
      }
    }
    
    // Post Silme Fonksiyonu
const deletePost = async (id) => {
  if (!confirm('Bu paylaşımı silmek istediğine emin misin? Bu işlem geri alınamaz.')) return

  try {
    // YENİ YÖNTEM (RPC):
    const { error } = await supabase.rpc('delete_post_securely', { 
      target_post_id: id 
    })
    
    if (error) throw error

    // Listeden de sil
    posts.value = posts.value.filter(post => post.id !== id)
    alert('Paylaşım kökten silindi. 👋')

  } catch (error) {
    console.error(error)
    alert('Silinirken hata oluştu: ' + error.message)
  }
}
    
    onMounted(() => {
      fetchMyPosts()
    })
    </script>
    
    <template>
      <div class="max-w-6xl mx-auto py-10 px-4">
        
        <div class="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-200">
          
          <!-- Üst Bar -->
          <div class="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
            <div>
              <h1 class="text-xl font-bold text-gray-800">Yayınlarım & İçerik Yönetimi</h1>
              <p class="text-sm text-gray-500">Paylaşımlarını buradan düzenleyebilir veya silebilirsin.</p>
            </div>
            
            <RouterLink to="/create-post" class="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 flex items-center gap-2">
              <span>➕</span> Yeni Ekle
            </RouterLink>
          </div>
    
          <!-- Yükleniyor -->
          <div v-if="loading" class="p-10 text-center">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          </div>
    
          <!-- Hiç Post Yoksa -->
          <div v-else-if="posts.length === 0" class="p-10 text-center text-gray-500">
            Henüz hiç içerik paylaşmamışsın. Yukarıdaki butona basarak başla! 🚀
          </div>
    
          <!-- TABLO -->
          <div v-else class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-gray-100 text-gray-600 text-xs uppercase tracking-wider">
                  <th class="p-4 border-b">Görsel</th>
                  <th class="p-4 border-b">Başlık</th>
                  <th class="p-4 border-b">Kategori</th>
                  <th class="p-4 border-b text-center">Etkileşim</th>
                  <th class="p-4 border-b">Tarih</th>
                  <th class="p-4 border-b text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <tr v-for="post in posts" :key="post.id" class="hover:bg-gray-50 transition">
                  
                  <!-- Görsel -->
                  <td class="p-4 w-20">
                    <img :src="post.media_url" class="w-12 h-12 object-cover rounded-md border" alt="Post">
                  </td>
    
                  <!-- Başlık -->
                  <td class="p-4 font-medium text-gray-900 max-w-xs truncate">
                    <RouterLink :to="`/post/${post.id}`" class="hover:text-primary-600 hover:underline">
                      {{ post.title }}
                    </RouterLink>
                  </td>
    
                  <!-- Kategori -->
                  <td class="p-4 text-sm text-gray-600">
                    <span class="bg-primary-50 text-primary-700 px-2 py-1 rounded text-xs font-medium">
                      {{ post.categories?.name }}
                    </span>
                  </td>
    
                  <!-- İstatistikler -->
                  <td class="p-4 text-center">
                    <div class="flex justify-center gap-3 text-xs text-gray-500">
                      <span class="flex items-center gap-1" title="Beğeni">❤️ {{ post.likes_count }}</span>
                      <span class="flex items-center gap-1" title="Kaydetme">🔖 {{ post.saves_count }}</span>
                    </div>
                  </td>
    
                  <!-- Tarih -->
                  <td class="p-4 text-sm text-gray-500 whitespace-nowrap">
                    {{ new Date(post.created_at).toLocaleDateString('tr-TR') }}
                  </td>
    
                  <!-- İşlemler (Butonlar) -->
                  <td class="p-4 text-right whitespace-nowrap">
                    <div class="flex justify-end gap-2">
                      <!-- Düzenle Butonu (Şimdilik Link Yok) -->
                      <RouterLink :to="`/edit-post/${post.id}`" class="text-blue-600 hover:bg-blue-50 p-2 rounded transition" title="Düzenle">
                        ✏️
                      </RouterLink>
                      
                      <!-- Sil Butonu -->
                      <button @click="deletePost(post.id)" class="text-red-600 hover:bg-red-50 p-2 rounded transition" title="Sil">
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
    </template>