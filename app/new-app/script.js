let soa = [];
let hasProbabilities = false;
let currentStep = 0;
let numAlternatives = 0;
let currentAlternative = 0;
let currentOutcome = 0;

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('startButton').addEventListener('click', startAnalysis);
    document.getElementById('loadFile').addEventListener('change', loadDataFromFile);
    document.getElementById('saveButton').addEventListener('click', saveData);
});

function startAnalysis() {
    document.getElementById('inputSection').classList.add('hidden');
    document.getElementById('outputSection').classList.remove('hidden');
    askQuestion("Quantas alternativas você tem no Set of Alternatives (SOA)?");
}

function askQuestion(question) {
    const outputSection = document.getElementById('outputSection');
    outputSection.innerHTML = `
        <h2 class="text-2xl font-semibold mb-4 text-gray-700">${question}</h2>
        <div class="w-full bg-gray-200 rounded-full h-6 mb-4">
            <div id="progressBar" class="bg-blue-600 h-6 rounded-full text-center text-xs text-white leading-6"></div>
        </div>
        <div id="liveDecisionMatrix" class="mb-4"></div>
        <div class="flex justify-between items-center">
            <button id="backButton" class="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded">
                Voltar
            </button>
            <input type="text" id="userInput" class="border border-gray-300 rounded px-3 py-2 w-full mx-4">
            <button id="nextButton" class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded">
                Avançar
            </button>
        </div>
    `;
    document.getElementById('nextButton').addEventListener('click', processAnswer);
    document.getElementById('backButton').addEventListener('click', goBack);
    document.getElementById('userInput').addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            processAnswer();
        }
    });
    document.getElementById('userInput').focus();
    updateProgressBar();
}

function goBack() {
    if (currentStep > 0) {
        currentStep--;
        if (currentStep === 1) {
            hasProbabilities = false;
        } else if (currentStep === 2) {
            currentAlternative--;
            soa.pop();
        } else if (currentStep === 3 || currentStep === 4) {
            currentOutcome = 0;
            soa[currentAlternative].probabilities = [];
            soa[currentAlternative].utilities = [];
        }
        askNextQuestion();
    }
}

function askNextQuestion() {
    switch(currentStep) {
        case 0:
            askQuestion("Quantas alternativas você tem no Set of Alternatives (SOA)?");
            break;
        case 1:
            askQuestion("Você conhece as probabilidades dos outcomes? (s/n)");
            break;
        case 2:
            askQuestion(`Nome da alternativa ${currentAlternative + 1} no SOA:`);
            break;
        case 3:
            askQuestion(`Quantos outcomes possíveis para a alternativa ${soa[currentAlternative].name}?`);
            break;
        case 4:
            if (hasProbabilities) {
                askQuestion(`Probabilidade do outcome ${currentOutcome + 1} para a alternativa ${soa[currentAlternative].name} (entre 0 e 1):`);
            } else {
                askQuestion(`Utilidade do outcome ${currentOutcome + 1} para a alternativa ${soa[currentAlternative].name}:`);
            }
            break;
    }
}

function updateProgressBar() {
    const totalSteps = numAlternatives * (hasProbabilities ? 3 : 2) + 2;
    const currentProgress = (currentStep / totalSteps) * 100;
    const progressBar = document.getElementById('progressBar');
    progressBar.style.width = `${currentProgress}%`;
    progressBar.textContent = `${Math.round(currentProgress)}%`;
}

