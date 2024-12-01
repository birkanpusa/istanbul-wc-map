from http.server import HTTPServer, SimpleHTTPRequestHandler
import webbrowser
import threading
import time

def open_browser():
    time.sleep(1)
    webbrowser.open('http://localhost:8000')

port = 8000
handler = SimpleHTTPRequestHandler
server = HTTPServer(('', port), handler)

print(f"Starting development server at http://localhost:{port}")
print("Press Ctrl+C to stop the server")

threading.Thread(target=open_browser).start()

try:
    server.serve_forever()
except KeyboardInterrupt:
    print("\nShutting down server...")
    server.socket.close()
