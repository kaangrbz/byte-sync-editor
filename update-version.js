#!/usr/bin/env node

/**
 * ByteSync Editor - Otomatik Versiyon Güncelleme Scripti
 * 
 * Kullanım:
 * node update-version.js patch   (1.41.1 → 1.41.2)
 * node update-version.js minor   (1.41.1 → 1.42.0)
 * node update-version.js major   (1.41.1 → 2.0.0)
 * node update-version.js manual 1.43.0   (versiyonu elle belirle)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);

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

/** Semver formatında mı kontrol eder (X.Y.Z) */
function isValidVersion(version) {
  return /^\d+\.\d+\.\d+$/.test(version);
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
    if (!fs.existsSync('sw.js')) return;
    let swContent = fs.readFileSync('sw.js', 'utf8');
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
 * src/app.ts dosyasındaki fallback versiyonları günceller
 * @param {string} newVersion - Yeni versiyon
 */
function updateAppTs(newVersion) {
  const appPath = 'src/app.ts';
  try {
    if (!fs.existsSync(appPath)) return;
    let content = fs.readFileSync(appPath, 'utf8');
    const fallbackRegex = /version: '[\d.]+', \/\/ fallback version/;
    const manifestFallbackRegex = /manifest\.version \|\| '[\d.]+'/;
    const newFallback = `version: '${newVersion}', // fallback version`;
    const newManifestFallback = `manifest.version || '${newVersion}'`;
    let updated = false;
    if (fallbackRegex.test(content)) {
      content = content.replace(fallbackRegex, newFallback);
      updated = true;
    }
    if (manifestFallbackRegex.test(content)) {
      content = content.replace(manifestFallbackRegex, newManifestFallback);
      updated = true;
    }
    if (updated) {
      fs.writeFileSync(appPath, content);
      console.log(`✅ src/app.ts güncellendi: ${newVersion}`);
    }
  } catch (error) {
    throw new Error('src/app.ts güncellenemedi: ' + error.message);
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
  node update-version.js patch        (1.41.1 → 1.41.2)
  node update-version.js minor       (1.41.1 → 1.42.0)
  node update-version.js major       (1.41.1 → 2.0.0)
  node update-version.js manual 1.43.0   (versiyonu elle belirle)

Versiyon Türleri:
  patch  - Hata düzeltmeleri, küçük iyileştirmeler
  minor  - Yeni özellikler, iyileştirmeler
  major  - Büyük değişiklikler, uyumsuzluklar
  manual - Belirtilen versiyonu kullan (örn: yarn version:manual 1.43.0)

Güncellenen Dosyalar:
  📦 package.json    - version alanı
  📱 manifest.json   - version alanı
  🔧 sw.js          - CACHE_NAME (varsa)
  🌐 index.html     - ByteSync Editor vX.X.X
  📄 src/app.ts     - fallback version
`);
    process.exit(1);
  }
  
  const versionType = args[0].toLowerCase();
  const validTypes = ['patch', 'minor', 'major', 'manual'];

  if (!validTypes.includes(versionType)) {
    console.error(`❌ Geçersiz versiyon türü: ${versionType}`);
    console.error('Geçerli türler: patch, minor, major, manual');
    process.exit(1);
  }

  if (versionType === 'manual' && (!args[1] || !isValidVersion(args[1]))) {
    console.error('❌ manual için geçerli bir versiyon gerekli (örn: 1.43.0)');
    console.error('   yarn version:manual 1.43.0');
    process.exit(1);
  }
  
  try {
    console.log('🔄 Versiyon güncelleme başlatılıyor...\n');
    
    const currentVersion = getCurrentVersion();
    console.log(`📋 Mevcut versiyon: ${currentVersion}`);
    
    const newVersion = versionType === 'manual'
      ? args[1]
      : calculateNewVersion(currentVersion, versionType);
    console.log(`🎯 Yeni versiyon: ${newVersion}\n`);
    
    // Dosyaları güncelle
    updatePackageJson(newVersion);
    updateManifestJson(newVersion);
    updateSwJs(newVersion);
    updateIndexHtml(newVersion);
    updateAppTs(newVersion);
    
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

// Script doğrudan çalıştırılıyorsa main'i çağır
if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  main();
}

export {
  parseVersion,
  formatVersion,
  calculateNewVersion,
  isValidVersion,
  getCurrentVersion,
  updatePackageJson,
  updateManifestJson,
  updateSwJs,
  updateIndexHtml,
  updateAppTs
};
