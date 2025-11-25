from flask import Flask, request, jsonify
from flask_cors import CORS
import requests

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

@app.route('/api/ipqs', methods=['GET'])
def proxy_ipqs():
    key = request.args.get('key')
    ip = request.args.get('ip')
    if not key or not ip:
        return jsonify({'error': 'Missing key or ip'}), 400
    
    url = f"https://ipqualityscore.com/api/json/ip/{key}/{ip}?strictness=1"
    try:
        resp = requests.get(url)
        return jsonify(resp.json()), resp.status_code
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/ipinfo', methods=['GET'])
def proxy_ipinfo():
    key = request.args.get('key')
    ip = request.args.get('ip')
    if not key or not ip:
        return jsonify({'error': 'Missing key or ip'}), 400
        
    url = f"https://ipinfo.io/{ip}?token={key}"
    try:
        resp = requests.get(url)
        return jsonify(resp.json()), resp.status_code
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/scamalytics', methods=['GET'])
def proxy_scamalytics():
    user = request.args.get('user')
    key = request.args.get('key')
    ip = request.args.get('ip')
    if not user or not key or not ip:
        return jsonify({'error': 'Missing user, key or ip'}), 400
        
    url = f"https://api11.scamalytics.com/v3/{user}/"
    params = {'key': key, 'ip': ip}
    try:
        resp = requests.get(url, params=params)
        return jsonify(resp.json()), resp.status_code
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/proxycheck', methods=['POST'])
def proxy_check():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Missing JSON body'}), 400
        
    key = data.get('api_key')
    ip = data.get('ip')
    
    if not key or not ip:
        return jsonify({'error': 'Missing api_key or ip'}), 400
        
    # Construct URL with required flags: vpn=1, asn=1, risk=1, info=1
    url = f"http://proxycheck.io/v2/{ip}?key={key}&vpn=1&asn=1&risk=1&info=1"
    
    try:
        resp = requests.get(url)
        return jsonify(resp.json()), resp.status_code
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("Starting Proxy Server on http://localhost:5000")
    app.run(debug=True, port=5000)
