#!/usr/bin/env node

/**
 * ByteSync Editor - Otomatik Versiyon Güncelleme Scripti
 * 
 * Kullanım:
 * node update-version.js patch   (1.41.1 → 1.41.2)
 * node update-version.js minor   (1.41.1 → 1.42.0)
 * node update-version.js major   (1.41.1 → 2.0.0)
 */

const fs = require('fs');
const path = require('path');

// Güncellenecek dosyalar
const FILES_TO_UPDATE = [
  'package.json',
  'manifest.json',
  'sw.js',
  'index.html',
  'app.js'
];

/**
 * Versiyon numarasını parse eder
 * @param {string} version - "1.41.1" formatında versiyon
 * @returns {object} - {major, minor, patch}
 */
function parseVersion(version) {
  const parts = version.split('.').map(Number);
  return {
    major: parts[0] || 0,
    minor: parts[1] || 0,
    patch: parts[2] || 0
  };
}

/**
 * Versiyon numarasını string'e çevirir
 * @param {object} version - {major, minor, patch}
 * @returns {string} - "1.41.1" formatında versiyon
 */
function formatVersion(version) {
  return `${version.major}.${version.minor}.${version.patch}`;
}

/**
 * Yeni versiyonu hesaplar
 * @param {string} currentVersion - Mevcut versiyon
 * @param {string} type - "patch", "minor", "major"
 * @returns {string} - Yeni versiyon
 */
function calculateNewVersion(currentVersion, type) {
  const version = parseVersion(currentVersion);
  
  switch (type) {
    case 'patch':
      version.patch++;
      break;
    case 'minor':
      version.minor++;
      version.patch = 0;
      break;
    case 'major':
      version.major++;
      version.minor = 0;
      version.patch = 0;
      break;
    default:
      throw new Error(`Geçersiz versiyon türü: ${type}`);
  }
  
  return formatVersion(version);
}

/**
 * package.json dosyasından mevcut versiyonu okur
 * @returns {string} - Mevcut versiyon
 */
function getCurrentVersion() {
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    return packageJson.version;
  } catch (error) {
    throw new Error('package.json dosyası okunamadı: ' + error.message);
  }
}

/**
 * package.json dosyasını günceller
 * @param {string} newVersion - Yeni versiyon
 */
function updatePackageJson(newVersion) {
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    packageJson.version = newVersion;
    fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2) + '\n');
    console.log(`✅ package.json güncellendi: ${newVersion}`);
  } catch (error) {
    throw new Error('package.json güncellenemedi: ' + error.message);
  }
}

/**
 * manifest.json dosyasını günceller
 * @param {string} newVersion - Yeni versiyon
 */
function updateManifestJson(newVersion) {
  try {
    const manifestJson = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));
    manifestJson.version = newVersion;
    fs.writeFileSync('manifest.json', JSON.stringify(manifestJson, null, 2) + '\n');
    console.log(`✅ manifest.json güncellendi: ${newVersion}`);
  } catch (error) {
    throw new Error('manifest.json güncellenemedi: ' + error.message);
  }
}

/**
 * sw.js dosyasını günceller
 * @param {string} newVersion - Yeni versiyon
 */
function updateSwJs(newVersion) {
  try {
    let swContent = fs.readFileSync('sw.js', 'utf8');
    
    // CACHE_NAME satırını bul ve güncelle
    const cacheNameRegex = /const CACHE_NAME = 'bytesync-editor-v[\d.]+';/;
    const newCacheName = `const CACHE_NAME = 'bytesync-editor-v${newVersion}';`;
    
    if (cacheNameRegex.test(swContent)) {
      swContent = swContent.replace(cacheNameRegex, newCacheName);
      fs.writeFileSync('sw.js', swContent);
      console.log(`✅ sw.js güncellendi: ${newCacheName}`);
    } else {
      console.log('⚠️  sw.js dosyasında CACHE_NAME bulunamadı');
    }
  } catch (error) {
    throw new Error('sw.js güncellenemedi: ' + error.message);
  }
}

/**
 * index.html dosyasını günceller
 * @param {string} newVersion - Yeni versiyon
 */
