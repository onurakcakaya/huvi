<script setup>
    import { onMounted, ref } from 'vue'
    import { useRoute, useRouter } from 'vue-router'
    import { supabase } from '../supabase'
    import DefaultLayout from '../layouts/DefaultLayout.vue'
    
    const route = useRoute()
    const router = useRouter()
    const loading = ref(true)
    const saving = ref(false)
    const staff = ref(null)
    
    // Varsayılan Haftalık Program Şablonu
    const defaultSchedule = {
      monday:    { active: true, start: '09:00', end: '19:00' },
      tuesday:   { active: true, start: '09:00', end: '19:00' },
      wednesday: { active: true, start: '09:00', end: '19:00' },
      thursday:  { active: true, start: '09:00', end: '19:00' },
      friday:    { active: true, start: '09:00', end: '19:00' },
      saturday:  { active: true, start: '09:00', end: '19:00' },
      sunday:    { active: false, start: '09:00', end: '19:00' } // Pazar genelde kapalı
    }
    
    // Gün İsimleri Çevirisi (UI için)
    const dayLabels = {
      monday: 'Pazartesi',
      tuesday: 'Salı',
      wednesday: 'Çarşamba',
      thursday: 'Perşembe',
      friday: 'Cuma',
      saturday: 'Cumartesi',
      sunday: 'Pazar'
    }
    
    // VERİYİ ÇEK
    const fetchStaffDetail = async () => {
      try {
        const staffId = route.params.id
    
        const { data, error } = await supabase
          .from('business_staff')
          .select(`
            *,
            profiles:user_id ( full_name, avatar_url, contact_email )
          `)
          .eq('id', staffId)
          .single()
    
        if (error) throw error
    
        // Eğer veritabanında saatler boşsa varsayılanı kullan, varsa birleştir
        if (!data.working_hours || Object.keys(data.working_hours).length === 0) {
          data.working_hours = JSON.parse(JSON.stringify(defaultSchedule))
        } else {
          // Eksik gün varsa varsayılanla tamamla (Merge)
          data.working_hours = { ...defaultSchedule, ...data.working_hours }
        }
    
        staff.value = data
    
      } catch (error) {
        console.error('Hata:', error)
        router.push('/my-staff') // Hata varsa listeye dön
      } finally {
        loading.value = false
      }
    }
    
    // KAYDET
    const saveChanges = async () => {
      try {
        saving.value = true
        
        const { error } = await supabase
          .from('business_staff')
          .update({
            title: staff.value.title,
            gender: staff.value.gender,
            birth_date: staff.value.birth_date,
            working_hours: staff.value.working_hours
          })
          .eq('id', staff.value.id)
    
        if (error) throw error
        alert('Bilgiler başarıyla güncellendi! ✅')
    
      } catch (error) {
        alert('Hata: ' + error.message)
      } finally {
        saving.value = false
      }
    }
    
    // PERSONELİ SİL
    const deleteStaff = async () => {
      if (!confirm('Bu personeli ve tüm ayarlarını silmek istediğinize emin misiniz?')) return
    
      const { error } = await supabase.from('business_staff').delete().eq('id', staff.value.id)
      if (!error) router.push('/my-staff')
    }
    
    onMounted(() => {
      fetchStaffDetail()
    })
    </script>
    
    <template>
      <DefaultLayout>
        <div class="max-w-4xl mx-auto px-4 py-8 pb-24">
          
          <!-- Back Button -->
          <button @click="router.back()" class="flex items-center text-gray-500 hover:text-gray-900 mb-6 transition">
            <svg class="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
            Listeye Dön
          </button>
    
          <!-- Loading -->
          <div v-if="loading" class="text-center py-20">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          </div>
    
          <div v-else>
            <!-- Başlık Kartı -->
            <div class="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-center gap-6 mb-8">
              <img :src="staff.profiles.avatar_url || 'https://via.placeholder.com/150'" class="w-24 h-24 rounded-full object-cover border-4 border-gray-50 shadow-md">
              <div class="text-center md:text-left flex-1">
                <h1 class="text-2xl font-bold text-gray-900">{{ staff.profiles.full_name }}</h1>
                <p class="text-gray-500">{{ staff.profiles.contact_email }}</p>
                <div class="mt-2 inline-block px-3 py-1 bg-primary-50 text-primary-700 rounded-lg text-sm font-bold border border-primary-100">
                  {{ staff.role === 'manager' ? 'Yönetici' : 'Personel' }}
                </div>
              </div>
              <button @click="deleteStaff" class="text-red-500 hover:text-red-700 font-medium text-sm border border-red-200 hover:bg-red-50 px-4 py-2 rounded-lg transition">
                Personeli Sil 🗑️
              </button>
            </div>
    
            <form @submit.prevent="saveChanges" class="space-y-8">
              
              <!-- 1. KİŞİSEL & KURUMSAL BİLGİLER -->
              <div class="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <h2 class="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span>🆔</span> Kimlik & Ünvan Bilgileri
                </h2>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <!-- Ünvan -->
                  <div>
                    <label class="block text-sm font-bold text-gray-700 mb-1">İşletmedeki Ünvanı</label>
                    <input v-model="staff.title" type="text" placeholder="Örn: Saç Kesim Uzmanı" class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-primary-500 focus:border-primary-500">
                  </div>
    
                  <!-- Cinsiyet -->
                  <div>
                    <label class="block text-sm font-bold text-gray-700 mb-1">Cinsiyet</label>
                    <select v-model="staff.gender" class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-primary-500 focus:border-primary-500 bg-white">
                      <option value="unspecified">Belirtilmedi</option>
                      <option value="female">Kadın</option>
                      <option value="male">Erkek</option>
                    </select>
                  </div>
    
                  <!-- Doğum Tarihi -->
                  <div>
                    <label class="block text-sm font-bold text-gray-700 mb-1">Doğum Tarihi</label>
                    <input v-model="staff.birth_date" type="date" class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-primary-500 focus:border-primary-500">
                  </div>
                </div>
              </div>
    
              <!-- 2. ÇALIŞMA SAATLERİ (HAFTALIK PROGRAM) -->
              <div class="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <h2 class="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
                  <span>⏰</span> Çalışma Saatleri
                </h2>
                <p class="text-gray-500 text-sm mb-6">Personelin randevu kabul edeceği gün ve saatleri belirleyin.</p>
    
                <div class="space-y-3">
                  <!-- Günler Döngüsü -->
                  <div 
                    v-for="(dayKey) in Object.keys(defaultSchedule)" 
                    :key="dayKey" 
                    class="flex flex-col sm:flex-row items-center justify-between p-3 rounded-xl border transition"
                    :class="staff.working_hours[dayKey].active ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100 opacity-70'"
                  >
                    
                    <!-- Toggle (Aç/Kapa) ve Gün Adı -->
                    <div class="flex items-center gap-4 w-full sm:w-40 mb-2 sm:mb-0">
                      <label class="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" v-model="staff.working_hours[dayKey].active" class="sr-only peer">
                        <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                      </label>
                      <span class="font-bold text-gray-700">{{ dayLabels[dayKey] }}</span>
                    </div>
    
                    <!-- Saat Seçiciler (Eğer gün aktifse görünür) -->
                    <div v-if="staff.working_hours[dayKey].active" class="flex items-center gap-3 w-full sm:w-auto">
                      <div class="flex items-center gap-2">
                        <input 
                          type="time" 
                          v-model="staff.working_hours[dayKey].start" 
                          class="border border-gray-300 rounded-lg px-2 py-1 text-sm focus:ring-primary-500"
                        >
                        <span class="text-gray-400">-</span>
                        <input 
                          type="time" 
                          v-model="staff.working_hours[dayKey].end" 
                          class="border border-gray-300 rounded-lg px-2 py-1 text-sm focus:ring-primary-500"
                        >
                      </div>
                    </div>
                    
                    <!-- Kapalı Yazısı -->
                    <div v-else class="w-full sm:w-auto text-center sm:text-right">
                      <span class="text-gray-400 text-sm font-medium italic pr-4">İzinli / Kapalı</span>
                    </div>
    
                  </div>
                </div>
              </div>
    
              <!-- KAYDET BUTONU -->
              <div class="flex justify-end pt-4">
                <button 
                  type="submit" 
                  :disabled="saving"
                  class="bg-gray-900 text-white px-8 py-3.5 rounded-xl font-bold hover:bg-black transition shadow-lg flex items-center gap-2 disabled:opacity-50"
                >
                  <span v-if="saving" class="animate-spin h-5 w-5 border-b-2 border-white rounded-full"></span>
                  {{ saving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet' }}
                </button>
              </div>
    
            </form>
          </div>
        </div>
      </DefaultLayout>
    </template>