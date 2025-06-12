# 安裝網站流程
1. 安裝 Python
https://www.python.org/downloads/
2. 在項目目錄中創建一個 Python 虛擬環境
python -m venv .venv
3. 激活虛擬環境
source .venv/Scripts/activate
4. 在虛擬環境中，使用 pip 安裝所需的 Python 包
pip install flask werkzeug
5. 直接運行 app.py
python app.py