import http.server
import socketserver
import webbrowser
import os
import sys
import socket

DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        super().end_headers()

class ReusableTCPServer(socketserver.TCPServer):
    allow_reuse_address = True

def get_free_port(start_port=8000, max_attempts=50):
    for port in range(start_port, start_port + max_attempts):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            try:
                s.bind(("", port))
                return port
            except OSError:
                continue
    return start_port

if __name__ == '__main__':
    port = get_free_port(8000)
    with ReusableTCPServer(("", port), Handler) as httpd:
        url = f"http://localhost:{port}/index.html"
        print("=" * 65)
        print("  SISTEMA PDI: ASOCIACION CULTURAL JOHANNES GUTENBERG")
        print("  Arquitectura MVC Modular Iniciada")
        print(f"  Servidor local activo en: {url}")
        print("  Presione Ctrl+C para detener el servidor")
        print("=" * 65)
        webbrowser.open(url)
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServidor detenido.")
            sys.exit(0)
