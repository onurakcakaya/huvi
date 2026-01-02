<script setup>
  import { ref, onMounted } from 'vue' // watch sildim kullanılmıyor
  import { useRouter } from 'vue-router' // 1. Router'ı import ettik
  import { supabase } from '../supabase'
  import DefaultLayout from '../layouts/DefaultLayout.vue'
  import PostCard from '../components/PostCard.vue'
  
  const router = useRouter() // 2. Router'ı tanımladık
  
  // DEĞİŞKENLER
  const posts = ref([])
  const categories = ref([])
  const loading = ref(true)
  const selectedCategory = ref(null)
  const searchQuery = ref('') // 3. İŞTE BU EKSİKTİ! (Hatanın sebebi)
  const page = ref(0)       // Şu anki sayfa sayısı (0'dan başlar)
  const PAGE_SIZE = 12      // Her seferinde kaç post çekilsin?
  const hasMore = ref(true) // Daha fazla post var mı?
  const appending = ref(false) // "Daha Fazla" butonuna basıldı mı?
  
  onMounted(async () => {
    await fetchCategories()
    await fetchPosts()
  })
  
  // Arama Yapma Fonksiyonu
  const handleSearch = () => {
    if (searchQuery.value.trim()) {
      router.push({ name: 'search', query: { q: searchQuery.value } })
    }
  }
  
  // 1. Kategorileri Getir
  const fetchCategories = async () => {
    const { data } = await supabase.from('categories').select('*').order('name')
    categories.value = data
  }
  
  // Postları Getir
const fetchPosts = async (isLoadMore = false) => {
  try {
    if (isLoadMore) {
      appending.value = true // Butonu loading yap
    } else {
      loading.value = true   // Tüm sayfayı loading yap
      page.value = 0         // Sayfayı sıfırla
      hasMore.value = true   // Resetle
      posts.value = []       // Listeyi temizle
    }
    
    // Sayfalama Hesabı (0-11, 12-23, ...)
    const from = page.value * PAGE_SIZE
    const to = from + PAGE_SIZE - 1

    let query = supabase
      .from('posts')
      .select(`
        *,
        categories ( name, slug ),
        profiles:user_id ( full_name, avatar_url )
      `)
      .order('created_at', { ascending: false })
      .range(from, to) // <--- KRİTİK NOKTA: Sadece bu aralığı çek

    if (selectedCategory.value) {
      query = query.eq('category_id', selectedCategory.value)
    }

    const { data, error } = await query

    if (error) throw error
    
    // Veri bitti mi kontrolü
    if (data.length < PAGE_SIZE) {
      hasMore.value = false // Artık daha fazla veri yok, butonu gizle
    }

    // Listeye Ekleme Mantığı
    if (isLoadMore) {
      posts.value.push(...data) // Mevcut listenin altına ekle
    } else {
      posts.value = data // Listeyi baştan oluştur
    }

  } catch (error) {
    console.error('Hata:', error.message)
  } finally {
    loading.value = false
    appending.value = false
  }
}

// "Daha Fazla Yükle" Butonunun Fonksiyonu
const loadMore = () => {
  page.value++ // Sayfayı bir arttır
  fetchPosts(true) // isLoadMore = true olarak çağır
}
  
  // Kategori değişince yeniden veri çek
  const selectCategory = (id) => {
    selectedCategory.value = id
    fetchPosts()
  }
  </script>
  
  <template>
    <DefaultLayout>
      
      <!-- 1. HERO SEARCH ALANI -->
      <div class="bg-primary-700 py-16 px-4 sm:px-6 lg:px-8 text-center relative overflow-hidden">
        <!-- Arka plan deseni -->
        <div class="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        
        <div class="relative z-10 max-w-3xl mx-auto">
          <h1 class="text-3xl font-extrabold text-white sm:text-4xl md:text-5xl mb-6">
            İlhamını Keşfet.
          </h1>
          <p class="text-primary-100 text-lg mb-8">
            Saç tasarımından cilt bakımına, uzmanların paylaşımlarını ara.
          </p>
  
          <!-- Arama Kutusu -->
          <div class="relative">
            <input 
              v-model="searchQuery"
              @keyup.enter="handleSearch"
              type="text" 
              class="w-full px-6 py-4 rounded-full text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-primary-300 shadow-xl text-lg"
              placeholder="Örn: Düğün saçı, Doğal makyaj, Ahmet..."
            >
            <button 
              @click="handleSearch"
              class="absolute right-2 top-2 bottom-2 bg-primary-600 text-white px-6 rounded-full font-bold hover:bg-primary-800 transition"
            >
              Ara
            </button>
          </div>
        </div>
      </div>
  
      <!-- 2. İÇERİK ALANI -->
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        <!-- Kategori Filtresi -->
        <div class="flex items-center space-x-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
          <button 
            @click="selectCategory(null)"
            class="whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors border"
            :class="selectedCategory === null ? 'bg-black text-white border-black' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'"
          >
            Hepsi
          </button>
          <button 
            v-for="cat in categories" :key="cat.id" @click="selectCategory(cat.id)"
            class="whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors border"
            :class="selectedCategory === cat.id ? 'bg-black text-white border-black' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'"
          >
            {{ cat.name }}
          </button>
        </div>
  
        <!-- Post Listesi -->
        <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div v-for="n in 4" :key="n" class="bg-white h-80 rounded-xl shadow-sm animate-pulse"></div>
        </div>
  
        <div v-else-if="posts.length === 0" class="text-center py-20 bg-gray-50 rounded-lg">
          <p class="text-xl text-gray-500">Bu kategoride içerik yok. 😔</p>
        </div>
  
        <div v-else class="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
  <PostCard v-for="post in posts" :key="post.id" :post="post" />
</div>
<!-- LOAD MORE BUTONU -->
<div class="mt-12 text-center" v-if="!loading && posts.length > 0">
  
  <button 
    v-if="hasMore" 
    @click="loadMore" 
    :disabled="appending"
    class="bg-white border border-gray-300 text-gray-700 px-8 py-3 rounded-full font-medium hover:bg-gray-50 shadow-sm transition disabled:opacity-50 flex items-center gap-2 mx-auto"
  >
    <span v-if="appending" class="animate-spin h-4 w-4 border-b-2 border-gray-600 rounded-full"></span>
    {{ appending ? 'Yükleniyor...' : 'Daha Fazla Göster' }}
  </button>

  <p v-else class="text-gray-400 text-sm italic">
    Hepsini gördün! 🎉
  </p>

</div>
  
      </div>
    </DefaultLayout>
  </template>
  
  <style scoped>
  .scrollbar-hide::-webkit-scrollbar {
      display: none;
  }
  .scrollbar-hide {
      -ms-overflow-style: none;
      scrollbar-width: none;
  }
  </style>