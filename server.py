"""
Простой локальный сервер для разработки
Использование: python server.py
"""

import http.server
import socketserver
import webbrowser
import os

PORT = 8000

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Добавляем заголовки для правильной работы
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        self.send_header('Expires', '0')
        super().end_headers()

def main():
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    Handler = MyHTTPRequestHandler
    
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print("=" * 60)
        print(f"🚀 Сервер запущен!")
        print("=" * 60)
        print(f"\n📍 Адрес: http://localhost:{PORT}")
        print(f"\n💡 Откройте в браузере: http://localhost:{PORT}")
        print(f"\n⏹️  Для остановки нажмите Ctrl+C\n")
        print("=" * 60)
        
        # Автоматически открываем браузер
        try:
            webbrowser.open(f'http://localhost:{PORT}')
        except:
            pass
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n\n🛑 Сервер остановлен")

if __name__ == "__main__":
    main()
