import json
import matplotlib.pyplot as plt
import networkx as nx
import io
import base64
from typing import List, Dict

def process_input(input_data: List[str]) -> Tuple[List[Dict], bool]:
    """
    Processa a entrada do usuário e retorna o SOA e se as probabilidades são conhecidas.
    
    Args:
        input_data (List[str]): Lista de strings contendo as entradas do usuário.
    
    Returns:
        Tuple[List[Dict], bool]: SOA e se as probabilidades são conhecidas.
    """
    soa = []
    num_alternatives = int(input_data[0])
    has_probabilities = input_data[1].lower() == 's'
    
    current_index = 2
    for i in range(num_alternatives):
        alt_name = input_data[current_index]
        current_index += 1
        
        num_outcomes = int(input_data[current_index])
        current_index += 1
        
        probabilities = []
        utilities = []
        
        for j in range(num_outcomes):
            if has_probabilities:
                probabilities.append(float(input_data[current_index]))
                current_index += 1
            utilities.append(float(input_data[current_index]))
            current_index += 1
        
        if not has_probabilities:
            probabilities = [1/num_outcomes] * num_outcomes
        
        soa.append({
            "name": alt_name,
            "probabilities": probabilities,
            "utilities": utilities
        })
    
    return soa, has_probabilities

def calculate_expected_utility(soa: List[Dict]) -> List[Dict]:
    for alt in soa:
        expected_utility = sum(p * u for p, u in zip(alt['probabilities'], alt['utilities']))
        alt["expected_utility"] = expected_utility
    return soa

def find_best_alternative(soa: List[Dict]) -> Dict:
    return max(soa, key=lambda x: x['expected_utility'])

def get_decision_matrix_html(soa: List[Dict]) -> str:
    html = "<table border='1'><tr><th>Alternativa</th><th>Probabilidades</th><th>Utilidades</th><th>Utilidade Esperada</th></tr>"
    for alt in soa:
        probs = ", ".join(f"{p:.2f}" for p in alt['probabilities'])
        utils = ", ".join(f"{u:.2f}" for u in alt['utilities'])
        html += f"<tr><td>{alt['name']}</td><td>{probs}</td><td>{utils}</td><td>{alt['expected_utility']:.2f}</td></tr>"
    html += "</table>"
    return html

def get_decision_tree_base64(soa: List[Dict]) -> str:
    G = nx.DiGraph()
    G.add_node("Decisão", pos=(0, 0))
    
    max_outcomes = max(len(alt['probabilities']) for alt in soa)
    
    for i, alt in enumerate(soa):
        alt_node = f"Alt {i+1}\n{alt['name']}"
        G.add_edge("Decisão", alt_node)
        G.nodes[alt_node]['pos'] = (1, (len(soa)-1)/2 - i)
        
        for j, (prob, util) in enumerate(zip(alt['probabilities'], alt['utilities'])):
            outcome_node = f"Outcome {j+1}\nProb: {prob:.2f}\nUtil: {util:.2f}"
            G.add_edge(alt_node, outcome_node)
            G.nodes[outcome_node]['pos'] = (2, max_outcomes/2 - j + (len(soa)-1)/2 - i)
    
    pos = nx.get_node_attributes(G, 'pos')
    
    plt.figure(figsize=(12, 8))
    nx.draw(G, pos, with_labels=True, node_color='lightblue', 
            node_size=3000, font_size=8, font_weight='bold', 
            arrows=True, edge_color='gray')
    
    nx.draw_networkx_labels(G, pos, {node: node.split('\n')[0] for node in G.nodes()}, font_size=8)
    
    plt.title("Árvore de Decisão")
    plt.axis('off')
    plt.tight_layout()
    
    img_buffer = io.BytesIO()
    plt.savefig(img_buffer, format='png')
    img_buffer.seek(0)
    img_base64 = base64.b64encode(img_buffer.getvalue()).decode()
    plt.close()
    
    return img_base64

def get_decision_algorithm_base64(soa: List[Dict]) -> str:
    fig, ax = plt.subplots(figsize=(10, 6))
    
    alternatives = [alt['name'] for alt in soa]
    expected_utilities = [alt['expected_utility'] for alt in soa]
    
    bars = ax.bar(alternatives, expected_utilities)
    
    ax.set_ylabel('Utilidade Esperada')
    ax.set_title('Algoritmo de Decisão: Comparação de Utilidades Esperadas')
    
    for bar in bars:
        height = bar.get_height()
        ax.text(bar.get_x() + bar.get_width()/2., height,
                f'{height:.2f}',
                ha='center', va='bottom')
    
    best_alt = find_best_alternative(soa)
    ax.text(0.5, -0.1, f"Melhor alternativa: {best_alt['name']} (Utilidade Esperada: {best_alt['expected_utility']:.2f})",
            ha='center', va='center', transform=ax.transAxes)
    
    plt.tight_layout()
    
    img_buffer = io.BytesIO()
    plt.savefig(img_buffer, format='png')
    img_buffer.seek(0)
    img_base64 = base64.b64encode(img_buffer.getvalue()).decode()
    plt.close()
    
    return img_base64