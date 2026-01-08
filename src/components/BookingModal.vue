<script setup>
    import { ref, watch, computed } from 'vue'
    import { supabase } from '../supabase'
    import { useAuthStore } from '../stores/auth'
    
    const props = defineProps({
      isOpen: Boolean,
      service: Object, // Hangi hizmet seçildi? (İçinde service_staff_link var)
      staffList: Array, // O işletmenin TÜM personelleri
      businessId: Number
    })
    
    const emit = defineEmits(['close', 'success'])
    const authStore = useAuthStore()
    
    // Adımlar: 1-Personel, 2-Tarih, 3-Saat, 4-Onay
    const step = ref(1)
    const loading = ref(false)
    
    // Seçimler
    const selectedStaff = ref(null)
    const selectedDate = ref('')
    const selectedSlot = ref(null)
    const customerNote = ref('')
    
    // Müsait Saatler
    const availableSlots = ref([])
    
    // BUGÜNÜN TARİHİ (Minimum tarih için)
    const minDate = computed(() => {
      return new Date().toISOString().split('T')[0]
    })
    
    // ==========================================
    // YENİ EKLEME: PERSONEL FİLTRELEME 🧠
    // ==========================================
    const filteredStaffList = computed(() => {
      // Veri güvenliği: Hizmet veya link tablosu yoksa boş dön
      if (!props.service || !props.service.service_staff_link) {
        return [] 
      }
    
      // 1. Bu hizmete atanmış personellerin ID'lerini bir diziye çıkar
      const allowedStaffIds = props.service.service_staff_link.map(link => link.staff_id)
    
      // 2. Ana personel listesini bu ID'lere göre filtrele
      return props.staffList.filter(staff => allowedStaffIds.includes(staff.id))
    })
    
    // 1. ADIM: PERSONEL SEÇİNCE
    const selectStaff = (staff) => {
      selectedStaff.value = staff
      step.value = 2 // Tarih seçimine geç
    }
    
    // 2. ADIM: TARİH SEÇİNCE SAATLERİ GETİR
    const fetchSlots = async () => {
      if (!selectedDate.value) return
      
      loading.value = true
      availableSlots.value = []
      selectedSlot.value = null
    
      try {
        const { data, error } = await supabase.rpc('get_available_slots', {
          p_date: selectedDate.value,
          p_staff_id: selectedStaff.value.id,
          p_service_duration: props.service.duration
        })
    
        if (error) throw error
        
        availableSlots.value = data.filter(s => s.is_available)
        
      } catch (error) {
        console.error('Slot hatası:', error)
        alert('Saatler çekilemedi.')
      } finally {
        loading.value = false
      }
    }
    
    // 3. ADIM: SAAT SEÇME
    const selectSlot = (time) => {
      selectedSlot.value = time
      step.value = 3 // Onay ekranına geç
    }
    
    // 4. SON ADIM: RANDEVUYU OLUŞTUR
    const createAppointment = async () => {
      if (!authStore.user) {
        alert('Randevu almak için giriş yapmalısınız.')
        return
      }
    
      loading.value = true
      try {
        const [hours, minutes] = selectedSlot.value.split(':').map(Number)
        const endDate = new Date()
        endDate.setHours(hours, minutes + props.service.duration)
        const endTime = endDate.toTimeString().slice(0, 5) // HH:MM
    
        const { error } = await supabase
          .from('appointments')
          .insert({
            customer_id: authStore.user.id,
            business_id: props.businessId,
            staff_id: selectedStaff.value.id,
            service_id: props.service.id,
            appointment_date: selectedDate.value,
            start_time: selectedSlot.value,
            end_time: endTime,
            status: 'pending',
            customer_note: customerNote.value
          })
    
        if (error) throw error
    
        alert('Randevu talebiniz alındı! 🎉 İşletme onaylayınca bildirim alacaksınız.')
        emit('success')
        closeModal()
    
      } catch (error) {
        alert('Hata: ' + error.message)
      } finally {
        loading.value = false
      }
    }
    
    const closeModal = () => {
      step.value = 1
      selectedStaff.value = null
      selectedDate.value = ''
      selectedSlot.value = null
      availableSlots.value = []
      emit('close')
    }
    
    watch(selectedDate, () => {
      if (selectedDate.value) fetchSlots()
    })
    </script>
    
    <template>
      <div v-if="isOpen" class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
          
          <!-- Header -->
          <div class="bg-gray-900 text-white p-4 flex justify-between items-center shrink-0">
            <div>
              <h3 class="font-bold text-lg">Randevu Oluştur</h3>
              <p class="text-gray-400 text-xs">{{ service?.name }} ({{ service?.duration }} dk)</p>
            </div>
            <button @click="closeModal" class="text-gray-400 hover:text-white text-2xl">&times;</button>
          </div>
    
          <!-- Body -->
          <div class="p-6 overflow-y-auto flex-1">
            
            <!-- ADIM 1: PERSONEL SEÇİMİ -->
            <div v-if="step === 1">
              <h4 class="font-bold text-gray-900 mb-4">Hangi uzmandan hizmet almak istersiniz?</h4>
              
              <!-- Eğer personel atanmamışsa uyarı ver -->
              <div v-if="filteredStaffList.length === 0" class="text-red-500 bg-red-50 p-4 rounded-lg text-sm border border-red-100">
                ⚠️ Bu hizmet için atanmış uygun bir uzman bulunamadı. Lütfen işletme ile iletişime geçin.
              </div>
    
              <div v-else class="space-y-3">
                <!-- DÖNGÜ ARTIK FİLTRELİ LİSTEDE ÇALIŞIYOR -->
                <div 
                  v-for="staff in filteredStaffList" 
                  :key="staff.id"
                  @click="selectStaff(staff)"
                  class="flex items-center gap-4 p-4 border border-gray-200 rounded-xl cursor-pointer hover:border-primary-500 hover:bg-primary-50 transition group"
                >
                  <img :src="staff.profiles?.avatar_url || 'https://via.placeholder.com/150'" class="w-12 h-12 rounded-full object-cover">
                  <div>
                    <h5 class="font-bold text-gray-900 group-hover:text-primary-700">{{ staff.profiles?.full_name }}</h5>
                    <p class="text-xs text-gray-500">{{ staff.title }}</p>
                  </div>
                  <div class="ml-auto text-primary-600 font-bold text-sm">Seç &rarr;</div>
                </div>
              </div>
            </div>
    
            <!-- ADIM 2: TARİH VE SAAT -->
            <div v-if="step === 2">
              <div class="flex items-center gap-3 mb-4">
                <button @click="step = 1" class="text-sm text-gray-500 hover:text-gray-900">← Geri</button>
                <h4 class="font-bold text-gray-900">Tarih ve Saat Seçin</h4>
              </div>
    
              <div class="mb-6">
                <label class="block text-sm font-bold text-gray-700 mb-1">Tarih</label>
                <input 
                  v-model="selectedDate" 
                  type="date" 
                  :min="minDate"
                  class="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-primary-500"
                >
              </div>
    
              <div v-if="loading" class="text-center py-4">
                <div class="animate-spin h-6 w-6 border-b-2 border-primary-600 rounded-full mx-auto"></div>
                <p class="text-xs text-gray-400 mt-2">Müsaitlik durumu kontrol ediliyor...</p>
              </div>
    
              <div v-else-if="selectedDate">
                <h5 class="text-sm font-bold text-gray-700 mb-2">Müsait Saatler ({{ selectedStaff.profiles.full_name }})</h5>
                
                <div v-if="availableSlots.length === 0" class="text-center py-4 bg-gray-50 rounded-lg text-sm text-gray-500">
                  Bu tarihte uygun saat bulunamadı. 😔
                </div>
    
                <div v-else class="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  <button 
                    v-for="slot in availableSlots" 
                    :key="slot.slot_time"
                    @click="selectSlot(slot.slot_time)"
                    class="py-2 px-1 text-sm font-medium rounded-lg border transition text-center"
                    :class="selectedSlot === slot.slot_time ? 'bg-primary-600 text-white border-primary-600' : 'bg-white border-gray-200 hover:border-primary-500 text-gray-700'"
                  >
                    {{ slot.slot_time.slice(0, 5) }}
                  </button>
                </div>
              </div>
            </div>
    
            <!-- ADIM 3: ONAY -->
            <div v-if="step === 3">
               <div class="flex items-center gap-3 mb-4">
                <button @click="step = 2" class="text-sm text-gray-500 hover:text-gray-900">← Geri</button>
                <h4 class="font-bold text-gray-900">Özet ve Onay</h4>
              </div>
    
              <div class="bg-gray-50 p-4 rounded-xl mb-4 space-y-2 text-sm border border-gray-100">
                <div class="flex justify-between">
                  <span class="text-gray-500">Hizmet:</span>
                  <span class="font-bold text-gray-900">{{ service.name }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-500">Uzman:</span>
                  <span class="font-bold text-gray-900">{{ selectedStaff.profiles.full_name }}</span>
                </div>
                 <div class="flex justify-between">
                  <span class="text-gray-500">Tarih:</span>
                  <span class="font-bold text-gray-900">{{ selectedDate }}</span>
                </div>
                 <div class="flex justify-between">
                  <span class="text-gray-500">Saat:</span>
                  <span class="font-bold text-gray-900">{{ selectedSlot.slice(0,5) }}</span>
                </div>
                 <div class="flex justify-between border-t border-gray-200 pt-2 mt-2">
                  <span class="text-gray-500">Ücret:</span>
                  <span class="font-bold text-primary-600 text-lg">₺{{ service.price }}</span>
                </div>
              </div>
    
              <div class="mb-4">
                <label class="block text-sm font-bold text-gray-700 mb-1">Notunuz (İsteğe Bağlı)</label>
                <textarea v-model="customerNote" rows="2" placeholder="Örn: Saçım omuz hizasında..." class="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm"></textarea>
              </div>
    
              <button 
                @click="createAppointment"
                :disabled="loading"
                class="w-full bg-gray-900 text-white py-4 rounded-xl font-bold hover:bg-black transition shadow-lg flex justify-center gap-2"
              >
                 <span v-if="loading" class="animate-spin h-5 w-5 border-b-2 border-white rounded-full"></span>
                {{ loading ? 'İşleniyor...' : 'Randevu Talebi Gönder' }}
              </button>
    
            </div>
    
          </div>
        </div>
      </div>
    </template>