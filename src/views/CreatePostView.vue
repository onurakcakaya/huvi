<script setup>
  import { ref, onMounted } from 'vue'
  import { useRouter } from 'vue-router'
  import { supabase } from '../supabase'
  import { useAuthStore } from '../stores/auth'
  import imageCompression from 'browser-image-compression' // Sıkıştırma kütüphanesi
  
  const router = useRouter()
  const authStore = useAuthStore()
  
  // Form Verileri
  const title = ref('')
  const content = ref('')
  const selectedCategory = ref(null)
  const selectedTags = ref([])
  const youtubeUrl = ref('') 
  
  // Dosya İşlemleri
  const coverImageFile = ref(null)
  const coverPreviewUrl = ref('')
  const galleryFiles = ref([])    
  const galleryPreviews = ref([])
  
  // Durumlar
  const loading = ref(false)
  const message = ref('')
  const categories = ref([])
  
  const availableTags = [
    'Özel Gün', 'Gündelik', 'Doğal', 'Gece Makyajı', 'Ofis Stili', 
    'Yaz Trendleri', 'Kış Bakımı', 'Hızlı Rutin', 'Video Anlatım'
  ]
  
  onMounted(async () => {
    const { data } = await supabase.from('categories').select('*')
    categories.value = data
  })
  
  const handleCoverUpload = (event) => {
    const file = event.target.files[0]
    if (file) {
      coverImageFile.value = file
      coverPreviewUrl.value = URL.createObjectURL(file)
    }
  }
  
  const handleGalleryUpload = (event) => {
    const files = Array.from(event.target.files)
    if (files.length > 0) {
      galleryFiles.value = [...galleryFiles.value, ...files]
      const newPreviews = files.map(file => URL.createObjectURL(file))
      galleryPreviews.value = [...galleryPreviews.value, ...newPreviews]
    }
  }
  
  const removeGalleryItem = (index) => {
    galleryFiles.value.splice(index, 1)
    galleryPreviews.value.splice(index, 1)
  }
  
  // SIKIŞTIRMA YARDIMCISI
  const compressImage = async (file) => {
    if (!file.type.startsWith('image')) return file
    const options = { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true }
    try {
      return await imageCompression(file, options)
    } catch (error) {
      console.error('Sıkıştırma hatası:', error)
      return file
    }
  }
  
  // DOSYA YÜKLEME (Tek ve Düzgün Hali)
  const uploadFile = async (file, bucket = 'post-images') => {
    const fileToUpload = await compressImage(file)
    const fileExt = file.name.split('.').pop()
    const fileName = `${authStore.user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
    
    const { error } = await supabase.storage.from(bucket).upload(fileName, fileToUpload)
    if (error) throw error
  
    const { data } = supabase.storage.from(bucket).getPublicUrl(fileName)
    return data.publicUrl
  }
  
  const handleSubmit = async () => {
    try {
      loading.value = true
      message.value = ''
  
      if (!title.value || !selectedCategory.value || !coverImageFile.value) {
        throw new Error('Lütfen başlık, kategori ve kapak resmini giriniz.')
      }
  
      const coverUrl = await uploadFile(coverImageFile.value)
  
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .insert({
          title: title.value,
          content: content.value,
          category_id: selectedCategory.value,
          tags: selectedTags.value,
          media_url: coverUrl,      
          youtube_url: youtubeUrl.value || null,
          user_id: authStore.user.id
        })
        .select()
        .single()
  
      if (postError) throw postError
      const newPostId = postData.id
  
      if (galleryFiles.value.length > 0) {
        const mediaPromises = galleryFiles.value.map(async (file) => {
          const url = await uploadFile(file)
          return {
            post_id: newPostId,
            url: url,
            media_type: file.type.startsWith('video') ? 'video' : 'image'
          }
        })
        const mediaRecords = await Promise.all(mediaPromises)
        const { error: mediaError } = await supabase.from('post_media').insert(mediaRecords)
        if (mediaError) throw mediaError
      }
  
      message.value = 'İçerik başarıyla yayınlandı! 🚀'
      setTimeout(() => router.push('/my-posts'), 2000)
  
    } catch (error) {
      message.value = 'Hata: ' + error.message
    } finally {
      loading.value = false
    }
  }
  </script>
  
  <template>
    <div class="max-w-4xl mx-auto py-10 px-4">
      <div class="bg-white shadow-lg rounded-xl p-8 border border-gray-100">
        <div class="mb-8 border-b pb-4">
          <h1 class="text-2xl font-bold text-gray-800">Yeni İçerik Oluştur</h1>
          <p class="text-gray-500">Video, galeri veya tek resim... Seçim senin.</p>
        </div>
        <div v-if="message" class="mb-6 p-4 rounded-lg font-bold text-sm" :class="message.includes('Hata') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'">{{ message }}</div>
        <form @submit.prevent="handleSubmit" class="space-y-8">
          <div>
            <label class="block text-sm font-bold text-gray-900 mb-2">1. Kapak Görseli (Vitrinde Görünecek)</label>
            <div class="flex items-center gap-4">
              <div class="relative w-32 h-32 bg-gray-100 rounded-lg overflow-hidden border border-gray-300 flex-shrink-0">
                <img v-if="coverPreviewUrl" :src="coverPreviewUrl" class="w-full h-full object-cover">
                <span v-else class="w-full h-full flex items-center justify-center text-gray-400 text-xs text-center p-2">Görsel Seçilmedi</span>
              </div>
              <input type="file" @change="handleCoverUpload" accept="image/*" class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 transition"/>
            </div>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div class="bg-red-50 p-4 rounded-lg border border-red-100">
              <label class="block text-sm font-bold text-red-800 mb-2 flex items-center gap-2"><span>🎥</span> YouTube Videosu (Opsiyonel)</label>
              <input v-model="youtubeUrl" type="text" placeholder="https://youtube.com/watch?v=..." class="block w-full px-3 py-2 border border-red-200 rounded-md focus:ring-red-500 focus:border-red-500">
            </div>
            <div class="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <label class="block text-sm font-bold text-gray-800 mb-2 flex items-center gap-2"><span>📸</span> Galeri / Slider (Opsiyonel)</label>
              <input type="file" @change="handleGalleryUpload" multiple accept="image/*" class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gray-200 file:text-gray-700 hover:file:bg-gray-300 transition mb-2"/>
              <div class="flex flex-wrap gap-2 mt-2">
                <div v-for="(src, index) in galleryPreviews" :key="index" class="relative w-16 h-16 rounded overflow-hidden border">
                  <img :src="src" class="w-full h-full object-cover">
                  <button type="button" @click="removeGalleryItem(index)" class="absolute top-0 right-0 bg-red-600 text-white w-4 h-4 flex items-center justify-center text-xs">×</button>
                </div>
              </div>
            </div>
          </div>
          <div class="space-y-6">
            <div><label class="block text-sm font-bold text-gray-700 mb-1">Başlık</label><input v-model="title" type="text" required class="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"></div>
            <div><label class="block text-sm font-bold text-gray-700 mb-1">Açıklama</label><textarea v-model="content" rows="4" class="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"></textarea></div>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label class="block text-sm font-bold text-gray-700 mb-2">Kategori</label>
              <select v-model="selectedCategory" required class="block w-full px-3 py-2 border border-gray-300 rounded-md bg-white">
                <option :value="null" disabled>Seçiniz...</option>
                <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-bold text-gray-700 mb-2">Etiketler</label>
              <div class="flex flex-wrap gap-2">
                <label v-for="tag in availableTags" :key="tag" class="inline-flex items-center space-x-2 bg-gray-50 px-3 py-1 rounded-full border cursor-pointer hover:bg-primary-50">
                  <input type="checkbox" :value="tag" v-model="selectedTags" class="text-primary-600 rounded focus:ring-primary-500">
                  <span class="text-sm text-gray-700">{{ tag }}</span>
                </label>
              </div>
            </div>
          </div>
          <div class="pt-6 border-t flex justify-end">
            <button type="submit" :disabled="loading" class="bg-primary-600 text-white px-8 py-3 rounded-lg hover:bg-primary-700 font-bold shadow-md disabled:opacity-50 flex items-center gap-2">
              <span v-if="loading" class="animate-spin h-5 w-5 border-b-2 border-white rounded-full"></span>
              {{ loading ? 'Yükleniyor...' : 'İçeriği Paylaş 🚀' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </template>