import json
import matplotlib.pyplot as plt
import networkx as nx
from typing import List, Dict

def get_float_input(prompt: str, min_value: float = float('-inf'), max_value: float = float('inf')) -> float:
    """
    Solicita ao decision maker um número de ponto flutuante dentro de um intervalo específico.
    
    Args:
        prompt (str): A mensagem a ser exibida ao decision maker.
        min_value (float): O valor mínimo aceitável (inclusive).
        max_value (float): O valor máximo aceitável (inclusive).
    
    Returns:
        float: O número de ponto flutuante inserido pelo decision maker.
    """
    while True:
        try:
            value = float(input(prompt))
            if min_value <= value <= max_value:
                return value
            else:
                print(f"O valor deve estar entre {min_value} e {max_value}.")
        except ValueError:
            print("Por favor, insira um número válido.")

def get_decision_maker_input() -> List[Dict]:
    """
    Solicita ao decision maker informações sobre o set of alternatives (SOA) e seus outcomes.
    
    Returns:
        List[Dict]: Uma lista de dicionários contendo informações sobre cada alternativa no SOA.
    """
    soa = []
    
    while True:
        try:
            num_alternatives = int(input("Quantas alternativas você tem no Set of Alternatives (SOA)? "))
            if num_alternatives <= 0:
                raise ValueError("O número de alternativas deve ser positivo.")
            break
        except ValueError as e:
            print(f"Erro: {e}. Por favor, insira um número inteiro positivo.")
    
    has_probabilities = input("Você conhece as probabilidades dos outcomes? (s/n): ").lower() == 's'
    
    for i in range(num_alternatives):
        alt_name = input(f"Nome da alternativa {i+1} no SOA: ").strip()
        while not alt_name:
            print("O nome da alternativa não pode estar vazio.")
            alt_name = input(f"Nome da alternativa {i+1} no SOA: ").strip()
        
        while True:
            try:
                num_outcomes = int(input(f"Quantos outcomes possíveis para a alternativa {alt_name}? "))
                if num_outcomes <= 0:
                    raise ValueError("O número de outcomes deve ser positivo.")
                break
            except ValueError as e:
                print(f"Erro: {e}. Por favor, insira um número inteiro positivo.")
        
        probabilities = []
        utilities = []
        
        for j in range(num_outcomes):
            if has_probabilities:
                prob = get_float_input(f"Probabilidade do outcome {j+1} para a alternativa {alt_name} (entre 0 e 1): ", 0, 1)
                probabilities.append(prob)
            util = get_float_input(f"Utilidade do outcome {j+1} para a alternativa {alt_name}: ")
            utilities.append(util)
        
        if has_probabilities:
            # Verificar se a soma das probabilidades é aproximadamente 1
            if not 0.99 <= sum(probabilities) <= 1.01:
                print(f"Aviso: A soma das probabilidades para {alt_name} é {sum(probabilities):.2f}, que não é exatamente 1.")
                choice = input("Deseja continuar mesmo assim? (s/n): ").lower()
                if choice != 's':
                    print("Reiniciando a entrada para esta alternativa.")
                    continue
        else:
            # Usar o critério de Laplace: probabilidades iguais para todos os outcomes
            probabilities = [1/num_outcomes] * num_outcomes
        
        soa.append({
            "name": alt_name,
            "probabilities": probabilities,
            "utilities": utilities
        })
    
    return soa, has_probabilities

def calculate_expected_utility(soa: List[Dict]) -> List[Dict]:
    """
    Calcula a utilidade esperada para cada alternativa no SOA.
    
    Args:
        soa (List[Dict]): Lista de alternativas com suas probabilidades e utilidades.
    
    Returns:
        List[Dict]: Lista de alternativas com a utilidade esperada calculada.
    """
    for alt in soa:
        expected_utility = sum(p * u for p, u in zip(alt['probabilities'], alt['utilities']))
        alt["expected_utility"] = expected_utility
    return soa

