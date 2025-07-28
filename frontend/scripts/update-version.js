import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * Sürüm dosyasını günceller
 * Bu script build sırasında çalıştırılır ve version.json dosyasını güncel sürüm bilgileriyle günceller
 */
function updateVersionFile() {
  try {
    // package.json'dan sürüm bilgisini al
    const packageJsonPath = path.join(__dirname, '..', 'package.json')
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
    const version = packageJson.version

    // Sürüm dosyası yolu
    const versionFilePath = path.join(__dirname, '..', 'public', 'version.json')

    // Yeni sürüm bilgileri
    const versionInfo = {
      version: version,
      buildTime: new Date().toISOString(),
      hash: generateBuildHash(),
      environment: process.env.NODE_ENV || 'development'
    }

    // Dosyayı güncelle
    fs.writeFileSync(versionFilePath, JSON.stringify(versionInfo, null, 2))
    
    console.log(`✅ Sürüm dosyası güncellendi: ${version}`)
  } catch (error) {
    console.error('❌ Sürüm dosyası güncellenirken hata:', error)
    // Vercel build'de hata olsa bile devam et, sadece uyarı ver
    console.warn('⚠️ Sürüm dosyası güncellenemedi, build devam ediyor...')
  }
}

/**
 * Basit bir build hash'i oluşturur
 */
function generateBuildHash() {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  return `${timestamp}-${random}`
}

// Script çalıştırıldığında sürüm dosyasını güncelle
updateVersionFile() 