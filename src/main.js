
        
 // Google Maps değişkenleri
 let map;
 let mapPolyline;
 let markers = [];
 let mapInitialized = false;
 let cities = [];
 let gaPolyline = null;  // GA rotası için polyline
let maPolyline = null;  // MA rotası için polyline
// Google Maps yüklendiğinde çağrılacak callback
let directionsService;
let directionsRendererGA;
let directionsRendererMA;
function initializeMap() {
    try {
        console.log('Initializing map...');
        const mapElement = document.getElementById('map');
        if (!mapElement) {
            console.error('Map element not found');
            return;
        }

        map = new google.maps.Map(mapElement, {
            zoom: 10,
            center: { lat: 36.8525, lng: 28.2427 }, // Marmaris merkez
            mapTypeId: 'terrain'
        });

        // Directions Service ve Renderer'ları başlat
        directionsService = new google.maps.DirectionsService();
        directionsRendererGA = new google.maps.DirectionsRenderer({
            map: map,
            suppressMarkers: true, // Kendi marker'larımızı kullanacağız
            polylineOptions: {
                strokeColor: '#FF0000',
                strokeOpacity: 0.8,
                strokeWeight: 3
            }
        });
        
        directionsRendererMA = new google.maps.DirectionsRenderer({
            map: map,
            suppressMarkers: true,
            polylineOptions: {
                strokeColor: '#2196F3',
                strokeOpacity: 0.8,
                strokeWeight: 3
            }
        });

        // Haritaya tıklama event listener'ı ekle
        map.addListener('click', function(e) {
            addCity(e.latLng.lat(), e.latLng.lng());
        });

        mapInitialized = true;
        console.log('Map initialized successfully');
    } catch (error) {
        console.error('Error initializing map:', error);
        mapInitialized = false;
    }
}

   
function addCity(lat, lng) {
    const cityName = `Location ${cities.length + 1}`;
    const city = new City(parseFloat(lat), parseFloat(lng), cityName);
    cities.push(city);
    addMarker(city);
    updateCityList();
    console.log(`Added city: ${cityName} at ${lat}, ${lng}`);
}
function addMarker(city) {
    const marker = new google.maps.Marker({
        position: { 
            lat: parseFloat(city.lat), 
            lng: parseFloat(city.lng) 
        },
        map: map,
        title: city.name,
        draggable: true
    });

    // Marker sürükleme olaylarını dinle
    marker.addListener('dragend', function(e) {
        const index = cities.findIndex(c => c.name === city.name);
        if (index !== -1) {
            cities[index].lat = e.latLng.lat();
            cities[index].lng = e.latLng.lng();
            updateCityList();
        }
    });

    markers.push(marker);
}
function updateCityList() {
    const listElement = document.getElementById('cityList');
    if (listElement) {
        listElement.innerHTML = cities.map((city, index) => `
            <div class="d-flex justify-content-between align-items-center mb-2">
                <span>${city.name}</span>
                <button class="btn btn-sm btn-danger" onclick="removeCity(${index})">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        `).join('');
    }
}
function removeCity(index) {
    if (markers[index]) {
        markers[index].setMap(null);
        markers.splice(index, 1);
    }
    cities.splice(index, 1);
    updateCityList();
}
function clearAllCities() {
    markers.forEach(marker => marker.setMap(null));
    markers = [];
    cities = [];
    updateCityList();
    if (mapPolyline) {
        mapPolyline.setMap(null);
    }
}
function addRandomCities(count) {
    // Muğla bölgesi sınırları
    const bounds = {
        north: 37.4346, // En kuzey nokta
        south: 36.2505, // En güney nokta
        east: 29.4149,  // En doğu nokta
        west: 27.2305   // En batı nokta
    };

    for (let i = 0; i < count; i++) {
        // Rastgele koordinat oluştur
        const lat = bounds.south + Math.random() * (bounds.north - bounds.south);
        const lng = bounds.west + Math.random() * (bounds.east - bounds.west);
        
        // Yeni şehir ekle
        addCity(lat, lng);
    }
}
  // Global variable for the convergence chart
 let convergenceChart = null;

 class City {
    constructor(lat, lng, name) {
        // Marker pozisyonunu bul
        const marker = markers.find(m => 
            Math.abs(m.getPosition().lat() - lat) < 0.000001 && 
            Math.abs(m.getPosition().lng() - lng) < 0.000001
        );
        
        if (marker) {
            this._lat = marker.getPosition().lat();
            this._lng = marker.getPosition().lng();
        } else {
            this._lat = parseFloat(lat);
            this._lng = parseFloat(lng);
        }
        this.name = name;
    }

    get lat() {
        return this._lat;
    }

    set lat(value) {
        this._lat = parseFloat(value);
    }

    get lng() {
        return this._lng;
    }

    set lng(value) {
        this._lng = parseFloat(value);
    }

    distance(other) {
        if (!google || !google.maps) {
            const R = 6371; // km
            const dLat = (other.lat - this.lat) * Math.PI / 180;
            const dLon = (other.lng - this.lng) * Math.PI / 180;
            const a = 
                Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(this.lat * Math.PI / 180) * Math.cos(other.lat * Math.PI / 180) * 
                Math.sin(dLon/2) * Math.sin(dLon/2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            return R * c;
        }
        
        return google.maps.geometry.spherical.computeDistanceBetween(
            new google.maps.LatLng(this.lat, this.lng),
            new google.maps.LatLng(other.lat, other.lng)
        ) / 1000; // metre'den km'ye çevir
    }
}
function generateCities(num) {
    clearAllCities(); // Mevcut şehirleri temizle
    addRandomCities(num);
    return cities;
}
function calculateTotalDistance(result) {
    let total = 0;
    const myroute = result.routes[0];
    for (let i = 0; i < myroute.legs.length; i++) {
        total += myroute.legs[i].distance.value;
    }
    return total / 1000; // metre'den kilometre'ye çevir
}    
function fallbackToStraightLines(gaRoute, maRoute) {
    // Eğer directions service başarısız olursa düz çizgilerle göster
    if (gaPolyline) gaPolyline.setMap(null);
    if (maPolyline) maPolyline.setMap(null);

    gaPolyline = new google.maps.Polyline({
        path: [...gaRoute, gaRoute[0]].map(city => ({
            lat: parseFloat(city.lat),
            lng: parseFloat(city.lng)
        })),
        geodesic: true,
        strokeColor: '#FF0000',
        strokeOpacity: 0.8,
        strokeWeight: 3,
        map: map
    });

    maPolyline = new google.maps.Polyline({
        path: [...maRoute, maRoute[0]].map(city => ({
            lat: parseFloat(city.lat),
            lng: parseFloat(city.lng)
        })),
        geodesic: true,
        strokeColor: '#2196F3',
        strokeOpacity: 0.8,
        strokeWeight: 3,
        map: map
    });
}
async function updateMapRoutes(gaRoute, maRoute) {
    if (!mapInitialized || !map) {
        console.error('Map not initialized');
        return;
    }

    // Önceki rotaları temizle
    directionsRendererGA.setMap(null);
    directionsRendererMA.setMap(null);
    
    try {
        function getMarkerPosition(city) {
            // En yakın marker'ı bul
            let closestMarker = null;
            let minDistance = Infinity;
            
            markers.forEach(marker => {
                const markerPos = marker.getPosition();
                const d = google.maps.geometry.spherical.computeDistanceBetween(
                    new google.maps.LatLng(city.lat, city.lng),
                    markerPos
                );
                if (d < minDistance) {
                    minDistance = d;
                    closestMarker = marker;
                }
            });
            
            if (closestMarker) {
                return closestMarker.getPosition();
            }
            
            console.warn('No matching marker found for position:', city);
            return new google.maps.LatLng(city.lat, city.lng);
        }

        // GA rotası için
        const gaPositions = gaRoute.map(city => getMarkerPosition(city));
        // Son nokta ile ilk nokta aynı olmalı
        gaPositions.push(gaPositions[0]);
        
        const gaRequest = {
            origin: gaPositions[0],
            destination: gaPositions[0],
            waypoints: gaPositions.slice(1, -1).map(pos => ({
                location: pos,
                stopover: true
            })),
            optimizeWaypoints: false,
            travelMode: google.maps.TravelMode.DRIVING
        };

        // MA rotası için
        const maPositions = maRoute.map(city => getMarkerPosition(city));
        // Son nokta ile ilk nokta aynı olmalı
        maPositions.push(maPositions[0]);
        
        const maRequest = {
            origin: maPositions[0],
            destination: maPositions[0],
            waypoints: maPositions.slice(1, -1).map(pos => ({
                location: pos,
                stopover: true
            })),
            optimizeWaypoints: false,
            travelMode: google.maps.TravelMode.DRIVING
        };

        // Directions isteklerini yap
        const [gaResult, maResult] = await Promise.all([
            new Promise((resolve, reject) => {
                directionsService.route(gaRequest, (result, status) => {
                    if (status === 'OK') resolve(result);
                    else reject(new Error(status));
                });
            }),
            new Promise((resolve, reject) => {
                directionsService.route(maRequest, (result, status) => {
                    if (status === 'OK') resolve(result);
                    else reject(new Error(status));
                });
            })
        ]);

        // Debug için log
        console.log('Marker positions used:', {
            markers: markers.map(m => ({
                lat: m.getPosition().lat(),
                lng: m.getPosition().lng()
            })),
            gaPositions: gaPositions.map(p => ({
                lat: p.lat(),
                lng: p.lng()
            })),
            maPositions: maPositions.map(p => ({
                lat: p.lat(),
                lng: p.lng()
            }))
        });

        // Sonuçları göster
        directionsRendererGA.setOptions({
            preserveViewport: true,
            suppressMarkers: true,
            polylineOptions: {
                strokeColor: '#FF0000',
                strokeOpacity: 0.8,
                strokeWeight: 4,
                zIndex: 1
            }
        });
        directionsRendererGA.setMap(map);
        directionsRendererGA.setDirections(gaResult);

        directionsRendererMA.setOptions({
            preserveViewport: true,
            suppressMarkers: true,
            polylineOptions: {
                strokeColor: '#2196F3',
                strokeOpacity: 0.8,
                strokeWeight: 4,
                zIndex: 2
            }
        });
        directionsRendererMA.setMap(map);
        directionsRendererMA.setDirections(maResult);

        // Mesafeleri güncelle
        const gaDistance = calculateTotalDistance(gaResult);
        const maDistance = calculateTotalDistance(maResult);
        
        $('#gaStats').text(`Best distance: ${gaDistance.toFixed(2)} km`);
        $('#maStats').text(`Best distance: ${maDistance.toFixed(2)} km`);

    } catch (error) {
        console.error('Error getting directions:', error);
        fallbackToStraightLines(gaRoute, maRoute);
    }
}
        class GeneticAlgorithm {
            constructor(cities, popSize = 50, eliteSize = 10, mutationRate = 0.01) {
                // City nesnelerini doğru şekilde kopyala
                this.cities = cities.map(city => new City(city.lat, city.lng, city.name));
                this.popSize = popSize;
                this.eliteSize = eliteSize;
                this.mutationRate = mutationRate;
            }

            createInitialPopulation() {
                return Array.from({ length: this.popSize }, () => 
                    // Her seferinde yeni City nesneleri oluştur
                    this.shuffleArray(this.cities.map(city => new City(city.lat, city.lng, city.name)))
                );
            }

            shuffleArray(array) {
                for (let i = array.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [array[i], array[j]] = [array[j], array[i]];
                }
                return array;
            }

            calculateRouteDistance(route) {
                let distance = 0;
                for (let i = 0; i < route.length; i++) {
                    const from = route[i];
                    const to = route[(i + 1) % route.length];
                    if (!from.distance || !to.distance) {
                        console.error('Invalid city object:', from, to);
                        return Infinity;
                    }
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

            selection(rankedPopulation, population) {
                const selectionResults = [];
                
                // Add elite routes
                for (let i = 0; i < this.eliteSize; i++) {
                    selectionResults.push(population[rankedPopulation[i].index]);
                }

                // Calculate fitness scores
                const fitnessScores = rankedPopulation.map(route => 1 / (1 + route.distance));
                const totalFitness = fitnessScores.reduce((a, b) => a + b, 0);
                const probabilities = fitnessScores.map(score => score / totalFitness);
                
                // Calculate cumulative probabilities
                const cumulativeProbabilities = [];
                let cumSum = 0;
                for (const prob of probabilities) {
                    cumSum += prob;
                    cumulativeProbabilities.push(cumSum);
                }

                // Select remaining routes
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

            breed(parent1, parent2) {
                const child = Array(parent1.length).fill(null);
                
                const startPos = Math.floor(Math.random() * parent1.length);
                const endPos = Math.floor(Math.random() * parent1.length);
                
                const [start, end] = [Math.min(startPos, endPos), Math.max(startPos, endPos)];
                for (let i = start; i <= end; i++) {
                    // Yeni City nesnesi oluştur
                    child[i] = new City(parent1[i].lat, parent1[i].lng, parent1[i].name);
                }
                
                let childPos = 0;
                for (const city of parent2) {
                    if (!child.some(item => item && item.lat === city.lat && item.lng === city.lng)) {
                        while (child[childPos] !== null) {
                            childPos++;
                        }
                        // Yeni City nesnesi oluştur
                        child[childPos] = new City(city.lat, city.lng, city.name);
                    }
                }
                
                return child;
            }

            breedPopulation(matingPool) {
                const children = [];
                
                // Keep elite routes
                for (let i = 0; i < this.eliteSize; i++) {
                    children.push(matingPool[i]);
                }
                
                // Breed remaining routes
                const pool = this.shuffleArray([...matingPool]);
                for (let i = this.eliteSize; i < this.popSize; i++) {
                    const child = this.breed(pool[i-1], pool[i]);
                    children.push(child);
                }
                
                return children;
            }

            mutate(route) {
                for (let i = 0; i < route.length; i++) {
                    if (Math.random() < this.mutationRate) {
                        const j = Math.floor(Math.random() * route.length);
                        [route[i], route[j]] = [route[j], route[i]];
                    }
                }
                return route;
            }

            mutatePopulation(population) {
                return population.map(route => this.mutate([...route]));
            }

            nextGeneration(population) {
                const rankedPop = this.rankRoutes(population);
                const selectionResults = this.selection(rankedPop, population);
                const children = this.breedPopulation(selectionResults);
                return this.mutatePopulation(children);
            }
        }

        class MemeticAlgorithm extends GeneticAlgorithm {
            constructor(cities, popSize = 50, eliteSize = 10, mutationRate = 0.01, localSearchIter = 50) {
                super(cities, popSize, eliteSize, mutationRate);
                this.localSearchIter = localSearchIter;
            }

            localSearch(route) {
                let bestRoute = route.map(city => new City(city.lat, city.lng, city.name));
                let bestDistance = this.calculateRouteDistance(bestRoute);
        
                for (let iter = 0; iter < this.localSearchIter; iter++) {
                    const i = Math.floor(Math.random() * route.length);
                    const j = Math.floor(Math.random() * route.length);
                    
                    const newRoute = [...bestRoute];
                    [newRoute[i], newRoute[j]] = [
                        new City(bestRoute[j].lat, bestRoute[j].lng, bestRoute[j].name),
                        new City(bestRoute[i].lat, bestRoute[i].lng, bestRoute[i].name)
                    ];
                    
                    const newDistance = this.calculateRouteDistance(newRoute);
                    if (newDistance < bestDistance) {
                        bestDistance = newDistance;
                        bestRoute = newRoute;
                    }
                }
        
                return bestRoute;
            }

            nextGeneration(population) {
                const nextGen = super.nextGeneration(population);
                
                // Apply local search to elite individuals
                for (let i = 0; i < this.eliteSize; i++) {
                    nextGen[i] = this.localSearch(nextGen[i]);
                }
                
                return nextGen;
            }
        }

        function generateCitiesOLD(num) {
            return Array.from({ length: num }, () => 
                new City(Math.random() * 100, Math.random() * 100));
        }
		
		$(document).ready(function() {
            let convergenceChart = null;
            
            // Canvas boyutlarını ayarla
            const initCanvases = () => {
                $('#gaCanvas, #maCanvas').each(function() {
                    this.width = $(this).width();
                    this.height = 300;
                });
            };
            // Event listener'ları ekle
            $(window).on('resize', initCanvases);
            $('#runButton').on('click', runComparison);
            // Grafik güncelleme fonksiyonu
            const updateChart = (gaProgress, maProgress) => {
                const ctx = $('#convergenceChart')[0].getContext('2d');
                
                if (convergenceChart) convergenceChart.destroy();
                
                convergenceChart = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: Array.from({ length: gaProgress.length }, (_, i) => i + 1),
                        datasets: [{
                            label: 'Genetic Algorithm',
                            data: gaProgress,
                            borderColor: '#4CAF50'
                        }, {
                            label: 'Memetic Algorithm',
                            data: maProgress,
                            borderColor: '#2196F3'
                        }]
                    },
                    options: {
                        responsive: true,
                        animation: false // Performans için animasyonu kapattık
                    }
                });
            };

            // Rota çizim fonksiyonu
            function drawRoute(canvas, route) {
                const ctx = canvas.getContext('2d');
                const width = canvas.width;
                const height = canvas.height;
                const padding = 20;
                
                // Canvas'ı temizle
                ctx.clearRect(0, 0, width, height);
                
                if (!route || route.length === 0) {
                    console.log('No route data to draw');
                    return;
                }
                
                // Koordinatları normalize et
                const lats = route.map(city => city.lat);
                const lngs = route.map(city => city.lng);
                
                const minLat = Math.min(...lats);
                const maxLat = Math.max(...lats);
                const minLng = Math.min(...lngs);
                const maxLng = Math.max(...lngs);
                
                // Ölçeklendirme faktörlerini hesapla
                const scaleX = (width - 2 * padding) / (maxLng - minLng || 1);
                const scaleY = (height - 2 * padding) / (maxLat - minLat || 1);
                
                // Koordinat dönüşüm fonksiyonu
                const transformCoords = (city) => ({
                    x: (city.lng - minLng) * scaleX + padding,
                    y: height - ((city.lat - minLat) * scaleY + padding)
                });
                
                // Rotayı çiz
                ctx.beginPath();
                const startPoint = transformCoords(route[0]);
                ctx.moveTo(startPoint.x, startPoint.y);
                
                [...route, route[0]].forEach((city, i) => {
                    if (i > 0) {
                        const point = transformCoords(city);
                        ctx.lineTo(point.x, point.y);
                    }
                });
                
                ctx.strokeStyle = '#4CAF50';
                ctx.lineWidth = 2;
                ctx.stroke();
                
                // Şehirleri çiz
                route.forEach(city => {
                    const point = transformCoords(city);
                    ctx.beginPath();
                    ctx.arc(point.x, point.y, 4, 0, 2 * Math.PI);
                    ctx.fillStyle = '#2196F3';
                    ctx.fill();
                    ctx.strokeStyle = '#1976D2';
                    ctx.lineWidth = 1;
                    ctx.stroke();
                });
                
                console.log(`Drew route with ${route.length} cities`);
            }
        
            // Ana karşılaştırma fonksiyonu
            async function runComparison() {
                console.log('Starting comparison...');
                
                if (!mapInitialized) {
                    console.error('Map not initialized yet');
                    alert("Google Maps henüz yüklenmedi. Lütfen birkaç saniye bekleyin.");
                    return;
                }
            
                if (cities.length < 3) {
                    alert("Lütfen en az 3 nokta ekleyin!");
                    return;
                }
            
                $('#progressModal').modal('show');
                
                // Parametreleri al
                const params = {
                    popSize: parseInt($('#popSize').val()),
                    generations: parseInt($('#generations').val()),
                    eliteSize: parseInt($('#eliteSize').val()),
                    mutationRate: parseFloat($('#mutationRate').val())
                };
                
                console.log('Parameters:', params);
                console.log('Using existing cities:', cities);
            
                // Algoritmaları oluştur
                const ga = new GeneticAlgorithm(cities, params.popSize, params.eliteSize, params.mutationRate);
                const ma = new MemeticAlgorithm(cities, params.popSize, params.eliteSize, params.mutationRate);
                
                // İlk popülasyonları oluştur
                let gaPop = ga.createInitialPopulation();
                let maPop = ma.createInitialPopulation();
                console.log('Initial populations created:', gaPop.length, maPop.length);
                
                let gaProgress = [];
                let maProgress = [];
                
                $('#runButton').prop('disabled', true);
            
                try {
                    for(let gen = 0; gen < params.generations; gen++) {
                        // GA İterasyonu
                        gaPop = ga.nextGeneration(gaPop);
                        const gaRanked = ga.rankRoutes(gaPop);
                        gaProgress.push(gaRanked[0].distance);
                        
                        // En iyi GA rotası
                        const bestGaRoute = gaPop[gaRanked[0].index];
                        drawRoute($('#gaCanvas')[0], bestGaRoute);
            
                        // MA İterasyonu
                        maPop = ma.nextGeneration(maPop);
                        const maRanked = ma.rankRoutes(maPop);
                        maProgress.push(maRanked[0].distance);
                        
                        // En iyi MA rotası
                        const bestMaRoute = maPop[maRanked[0].index];
                        drawRoute($('#maCanvas')[0], bestMaRoute);
            
                        // Her iki rotayı da haritada güncelle
                        updateMapRoutes(bestGaRoute, bestMaRoute);
                        
                        // Stats güncelle
                        $('#gaStats').text(`Best distance: ${gaRanked[0].distance.toFixed(2)} km`);
                        $('#maStats').text(`Best distance: ${maRanked[0].distance.toFixed(2)} km`);
            
                        // Progress güncelle
                        const progress = (gen / params.generations) * 100;
                        $('.progress-bar').css('width', progress + '%');
                        $('#progressText').text(`Generation: ${gen + 1} / ${params.generations}`);
                        
                        if(gen % 5 === 0) {
                            updateChart(gaProgress, maProgress);
                            console.log(`Generation ${gen}: GA=${gaRanked[0].distance.toFixed(2)}, MA=${maRanked[0].distance.toFixed(2)}`);
                        }
                        
                        await new Promise(resolve => setTimeout(resolve, 0));
                    }
                    
                    console.log('Comparison completed successfully');
                } catch (error) {
                    console.error('Error during comparison:', error);
                } finally {
                    updateChart(gaProgress, maProgress);
                    $('#runButton').prop('disabled', false);
                    $('#progressModal').modal('hide');
                }
            }

            // Event listener'ları ekle
            $(window).on('resize', initCanvases);
            $('#runButton').on('click', runComparison);

            // Başlangıç
            initCanvases();
            
        });
		
		