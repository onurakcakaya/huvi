<script setup>
    import { ref, onMounted } from 'vue'
    import { useRoute, useRouter } from 'vue-router'
    import { supabase } from '../supabase'
    import { useAuthStore } from '../stores/auth'
    
    const route = useRoute()
    const router = useRouter()
    const authStore = useAuthStore()
    
    // Form Verileri
    const title = ref('')
    const content = ref('')
    const selectedCategory = ref(null)
    const selectedTags = ref([])
    const currentImageUrl = ref('') // Mevcut resim
    const newImageFile = ref(null)  // Yeni yüklenecekse dosya
    const previewUrl = ref('')      // Yeni resim önizlemesi
    
    // Durumlar
    const loading = ref(true)
    const updating = ref(false)
    const message = ref('')
    const categories = ref([])
    
    // Sabit Etiketler (Create sayfasıyla aynı olmalı)
    const availableTags = [
      'Özel Gün', 'Gündelik', 'Doğal', 'Gece Makyajı', 'Ofis Stili', 
      'Yaz Trendleri', 'Kış Bakımı', 'Hızlı Rutin'
    ]
    
    onMounted(async () => {
      await fetchCategories()
      await fetchPostData()
    })
    
    // 1. Kategorileri Çek
    const fetchCategories = async () => {
      const { data } = await supabase.from('categories').select('*')
      categories.value = data
    }
    
    // 2. Mevcut Post Bilgilerini Çek ve Doldur
    const fetchPostData = async () => {
      try {
        const { data, error } = await supabase
          .from('posts')
          .select('*')
          .eq('id', route.params.id)
          .single()
    
        if (error) throw error
    
        // Güvenlik: Post başkasınınsa düzenletme!
        if (data.user_id !== authStore.user.id) {
          alert('Bu paylaşımı düzenleme yetkiniz yok.')
          router.push('/dashboard/posts')
          return
        }
    
        // Kutuları doldur
        title.value = data.title
        content.value = data.content
        selectedCategory.value = data.category_id
        selectedTags.value = data.tags || []
        currentImageUrl.value = data.media_url
        
      } catch (error) {
        console.error('Hata:', error)
        router.push('/dashboard/posts')
      } finally {
        loading.value = false
      }
    }
    
    // 3. Yeni Resim Seçilirse
    const handleFileUpload = (event) => {
      const file = event.target.files[0]
      if (file) {
        newImageFile.value = file
        previewUrl.value = URL.createObjectURL(file)
      }
    }
    
    // 4. Güncelleme İşlemi
    const handleUpdate = async () => {
      try {
        updating.value = true
        message.value = ''
        
        let finalImageUrl = currentImageUrl.value
    
        // A. Eğer YENİ resim seçildiyse onu yükle
        if (newImageFile.value) {
          const fileExt = newImageFile.value.name.split('.').pop()
          const fileName = `${authStore.user.id}/${Date.now()}.${fileExt}`
          
          const { error: uploadError } = await supabase.storage
            .from('post-images')
            .upload(fileName, newImageFile.value)
    
          if (uploadError) throw uploadError
    
          const { data } = supabase.storage
            .from('post-images')
            .getPublicUrl(fileName)
            
          finalImageUrl = data.publicUrl
        }
    
        // B. Veritabanını Güncelle
        const { error } = await supabase
          .from('posts')
          .update({
            title: title.value,
            content: content.value,
            category_id: selectedCategory.value,
            tags: selectedTags.value,
            media_url: finalImageUrl,
            updated_at: new Date() // Güncellenme tarihini bas
          })
          .eq('id', route.params.id)
    
        if (error) throw error
    
        message.value = 'Paylaşım başarıyla güncellendi! ✅'
        setTimeout(() => router.push('/dashboard/posts'), 1500)
    
      } catch (error) {
        message.value = 'Hata: ' + error.message
      } finally {
        updating.value = false
      }
    }
    </script>
    
    <template>
      <div class="max-w-3xl mx-auto py-10 px-4">
        
        <div v-if="loading" class="text-center py-20">
          <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto"></div>
        </div>
    
        <div v-else class="bg-white shadow-lg rounded-lg p-8">
          
          <div class="mb-8 border-b pb-4 flex justify-between items-center">
            <div>
              <h1 class="text-2xl font-bold text-gray-800">Paylaşımı Düzenle</h1>
              <p class="text-gray-600">İçeriğini güncelle.</p>
            </div>
            <button @click="router.back()" class="text-sm text-gray-500 hover:text-gray-800">
              ← İptal ve Geri Dön
            </button>
          </div>
    
          <div v-if="message" class="mb-6 p-4 rounded text-sm font-medium" 
               :class="message.includes('Hata') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'">
            {{ message }}
          </div>
    
          <form @submit.prevent="handleUpdate" class="space-y-8">
            
            <!-- Görsel Alanı -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Kapak Görseli</label>
              
              <div class="flex items-start gap-6">
                <!-- Mevcut veya Yeni Önizleme -->
                <div class="relative w-40 h-40 bg-gray-100 rounded-lg overflow-hidden border">
                  <img :src="previewUrl || currentImageUrl" class="w-full h-full object-cover">
                  <div class="absolute bottom-0 w-full bg-black bg-opacity-50 text-white text-xs text-center py-1">
                    {{ newImageFile ? 'Yeni Görsel' : 'Mevcut' }}
                  </div>
                </div>
    
                <!-- Yükleme Alanı -->
                <div class="flex-1">
                   <input type="file" @change="handleFileUpload" accept="image/*" class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 transition"/>
                   <p class="text-xs text-gray-500 mt-2">Değiştirmek istemiyorsan boş bırak.</p>
                </div>
              </div>
            </div>
    
            <!-- Başlık & İçerik -->
            <div class="grid grid-cols-1 gap-6">
              <div>
                <label class="block text-sm font-medium text-gray-700">Başlık</label>
                <input v-model="title" type="text" required class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500">
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700">Açıklama</label>
                <textarea v-model="content" rows="6" class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"></textarea>
              </div>
            </div>
    
            <!-- Kategori & Etiketler -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Kategori</label>
                <select v-model="selectedCategory" required class="block w-full px-3 py-2 border border-gray-300 rounded-md bg-white">
                  <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
                </select>
              </div>
    
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Etiketler</label>
                <div class="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                  <label v-for="tag in availableTags" :key="tag" class="inline-flex items-center space-x-2">
                    <input type="checkbox" :value="tag" v-model="selectedTags" class="text-primary-600 rounded">
                    <span class="text-sm text-gray-700">{{ tag }}</span>
                  </label>
                </div>
              </div>
            </div>
    
            <!-- Butonlar -->
            <div class="flex justify-end pt-4 border-t">
              <button type="submit" :disabled="updating" class="bg-primary-600 text-white px-8 py-3 rounded-md hover:bg-primary-700 font-medium transition disabled:opacity-50">
                {{ updating ? 'Güncelleniyor...' : 'Değişiklikleri Kaydet' }}
              </button>
            </div>
    
          </form>
        </div>
      </div>
    </template>