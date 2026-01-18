<script setup>
import { onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { supabase } from '../supabase'
import DefaultLayout from '../layouts/DefaultLayout.vue'
import PostCard from '../components/PostCard.vue'

const route = useRoute()
const searchTerm = ref('')
const activeTab = ref('posts') // 'posts' veya 'profiles'

// Sonuçlar
const posts = ref([])
const profiles = ref([])
const loading = ref(true)

const performSearch = async () => {
  searchTerm.value = route.query.q || ''
  if (!searchTerm.value) return

  loading.value = true
  posts.value = []
  profiles.value = []

  try {
    // 1. POST ARAMASI
    const { data: postsData } = await supabase
      .from('posts')
      .select(`*, categories(name), profiles:user_id(full_name, avatar_url)`)
      .or(`title.ilike.%${searchTerm.value}%,content.ilike.%${searchTerm.value}%`)
      .order('created_at', { ascending: false })
    
    if (postsData) posts.value = postsData

    // 2. PROFİL ARAMASI (GÜNCELLENDİ)
    // Sadece role = 'publisher' olanları getiriyoruz!
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'publisher') // <-- İŞTE SİHİRLİ DOKUNUŞ 🪄
      .or(`full_name.ilike.%${searchTerm.value}%,profession.ilike.%${searchTerm.value}%`)
      .limit(20)

    if (profilesData) profiles.value = profilesData

  } catch (error) {
    console.error('Arama hatası:', error)
  } finally {
    loading.value = false
  }
}

onMounted(performSearch)
watch(() => route.query.q, performSearch)
</script>

<template>
  <DefaultLayout>
    <div class="max-w-7xl mx-auto px-4 py-8">
      
      <!-- Başlık -->
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-gray-900">
          "{{ searchTerm }}" için sonuçlar
        </h1>
      </div>

      <!-- SEKMELER (TABS) -->
      <div class="border-b border-gray-200 mb-8">
        <nav class="-mb-px flex space-x-8">
          <button 
            @click="activeTab = 'posts'"
            class="whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors"
            :class="activeTab === 'posts' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'"
          >
            Gönderiler ({{ posts.length }})
          </button>

          <button 
            @click="activeTab = 'profiles'"
            class="whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors"
            :class="activeTab === 'profiles' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'"
          >
            Uzmanlar ({{ profiles.length }})
          </button>
        </nav>
      </div>

      <!-- YÜKLENİYOR -->
      <div v-if="loading" class="flex justify-center py-20">
        <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
      </div>

      <!-- 1. POST SONUÇLARI -->
      <div v-else-if="activeTab === 'posts'">
        <div v-if="posts.length === 0" class="text-center py-20 text-gray-500">
          Aradığınız kelimeye uygun gönderi bulunamadı.
        </div>
        <div v-else class="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
          <PostCard v-for="post in posts" :key="post.id" :post="post" />
        </div>
      </div>

      <!-- 2. PROFİL SONUÇLARI -->
      <div v-else-if="activeTab === 'profiles'">
        <div v-if="profiles.length === 0" class="text-center py-20 text-gray-500">
          Aradığınız kelimeye uygun uzman bulunamadı.
        </div>
        <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          
          <!-- Profil Kartı (RouterLink eklendi) -->
          <RouterLink 
            v-for="profile in profiles" 
            :key="profile.id" 
            :to="`/profile/${profile.id}`"
            class="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition flex items-center space-x-4 group"
          >
            <div class="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 text-xl font-bold flex-shrink-0 overflow-hidden">
               <img v-if="profile.avatar_url" :src="profile.avatar_url" class="w-full h-full object-cover">
               <span v-else>{{ profile.full_name?.[0] }}</span>
            </div>
            <div>
              <h3 class="font-bold text-gray-900 group-hover:text-primary-600 transition">{{ profile.full_name }}</h3>
              <p v-if="profile.profession" class="text-sm text-primary-600 font-medium">
                {{ profile.profession }}
              </p>
              <p class="text-xs text-gray-500 mt-1 line-clamp-1">
                {{ profile.bio || 'Henüz biyografi yok.' }}
              </p>
            </div>
          </RouterLink>

        </div>
      </div>

    </div>
  </DefaultLayout>
</template>