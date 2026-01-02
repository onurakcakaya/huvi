<script setup>
    import { onMounted, ref } from 'vue'
    import { supabase } from '../supabase'
    import DefaultLayout from '../layouts/DefaultLayout.vue'
    import PostCard from '../components/PostCard.vue'
    import { useAuthStore } from '../stores/auth'
    
    const authStore = useAuthStore()
    const savedPosts = ref([]) // Kaydedilen postlar
    const loading = ref(true)
    
    const fetchSavedPosts = async () => {
      try {
        loading.value = true
        const userId = authStore.user.id
    
        // SORGUNUN KRALI:
        // 1. 'saves' tablosundan benim kaydettiklerimi bul.
        // 2. 'posts' tablosuna git, o postun detaylarını al.
        // 3. 'posts'un içinden de kategoriyi ve yazarın profilini al.
        const { data, error } = await supabase
          .from('saves')
          .select(`
            id,
            posts (
              *,
              categories ( name ),
              profiles:user_id ( full_name, avatar_url )
            )
          `)
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
    
        if (error) throw error
    
        // DİKKAT: Veri bize şöyle gelir: [ { id:1, posts: {...} }, { id:2, posts: {...} } ]
        // Ama PostCard bileşeni direkt {...} (post objesi) bekler.
        // O yüzden haritalama (map) yapıyoruz:
        savedPosts.value = data.map(item => item.posts)
    
      } catch (error) {
        console.error('Hata:', error.message)
      } finally {
        loading.value = false
      }
    }
    
    onMounted(() => {
      if (authStore.user) {
        fetchSavedPosts()
      }
    })
    </script>
    
    <template>
      <DefaultLayout>
        <div class="max-w-7xl mx-auto px-4 py-8">
          
          <div class="mb-8 border-b pb-4">
            <h1 class="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <span class="text-3xl">🔖</span> Kaydettiklerim
            </h1>
            <p class="text-gray-500 mt-2">Daha sonra incelemek için sakladığın içerikler.</p>
          </div>
    
          <!-- Yükleniyor -->
          <div v-if="loading" class="flex justify-center py-20">
            <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
          </div>
    
          <!-- Boş Durum -->
          <div v-else-if="savedPosts.length === 0" class="text-center py-20 bg-white rounded-lg shadow-sm border border-dashed">
            <p class="text-gray-500 text-lg">Henüz hiçbir şeyi kaydetmemişsin.</p>
            <p class="text-gray-400 text-sm mt-2">Beğendiğin postlardaki bayrak ikonuna tıkla.</p>
          </div>
    
          <!-- Liste -->
          <div v-else class="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
  <PostCard v-for="post in posts" :key="post.id" :post="post" />
</div>
    
        </div>
      </DefaultLayout>
    </template>