def find_best_alternative(soa: List[Dict]) -> Dict:
    """
    Encontra a alternativa com a maior utilidade esperada no SOA.
    
    Args:
        soa (List[Dict]): Lista de alternativas com suas utilidades esperadas.
    
    Returns:
        Dict: A alternativa com a maior utilidade esperada.
    """
    return max(soa, key=lambda x: x['expected_utility'])

def save_data(soa: List[Dict], filename: str = "decision_data.json"):
    """
    Salva os dados do SOA em um arquivo JSON.
    
    Args:
        soa (List[Dict]): Lista de alternativas para salvar.
        filename (str): Nome do arquivo para salvar os dados.
    """
    with open(filename, 'w') as f:
        json.dump(soa, f)
    print(f"Dados salvos em {filename}")

def load_data(filename: str = "decision_data.json") -> List[Dict]:
    """
    Carrega os dados do SOA de um arquivo JSON.
    
    Args:
        filename (str): Nome do arquivo para carregar os dados.
    
    Returns:
        List[Dict]: Lista de alternativas carregadas do arquivo.
    """
    try:
        with open(filename, 'r') as f:
            soa = json.load(f)
        print(f"Dados carregados de {filename}")
        return soa
    except FileNotFoundError:
        print(f"Arquivo {filename} não encontrado. Iniciando com dados vazios.")
        return []

def print_decision_matrix(soa: List[Dict]):
    """
    Imprime a matriz de decisão no console.
    
    Args:
        soa (List[Dict]): Lista de alternativas com suas probabilidades e utilidades.
    """
    print("\nMatriz de Decisão:")
    print("Alternativa | Probabilidades | Utilidades | Utilidade Esperada")
    print("-" * 60)
    for alt in soa:
        probs = ", ".join(f"{p:.2f}" for p in alt['probabilities'])
        utils = ", ".join(f"{u:.2f}" for u in alt['utilities'])
        print(f"{alt['name']:11} | {probs:14} | {utils:10} | {alt['expected_utility']:.2f}")

def visualize_decision_tree(soa: List[Dict]):
    """
    Cria uma representação visual da árvore de decisão.
    
    Args:
        soa (List[Dict]): Lista de alternativas com suas probabilidades e utilidades.
    """
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
    plt.show()

def visualize_decision_algorithm(soa: List[Dict]):
    """
    Cria uma representação visual do algoritmo de decisão.
    
    Args:
        soa (List[Dict]): Lista de alternativas com suas utilidades esperadas.
    """
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
    plt.show()

def main():
    """
    Função principal que coordena o fluxo do programa.
    """
    print("Bem-vindo ao Analisador de Decisões!")
    print("Este programa usa a terminologia do livro 'An Introduction to Decision Theory' de Martin Peterson.")
    
    while True:
        choice = input("Deseja carregar dados existentes? (s/n): ").lower()
        if choice == 's':
            soa = load_data()
            if not soa:
                soa, has_probabilities = get_decision_maker_input()
            else:
                has_probabilities = True  # Assumimos que dados carregados têm probabilidades
            break
        elif choice == 'n':
            soa, has_probabilities = get_decision_maker_input()
            break
        else:
            print("Por favor, responda com 's' para sim ou 'n' para não.")
    
    soa = calculate_expected_utility(soa)
    
    print("\nMatriz de utilidade esperada:")
    for alt in soa:
        print(f"Alternativa {alt['name']}: Utilidade Esperada = {alt['expected_utility']:.2f}")
    
    best_alternative = find_best_alternative(soa)
    print(f"\nA melhor alternativa no SOA é {best_alternative['name']} com utilidade esperada de {best_alternative['expected_utility']:.2f}.")
    
    if has_probabilities:
        print("Esta é uma decisão sob risco (probabilidades conhecidas).")
    else:
        print("Esta é uma decisão sob incerteza (probabilidades desconhecidas). Utilizamos o critério de Laplace.")
    
    print_decision_matrix(soa)
    visualize_decision_tree(soa)
    visualize_decision_algorithm(soa)
    
    save_choice = input("Deseja salvar os dados desta decisão? (s/n): ").lower()
    if save_choice == 's':
        save_data(soa)

if __name__ == "__main__":
    main()