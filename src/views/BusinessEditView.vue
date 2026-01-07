<script setup>
  import { onMounted, ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { supabase } from '../supabase'
  import { useAuthStore } from '../stores/auth'
  import imageCompression from 'browser-image-compression' // SIKIŞTIRMA PAKETİ
  
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
  
  // İşletme Tipleri
  const businessTypes = [
    'Kuaför (Kadın)', 'Berber (Erkek)', 'Güzellik Merkezi', 
    'Tırnak Stüdyosu', 'Spa & Masaj', 'Dövme Stüdyosu',
    'Diyetisyen / Klinik', 'Diğer'
  ]
  
  // ---------------------------------------------------------
  // 1. YARDIMCI FONKSİYONLAR (PRO DOKUNUŞLAR) 🚀
  // ---------------------------------------------------------
  
  // A. RESİM SIKIŞTIRMA FONKSİYONU
  const compressImage = async (file) => {
    const options = {
      maxSizeMB: 1,          // En fazla 1MB olsun
      maxWidthOrHeight: 1920,// Max genişlik/yükseklik
      useWebWorker: true     // Tarayıcıyı dondurmasın
    }
    try {
      return await imageCompression(file, options)
    } catch (error) {
      console.error('Sıkıştırma hatası:', error)
      return file // Hata olursa orjinalini döndür
    }
  }
  
  // B. ESKİ RESMİ SİLME FONKSİYONU (Çöp Temizliği) 🧹
  const deleteOldImage = async (fullUrl) => {
    if (!fullUrl) return
    
    try {
      // URL'den dosya yolunu ayıkla
      // Örn: .../business-media/logos/123.jpg -> logos/123.jpg
      const path = fullUrl.split('business-media/')[1]
      if (path) {
        await supabase.storage.from('business-media').remove([path])
        console.log('Eski dosya silindi:', path)
      }
    } catch (error) {
      console.error('Silme hatası (önemsiz):', error)
    }
  }
  
  // ---------------------------------------------------------
  
  onMounted(async () => {
    try {
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('owner_id', authStore.user.id)
        .single()
  
      if (error) throw error
      business.value = data
      
      if (data.logo_url) logoPreview.value = data.logo_url
      if (data.cover_url) coverPreview.value = data.cover_url
  
    } catch (error) {
      console.error('Veri hatası:', error)
      router.push('/dashboard')
    } finally {
      loading.value = false
    }
  })
  
  // Dosya Seçme ve Sıkıştırma
  const handleLogoUpload = async (e) => {
    const file = e.target.files[0]
    if (file) {
      // Sıkıştır ve Ata
      const compressed = await compressImage(file)
      logoFile.value = compressed
      logoPreview.value = URL.createObjectURL(compressed)
    }
  }
  
  const handleCoverUpload = async (e) => {
    const file = e.target.files[0]
    if (file) {
      // Sıkıştır ve Ata
      const compressed = await compressImage(file)
      coverFile.value = compressed
      coverPreview.value = URL.createObjectURL(compressed)
    }
  }
  
  // Dosya Yükleme (Supabase)
  const uploadFile = async (file, pathPrefix) => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${pathPrefix}/${business.value.id}-${Date.now()}.${fileExt}`
    
    const { error } = await supabase.storage.from('business-media').upload(fileName, file, { upsert: true })
    if (error) throw error
    
    const { data } = supabase.storage.from('business-media').getPublicUrl(fileName)
    return data.publicUrl
  }
  
  // GÜNCELLEME İŞLEMİ
  const updateBusiness = async () => {
    try {
      updating.value = true
      message.value = ''
  
      let newLogoUrl = business.value.logo_url
      let newCoverUrl = business.value.cover_url
  
      // 1. Logo Değiştiyse: Eskiyi Sil -> Yeniyi Yükle
      if (logoFile.value) {
        if (business.value.logo_url) {
          await deleteOldImage(business.value.logo_url) // Çöpü temizle
        }
        newLogoUrl = await uploadFile(logoFile.value, 'logos')
      }
  
      // 2. Kapak Değiştiyse: Eskiyi Sil -> Yeniyi Yükle
      if (coverFile.value) {
        if (business.value.cover_url) {
          await deleteOldImage(business.value.cover_url) // Çöpü temizle
        }
        newCoverUrl = await uploadFile(coverFile.value, 'covers')
      }
  
      // Veritabanını Güncelle
      const { error } = await supabase
        .from('businesses')
        .update({
          name: business.value.name,
          type: business.value.type,
          description: business.value.description,
          address: business.value.address,
          district: business.value.district,
          city: business.value.city,
          phone: business.value.phone,
          instagram_url: business.value.instagram_url,
          website_url: business.value.website_url,
          maps_url: business.value.maps_url,
          logo_url: newLogoUrl,
          cover_url: newCoverUrl,
        })
        .eq('id', business.value.id)
  
      if (error) throw error
  
      // Güncel veriyi state'e de yansıt (tekrar silme işlemi denerse hata almamak için)
      business.value.logo_url = newLogoUrl
      business.value.cover_url = newCoverUrl
      logoFile.value = null // Dosya kuyruğunu temizle
      coverFile.value = null
  
      message.value = 'İşletme bilgileri başarıyla güncellendi! ✅'
      
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
          <a :href="`/business/${business.slug}`" target="_blank" class="text-sm bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition flex items-center gap-2">
            👁️ Vitrini Gör
          </a>
        </div>
  
        <div class="p-8">
          <div v-if="message" class="mb-6 p-4 rounded-lg font-bold text-sm" :class="message.includes('Hata') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'">
            {{ message }}
          </div>
  
          <form @submit.prevent="updateBusiness" class="space-y-8">
            
            <!-- 1. GÖRSELLER -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
              <!-- Logo -->
              <div class="text-center">
                <span class="block text-sm font-bold text-gray-700 mb-2">İşletme Logosu</span>
                <div class="relative w-32 h-32 mx-auto bg-gray-100 rounded-full overflow-hidden border-4 border-white shadow-md group cursor-pointer">
                  <img v-if="logoPreview" :src="logoPreview" class="w-full h-full object-cover">
                  <span v-else class="w-full h-full flex items-center justify-center text-4xl">🏢</span>
                  <div class="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                    <span class="text-white text-xs font-bold">Değiştir</span>
                  </div>
                  <input type="file" id="logoUpload" name="logoUpload" accept="image/*" @change="handleLogoUpload" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer">
                </div>
                <p class="text-xs text-gray-400 mt-2" v-if="logoFile">Sıkıştırıldı ve Hazır ✅</p>
              </div>
  
              <!-- Kapak -->
              <div>
                <span class="block text-sm font-bold text-gray-700 mb-2">Kapak Fotoğrafı</span>
                <div class="relative w-full h-32 bg-gray-100 rounded-lg overflow-hidden border border-gray-300 group cursor-pointer">
                  <img v-if="coverPreview" :src="coverPreview" class="w-full h-full object-cover">
                  <span v-else class="w-full h-full flex items-center justify-center text-gray-400 text-sm">Görsel Yok</span>
                  <div class="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                    <span class="text-white text-sm font-bold">Fotoğraf Seç</span>
                  </div>
                  <input type="file" id="coverUpload" name="coverUpload" accept="image/*" @change="handleCoverUpload" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer">
                </div>
                <p class="text-xs text-gray-400 mt-1">Vitrin sayfasının en üstünde görünür.</p>
              </div>
            </div>
  
            <hr class="border-gray-100">
  
            <!-- 2. KİMLİK BİLGİLERİ -->
            <div class="space-y-4">
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label for="name" class="block text-sm font-bold text-gray-700 mb-1">İşletme Adı</label>
                  <input id="name" name="name" v-model="business.name" type="text" class="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500">
                </div>
                <div>
                  <label for="type" class="block text-sm font-bold text-gray-700 mb-1">İşletme Tipi</label>
                  <select id="type" name="type" v-model="business.type" class="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 bg-white">
                    <option v-for="type in businessTypes" :key="type" :value="type">{{ type }}</option>
                  </select>
                </div>
              </div>
  
              <div>
                <label for="description" class="block text-sm font-bold text-gray-700 mb-1">Açıklama / Slogan</label>
                <textarea id="description" name="description" v-model="business.description" rows="3" placeholder="İşletmeniz hakkında kısa bir bilgi..." class="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"></textarea>
              </div>
            </div>
  
            <hr class="border-gray-100">
  
            <!-- 3. ADRES BİLGİLERİ -->
            <div class="space-y-4">
              <h3 class="font-bold text-gray-800">İletişim & Konum</h3>
  
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label for="city" class="block text-sm font-bold text-gray-700 mb-1">Şehir (İl)</label>
                  <input id="city" name="city" v-model="business.city" type="text" class="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500">
                </div>
                <div>
                  <label for="district" class="block text-sm font-bold text-gray-700 mb-1">İlçe</label>
                  <input id="district" name="district" v-model="business.district" type="text" placeholder="Kadıköy" class="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500">
                </div>
              </div>
  
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label for="phone" class="block text-sm font-bold text-gray-700 mb-1">Telefon</label>
                  <input id="phone" name="phone" v-model="business.phone" type="text" class="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500">
                </div>
                <div>
                  <label for="address" class="block text-sm font-bold text-gray-700 mb-1">Açık Adres</label>
                  <textarea id="address" name="address" v-model="business.address" rows="1" placeholder="Mahalle, Sokak, No..." class="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"></textarea>
                </div>
              </div>
            </div>
  
            <hr class="border-gray-100">
  
            <!-- 4. BAĞLANTILAR -->
            <div class="space-y-4">
              <h3 class="font-bold text-gray-800">Sosyal Medya & Harita</h3>
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label for="instagram" class="block text-sm font-bold text-gray-700 mb-1">Instagram Linki</label>
                  <input id="instagram" name="instagram" v-model="business.instagram_url" type="url" placeholder="https://instagram.com/..." class="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500">
                </div>
                <div>
                  <label for="maps" class="block text-sm font-bold text-gray-700 mb-1">Google Haritalar Linki</label>
                  <input id="maps" name="maps" v-model="business.maps_url" type="url" placeholder="https://goo.gl/maps/..." class="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500">
                </div>
                <div>
                  <label for="website" class="block text-sm font-bold text-gray-700 mb-1">Web Sitesi</label>
                  <input id="website" name="website" v-model="business.website_url" type="url" placeholder="https://..." class="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500">
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