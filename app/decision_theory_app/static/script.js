// Importações (assumindo que estamos usando bibliotecas equivalentes no navegador)
// Você precisará incluir as bibliotecas Chart.js e vis-network.js no seu HTML

let soa = [];
let hasProbabilities = false;

function getFloatInput(prompt, minValue = -Infinity, maxValue = Infinity) {
    while (true) {
        const value = parseFloat(prompt);
        if (!isNaN(value) && value >= minValue && value <= maxValue) {
            return value;
        } else {
            console.log(`O valor deve estar entre ${minValue} e ${maxValue}.`);
        }
    }
}

function getDecisionMakerInput() {
    soa = [];
    
    const numAlternatives = parseInt(prompt("Quantas alternativas você tem no Set of Alternatives (SOA)?"));
    if (isNaN(numAlternatives) || numAlternatives <= 0) {
        throw new Error("O número de alternativas deve ser positivo.");
    }
    
    hasProbabilities = confirm("Você conhece as probabilidades dos outcomes?");
    
    for (let i = 0; i < numAlternatives; i++) {
        let altName = prompt(`Nome da alternativa ${i+1} no SOA:`).trim();
        while (!altName) {
            console.log("O nome da alternativa não pode estar vazio.");
            altName = prompt(`Nome da alternativa ${i+1} no SOA:`).trim();
        }
        
        const numOutcomes = parseInt(prompt(`Quantos outcomes possíveis para a alternativa ${altName}?`));
        if (isNaN(numOutcomes) || numOutcomes <= 0) {
            throw new Error("O número de outcomes deve ser positivo.");
        }
        
        const probabilities = [];
        const utilities = [];
        
        for (let j = 0; j < numOutcomes; j++) {
            if (hasProbabilities) {
                const prob = getFloatInput(`Probabilidade do outcome ${j+1} para a alternativa ${altName} (entre 0 e 1):`, 0, 1);
                probabilities.push(prob);
            }
            const util = getFloatInput(`Utilidade do outcome ${j+1} para a alternativa ${altName}:`);
            utilities.push(util);
        }
        
        if (hasProbabilities) {
            const sumProb = probabilities.reduce((a, b) => a + b, 0);
            if (sumProb < 0.99 || sumProb > 1.01) {
                console.log(`Aviso: A soma das probabilidades para ${altName} é ${sumProb.toFixed(2)}, que não é exatamente 1.`);
                if (!confirm("Deseja continuar mesmo assim?")) {
                    i--; // Reiniciar esta alternativa
                    continue;
                }
            }
        } else {
            // Usar o critério de Laplace: probabilidades iguais para todos os outcomes
            probabilities.fill(1 / numOutcomes, 0, numOutcomes);
        }
        
        soa.push({
            name: altName,
            probabilities: probabilities,
            utilities: utilities
        });
    }
    
    return [soa, hasProbabilities];
}

function calculateExpectedUtility(soa) {
    return soa.map(alt => {
        alt.expectedUtility = alt.probabilities.reduce((sum, prob, i) => sum + prob * alt.utilities[i], 0);
        return alt;
    });
}

function findBestAlternative(soa) {
    return soa.reduce((best, current) => 
        (current.expectedUtility > best.expectedUtility) ? current : best
    );
}

function saveData(soa, filename = "decision_data.json") {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(soa));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", filename);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

function loadData(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const soa = JSON.parse(event.target.result);
                console.log("Dados carregados com sucesso");
                resolve(soa);
            } catch (error) {
                reject("Erro ao analisar o arquivo JSON");
            }
        };
        reader.onerror = (error) => reject(error);
        reader.readAsText(file);
    });
}

