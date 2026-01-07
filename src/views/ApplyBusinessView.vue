<script setup>
  import { ref, onMounted } from 'vue' // onMounted ekledik
  import { useRouter } from 'vue-router'
  import { supabase } from '../supabase'
  import { useAuthStore } from '../stores/auth'
  
  const router = useRouter()
  const authStore = useAuthStore()
  
  const form = ref({
    name: '',
    city: '',
    district: '', // Scriptte vardı, template'de yoktu.
    phone: '',
    type: '',
    social_link: ''
  })
  
  const loading = ref(false)
  const checking = ref(true) // Başvuru kontrolü için
  const hasExistingApplication = ref(false) // Zaten başvurusu var mı?
  const message = ref('')
  
  const businessTypes = [
    'Kuaför (Kadın)', 
    'Berber (Erkek)', 
    'Güzellik Merkezi', 
    'Tırnak Stüdyosu', 
    'Spa & Masaj', 
    'Dövme Stüdyosu',
    'Diyetisyen / Klinik',
    'Diğer'
  ]
  
  // Sayfa açılınca: Adamın zaten bekleyen başvurusu var mı bakalım?
  onMounted(async () => {
    if(!authStore.user) return
    
    const { data } = await supabase
      .from('business_applications')
      .select('status')
      .eq('user_id', authStore.user.id)
      .in('status', ['pending', 'approved']) // Bekleyen veya Onaylanmış varsa
      .single()
  
    if (data) {
      hasExistingApplication.value = true
    }
    checking.value = false
  })
  
  const handleApply = async () => {
    try {
      loading.value = true
      message.value = ''
  
      const { error } = await supabase
        .from('business_applications')
        .insert({
          user_id: authStore.user.id,
          business_name: form.value.name,
          city: form.value.city,
          district: form.value.district, // Artık inputtan gelecek
          phone: form.value.phone,
          type: form.value.type,
          social_link: form.value.social_link || null,
          status: 'pending'
        })
  
      if (error) throw error
  
      message.value = 'Başvurunuz başarıyla alındı! 🎉 Yönlendiriliyorsunuz...'
      setTimeout(() => router.push('/dashboard'), 2500)
  
    } catch (error) {
      alert('Hata: ' + error.message)
    } finally {
      loading.value = false
    }
  }
  </script>
  
  <template>
    <div class="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div class="max-w-lg w-full bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        
        <!-- Yükleniyor veya Kontrol Ediliyor -->
        <div v-if="checking" class="text-center py-10">
          <div class="animate-spin h-8 w-8 border-b-2 border-primary-600 rounded-full mx-auto"></div>
        </div>
  
        <!-- Zaten Başvurusu Varsa -->
        <div v-else-if="hasExistingApplication" class="text-center py-6">
          <span class="text-4xl">⏳</span>
          <h2 class="text-xl font-bold text-gray-900 mt-4">Başvurunuz İnceleniyor</h2>
          <p class="text-gray-500 mt-2">Zaten aktif bir başvurunuz veya işletmeniz bulunuyor. Sonuçlandığında size bildireceğiz.</p>
          <button @click="router.push('/dashboard')" class="mt-6 text-primary-600 hover:underline">Panele Dön</button>
        </div>
  
        <!-- Form (Normal Durum) -->
        <div v-else>
          <div class="text-center mb-8">
            <span class="text-4xl">🤝</span>
            <h1 class="text-2xl font-bold text-gray-900 mt-2">İşletme Ortaklığı Başvurusu</h1>
            <p class="text-gray-500 text-sm mt-2">
              Hizmetlerinizi Huvi üzerinden sunmak için ilk adımı atın.
            </p>
          </div>
  
          <div v-if="message" class="mb-6 p-4 rounded-lg bg-green-100 text-green-700 font-medium text-center">
            {{ message }}
          </div>
  
          <form v-else @submit.prevent="handleApply" class="space-y-5">
            
            <!-- İşletme Adı -->
            <div>
              <label class="block text-sm font-bold text-gray-700 mb-1">İşletme Adı</label>
              <input v-model="form.name" type="text" required placeholder="Örn: Gold Hair Studio" class="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500">
            </div>
  
            <!-- Şehir ve İlçe (YAN YANA) -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-bold text-gray-700 mb-1">Şehir (İl)</label>
                <input v-model="form.city" type="text" required placeholder="İstanbul" class="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500">
              </div>
              <!-- EKSİK OLAN İLÇE KISMI EKLENDİ -->
              <div>
                <label class="block text-sm font-bold text-gray-700 mb-1">İlçe</label>
                <input v-model="form.district" type="text" required placeholder="Kadıköy" class="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500">
              </div>
            </div>
  
            <!-- Tip ve Telefon -->
             <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                <label class="block text-sm font-bold text-gray-700 mb-1">İşletme Tipi</label>
                <select v-model="form.type" required class="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 bg-white">
                  <option value="" disabled>Seçiniz...</option>
                  <option v-for="type in businessTypes" :key="type" :value="type">{{ type }}</option>
                </select>
              </div>
               <div>
                <label class="block text-sm font-bold text-gray-700 mb-1">Telefon</label>
                <input v-model="form.phone" type="tel" required placeholder="0555..." class="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500">
              </div>
             </div>
  
            <!-- Sosyal Medya -->
            <div>
              <label class="block text-sm font-bold text-gray-700 mb-1">
                Google Haritalar / Instagram
              </label>
              <input v-model="form.social_link" type="url" placeholder="https://..." class="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500">
            </div>
  
            <!-- Gönder -->
            <div class="pt-4">
              <button type="submit" :disabled="loading" class="w-full bg-gray-900 text-white py-3.5 rounded-lg font-bold hover:bg-black transition disabled:opacity-50 flex justify-center items-center gap-2">
                <span v-if="loading" class="animate-spin h-5 w-5 border-b-2 border-white rounded-full"></span>
                {{ loading ? 'Gönderiliyor...' : 'Başvuruyu Tamamla' }}
              </button>
            </div>
  
          </form>
        </div>
      </div>
    </div>
  </template>