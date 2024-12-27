 // Global variable for the convergence chart
        let convergenceChart = null;

        class City {
            constructor(x, y) {
                this.x = x;
                this.y = y;
            }

            distance(other) {
                return Math.sqrt(Math.pow(this.x - other.x, 2) + Math.pow(this.y - other.y, 2));
            }
        }

        class GeneticAlgorithm {
            constructor(cities, popSize = 50, eliteSize = 10, mutationRate = 0.01) {
                this.cities = cities;
                this.popSize = popSize;
                this.eliteSize = eliteSize;
                this.mutationRate = mutationRate;
            }

            createInitialPopulation() {
                return Array.from({ length: this.popSize }, () => 
                    this.shuffleArray([...this.cities]));
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
                
                // Select subset of parent1
                const startPos = Math.floor(Math.random() * parent1.length);
                const endPos = Math.floor(Math.random() * parent1.length);
                
                // Copy part from parent1
                const [start, end] = [Math.min(startPos, endPos), Math.max(startPos, endPos)];
                for (let i = start; i <= end; i++) {
                    child[i] = parent1[i];
                }
                
                // Fill remaining positions with cities from parent2
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
                let bestRoute = [...route];
                let bestDistance = this.calculateRouteDistance(bestRoute);

                for (let iter = 0; iter < this.localSearchIter; iter++) {
                    // 2-opt swap
                    const i = Math.floor(Math.random() * route.length);
                    const j = Math.floor(Math.random() * route.length);
                    
                    const newRoute = [...bestRoute];
                    [newRoute[i], newRoute[j]] = [newRoute[j], newRoute[i]];
                    
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

        function generateCities(num) {
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
            const drawRoute = (canvas, route) => {
                const ctx = canvas.getContext('2d');
                const width = canvas.width;
                const height = canvas.height;
                const padding = 20;
                
                ctx.clearRect(0, 0, width, height);
                
                const scaleX = (width - 2 * padding) / 100;
                const scaleY = (height - 2 * padding) / 100;
                
                // Rota çizimi
                ctx.beginPath();
                ctx.moveTo(route[0].x * scaleX + padding, route[0].y * scaleY + padding);
                route.concat(route[0]).forEach((city, i) => {
                    if(i > 0) ctx.lineTo(city.x * scaleX + padding, city.y * scaleY + padding);
                });
                ctx.strokeStyle = '#4CAF50';
                ctx.stroke();
                
                // Şehirleri çiz
                route.forEach(city => {
                    ctx.beginPath();
                    ctx.arc(city.x * scaleX + padding, city.y * scaleY + padding, 3, 0, 2 * Math.PI);
                    ctx.fillStyle = '#2196F3';
                    ctx.fill();
                });
            };

            // Ana karşılaştırma fonksiyonu
            const runComparison = async () => {
			$('#progressModal').modal('show');
                const params = {
                    numCities: parseInt($('#numCities').val()),
                    popSize: parseInt($('#popSize').val()),
                    generations: parseInt($('#generations').val()),
                    eliteSize: parseInt($('#eliteSize').val()),
                    mutationRate: parseFloat($('#mutationRate').val())
                };

                const cities = generateCities(params.numCities);
                const ga = new GeneticAlgorithm(cities, params.popSize, params.eliteSize, params.mutationRate);
                const ma = new MemeticAlgorithm(cities, params.popSize, params.eliteSize, params.mutationRate);
                
                let [gaPop, maPop] = [ga.createInitialPopulation(), ma.createInitialPopulation()];
                let [gaProgress, maProgress] = [[], []];
                
                // Butonun yeniden tıklanmasını engelle
                $('#runButton').prop('disabled', true);

                for(let gen = 0; gen < params.generations; gen++) {
                    // GA Adımı
                    gaPop = ga.nextGeneration(gaPop);
                    const gaRanked = ga.rankRoutes(gaPop);
                    gaProgress.push(gaRanked[0].distance);
                    drawRoute($('#gaCanvas')[0], gaPop[gaRanked[0].index]);
                    $('#gaStats').text(`Best distance: ${gaRanked[0].distance.toFixed(2)}`);

                    // MA Adımı
                    maPop = ma.nextGeneration(maPop);
                    const maRanked = ma.rankRoutes(maPop);
                    maProgress.push(maRanked[0].distance);
                    drawRoute($('#maCanvas')[0], maPop[maRanked[0].index]);
                    $('#maStats').text(`Best distance: ${maRanked[0].distance.toFixed(2)}`);

					const progress = (gen / params.generations) * 100;
					$('.progress-bar').css('width', progress + '%');
					$('#progressText').text(`Generation: ${gen + 1}`);																					
                    // Her 5 jenerasyonda bir grafiği güncelle
                    if(gen % 5 === 0) updateChart(gaProgress, maProgress);
                    
                    // UI güncellemesi için bekle
                    await new Promise(resolve => setTimeout(resolve, 0));
                }
                
                // Son güncelleme ve butonu aktif et
                updateChart(gaProgress, maProgress);
                $('#runButton').prop('disabled', false);
				$('#progressModal').modal('hide');
            };

            // Event listener'ları ekle
            $(window).on('resize', initCanvases);
            $('#runButton').on('click', runComparison);

            // Başlangıç
            initCanvases();
            runComparison();
        });
		
		