function updateIndexHtml(newVersion) {
  try {
    let htmlContent = fs.readFileSync('index.html', 'utf8');
    
    // ByteSync Editor vX.X.X formatındaki versiyonu bul ve güncelle
    const versionRegex = /ByteSync Editor v[\d.]+/g;
    const newVersionText = `ByteSync Editor v${newVersion}`;
    
    if (versionRegex.test(htmlContent)) {
      htmlContent = htmlContent.replace(versionRegex, newVersionText);
      fs.writeFileSync('index.html', htmlContent);
      console.log(`✅ index.html güncellendi: ${newVersionText}`);
    } else {
      console.log('⚠️  index.html dosyasında versiyon bulunamadı');
    }
  } catch (error) {
    throw new Error('index.html güncellenemedi: ' + error.message);
  }
}

/**
 * app.js dosyasındaki fallback versiyonu günceller
 * @param {string} newVersion - Yeni versiyon
 */
function updateAppJs(newVersion) {
  try {
    let appContent = fs.readFileSync('app.js', 'utf8');
    
    // Fallback version satırını bul ve güncelle
    const fallbackVersionRegex = /version: '[\d.]+', \/\/ fallback version/;
    const newFallbackVersion = `version: '${newVersion}', // fallback version`;
    
    if (fallbackVersionRegex.test(appContent)) {
      appContent = appContent.replace(fallbackVersionRegex, newFallbackVersion);
      fs.writeFileSync('app.js', appContent);
      console.log(`✅ app.js fallback version güncellendi: ${newVersion}`);
    } else {
      console.log('⚠️  app.js dosyasında fallback version bulunamadı');
    }
  } catch (error) {
    throw new Error('app.js güncellenemedi: ' + error.message);
  }
}

/**
 * Ana fonksiyon
 */
function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
🚀 ByteSync Editor - Versiyon Güncelleme Scripti

Kullanım:
  node update-version.js patch   (1.41.1 → 1.41.2)
  node update-version.js minor   (1.41.1 → 1.42.0)
  node update-version.js major   (1.41.1 → 2.0.0)

Versiyon Türleri:
  patch  - Hata düzeltmeleri, küçük iyileştirmeler
  minor  - Yeni özellikler, iyileştirmeler
  major  - Büyük değişiklikler, uyumsuzluklar

Güncellenen Dosyalar:
  📦 package.json    - version alanı
  📱 manifest.json   - version alanı
  🔧 sw.js          - CACHE_NAME değeri
  🌐 index.html     - ByteSync Editor vX.X.X
`);
    process.exit(1);
  }
  
  const versionType = args[0].toLowerCase();
  
  if (!['patch', 'minor', 'major'].includes(versionType)) {
    console.error(`❌ Geçersiz versiyon türü: ${versionType}`);
    console.error('Geçerli türler: patch, minor, major');
    process.exit(1);
  }
  
  try {
    console.log('🔄 Versiyon güncelleme başlatılıyor...\n');
    
    // Mevcut versiyonu al
    const currentVersion = getCurrentVersion();
    console.log(`📋 Mevcut versiyon: ${currentVersion}`);
    
    // Yeni versiyonu hesapla
    const newVersion = calculateNewVersion(currentVersion, versionType);
    console.log(`🎯 Yeni versiyon: ${newVersion}\n`);
    
    // Dosyaları güncelle
    updatePackageJson(newVersion);
    updateManifestJson(newVersion);
    updateSwJs(newVersion);
    updateIndexHtml(newVersion);
    updateAppJs(newVersion);
    
    console.log(`\n🎉 Versiyon güncelleme tamamlandı!`);
    console.log(`📦 ${currentVersion} → ${newVersion}`);
    console.log(`\n📝 Sonraki adımlar:`);
    console.log(`   git add .`);
    console.log(`   git commit -m "chore: versiyon ${newVersion} güncellendi"`);
    console.log(`   git tag v${newVersion}`);
    console.log(`   git push origin main --tags`);
    
  } catch (error) {
    console.error(`❌ Hata: ${error.message}`);
    process.exit(1);
  }
}

// Script çalıştırılıyorsa main fonksiyonunu çağır
if (require.main === module) {
  main();
}

module.exports = {
  parseVersion,
  formatVersion,
  calculateNewVersion,
  getCurrentVersion,
  updatePackageJson,
  updateManifestJson,
  updateSwJs,
  updateIndexHtml,
  updateAppJs
};