function processAnswer() {
    const userInput = document.getElementById('userInput').value;
    
    switch(currentStep) {
        case 0:
            numAlternatives = parseInt(userInput);
            if (isNaN(numAlternatives) || numAlternatives <= 0) {
                alert("O número de alternativas deve ser um inteiro positivo.");
                return;
            }
            currentStep++;
            updateDecisionMatrix();
            break;
        case 1:
            hasProbabilities = userInput.toLowerCase() === 's';
            currentStep++;
            break;
        case 2:
            if (userInput.trim() === "") {
                alert("O nome da alternativa não pode estar vazio.");
                return;
            }
            soa.push({ name: userInput, probabilities: [], utilities: [], numOutcomes: 0, expectedUtility: 0 });
            currentStep++;
            break;
        case 3:
            const numOutcomes = parseInt(userInput);
            if (isNaN(numOutcomes) || numOutcomes <= 0) {
                alert("O número de outcomes deve ser um inteiro positivo.");
                return;
            }
            soa[currentAlternative].numOutcomes = numOutcomes;
            currentStep++;
            break;
            if (hasProbabilities) {
                const prob = parseFloat(userInput);
                if (isNaN(prob) || prob < 0 || prob > 1) {
                    alert("A probabilidade deve ser um número entre 0 e 1.");
                    return;
                }
                soa[currentAlternative].probabilities.push(prob);
            
                // Verificar se é o último outcome e se a soma das probabilidades é 1
                if (currentOutcome === soa[currentAlternative].numOutcomes - 1) {
                    const sumProb = soa[currentAlternative].probabilities.reduce((sum, p) => sum + p, 0);
                    if (Math.abs(sumProb - 1) > 0.001) {
                        alert(`A soma das probabilidades deve ser igual a 1. Atualmente, a soma é ${sumProb.toFixed(3)}.`);
                        soa[currentAlternative].probabilities.pop();
                        return;
                    }
                }
            }
            processUtility(userInput);
            break;
    }
    updateDecisionMatrix();
    askNextQuestion();
}

function processUtility(input) {
    const util = parseFloat(input);
    if (isNaN(util)) {
        alert("A utilidade deve ser um número.");
        return;
    }
    soa[currentAlternative].utilities.push(util);
    currentOutcome++;
    
    updateDecisionMatrix();
    
    if (currentOutcome < soa[currentAlternative].numOutcomes) {
        if (hasProbabilities) {
            askQuestion(`Probabilidade do outcome ${currentOutcome + 1} para a alternativa ${soa[currentAlternative].name} (entre 0 e 1):`);
        } else {
            askQuestion(`Utilidade do outcome ${currentOutcome + 1} para a alternativa ${soa[currentAlternative].name}:`);
        }
    } else {
        currentOutcome = 0;
        currentAlternative++;
        if (currentAlternative < numAlternatives) {
            currentStep = 2;
            askQuestion(`Nome da alternativa ${currentAlternative + 1} no SOA:`);
        } else {
            finishAnalysis();
        }
    }
}

function finishAnalysis() {
    soa = calculateExpectedUtility(soa);
    
    const outputSection = document.getElementById('outputSection');
    outputSection.innerHTML = `
        <h2 class="text-2xl font-semibold mb-4 text-gray-700">Resultados da Análise</h2>
        <div id="decisionMatrix"></div>
        <div id="decisionTree" class="w-full h-96 mb-4"></div>
        <canvas id="decisionAlgorithm" class="mb-4"></canvas>
        <div id="bestAlternative" class="text-lg font-semibold text-green-600 mb-4"></div>
    `;
    
    printDecisionMatrix(soa);
    visualizeDecisionTree(soa);
    visualizeDecisionAlgorithm(soa);
    showBestAlternative(soa);
}

function calculateExpectedUtility(soa) {
    return soa.map(alt => {
        if (hasProbabilities) {
            alt.expectedUtility = alt.probabilities.reduce((sum, prob, index) => sum + prob * alt.utilities[index], 0);
        } else {
            // Se não houver probabilidades, use a média das utilidades
            alt.expectedUtility = alt.utilities.reduce((sum, util) => sum + util, 0) / alt.utilities.length;
        }
        return alt;
    });
}

function findBestAlternative(soa) {
    return soa.reduce((best, current) => current.expectedUtility > best.expectedUtility ? current : best);
}

function printDecisionMatrix(soa) {
    let html = '<h3 class="text-xl font-semibold mb-2">Matriz de Decisão</h3>';
    html += '<table class="w-full border-collapse border border-gray-300 mb-4">';
    html += '<tr><th class="border border-gray-300 px-2 py-1">Alternativa</th><th class="border border-gray-300 px-2 py-1">Probabilidades</th><th class="border border-gray-300 px-2 py-1">Utilidades</th><th class="border border-gray-300 px-2 py-1">Utilidade Esperada</th></tr>';
    
    soa.forEach(alt => {
        html += `<tr>
            <td class="border border-gray-300 px-2 py-1">${alt.name}</td>
            <td class="border border-gray-300 px-2 py-1">${alt.probabilities.map(p => p.toFixed(2)).join(', ')}</td>
            <td class="border border-gray-300 px-2 py-1">${alt.utilities.map(u => u.toFixed(2)).join(', ')}</td>
            <td class="border border-gray-300 px-2 py-1">${alt.expectedUtility.toFixed(2)}</td>
        </tr>`;
    });
    
    html += '</table>';
    document.getElementById('decisionMatrix').innerHTML = html;
}

