<script setup>
    import { onMounted, ref } from 'vue'
    import { useRouter } from 'vue-router'
    import { supabase } from '../supabase'
    import { useAuthStore } from '../stores/auth'
    
    const router = useRouter()
    const authStore = useAuthStore()
    const loading = ref(true)
    const updating = ref(false)
    const message = ref('')
    
    // İşletme Verisi
    const business = ref({})
    
    // Dosya Yükleme State'leri
    const logoFile = ref(null)
    const logoPreview = ref('')
    const coverFile = ref(null)
    const coverPreview = ref('')
    
    // Sayfa Açılınca Veriyi Çek
    onMounted(async () => {
      try {
        const { data, error } = await supabase
          .from('businesses')
          .select('*')
          .eq('owner_id', authStore.user.id)
          .single()
    
        if (error) throw error
        business.value = data
        
        // Mevcut resimleri önizlemeye koy
        if (data.logo_url) logoPreview.value = data.logo_url
        if (data.cover_url) coverPreview.value = data.cover_url
    
      } catch (error) {
        console.error('İşletme verisi çekilemedi:', error)
        router.push('/dashboard') // Hata varsa geri at
      } finally {
        loading.value = false
      }
    })
    
    // Dosya Seçme Fonksiyonları
    const handleLogoUpload = (e) => {
      const file = e.target.files[0]
      if (file) {
        logoFile.value = file
        logoPreview.value = URL.createObjectURL(file)
      }
    }
    
    const handleCoverUpload = (e) => {
      const file = e.target.files[0]
      if (file) {
        coverFile.value = file
        coverPreview.value = URL.createObjectURL(file)
      }
    }
    
    // Dosya Yükleme Yardımcısı
    const uploadFile = async (file, pathPrefix) => {
      const fileExt = file.name.split('.').pop()
      const fileName = `${pathPrefix}/${business.value.id}-${Date.now()}.${fileExt}`
      const { error } = await supabase.storage.from('business-media').upload(fileName, file, { upsert: true })
      if (error) throw error
      const { data } = supabase.storage.from('business-media').getPublicUrl(fileName)
      return data.publicUrl
    }
    
    // KAYDETME İŞLEMİ
    const updateBusiness = async () => {
      try {
        updating.value = true
        message.value = ''
    
        let newLogoUrl = business.value.logo_url
        let newCoverUrl = business.value.cover_url
    
        // Yeni dosya seçildiyse yükle
        if (logoFile.value) newLogoUrl = await uploadFile(logoFile.value, 'logos')
        if (coverFile.value) newCoverUrl = await uploadFile(coverFile.value, 'covers')
    
        // Veritabanını Güncelle
        const { error } = await supabase
          .from('businesses')
          .update({
            description: business.value.description,
            address: business.value.address,
            phone: business.value.phone,
            city: business.value.city,
            instagram_url: business.value.instagram_url,
            website_url: business.value.website_url,
            maps_url: business.value.maps_url,
            logo_url: newLogoUrl,
            cover_url: newCoverUrl,
            // Slug ve Name'i değiştirmiyoruz (Güvenlik ve SEO için sabit kalsın şimdilik)
          })
          .eq('id', business.value.id)
    
        if (error) throw error
    
        message.value = 'İşletme bilgileri güncellendi! Vitrininiz parlıyor. ✨'
        
      } catch (error) {
        message.value = 'Hata: ' + error.message
      } finally {
        updating.value = false
      }
    }
    </script>
    
    <template>
      <div class="max-w-4xl mx-auto py-10 px-4">
        
        <div v-if="loading" class="text-center py-20">
          <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto"></div>
        </div>
    
        <div v-else class="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-100">
          
          <!-- Başlık -->
          <div class="bg-gray-900 p-6 text-white flex justify-between items-center">
            <div>
              <h1 class="text-2xl font-bold">{{ business.name }} - Yönetim</h1>
              <p class="text-gray-400 text-sm mt-1">Vitrin bilgilerini buradan düzenle.</p>
            </div>
            <!-- Vitrini Gör Butonu -->
            <a :href="`/business/${business.slug}`" target="_blank" class="text-sm bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition flex items-center gap-2">
              👁️ Vitrini Gör
            </a>
          </div>
    
          <div class="p-8">
            <!-- Mesaj -->
            <div v-if="message" class="mb-6 p-4 rounded-lg font-bold text-sm" :class="message.includes('Hata') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'">
              {{ message }}
            </div>
    
            <form @submit.prevent="updateBusiness" class="space-y-8">
              
              <!-- 1. GÖRSELLER (Logo ve Kapak) -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                <!-- Logo -->
                <div class="text-center">
                  <label class="block text-sm font-bold text-gray-700 mb-2">İşletme Logosu</label>
                  <div class="relative w-32 h-32 mx-auto bg-gray-100 rounded-full overflow-hidden border-4 border-white shadow-md group">
                    <img v-if="logoPreview" :src="logoPreview" class="w-full h-full object-cover">
                    <span v-else class="w-full h-full flex items-center justify-center text-4xl">🏢</span>
                    
                    <!-- Yükleme Overlay -->
                    <div class="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer">
                      <span class="text-white text-xs font-bold">Değiştir</span>
                    </div>
                    <input type="file" accept="image/*" @change="handleLogoUpload" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer">
                  </div>
                </div>
    
                <!-- Kapak Fotoğrafı -->
                <div>
                  <label class="block text-sm font-bold text-gray-700 mb-2">Kapak Fotoğrafı</label>
                  <div class="relative w-full h-32 bg-gray-100 rounded-lg overflow-hidden border border-gray-300 group">
                    <img v-if="coverPreview" :src="coverPreview" class="w-full h-full object-cover">
                    <span v-else class="w-full h-full flex items-center justify-center text-gray-400 text-sm">Görsel Yok</span>
                    
                    <div class="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer">
                      <span class="text-white text-sm font-bold">Fotoğraf Seç</span>
                    </div>
                    <input type="file" accept="image/*" @change="handleCoverUpload" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer">
                  </div>
                  <p class="text-xs text-gray-400 mt-1">Vitrin sayfasının en üstünde görünür.</p>
                </div>
              </div>
    
              <hr class="border-gray-100">
    
              <!-- 2. TEMEL BİLGİLER -->
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-bold text-gray-700 mb-1">Açıklama / Slogan</label>
                  <textarea v-model="business.description" rows="3" placeholder="İşletmeniz hakkında kısa bir bilgi..." class="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"></textarea>
                </div>
    
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-bold text-gray-700 mb-1">Şehir</label>
                    <input v-model="business.city" type="text" class="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500">
                  </div>
                  <div>
                    <label class="block text-sm font-bold text-gray-700 mb-1">Telefon</label>
                    <input v-model="business.phone" type="text" class="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500">
                  </div>
                </div>
    
                <div>
                  <label class="block text-sm font-bold text-gray-700 mb-1">Açık Adres</label>
                  <input v-model="business.address" type="text" class="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500">
                </div>
              </div>
    
              <hr class="border-gray-100">
    
              <!-- 3. BAĞLANTILAR -->
              <div class="space-y-4">
                <h3 class="font-bold text-gray-800">Sosyal Medya & Harita</h3>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-bold text-gray-700 mb-1">Instagram Linki</label>
                    <input v-model="business.instagram_url" type="url" placeholder="https://instagram.com/..." class="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500">
                  </div>
                  <div>
                    <label class="block text-sm font-bold text-gray-700 mb-1">Google Haritalar Linki</label>
                    <input v-model="business.maps_url" type="url" placeholder="https://goo.gl/maps/..." class="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500">
                  </div>
                </div>
              </div>
    
              <!-- KAYDET -->
              <div class="pt-6 flex justify-end">
                <button type="submit" :disabled="updating" class="bg-gray-900 text-white px-8 py-3 rounded-lg hover:bg-black font-bold shadow-lg transition disabled:opacity-50 flex items-center gap-2">
                  <span v-if="updating" class="animate-spin h-5 w-5 border-b-2 border-white rounded-full"></span>
                  {{ updating ? 'Kaydediliyor...' : 'Vitrini Güncelle' }}
                </button>
              </div>
    
            </form>
          </div>
        </div>
      </div>
    </template>