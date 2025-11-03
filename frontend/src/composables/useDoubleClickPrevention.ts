import { ref } from 'vue';

/**
 * Çift tıklama ve çoklu kayıt önleme composable'ı
 * 
 * Kullanım:
 * const { isProcessing, executeOnce } = useDoubleClickPrevention()
 * 
 * <q-btn 
 *   @click="executeOnce(myFunction)" 
 *   :loading="isProcessing" 
 *   :disable="isProcessing"
 * />
 */
export function useDoubleClickPrevention(minDelayMs = 1000) {
  const isProcessing = ref(false);
  const lastExecutionTime = ref(0);

  /**
   * Fonksiyonu sadece bir kere çalıştırır
   * İşlem devam ederken veya minimum bekleme süresi geçmemişse engeller
   */
  async function executeOnce<T>(
    fn: () => Promise<T> | T,
    options?: {
      onError?: (error: unknown) => void;
      onSuccess?: (result: T) => void;
      onFinally?: () => void;
    }
  ): Promise<T | null> {
    // Çift tıklama kontrolü
    const now = Date.now();
    const timeSinceLastExecution = now - lastExecutionTime.value;

    // Minimum süre geçmemişse engelle
    if (timeSinceLastExecution < minDelayMs) {
      console.warn(`⚠️ Çok hızlı tıklama tespit edildi! ${minDelayMs}ms beklemelisiniz.`);
      return null;
    }

    // İşlem zaten devam ediyorsa engelle
    if (isProcessing.value) {
      console.warn('⚠️ İşlem devam ediyor, lütfen bekleyin...');
      return null;
    }

    try {
      isProcessing.value = true;
      lastExecutionTime.value = now;

      const result = await fn();
      
      if (options?.onSuccess) {
        options.onSuccess(result);
      }

      return result;
    } catch (error) {
      console.error('❌ İşlem hatası:', error);
      
      if (options?.onError) {
        options.onError(error);
      } else {
        throw error;
      }
      
      return null;
    } finally {
      // Minimum bekleme süresini garanti et
      setTimeout(() => {
        isProcessing.value = false;
      }, Math.max(0, minDelayMs - (Date.now() - lastExecutionTime.value)));

      if (options?.onFinally) {
        options.onFinally();
      }
    }
  }

  /**
   * Manuel olarak işlem durumunu sıfırla
   */
  function reset() {
    isProcessing.value = false;
    lastExecutionTime.value = 0;
  }

  return {
    isProcessing,
    executeOnce,
    reset
  };
}

