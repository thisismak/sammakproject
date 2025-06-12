import os
import sqlite3
from flask import Flask, request, jsonify, send_file, session, redirect, url_for, render_template
from werkzeug.security import generate_password_hash, check_password_hash
import io
import logging

app = Flask(__name__)
app.secret_key = 'your-secret-key'  # 替換為安全的密鑰

# 設置日誌
logging.basicConfig(level=logging.DEBUG)

# SQLite 資料庫路徑
DB_PATH = 'file_management.db'

# 初始化資料庫
def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            theme TEXT DEFAULT 'light'
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS files (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            owner_id INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (owner_id) REFERENCES users(id)
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS file_shares (
            file_id INTEGER,
            user_id INTEGER,
            PRIMARY KEY (file_id, user_id),
            FOREIGN KEY (file_id) REFERENCES files(id),
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    ''')
    conn.commit()
    cursor.close()
    conn.close()

# 首頁
@app.route('/')
def index():
    return render_template('index.html')

# 注冊
@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        try:
            conn = sqlite3.connect(DB_PATH)
            cursor = conn.cursor()
            cursor.execute('SELECT username FROM users WHERE username = ?', (username,))
            if cursor.fetchone():
                return jsonify({'error': '用戶名已存在'})
            hashed_password = generate_password_hash(password)
            cursor.execute('INSERT INTO users (username, password) VALUES (?, ?)', (username, hashed_password))
            conn.commit()
            cursor.execute('SELECT id, username, theme FROM users WHERE username = ?', (username,))
            user = cursor.fetchone()
            session['user'] = {'id': user[0], 'username': user[1], 'theme': user[2]}
            cursor.close()
            conn.close()
            return redirect(url_for('dashboard'))
        except sqlite3.Error as e:
            logging.error(f"Register error: {str(e)}")
            return jsonify({'error': str(e)})
    return render_template('register.html')

# 登入
@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        try:
            conn = sqlite3.connect(DB_PATH)
            cursor = conn.cursor()
            cursor.execute('SELECT id, username, password, theme FROM users WHERE username = ?', (username,))
            user = cursor.fetchone()
            if user and check_password_hash(user[2], password):
                session['user'] = {'id': user[0], 'username': user[1], 'theme': user[3]}
                cursor.close()
                conn.close()
                return redirect(url_for('dashboard'))
            return jsonify({'error': '用戶名或密碼錯誤'})
        except sqlite3.Error as e:
            logging.error(f"Login error: {str(e)}")
            return jsonify({'error': str(e)})
    return render_template('login.html')

# 登出
@app.route('/logout')
def logout():
    session.pop('user', None)
    return redirect(url_for('index'))

# 文件管理
@app.route('/dashboard')
def dashboard():
    if 'user' not in session:
        return redirect(url_for('login'))
    return render_template('dashboard.html')

# 獲取文件列表
@app.route('/files')
def get_files():
    if 'user' not in session:
        return jsonify({'error': '未登入'})
    search_query = request.args.get('search', '')
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute('''
            SELECT f.id, f.name, u.username AS owner, f.owner_id, GROUP_CONCAT(u2.username) AS shared_with
            FROM files f
            LEFT JOIN users u ON f.owner_id = u.id
            LEFT JOIN file_shares fs ON f.id = fs.file_id
            LEFT JOIN users u2 ON fs.user_id = u2.id
            WHERE (f.owner_id = ? OR fs.user_id = ?) AND f.name LIKE ?
            GROUP BY f.id
        ''', (session['user']['id'], session['user']['id'], f'%{search_query}%'))
        files = [dict(row) for row in cursor.fetchall()]
        for file in files:
            file['shared_with'] = file['shared_with'].split(',') if file['shared_with'] else []
            file['current_user_id'] = session['user']['id']
        cursor.close()
        conn.close()
        return jsonify({'files': files, 'theme': session['user']['theme']})
    except sqlite3.Error as e:
        logging.error(f"Get files error: {str(e)}")
        return jsonify({'error': str(e)})

# 文件上傳
@app.route('/upload', methods=['POST'])
def upload():
    if 'user' not in session:
        return jsonify({'error': '未登入'})
    if 'file' not in request.files:
        logging.warning("No file part in request")
        return jsonify({'error': '無文件上傳'})
    file = request.files['file']
    if file.filename == '':
        logging.warning("No file selected")
        return jsonify({'error': '請選擇一個文件'})
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute('INSERT INTO files (name, owner_id) VALUES (?, ?)', (file.filename, session['user']['id']))
        conn.commit()
        cursor.close()
        conn.close()
        logging.info(f"File uploaded: {file.filename}")
        return redirect(url_for('dashboard'))
    except sqlite3.Error as e:
        logging.error(f"Upload error: {str(e)}")
        return jsonify({'error': str(e)})

# 文件共享
@app.route('/share', methods=['POST'])
def share():
    if 'user' not in session:
        return jsonify({'error': '未登入'})
    data = request.get_json()
    file_id = data['file_id']
    username = data['username']
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute('SELECT id FROM users WHERE username = ?', (username,))
        user = cursor.fetchone()
        if not user:
            return jsonify({'error': '用戶不存在'})
        cursor.execute('SELECT owner_id FROM files WHERE id = ?', (file_id,))
        file = cursor.fetchone()
        if not file or file[0] != session['user']['id']:
            return jsonify({'error': '無權限共享此文件'})
        cursor.execute('INSERT OR IGNORE INTO file_shares (file_id, user_id) VALUES (?, ?)', (file_id, user[0]))
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({'success': True})
    except sqlite3.Error as e:
        logging.error(f"Share error: {str(e)}")
        return jsonify({'error': str(e)})

# 文件刪除
@app.route('/delete', methods=['POST'])
def delete():
    if 'user' not in session:
        return jsonify({'error': '未登入'})
    data = request.get_json()
    file_id = data['file_id']
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute('SELECT owner_id FROM files WHERE id = ?', (file_id,))
        file = cursor.fetchone()
        if not file or file[0] != session['user']['id']:
            return jsonify({'error': '無權限刪除此文件'})
        cursor.execute('DELETE FROM file_shares WHERE file_id = ?', (file_id,))
        cursor.execute('DELETE FROM files WHERE id = ?', (file_id,))
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({'success': True})
    except sqlite3.Error as e:
        logging.error(f"Delete error: {str(e)}")
        return jsonify({'error': str(e)})

# 文件下載
@app.route('/download/<int:file_id>')
def download(file_id):
    if 'user' not in session:
        return redirect(url_for('login'))
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute('SELECT name, owner_id FROM files WHERE id = ?', (file_id,))
        file = cursor.fetchone()
        if not file:
            return jsonify({'error': '文件不存在'})
        cursor.execute('SELECT user_id FROM file_shares WHERE file_id = ? AND user_id = ?', (file_id, session['user']['id']))
        if file[1] != session['user']['id'] and not cursor.fetchone():
            return jsonify({'error': '無權限下載此文件'})
        cursor.close()
        conn.close()
        return send_file(io.BytesIO("模擬文件內容".encode('utf-8')), download_name=file[0], as_attachment=True)
    except sqlite3.Error as e:
        logging.error(f"Download error: {str(e)}")
        return jsonify({'error': str(e)})

# 個人化設置
@app.route('/settings', methods=['GET', 'POST'])
def settings():
    if 'user' not in session:
        return redirect(url_for('login'))
    if request.method == 'POST':
        data = request.get_json()
        theme = data['theme']
        try:
            conn = sqlite3.connect(DB_PATH)
            cursor = conn.cursor()
            cursor.execute('UPDATE users SET theme = ? WHERE id = ?', (theme, session['user']['id']))
            conn.commit()
            session['user']['theme'] = theme
            cursor.close()
            conn.close()
            return jsonify({'success': True})
        except sqlite3.Error as e:
            logging.error(f"Settings error: {str(e)}")
            return jsonify({'error': str(e)})
    return render_template('settings.html')

if __name__ == '__main__':
    init_db()
    app.run(debug=True)