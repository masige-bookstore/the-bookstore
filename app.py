from flask import Flask, render_template, request, jsonify, session, redirect, url_for
import json
import random
import string
import os

app = Flask(__name__)
app.secret_key = 'your_secret_key_here'  # Change this to a strong random string in production

# Admin credentials
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "admin123"

BOOKS_FILE = os.path.join(os.path.dirname(__file__), 'books.json')

# Load books data once at startup
with open(BOOKS_FILE, 'r', encoding='utf-8') as f:
    books = json.load(f)

# Simulated orders (you can later replace with real database)
orders = [
    {
        'transaction_id': 'ABC123XYZ789',
        'items': [{'title': 'Book 1', 'quantity': 1, 'price': 12.99}],
        'total': 12.99
    },
    {
        'transaction_id': 'DEF456UVW000',
        'items': [{'title': 'Book 2', 'quantity': 2, 'price': 8.99}],
        'total': 17.98
    }
]

@app.route('/')
def index():
    return render_template('index.html', books=books)

@app.route('/checkout', methods=['GET', 'POST'])
def checkout():
    if request.method == 'GET':
        return render_template('checkout.html')
    
    data = request.get_json()
    cart = data.get('cart', [])
    total_amount = sum(item.get('price', 0) * item.get('quantity', 1) for item in cart)
    transaction_id = ''.join(random.choices(string.ascii_uppercase + string.digits, k=12))
    
    # Simulate saving the order
    orders.append({
        'transaction_id': transaction_id,
        'items': cart,
        'total': total_amount
    })
    
    return jsonify({
        'status': 'success',
        'transaction_id': transaction_id,
        'amount': total_amount
    })

@app.route('/contact')
def contact():
    return render_template('contact.html')

@app.route('/about')
def about():
    return render_template('about.html')

# ADMIN LOGIN & DASHBOARD

@app.route('/admin', methods=['GET', 'POST'])
def admin():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')

        if username == ADMIN_USERNAME and password == ADMIN_PASSWORD:
            session['admin_logged_in'] = True
            return redirect(url_for('admin_dashboard'))
        else:
            return render_template('admin.html', error="❌ Incorrect username or password. Please try again.")

    if session.get('admin_logged_in'):
        return redirect(url_for('admin_dashboard'))

    return render_template('admin.html')

@app.route('/admin/dashboard')
def admin_dashboard():
    if not session.get('admin_logged_in'):
        return redirect(url_for('admin'))

    total_books = len(books)
    total_orders = len(orders)
    total_revenue = sum(order['total'] for order in orders)
    
    return render_template('admin_dashboard.html', 
                           books=books, 
                           total_books=total_books, 
                           total_orders=total_orders,
                           total_revenue=total_revenue)

# API routes for books management

@app.route('/admin/books/add', methods=['POST'])
def add_book():
    if not session.get('admin_logged_in'):
        return jsonify({'error': 'Unauthorized'}), 403
    
    data = request.get_json()
    new_id = max(book['id'] for book in books) + 1 if books else 1
    new_book = {
        'id': new_id,
        'title': data.get('title'),
        'author': data.get('author'),
        'price': float(data.get('price', 0)),
        'image': data.get('image', 'default.jpg')  # default image fallback
    }
    books.append(new_book)
    save_books()
    return jsonify({'status': 'success', 'book': new_book})

@app.route('/admin/books/edit/<int:book_id>', methods=['PUT'])
def edit_book(book_id):
    if not session.get('admin_logged_in'):
        return jsonify({'error': 'Unauthorized'}), 403
    
    data = request.get_json()
    for book in books:
        if book['id'] == book_id:
            book['title'] = data.get('title', book['title'])
            book['author'] = data.get('author', book['author'])
            book['price'] = float(data.get('price', book['price']))
            book['image'] = data.get('image', book['image'])
            save_books()
            return jsonify({'status': 'success', 'book': book})
    return jsonify({'error': 'Book not found'}), 404

@app.route('/admin/books/delete/<int:book_id>', methods=['DELETE'])
def delete_book(book_id):
    if not session.get('admin_logged_in'):
        return jsonify({'error': 'Unauthorized'}), 403

    global books
    books = [book for book in books if book['id'] != book_id]
    save_books()
    return jsonify({'status': 'success'})

# View orders page
@app.route('/admin/orders')
def admin_orders():
    if not session.get('admin_logged_in'):
        return redirect(url_for('admin'))
    return render_template('admin_orders.html', orders=orders)

# View site stats
@app.route('/admin/stats')
def admin_stats():
    if not session.get('admin_logged_in'):
        return redirect(url_for('admin'))
    
    stats = {
        'total_books': len(books),
        'total_orders': len(orders),
        'total_revenue': sum(order['total'] for order in orders)
    }
    return render_template('admin_stats.html', stats=stats)

@app.route('/admin/logout')
def admin_logout():
    session.pop('admin_logged_in', None)
    return redirect(url_for('admin'))

# Helper function to save books data to JSON file
def save_books():
    with open(BOOKS_FILE, 'w', encoding='utf-8') as f:
        json.dump(books, f, indent=4)

@app.route('/future')
def future():
    return render_template('future.html')

@app.errorhandler(500)
def internal_server_error(e):
    return render_template('error.html', error=str(e)), 500

if __name__ == '__main__':
    app.run(debug=True)
