<script setup>
  import { onMounted, ref } from 'vue'
  import { supabase } from '../supabase'
  import { useAuthStore } from '../stores/auth'
  
  const authStore = useAuthStore()
  const loading = ref(false)
  const uploading = ref(false)
  const message = ref('')
  
  // Veriler
  const profession = ref('')
  const bio = ref('')
  const website = ref('')
  const avatarUrl = ref('') 
  const previewUrl = ref('')
  // YENİ İLETİŞİM BİLGİLERİ
  const whatsapp = ref('')
  const contactEmail = ref('')
  
  onMounted(() => {
    if (authStore.profile) {
      profession.value = authStore.profile.profession || ''
      bio.value = authStore.profile.bio || ''
      website.value = authStore.profile.website || ''
      avatarUrl.value = authStore.profile.avatar_url || ''
      // Yeni verileri çek
      whatsapp.value = authStore.profile.whatsapp || ''
      contactEmail.value = authStore.profile.contact_email || ''
    }
  })
  
  const handleAvatarUpload = async (event) => {
    try {
      uploading.value = true
      const file = event.target.files[0]
      if (!file) return
  
      const fileExt = file.name.split('.').pop()
      const fileName = `${authStore.user.id}/${Date.now()}.${fileExt}`
  
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true })
  
      if (uploadError) throw uploadError
  
      const { data } = supabase.storage.from('avatars').getPublicUrl(fileName)
      previewUrl.value = data.publicUrl 
  
    } catch (error) {
      alert('Resim yüklenirken hata: ' + error.message)
    } finally {
      uploading.value = false
    }
  }
  
  const updatePublisherProfile = async () => {
    try {
      loading.value = true
      message.value = ''
  
      const updates = {
        profession: profession.value,
        bio: bio.value,
        website: website.value,
        avatar_url: previewUrl.value || avatarUrl.value,
        // Yeni verileri kaydet
        whatsapp: whatsapp.value,
        contact_email: contactEmail.value,
        updated_at: new Date(),
      }
  
      await authStore.updateProfile(updates)
      
      if (previewUrl.value) {
         authStore.profile.avatar_url = previewUrl.value
      }
  
      message.value = 'Profil bilgileriniz güncellendi! ✅'
    } catch (error) {
      message.value = 'Hata: ' + error.message
    } finally {
      loading.value = false
    }
  }
  </script>
  
  <template>
    <div class="max-w-4xl mx-auto py-10 px-4 sm:px-6">
      
      <div class="bg-white shadow-lg rounded-xl overflow-hidden border border-primary-50">
        
        <div class="bg-primary-600 p-6 text-white">
          <h1 class="text-2xl font-bold">Yayıncı Kimliği Yönetimi</h1>
          <p class="text-primary-100 mt-1 text-sm">
            Uzman profilini ve iletişim kanallarını buradan düzenle.
          </p>
        </div>
  
        <div class="p-8">
          <div v-if="message" class="mb-6 p-4 rounded-lg text-sm font-bold shadow-sm" 
               :class="message.includes('Hata') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'">
            {{ message }}
          </div>
  
          <form @submit.prevent="updatePublisherProfile" class="space-y-8">
            
            <!-- 1. PROFİL FOTOĞRAFI -->
            <div class="flex flex-col items-center sm:flex-row sm:items-start gap-6 pb-6 border-b border-gray-100">
              <div class="relative group">
                <div class="w-24 h-24 rounded-full overflow-hidden border-4 border-primary-100 bg-gray-200 shadow-md">
                  <img v-if="previewUrl || avatarUrl" :src="previewUrl || avatarUrl" class="w-full h-full object-cover">
                  <span v-else class="w-full h-full flex items-center justify-center text-3xl text-gray-400 font-bold">?</span>
                  <div v-if="uploading" class="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                    <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                  </div>
                </div>
                <div class="absolute bottom-0 right-0 bg-primary-600 p-1.5 rounded-full text-white shadow hover:bg-primary-700 transition cursor-pointer">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path></svg>
                </div>
                <input type="file" accept="image/*" @change="handleAvatarUpload" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer">
              </div>
              <div class="text-center sm:text-left">
                <h3 class="font-bold text-gray-900">Profil Fotoğrafı</h3>
                <p class="text-sm text-gray-500 mt-1 max-w-xs">Takipçilerinin seni tanıması için profesyonel bir fotoğraf yükle.</p>
              </div>
            </div>
  
            <!-- 2. GENEL BİLGİLER -->
            <div class="space-y-6">
              <div>
                <label class="block text-sm font-bold text-gray-900 mb-2">Uzmanlık Alanı / Unvan</label>
                <input v-model="profession" type="text" placeholder="Örn: Saç Tasarım Uzmanı" class="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 shadow-sm">
              </div>
              <div>
                <label class="block text-sm font-bold text-gray-900 mb-2">Biyografi</label>
                <textarea v-model="bio" rows="4" placeholder="Kendinden bahset..." class="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 shadow-sm"></textarea>
              </div>
              <div>
                <label class="block text-sm font-bold text-gray-900 mb-2">Website / Sosyal Medya</label>
                <input v-model="website" type="text" placeholder="https://instagram.com/..." class="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 shadow-sm">
              </div>
            </div>
  
            <!-- 3. İLETİŞİM (YENİ BÖLÜM) -->
            <div class="pt-6 border-t border-gray-100 space-y-6">
              <h3 class="font-bold text-gray-800">📞 İletişim Kanalları (Opsiyonel)</h3>
              <p class="text-xs text-gray-500 -mt-4 mb-4">Sadece doldurduğunuz alanlar profilinizde görünür.</p>
  
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- WhatsApp -->
                <div>
                  <label class="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                    <span class="text-green-600 text-lg">📱</span> WhatsApp Numarası
                  </label>
                  <input v-model="whatsapp" type="text" placeholder="905551234567" class="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 shadow-sm">
                  <p class="text-xs text-gray-400 mt-1">Başında + olmadan ülke koduyla yazın (Örn: 90555...)</p>
                </div>
  
                <!-- Email -->
                <div>
                  <label class="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                    <span class="text-blue-600 text-lg">📧</span> İletişim E-postası
                  </label>
                  <input v-model="contactEmail" type="email" placeholder="iletisim@mail.com" class="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 shadow-sm">
                </div>
              </div>
            </div>
  
            <!-- KAYDET -->
            <div class="pt-6 border-t flex justify-end">
              <button type="submit" :disabled="loading || uploading" class="bg-primary-600 text-white px-8 py-3 rounded-lg hover:bg-primary-700 font-bold shadow-md disabled:opacity-50 transition">
                {{ loading ? 'Güncelleniyor...' : 'Profili Yayınla 🚀' }}
              </button>
            </div>
  
          </form>
        </div>
      </div>
    </div>
  </template>