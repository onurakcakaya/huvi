<script setup>
  import { onMounted, ref } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { supabase } from '../supabase'
  import DefaultLayout from '../layouts/DefaultLayout.vue'
  import { useAuthStore } from '../stores/auth'
  
  const route = useRoute()
  const router = useRouter()
  const authStore = useAuthStore()
  
  const post = ref(null)
  const comments = ref([]) 
  const newComment = ref('') 
  const loading = ref(true)
  const sendingComment = ref(false) 
  
  const isLiked = ref(false)
  const isSaved = ref(false)
  const localLikeCount = ref(0)
  
  const carouselRef = ref(null)
  
  const getYoutubeId = (url) => {
    if (!url) return null
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
    const match = url.match(regExp)
    return (match && match[2].length === 11) ? match[2] : null
  }
  
  const scrollGallery = (direction) => {
    if (carouselRef.value) {
      const scrollAmount = carouselRef.value.clientWidth
      carouselRef.value.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      })
    }
  }
  
  const fetchPostDetail = async () => {
    try {
      loading.value = true
      const postId = route.params.id
      const { data, error } = await supabase
        .from('posts')
        .select(`*, categories(name), profiles:user_id(full_name, avatar_url, role), post_media(*)`)
        .eq('id', postId)
        .single()
      if (error) throw error
      post.value = data
      localLikeCount.value = data.likes_count
      await fetchComments(postId)
      if (authStore.user) checkInteractions(postId)
    } catch (error) { console.error(error) } finally { loading.value = false }
  }
  
  const fetchComments = async (postId) => {
    const { data } = await supabase.from('comments').select(`id, content, created_at, profiles:user_id(full_name, avatar_url)`).eq('post_id', postId).order('created_at', { ascending: false })
    comments.value = data || []
  }
  
  const sendComment = async () => {
    if (!newComment.value.trim()) return
    try {
      sendingComment.value = true
      const { error } = await supabase.from('comments').insert({ content: newComment.value, post_id: post.value.id, user_id: authStore.user.id })
      if (error) throw error
      newComment.value = ''
      await fetchComments(post.value.id)
    } catch (error) { alert('Hata: ' + error.message) } finally { sendingComment.value = false }
  }
  
  const checkInteractions = async (postId) => {
    const userId = authStore.user.id
    const { data: likeData } = await supabase.from('likes').select('id').eq('post_id', postId).eq('user_id', userId).maybeSingle()
    if (likeData) isLiked.value = true
    const { data: saveData } = await supabase.from('saves').select('id').eq('post_id', postId).eq('user_id', userId).maybeSingle()
    if (saveData) isSaved.value = true
  }
  
  const toggleLike = async () => {
    if (!authStore.user) return router.push('/login')
    const postId = post.value.id; const userId = authStore.user.id
    if (isLiked.value) { isLiked.value = false; localLikeCount.value--; await supabase.from('likes').delete().eq('post_id', postId).eq('user_id', userId) }
    else { isLiked.value = true; localLikeCount.value++; await supabase.from('likes').insert({ post_id: postId, user_id: userId }) }
  }
  
  const toggleSave = async () => {
    if (!authStore.user) return router.push('/login')
    const postId = post.value.id; const userId = authStore.user.id
    if (isSaved.value) { isSaved.value = false; await supabase.from('saves').delete().eq('post_id', postId).eq('user_id', userId) }
    else { isSaved.value = true; await supabase.from('saves').insert({ post_id: postId, user_id: userId }) }
  }
  
  onMounted(fetchPostDetail)
  </script>
  
  <template>
    <DefaultLayout>
      <div v-if="loading" class="flex justify-center items-center h-[calc(100vh-64px)]"><div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>
      <div v-else-if="!post" class="text-center py-20 text-gray-500">İçerik bulunamadı.</div>
  
      <div v-else class="max-w-6xl mx-auto px-4 py-8 lg:py-12 h-full">
        <div class="bg-white rounded-2xl shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-2 min-h-[600px]">
          
          <!-- SOL: Medya Alanı (GÜNCELLENDİ: Blur Backdrop) -->
          <div class="relative group overflow-hidden bg-gray-900 flex items-center justify-center">
            
            <!-- YOUTUBE VARSA -->
            <div v-if="post.youtube_url" class="w-full h-full bg-black">
              <iframe class="w-full h-full min-h-[400px]" :src="`https://www.youtube.com/embed/${getYoutubeId(post.youtube_url)}`" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
            </div>
  
            <!-- GALERİ (Çoklu Resim) -->
            <div v-else-if="post.post_media && post.post_media.length > 0" class="w-full h-full relative">
              <button @click.stop="scrollGallery('left')" class="absolute left-4 top-1/2 -translate-y-1/2 z-30 bg-black/50 text-white p-2 rounded-full hover:bg-black/80 transition hidden sm:block">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
              </button>
              <button @click.stop="scrollGallery('right')" class="absolute right-4 top-1/2 -translate-y-1/2 z-30 bg-black/50 text-white p-2 rounded-full hover:bg-black/80 transition hidden sm:block">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
              </button>
  
              <div ref="carouselRef" class="flex-1 overflow-x-auto flex snap-x snap-mandatory scrollbar-hide h-full items-center">
                <!-- KAPAK RESMİ -->
                <div class="snap-center w-full h-full flex-shrink-0 relative flex items-center justify-center overflow-hidden">
                  <!-- Arka Plan Blur -->
                  <div class="absolute inset-0 bg-cover bg-center blur-xl opacity-50 scale-110" :style="`background-image: url('${post.media_url}')`"></div>
                  <!-- Ön Plan Net -->
                  <img :src="post.media_url" class="relative z-10 w-full h-full object-contain" />
                </div>
  
                <!-- DİĞER MEDYALAR -->
                <div v-for="media in post.post_media" :key="media.id" class="snap-center w-full h-full flex-shrink-0 relative flex items-center justify-center overflow-hidden">
                  <div class="absolute inset-0 bg-cover bg-center blur-xl opacity-50 scale-110" :style="`background-image: url('${media.url}')`"></div>
                  <img :src="media.url" class="relative z-10 w-full h-full object-contain" />
                </div>
              </div>
            </div>
  
            <!-- TEK RESİM -->
            <div v-else class="w-full h-full relative flex items-center justify-center overflow-hidden">
               <!-- Arka Plan Blur -->
               <div class="absolute inset-0 bg-cover bg-center blur-xl opacity-50 scale-110" :style="`background-image: url('${post.media_url}')`"></div>
               <!-- Ön Plan Net -->
               <img :src="post.media_url" :alt="post.title" class="relative z-10 w-full h-full object-contain" />
            </div>
  
          </div>
  
          <!-- SAĞ: Bilgi -->
          <div class="flex flex-col h-full bg-white relative max-h-[80vh]">
            <!-- ÜST KISIM -->
            <div class="p-4 border-b flex items-center justify-between flex-shrink-0 bg-white z-10">
              <div class="flex items-center space-x-3">
                <RouterLink :to="`/profile/${post.user_id}`" class="block flex-shrink-0">
                  <img v-if="post.profiles?.avatar_url" :src="post.profiles.avatar_url" class="w-10 h-10 rounded-full object-cover border border-gray-200">
                  <div v-else class="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center font-bold text-primary-600 border border-primary-200">{{ post.profiles?.full_name?.[0] }}</div>
                </RouterLink>
                <div>
                  <RouterLink :to="`/profile/${post.user_id}`"><h3 class="font-bold text-gray-900 text-sm hover:underline text-primary-900">{{ post.profiles?.full_name }}</h3></RouterLink>
                  <span v-if="post.profiles?.role === 'publisher'" class="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Uzman</span>
                </div>
              </div>
              <span class="text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">{{ post.categories?.name }}</span>
            </div>
  
            <!-- ORTA KISIM -->
            <div class="flex-1 overflow-y-auto p-6 scrollbar-thin">
              <div class="mb-8 border-b pb-6">
                <h1 class="text-xl font-bold text-gray-900 mb-3 leading-tight">{{ post.title }}</h1>
                <p class="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{{ post.content }}</p>
                <div class="mt-4 flex flex-wrap gap-2">
                  <span v-for="tag in post.tags" :key="tag" class="text-xs text-primary-600 hover:underline cursor-pointer">#{{ tag }}</span>
                </div>
              </div>
              <div class="space-y-6">
                <h3 class="text-sm font-bold text-gray-900">Yorumlar ({{ comments.length }})</h3>
                <div v-if="comments.length === 0" class="text-center py-4 text-gray-400 text-xs">Henüz yorum yok.</div>
                <div v-for="comment in comments" :key="comment.id" class="flex space-x-3">
                  <div class="flex-shrink-0">
                    <RouterLink :to="`/profile/${comment.profiles?.id}`">
                       <img v-if="comment.profiles?.avatar_url" :src="comment.profiles.avatar_url" class="w-8 h-8 rounded-full object-cover border border-gray-200">
                       <div v-else class="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">{{ comment.profiles?.full_name?.[0] || '?' }}</div>
                    </RouterLink>
                  </div>
                  <div>
                    <div class="bg-gray-50 px-3 py-2 rounded-lg rounded-tl-none">
                      <span class="font-bold text-xs text-gray-900 block mb-0.5">{{ comment.profiles?.full_name }}</span>
                      <p class="text-xs text-gray-700">{{ comment.content }}</p>
                    </div>
                    <span class="text-[10px] text-gray-400 ml-1">{{ new Date(comment.created_at).toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'}) }}</span>
                  </div>
                </div>
              </div>
            </div>
  
            <!-- ALT KISIM -->
            <div class="p-4 border-t bg-gray-50 flex-shrink-0">
              <form v-if="authStore.user" @submit.prevent="sendComment" class="flex items-center gap-2 mb-4">
                <input v-model="newComment" type="text" placeholder="Yorum yaz..." class="flex-1 text-sm border-gray-300 rounded-full px-4 py-2 focus:ring-primary-500 bg-white border">
                <button type="submit" :disabled="!newComment.trim() || sendingComment" class="text-primary-600 font-bold text-sm px-2 disabled:opacity-50">Paylaş</button>
              </form>
              <div v-else class="text-center mb-4 text-xs text-gray-500"><RouterLink to="/login" class="text-primary-600 underline">Giriş yap</RouterLink></div>
              <div class="flex items-center justify-between">
                <div class="flex space-x-4">
                  <button @click="toggleLike" class="group"><svg class="w-6 h-6 transition active:scale-90" :class="isLiked ? 'text-red-500 fill-current' : 'text-gray-400 hover:text-red-500'" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" fill="none"><path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg></button>
                  <button class="cursor-default"><svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg></button>
                </div>
                <button @click="toggleSave" class="group"><svg class="w-6 h-6 transition active:scale-90" :class="isSaved ? 'text-gray-800 fill-current' : 'text-gray-400 hover:text-gray-800'" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" fill="none"><path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path></svg></button>
              </div>
              <div class="text-xs font-bold text-gray-800 mt-1">{{ localLikeCount }} beğenme</div>
            </div>
          </div>
        </div>
      </div>
    </DefaultLayout>
  </template>