import http.server
import socketserver
import webbrowser
import os
import sys
import socket
import mimetypes

DIRECTORY = os.path.dirname(os.path.abspath(__file__))
os.chdir(DIRECTORY)

# MIME types explícitos para evitar bloqueos en Windows
mimetypes.add_type('application/javascript', '.js')
mimetypes.add_type('application/javascript', '.mjs')
mimetypes.add_type('text/css', '.css')
mimetypes.add_type('image/svg+xml', '.svg')
mimetypes.add_type('application/json', '.json')

class FastHTTPHandler(http.server.SimpleHTTPRequestHandler):
    extensions_map = http.server.SimpleHTTPRequestHandler.extensions_map.copy()
    extensions_map.update({
        '.js': 'application/javascript; charset=utf-8',
        '.mjs': 'application/javascript; charset=utf-8',
        '.css': 'text/css; charset=utf-8',
        '.html': 'text/html; charset=utf-8',
        '.json': 'application/json; charset=utf-8',
        '.svg': 'image/svg+xml',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.ico': 'image/x-icon',
    })

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        # Permitir revalidación inmediata pero usando caché de memoria ligera
        self.send_header('Cache-Control', 'no-cache')
        self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()

    def log_message(self, format, *args):
        # Desactivar I/O síncrono de consola por cada archivo estático para acelerar el servidor al 100%
        pass

# ThreadingServer para atender peticiones en paralelo (multihilo real sin bloqueos)
class ThreadedTCPServer(socketserver.ThreadingMixIn, socketserver.TCPServer):
    allow_reuse_address = True
    daemon_threads = True

def is_port_in_use(port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(0.5)
        # Si connect_ex devuelve 0, significa que alguien ya está escuchando en este puerto
        return s.connect_ex(('127.0.0.1', port)) == 0

def get_free_port(start_port=8080, max_attempts=100):
    for port in range(start_port, start_port + max_attempts):
        if is_port_in_use(port):
            continue
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.bind(('127.0.0.1', port))
                return port
        except OSError:
            continue
    return start_port

if __name__ == '__main__':
    # Permite especificar puerto por argumento: python serve.py 8080
    requested_port = 8080
    if len(sys.argv) > 1 and sys.argv[1].isdigit():
        requested_port = int(sys.argv[1])

    port = get_free_port(requested_port)
    try:
        with ThreadedTCPServer(("", port), FastHTTPHandler) as httpd:
            url = f"http://localhost:{port}/index.html"
            print("=" * 65)
            print("  SISTEMA PDI: ASOCIACION CULTURAL JOHANNES GUTENBERG")
            print(f"  Servidor HTTP activo en el puerto: {port}")
            print(f"  Acceso directo: {url}")
            print("=" * 65)
            
            webbrowser.open(url)
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n[INFO] Servidor PDI detenido.")
        sys.exit(0)
    except Exception as e:
        print(f"\n[ERROR] Fallo al iniciar el servidor en el puerto {port}: {e}")
        sys.exit(1)
