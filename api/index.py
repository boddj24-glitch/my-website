from flask import Flask, jsonify
import json
import os

app = Flask(__name__)

@app.route('/api/channels', methods=['GET'])
def get_channels():
    try:
        # প্রজেক্ট রুটে থাকা channels.json ফাইল পড়া
        file_path = os.path.join(os.path.dirname(__file__), '..', 'channels.json')
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