function visualizeDecisionTree(soa) {
    const container = document.getElementById('decisionTree');
    const data = {
        nodes: [],
        edges: []
    };
    
    data.nodes.push({id: 0, label: 'Decisão', shape: 'diamond'});
    
    soa.forEach((alt, altIndex) => {
        const altId = altIndex + 1;
        data.nodes.push({id: altId, label: alt.name});
        data.edges.push({from: 0, to: altId});
        
        alt.probabilities.forEach((prob, probIndex) => {
            const outcomeId = `${altId}-${probIndex}`;
            data.nodes.push({id: outcomeId, label: `P: ${prob.toFixed(2)}\nU: ${alt.utilities[probIndex].toFixed(2)}`});
            data.edges.push({from: altId, to: outcomeId, label: prob.toFixed(2)});
        });
    });
    
    const network = new vis.Network(container, data, {});
}

function visualizeDecisionAlgorithm(soa) {
    const ctx = document.getElementById('decisionAlgorithm').getContext('2d');
    const labels = soa.map(alt => alt.name);
    const data = soa.map(alt => alt.expectedUtility);
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Utilidade Esperada',
                data: data,
                backgroundColor: 'rgba(75, 192, 192, 0.6)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Comparação de Utilidades Esperadas'
                }
            }
        }
    });
}

function showBestAlternative(soa) {
    const best = findBestAlternative(soa);
    let message = `A melhor alternativa é ${best.name} com utilidade esperada de ${best.expectedUtility.toFixed(2)}.`;
    message += `\nParâmetros da escolha:`;
    message += `\nProbabilidades: ${best.probabilities.map(p => p.toFixed(2)).join(', ')}`;
    message += `\nUtilidades: ${best.utilities.map(u => u.toFixed(2)).join(', ')}`;
    document.getElementById('bestAlternative').innerHTML = message.replace(/\n/g, '<br>');
}

function updateDecisionMatrix() {
    const matrixDiv = document.getElementById('liveDecisionMatrix');
    let html = '<h3 class="text-xl font-semibold mb-2">Matriz de Decisão (Atualização em Tempo Real)</h3>';
    html += '<table class="w-full border-collapse border border-gray-300 mb-4">';
    html += '<tr><th class="border border-gray-300 px-2 py-1">Alternativa</th><th class="border border-gray-300 px-2 py-1">Probabilidades</th><th class="border border-gray-300 px-2 py-1">Utilidades</th></tr>';
    
    if (soa.length === 0 && numAlternatives > 0) {
        for (let i = 0; i < numAlternatives; i++) {
            html += `<tr>
                <td class="border border-gray-300 px-2 py-1">Alternativa ${i + 1}</td>
                <td class="border border-gray-300 px-2 py-1">-</td>
                <td class="border border-gray-300 px-2 py-1">-</td>
            </tr>`;
        }
    } else {
        soa.forEach(alt => {
            html += `<tr>
                <td class="border border-gray-300 px-2 py-1">${alt.name || `Alternativa ${soa.indexOf(alt) + 1}`}</td>
                <td class="border border-gray-300 px-2 py-1">${alt.probabilities.map(p => p.toFixed(2)).join(', ') || '-'}</td>
                <td class="border border-gray-300 px-2 py-1">${alt.utilities.map(u => u.toFixed(2)).join(', ') || '-'}</td>
            </tr>`;
        });
    }
    
    html += '</table>';
    matrixDiv.innerHTML = html;
}

function loadDataFromFile(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                soa = JSON.parse(e.target.result);
                hasProbabilities = true;
                finishAnalysis();
            } catch (error) {
                alert("Erro ao carregar o arquivo: " + error);
            }
        };
        reader.readAsText(file);
    }
}

function saveData() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(soa));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "decision_data.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}