<script setup>
import { onMounted, ref } from 'vue'
import { supabase } from '../supabase'
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()
const loading = ref(false)
const message = ref('')

// Form verileri (Profil)
const fullName = ref('')

// Yayıncı Başvuru Verileri
const professionList = ref([]) // DB'den gelecek liste
const selectedProfession = ref('')
const bio = ref('')
const isUpgrading = ref(false) // Yükleniyor durumu (Başvuru için)

// Sayfa açılınca verileri çek
onMounted(async () => {
  // 1. Profil Bilgisi
  if (authStore.profile) {
    fullName.value = authStore.profile.full_name || ''
  }

  // 2. Meslek Listesini Çek (Professions Tablosundan)
  const { data } = await supabase
    .from('professions')
    .select('name')
    .order('name', { ascending: true })
  
  if (data) {
    professionList.value = data
  }
})

// Sadece İsim Güncelleme (Standart User İşlemi)
const updateProfile = async () => {
  try {
    loading.value = true
    message.value = ''

    const updates = {
      full_name: fullName.value,
      updated_at: new Date(),
    }

    await authStore.updateProfile(updates)
    message.value = 'Profil bilgileri güncellendi! ✅'
  } catch (error) {
    message.value = 'Hata: ' + error.message
  } finally {
    loading.value = false
  }
}

// YAYINCI OLMA İŞLEMİ 🚀
const becomePublisher = async () => {
  if (!selectedProfession.value || !bio.value) {
    alert('Lütfen bir uzmanlık alanı seçin ve kendinizi tanıtan kısa bir yazı yazın.')
    return
  }

  try {
    isUpgrading.value = true
    
    // 1. Profili Güncelle (Rolü değiştir, meslek ve bio ekle)
    const updates = {
      role: 'publisher', // ARTIK YAYINCI!
      profession: selectedProfession.value,
      bio: bio.value,
      updated_at: new Date()
    }

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', authStore.user.id)

    if (error) throw error

    // 2. Store'u tazelee (Navbarda menüler değişsin diye)
    await authStore.fetchProfileSafe()

    alert('Tebrikler! Yayıncı hesabına geçiş yaptınız. 🎉 Şimdi vitrin ayarlarını yapmaya gidiyoruz...')
    
    // 3. Vitrin Ayarlarına Yönlendir
    router.push('/dashboard/settings')

  } catch (error) {
    alert('Hata: ' + error.message)
  } finally {
    isUpgrading.value = false
  }
}
</script>

<template>
  <div class="max-w-4xl mx-auto py-10 px-4">
    
    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
      
      <!-- SOL TARAF: KİŞİSEL BİLGİLER -->
      <div class="md:col-span-1 space-y-6">
        <div class="bg-white shadow rounded-lg p-6 border border-gray-100">
          <h2 class="text-lg font-bold text-gray-800 mb-4">Hesap Bilgileri</h2>
          
          <div v-if="message" class="mb-4 p-2 text-xs rounded bg-green-50 text-green-700">
            {{ message }}
          </div>

          <form @submit.prevent="updateProfile" class="space-y-4">
            <div>
              <label class="block text-xs font-bold text-gray-500 uppercase mb-1">E-posta</label>
              <input type="text" disabled :value="authStore.user?.email" class="block w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-500 text-sm cursor-not-allowed">
            </div>

            <div>
              <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Ad Soyad</label>
              <input v-model="fullName" type="text" required class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 text-sm">
            </div>

            <button type="submit" :disabled="loading" class="w-full py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-gray-800 hover:bg-gray-900 transition disabled:opacity-50">
              {{ loading ? '...' : 'Güncelle' }}
            </button>
          </form>
        </div>
      </div>

      <!-- SAĞ TARAF: YAYINCI ALANI -->
      <div class="md:col-span-2">
        
        <!-- DURUM 1: ZATEN YAYINCIYSA -->
        <div v-if="authStore.profile?.role === 'publisher'" class="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-8 text-white shadow-lg text-center">
          <div class="text-5xl mb-4">✨</div>
          <h2 class="text-2xl font-bold mb-2">Yayıncı Hesabı Aktif</h2>
          <p class="text-primary-100 mb-6">
            Profiliniz, uzmanlık alanınız ve içerikleriniz vitrininizde sergileniyor. 
            Detaylı düzenlemeler (WhatsApp, Fotoğraf vb.) için yönetim paneline gidin.
          </p>
          <button @click="router.push('/dashboard/settings')" class="bg-white text-primary-700 px-8 py-3 rounded-full font-bold hover:bg-primary-50 transition shadow-md">
            Vitrin Ayarlarını Düzenle →
          </button>
        </div>

        <!-- DURUM 2: HENÜZ USER İSE (BAŞVURU FORMU) -->
        <div v-else class="bg-white shadow rounded-lg p-8 border border-primary-100 relative overflow-hidden">
          <div class="absolute top-0 right-0 w-24 h-24 bg-primary-50 rounded-bl-full -mr-4 -mt-4 z-0"></div>
          
          <div class="relative z-10">
            <h2 class="text-2xl font-bold text-gray-900 mb-2">Yayıncı Moduna Geç 🚀</h2>
            <p class="text-gray-600 mb-6 text-sm">
              Uzmanlığınızı sergileyin, içerik paylaşın ve binlerce kişiye ilham verin. 
              Başlamak için aşağıdaki bilgileri doldurmanız yeterli.
            </p>

            <div class="space-y-5">
              
              <!-- Uzmanlık Seçimi (DB'den Geliyor) -->
              <div>
                <label class="block text-sm font-bold text-gray-700 mb-1">Uzmanlık Alanınız / Ünvan</label>
                <select v-model="selectedProfession" class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 bg-white">
                  <option value="" disabled>Lütfen seçiniz...</option>
                  <option v-for="prof in professionList" :key="prof.name" :value="prof.name">
                    {{ prof.name }}
                  </option>
                </select>
              </div>

              <!-- Biyografi -->
              <div>
                <label class="block text-sm font-bold text-gray-700 mb-1">Hakkınızda & Eğitim Geçmişi</label>
                <textarea 
                  v-model="bio" 
                  rows="4" 
                  class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 text-sm"
                  placeholder="Bu uzmanlığı nasıl kazandınız? Eğitimleriniz, sertifikalarınız veya deneyim sürenizden bahsedin. (Vitrin sayfasında görünecektir)"
                ></textarea>
              </div>

              <div class="bg-gray-50 p-4 rounded-md text-xs text-gray-500 border border-gray-200">
                <p>⚠️ "Yayıncı Ol" butonuna tıkladığınızda profiliniz herkese açık hale gelecek ve içerik üreticisi (Publisher) yetkilerine sahip olacaksınız. Profil fotoğrafı ve iletişim bilgilerini bir sonraki adımda ekleyebilirsiniz.</p>
              </div>

              <div class="flex justify-end">
                <button 
                  @click="becomePublisher" 
                  :disabled="isUpgrading"
                  class="bg-primary-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-primary-700 transition shadow-lg flex items-center gap-2 disabled:opacity-50"
                >
                  <span v-if="isUpgrading" class="animate-spin h-4 w-4 border-b-2 border-white rounded-full"></span>
                  {{ isUpgrading ? 'İşleniyor...' : 'Onayla ve Yayıncı Ol' }}
                </button>
              </div>

            </div>
          </div>
        </div>

      </div>

    </div>
  </div>
</template>