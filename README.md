# Genetik ve Memetik Algoritma Uygulama Kılavuzu

## İçindekiler
- [Genel Bakış](#genel-bakış)
- [Algoritma Bileşenleri](#algoritma-bileşenleri)
  - [Başlangıç Popülasyonu](#1-başlangıç-popülasyonu)
  - [Uygunluk Hesaplama](#2-uygunluk-hesaplama)
  - [Seçilim](#3-seçilim)
  - [Çaprazlama](#4-çaprazlama)
  - [Mutasyon](#5-mutasyon)
  - [Yerel Arama (Memetik)](#6-yerel-arama-memetik)
- [Uygulama Örnekleri](#uygulama-örnekleri)
- [Kullanım](#kullanım)

## Genel Bakış

Bu uygulama, Gezgin Satıcı Problemi'ni (TSP) çözmek için Genetik Algoritma (GA) ve Memetik Algoritma (MA) yaklaşımlarını birleştirir. Temel fark, MA'nın yerel arama optimizasyonunu içermesidir.

## Algoritma Bileşenleri

### 1. Başlangıç Popülasyonu

İlk nesil rastgele çözümleri oluşturur.

```javascript
class GenetikAlgoritma {
    baslangicPopulasyonuOlustur() {
        return Array.from({ length: this.popBoyutu }, () => 
            this.diziKaristir([...this.sehirler]));
    }
}

// Örnek:
// Popülasyon boyutu = 50
// Her birey = Tüm şehirler için rastgele bir rota
baslangicPopulasyonu = [
    [sehir1, sehir4, sehir2, sehir3], // Birey 1
    [sehir2, sehir1, sehir3, sehir4], // Birey 2
    // ... 48 birey daha
]
```

### 2. Uygunluk Hesaplama

Her çözümü toplam rota mesafesine göre değerlendirir ve sıralar.

```javascript
rotaMesafesiHesapla(rota) {
    let mesafe = 0;
    for (let i = 0; i < rota.length; i++) {
        const kaynak = rota[i];
        const hedef = rota[(i + 1) % rota.length];
        mesafe += kaynak.mesafe(hedef);
    }
    return mesafe;
}

rotalariSirala(populasyon) {
    const rotaMesafeleri = populasyon.map((rota, index) => ({
        index,
        mesafe: this.rotaMesafesiHesapla(rota)
    }));
    return rotaMesafeleri.sort((a, b) => a.mesafe - b.mesafe);
}

// Örnek çıktı:
siraliPopulasyon = [
    {index: 5, mesafe: 100},  // En iyi rota
    {index: 12, mesafe: 120}, // İkinci en iyi
    // ... diğer rotalar
]
```

### 3. Seçilim

Elit seçim ve uygunluk orantılı seçim kullanarak çaprazlama için bireyleri seçer.

```javascript
secilim(siraliPopulasyon, populasyon) {
    const secimSonuclari = [];
    
    // Elit seçim (örn. en iyi 10)
    for (let i = 0; i < this.elitBoyutu; i++) {
        secimSonuclari.push(populasyon[siraliPopulasyon[i].index]);
    }

    // Kalan yerler için uygunluk orantılı seçim
    const uygunlukPuanlari = siraliPopulasyon.map(rota => 1 / (1 + rota.mesafe));
    const toplamUygunluk = uygunlukPuanlari.reduce((a, b) => a + b, 0);
    const olasiliklar = uygunlukPuanlari.map(puan => puan / toplamUygunluk);
    
    while (secimSonuclari.length < this.popBoyutu) {
        const secim = Math.random();
        for (let i = 0; i < kumulatifOlasiliklar.length; i++) {
            if (secim <= kumulatifOlasiliklar[i]) {
                secimSonuclari.push(populasyon[siraliPopulasyon[i].index]);
                break;
            }
        }
    }
    
    return secimSonuclari;
}
```

### 4. Çaprazlama

Seçilen ebeveynleri birleştirerek yeni çözümler oluşturur.

```javascript
caprazla(ebeveyn1, ebeveyn2) {
    const cocuk = Array(ebeveyn1.length).fill(null);
    
    // Ebeveyn1'den alt küme seç
    const baslangicPoz = Math.floor(Math.random() * ebeveyn1.length);
    const bitisPoz = Math.floor(Math.random() * ebeveyn1.length);
    
    // Ebeveyn1'den seçilen bölümü kopyala
    const [baslangic, bitis] = [Math.min(baslangicPoz, bitisPoz), 
                               Math.max(baslangicPoz, bitisPoz)];
    for (let i = baslangic; i <= bitis; i++) {
        cocuk[i] = ebeveyn1[i];
    }
    
    // Kalan pozisyonları ebeveyn2'den doldur
    let cocukPoz = 0;
    for (const sehir of ebeveyn2) {
        if (!cocuk.includes(sehir)) {
            while (cocuk[cocukPoz] !== null) {
                cocukPoz++;
            }
            cocuk[cocukPoz] = sehir;
        }
    }
    
    return cocuk;
}

// Örnek:
// ebeveyn1: [sehir1, sehir2, sehir3, sehir4]
// ebeveyn2: [sehir2, sehir4, sehir1, sehir3]
// ebeveyn1'den seçilen bölüm: sehir2, sehir3
// sonuç çocuk: [sehir4, sehir2, sehir3, sehir1]
```

### 5. Mutasyon

Çeşitliliği korumak için küçük rastgele değişiklikler yapar.

```javascript
mutasyon(rota) {
    for (let i = 0; i < rota.length; i++) {
        if (Math.random() < this.mutasyonOrani) { // genellikle 0.01
            const j = Math.floor(Math.random() * rota.length);
            [rota[i], rota[j]] = [rota[j], rota[i]];
        }
    }
    return rota;
}
```

### 6. Yerel Arama (Memetik)

Memetik Algoritmada ek optimizasyon adımı. Şu şekillerde uygulanabilir:
- Sadece elit bireylere
- Tüm popülasyona
- Rastgele seçilen bireylere
- Periyodik olarak

```javascript
// Örnek 1: Sadece elit bireylere yerel arama
class MemetikAlgoritma extends GenetikAlgoritma {
    sonrakiNesil(populasyon) {
        const sonrakiNesil = super.sonrakiNesil(populasyon);
        
        // Elit bireylere yerel arama uygula
        for (let i = 0; i < this.elitBoyutu; i++) {
            sonrakiNesil[i] = this.yerelArama(sonrakiNesil[i]);
        }
        
        return sonrakiNesil;
    }
}

// Örnek 2: Tüm popülasyona yerel arama
class MemetikAlgoritma extends GenetikAlgoritma {
    sonrakiNesil(populasyon) {
        const sonrakiNesil = super.sonrakiNesil(populasyon);
        return sonrakiNesil.map(birey => this.yerelArama(birey));
    }
}
```

## Kullanım

```javascript
// Örnekleri oluştur
const sehirler = sehirlerOlustur(20);
const ga = new GenetikAlgoritma(sehirler, 50, 10, 0.01);
const ma = new MemetikAlgoritma(sehirler, 50, 10, 0.01, 50, 'ikiOpt');

// Tek nesil çalıştır
let gaPopulasyon = ga.baslangicPopulasyonuOlustur();
let maPopulasyon = ma.baslangicPopulasyonuOlustur();

gaPopulasyon = ga.sonrakiNesil(gaPopulasyon);
maPopulasyon = ma.sonrakiNesil(maPopulasyon);

// Parametreler:
// - Popülasyon boyutu: 50
// - Elit boyutu: 10
// - Mutasyon oranı: 0.01
// - Yerel arama iterasyonu: 50
// - Optimizasyon yöntemi: 'ikiOpt'
```

## Algoritma Akışı

1. Başlangıç popülasyonu oluştur (50 rastgele rota)
2. Her nesil için:
   - Her rotanın uygunluğunu hesapla
   - Rotaları uygunluğa göre sırala
   - Ebeveynleri seç (10 elit + 40 seçilen)
   - Çaprazlama ile yeni popülasyon oluştur
   - Mutasyon uygula
   - Memetik için: Yerel arama uygula
3. Maksimum nesil sayısına ulaşana kadar tekrarla

Bu uygulama, TSP'yi çözmek için hem genetik hem de memetik yaklaşımları kullanmayı sağlayan esnek bir çerçeve sunar. En iyi performans için çeşitli parametreler ayarlanabilir.