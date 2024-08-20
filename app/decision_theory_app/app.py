from flask import Flask, render_template, request, jsonify
import decision_theory as dt

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/process', methods=['POST'])
def process():
    input_data = request.json['input']
    try:
        soa, has_probabilities = dt.process_input(input_data)
        soa = dt.calculate_expected_utility(soa)
        best_alternative = dt.find_best_alternative(soa)
        
        decision_matrix = dt.get_decision_matrix_html(soa)
        decision_tree = dt.get_decision_tree_base64(soa)
        decision_algorithm = dt.get_decision_algorithm_base64(soa)
        
        return jsonify({
            'decision_matrix': decision_matrix,
            'decision_tree': decision_tree,
            'decision_algorithm': decision_algorithm,
            'best_alternative': best_alternative['name'],
            'best_alternative_utility': best_alternative['expected_utility'],
            'decision_type': 'risco' if has_probabilities else 'incerteza'
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 400

if __name__ == '__main__':
    app.run(debug=True)