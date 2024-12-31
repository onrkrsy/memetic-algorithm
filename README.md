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
### Ekran Görüntüsü
![image](https://github.com/user-attachments/assets/4dadd789-bc42-4b07-a275-09c3daa6d73b)


## Algoritma Bileşenleri

### 1. Başlangıç Popülasyonu

İlk nesil rastgele çözümleri oluşturur.

```javascript
class GeneticAlgorithm {
    createInitialPopulation() {
        return Array.from({ length: this.popSize }, () => 
            this.shuffleArray([...this.cities]));
    }
}

// Örnek:
// Popülasyon boyutu = 50
// Her birey = Tüm şehirler için rastgele bir rota
initialPopulation = [
    [city1, city4, city2, city3], // Birey 1
    [city2, city1, city3, city4], // Birey 2
    // ... 48 birey daha
]
```

### 2. Uygunluk Hesaplama

Her çözümü toplam rota mesafesine göre değerlendirir ve sıralar.

```javascript
calculateRouteDistance(route) {
    let distance = 0;
    for (let i = 0; i < route.length; i++) {
        const from = route[i];
        const to = route[(i + 1) % route.length];
        distance += from.distance(to);
    }
    return distance;
}

rankRoutes(population) {
    const routeDistances = population.map((route, index) => ({
        index,
        distance: this.calculateRouteDistance(route)
    }));
    return routeDistances.sort((a, b) => a.distance - b.distance);
}

// Örnek çıktı:
rankedPopulation = [
    {index: 5, distance: 100},  // En iyi rota
    {index: 12, distance: 120}, // İkinci en iyi
    // ... diğer rotalar
]
```

### 3. Seçilim

Elit seçim ve uygunluk orantılı seçim kullanarak çaprazlama için bireyleri seçer.

```javascript
selection(rankedPopulation, population) {
    const selectionResults = [];
    
    // Elit seçim (örn. en iyi 10)
    for (let i = 0; i < this.eliteSize; i++) {
        selectionResults.push(population[rankedPopulation[i].index]);
    }

    // Kalan yerler için uygunluk orantılı seçim
    const fitnessScores = rankedPopulation.map(route => 1 / (1 + route.distance));
    const totalFitness = fitnessScores.reduce((a, b) => a + b, 0);
    const probabilities = fitnessScores.map(score => score / totalFitness);
    
    while (selectionResults.length < this.popSize) {
        const pick = Math.random();
        for (let i = 0; i < cumulativeProbabilities.length; i++) {
            if (pick <= cumulativeProbabilities[i]) {
                selectionResults.push(population[rankedPopulation[i].index]);
                break;
            }
        }
    }
    
    return selectionResults;
}
```

### 4. Çaprazlama

Seçilen ebeveynleri birleştirerek yeni çözümler oluşturur.

```javascript
breed(parent1, parent2) {
    const child = Array(parent1.length).fill(null);
    
    // Ebeveyn1'den alt küme seç
    const startPos = Math.floor(Math.random() * parent1.length);
    const endPos = Math.floor(Math.random() * parent1.length);
    
    // Ebeveyn1'den seçilen bölümü kopyala
    const [start, end] = [Math.min(startPos, endPos), Math.max(startPos, endPos)];
    for (let i = start; i <= end; i++) {
        child[i] = parent1[i];
    }
    
    // Kalan pozisyonları ebeveyn2'den doldur
    let childPos = 0;
    for (const city of parent2) {
        if (!child.includes(city)) {
            while (child[childPos] !== null) {
                childPos++;
            }
            child[childPos] = city;
        }
    }
    
    return child;
}

// Örnek:
// parent1: [city1, city2, city3, city4]
// parent2: [city2, city4, city1, city3]
// parent1'den seçilen bölüm: city2, city3
// sonuç child: [city4, city2, city3, city1]
```

### 5. Mutasyon

Çeşitliliği korumak için küçük rastgele değişiklikler yapar.

```javascript
mutate(route) {
    for (let i = 0; i < route.length; i++) {
        if (Math.random() < this.mutationRate) { // genellikle 0.01
            const j = Math.floor(Math.random() * route.length);
            [route[i], route[j]] = [route[j], route[i]];
        }
    }
    return route;
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
class MemeticAlgorithm extends GeneticAlgorithm {
    nextGeneration(population) {
        const nextGen = super.nextGeneration(population);
        
        // Elit bireylere yerel arama uygula
        for (let i = 0; i < this.eliteSize; i++) {
            nextGen[i] = this.localSearch(nextGen[i]);
        }
        
        return nextGen;
    }
}

// Örnek 2: Tüm popülasyona yerel arama
class MemeticAlgorithm extends GeneticAlgorithm {
    nextGeneration(population) {
        const nextGen = super.nextGeneration(population);
        return nextGen.map(individual => this.localSearch(individual));
    }
}
```

## Kullanım

```javascript
// Örnekleri oluştur
const cities = generateCities(20);
const ga = new GeneticAlgorithm(cities, 50, 10, 0.01);
const ma = new MemeticAlgorithm(cities, 50, 10, 0.01, 50, 'twoOpt');

// Tek nesil çalıştır
let gaPopulation = ga.createInitialPopulation();
let maPopulation = ma.createInitialPopulation();

gaPopulation = ga.nextGeneration(gaPopulation);
maPopulation = ma.nextGeneration(maPopulation);

// Parametreler:
// - Population size: 50
// - Elite size: 10
// - Mutation rate: 0.01
// - Local search iterations: 50
// - Optimization method: 'twoOpt'
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

Bu uygulama, TSP'yi çözmek için hem genetik hem de memetik yaklaşımları kullanır. En iyi performans için çeşitli parametreler ayarlanabilir.
