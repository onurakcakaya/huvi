<script setup>
    import { ref, onMounted, computed } from 'vue'
    import { supabase } from '../supabase'
    
    const props = defineProps({
      isOpen: Boolean,
      businessId: Number, // BigInt olduğu için Number veya String gelebilir
      existingStaff: Array // Personel listesini dışarıdan alacağız
    })
    
    const emit = defineEmits(['close', 'refresh'])
    
    const form = ref({
      name: '',
      description: '',
      duration: 30, // Varsayılan 30 dk
      price: 0,
      selectedStaffIds: [] // Seçilen personellerin ID'leri
    })
    
    const loading = ref(false)
    
    // SÜRE SEÇENEKLERİ (Kolaylık olsun diye)
    const durationOptions = [
      { label: '15 dk', value: 15 },
      { label: '30 dk', value: 30 },
      { label: '45 dk', value: 45 },
      { label: '1 Saat', value: 60 },
      { label: '1.5 Saat', value: 90 },
      { label: '2 Saat', value: 120 },
    ]
    
    // KAYDETME İŞLEMİ (Transaction Mantığı)
    const saveService = async () => {
      if (!form.value.name || form.value.price <= 0) {
        alert('Lütfen hizmet adı ve geçerli bir fiyat giriniz.')
        return
      }
      
      if (form.value.selectedStaffIds.length === 0) {
        alert('Bu hizmeti verecek en az bir personel seçmelisiniz.')
        return
      }
    
      loading.value = true
      try {
        // 1. Önce Hizmeti Kaydet
        const { data: serviceData, error: serviceError } = await supabase
          .from('business_services')
          .insert({
            business_id: props.businessId,
            name: form.value.name,
            description: form.value.description,
            duration: form.value.duration,
            price: form.value.price
          })
          .select()
          .single()
    
        if (serviceError) throw serviceError
    
        // 2. Sonra Personel Eşleşmelerini Kaydet (Link Table)
        // Seçilen her ID için bir obje oluşturuyoruz
        const links = form.value.selectedStaffIds.map(staffId => ({
          service_id: serviceData.id,
          staff_id: staffId
        }))
    
        const { error: linkError } = await supabase
          .from('service_staff_link')
          .insert(links)
    
        if (linkError) throw linkError
    
        // Başarılı
        emit('refresh')
        closeModal()
    
      } catch (error) {
        alert('Hata: ' + error.message)
      } finally {
        loading.value = false
      }
    }
    
    const closeModal = () => {
      // Formu sıfırla
      form.value = {
        name: '',
        description: '',
        duration: 30,
        price: 0,
        selectedStaffIds: []
      }
      emit('close')
    }
    </script>
    
    <template>
      <div v-if="isOpen" class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
        <div class="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
          
          <!-- Header -->
          <div class="bg-gray-900 text-white p-5 flex justify-between items-center">
            <h3 class="font-bold text-lg">Yeni Hizmet Ekle</h3>
            <button @click="closeModal" class="text-gray-400 hover:text-white text-2xl">&times;</button>
          </div>
    
          <!-- Scrollable Body -->
          <div class="p-6 overflow-y-auto space-y-6">
            
            <!-- 1. Hizmet Detayları -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="md:col-span-2">
                <label class="block text-sm font-bold text-gray-700 mb-1">Hizmet Adı</label>
                <input v-model="form.name" type="text" placeholder="Örn: Saç Kesimi & Yıkama" class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-primary-500">
              </div>
    
              <div>
                <label class="block text-sm font-bold text-gray-700 mb-1">Ücret (TL)</label>
                <input v-model="form.price" type="number" min="0" class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-primary-500">
              </div>
    
              <div>
                <label class="block text-sm font-bold text-gray-700 mb-1">Süre</label>
                <select v-model="form.duration" class="w-full border border-gray-300 rounded-lg px-4 py-2 bg-white focus:ring-primary-500">
                  <option v-for="opt in durationOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                </select>
              </div>
    
              <div class="md:col-span-2">
                <label class="block text-sm font-bold text-gray-700 mb-1">Açıklama (Opsiyonel)</label>
                <textarea v-model="form.description" rows="2" class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-primary-500"></textarea>
              </div>
            </div>
    
            <hr class="border-gray-100">
    
            <!-- 2. Personel Seçimi (Hizmeti Kim Veriyor?) -->
            <div>
              <h4 class="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span>👥</span> Bu hizmeti hangi uzmanlar verecek?
              </h4>
              
              <div v-if="existingStaff.length === 0" class="text-red-500 text-sm bg-red-50 p-3 rounded-lg">
                Önce personel eklemeniz gerekmektedir.
              </div>
    
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label 
                  v-for="staff in existingStaff" 
                  :key="staff.id"
                  class="flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition select-none"
                  :class="form.selectedStaffIds.includes(staff.id) ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:bg-gray-50'"
                >
                  <input type="checkbox" :value="staff.id" v-model="form.selectedStaffIds" class="w-5 h-5 text-primary-600 rounded focus:ring-primary-500">
                  
                  <img :src="staff.profiles.avatar_url || 'https://via.placeholder.com/150'" class="w-8 h-8 rounded-full object-cover">
                  
                  <div>
                    <span class="block text-sm font-bold text-gray-900">{{ staff.profiles.full_name }}</span>
                    <span class="block text-xs text-gray-500">{{ staff.title }}</span>
                  </div>
                </label>
              </div>
            </div>
    
          </div>
    
          <!-- Footer -->
          <div class="p-5 border-t border-gray-100 bg-gray-50 flex justify-end">
            <button 
              @click="saveService"
              :disabled="loading"
              class="bg-gray-900 text-white px-6 py-3 rounded-lg font-bold hover:bg-black transition flex items-center gap-2"
            >
              <span v-if="loading" class="animate-spin h-5 w-5 border-b-2 border-white rounded-full"></span>
              {{ loading ? 'Kaydediliyor...' : 'Hizmeti Oluştur' }}
            </button>
          </div>
    
        </div>
      </div>
    </template>