function printDecisionMatrix(soa) {
    let html = "<table border='1'><tr><th>Alternativa</th><th>Probabilidades</th><th>Utilidades</th><th>Utilidade Esperada</th></tr>";
    for (const alt of soa) {
        const probs = alt.probabilities.map(p => p.toFixed(2)).join(", ");
        const utils = alt.utilities.map(u => u.toFixed(2)).join(", ");
        html += `<tr><td>${alt.name}</td><td>${probs}</td><td>${utils}</td><td>${alt.expectedUtility.toFixed(2)}</td></tr>`;
    }
    html += "</table>";
    document.getElementById('decisionMatrix').innerHTML = html;
}

function visualizeDecisionTree(soa) {
    const nodes = [];
    const edges = [];
    
    nodes.push({id: 0, label: "Decisão"});
    
    let nodeId = 1;
    for (let i = 0; i < soa.length; i++) {
        const alt = soa[i];
        const altNodeId = nodeId++;
        nodes.push({id: altNodeId, label: `Alt ${i+1}\n${alt.name}`});
        edges.push({from: 0, to: altNodeId});
        
        for (let j = 0; j < alt.probabilities.length; j++) {
            const outcomeNodeId = nodeId++;
            nodes.push({id: outcomeNodeId, label: `Outcome ${j+1}\nProb: ${alt.probabilities[j].toFixed(2)}\nUtil: ${alt.utilities[j].toFixed(2)}`});
            edges.push({from: altNodeId, to: outcomeNodeId});
        }
    }
    
    const container = document.getElementById('decisionTree');
    const data = {nodes: new vis.DataSet(nodes), edges: new vis.DataSet(edges)};
    const options = {
        layout: {
            hierarchical: {
                direction: "UD",
                sortMethod: "directed"
            }
        }
    };
    new vis.Network(container, data, options);
}

function visualizeDecisionAlgorithm(soa) {
    const ctx = document.getElementById('decisionAlgorithm').getContext('2d');
    const alternatives = soa.map(alt => alt.name);
    const expectedUtilities = soa.map(alt => alt.expectedUtility);
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: alternatives,
            datasets: [{
                label: 'Utilidade Esperada',
                data: expectedUtilities,
                backgroundColor: 'rgba(75, 192, 192, 0.6)'
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Algoritmo de Decisão: Comparação de Utilidades Esperadas'
                }
            }
        }
    });
}

async function main() {
    console.log("Bem-vindo ao Analisador de Decisões!");
    console.log("Este programa usa a terminologia do livro 'An Introduction to Decision Theory' de Martin Peterson.");
    
    const loadExisting = confirm("Deseja carregar dados existentes?");
    if (loadExisting) {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.onchange = async (e) => {
            try {
                soa = await loadData(e.target.files[0]);
                hasProbabilities = true; // Assumimos que dados carregados têm probabilidades
            } catch (error) {
                console.error(error);
                [soa, hasProbabilities] = getDecisionMakerInput();
            }
            processData();
        };
        fileInput.click();
    } else {
        [soa, hasProbabilities] = getDecisionMakerInput();
        processData();
    }
}

function processData() {
    soa = calculateExpectedUtility(soa);
    
    console.log("\nMatriz de utilidade esperada:");
    for (const alt of soa) {
        console.log(`Alternativa ${alt.name}: Utilidade Esperada = ${alt.expectedUtility.toFixed(2)}`);
    }
    
    const bestAlternative = findBestAlternative(soa);
    console.log(`\nA melhor alternativa no SOA é ${bestAlternative.name} com utilidade esperada de ${bestAlternative.expectedUtility.toFixed(2)}.`);
    
    if (hasProbabilities) {
        console.log("Esta é uma decisão sob risco (probabilidades conhecidas).");
    } else {
        console.log("Esta é uma decisão sob incerteza (probabilidades desconhecidas). Utilizamos o critério de Laplace.");
    }
    
    printDecisionMatrix(soa);
    visualizeDecisionTree(soa);
    visualizeDecisionAlgorithm(soa);
    
    if (confirm("Deseja salvar os dados desta decisão?")) {
        saveData(soa);
    }
}

// Iniciar o programa
main();