/* ========================================
   Sean Bookstore - Cart and Payment Logic with localStorage and redirect
   ======================================== */

let cart = [];

/* ===== Add to Cart Function ===== */
function addToCart(id, title, price) {
    cart = JSON.parse(localStorage.getItem('cart')) || [];

    const existing = cart.find(item => item.id === id);
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ id, title, price, quantity: 1 });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    window.location.href = '/checkout';
}

/* ===== On DOM Load: Setup add-to-cart buttons and checkout page ===== */
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.add-to-cart').forEach(button => {
        button.addEventListener('click', () => {
            const id = parseInt(button.dataset.id);
            const title = button.dataset.title;
            const price = parseFloat(button.dataset.price);
            addToCart(id, title, price);
        });
    });

    const cartItemsDiv = document.getElementById('cart-items');
    const totalAmountP = document.getElementById('total-amount');
    const payButton = document.getElementById('pay-button');
    const paymentResultDiv = document.getElementById('payment-result');

    if (cartItemsDiv && totalAmountP && payButton) {
        cart = JSON.parse(localStorage.getItem('cart')) || [];
        renderCart();

        payButton.addEventListener('click', () => {
            if (cart.length === 0) {
                alert("Your cart is empty!");
                return;
            }

            fetch('/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cart })
            })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    paymentResultDiv.innerHTML = `✅ Payment Successful!<br>Transaction ID: <strong>${data.transaction_id}</strong><br>Total Paid: $${data.amount.toFixed(2)}`;
                    cart = [];
                    localStorage.removeItem('cart');
                    renderCart();
                }
            })
            .catch(() => {
                paymentResultDiv.textContent = "❌ Payment failed. Try again.";
            });
        });
    }
});

/* ===== Render Cart Contents on Checkout ===== */
function renderCart() {
    const cartItemsDiv = document.getElementById('cart-items');
    const totalAmountP = document.getElementById('total-amount');

    if (!cartItemsDiv || !totalAmountP) return;

    cartItemsDiv.innerHTML = "";
    let total = 0;

    cart.forEach(item => {
        const p = document.createElement('p');
        p.textContent = `${item.title} × ${item.quantity} - $${(item.price * item.quantity).toFixed(2)}`;
        cartItemsDiv.appendChild(p);
        total += item.price * item.quantity;
    });

    totalAmountP.innerHTML = `<strong>Total:</strong> $${total.toFixed(2)}`;
}

/* ===== Phone Number Validation & Formatting ===== */
function isValidPhoneNumber(phone) {
    const cleaned = phone.replace(/\s+/g, '').replace(/-/g, '');
    const regex = /^(?:\+255|0)?7\d{8}$/;
    return regex.test(cleaned);
}

function formatPhoneNumber(input) {
    input = input.replace(/[^\d+]/g, '');
    if (input.startsWith('+255')) {
        return input.replace(/^(\+255)(\d{3})(\d{3})(\d{0,3}).*/, (m,p1,p2,p3,p4)=>`${p1} ${p2} ${p3} ${p4}`.trim());
    } else if (input.startsWith('0')) {
        return input.replace(/^(0\d{3})(\d{3})(\d{0,3}).*/, (m,p1,p2,p3)=>`${p1} ${p2} ${p3}`.trim());
    }
    return input;
}

document.addEventListener('DOMContentLoaded', () => {
    const phoneInput = document.getElementById('payment-phone');
    const payButton = document.getElementById('pay-button');

    if (phoneInput && payButton) {
        phoneInput.addEventListener('input', () => {
            phoneInput.value = formatPhoneNumber(phoneInput.value);
        });

        payButton.addEventListener('click', () => {
            const phone = phoneInput.value.trim();
            if (!isValidPhoneNumber(phone)) {
                alert('Please enter a valid M-Pesa phone number (e.g., +2557XXXXXXXX or 07XXXXXXXX).');
                phoneInput.focus();
                return;
            }
        }, true);
    }
});

/* ===== Sidebar Toggle Logic ===== */
document.addEventListener("DOMContentLoaded", () => {
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('sidebar-toggle');

    if (sidebar && toggleBtn) {
        toggleBtn.addEventListener('click', () => sidebar.classList.toggle('active'));

        document.addEventListener('click', (e) => {
            if (!sidebar.contains(e.target) && !toggleBtn.contains(e.target)) {
                sidebar.classList.remove('active');
            }
        });
    }
});

/* ===== Admin Dashboard: Books Management ===== */
document.addEventListener('DOMContentLoaded', () => {
    const bookForm = document.getElementById('book-form');
    const booksTableBody = document.querySelector('#books-table tbody');

    if (!bookForm || !booksTableBody) return;

    // Show/Hide form
    window.showAddBookForm = function() {
        bookForm.style.display = 'block';
        document.getElementById('book-id').value = '';
        document.getElementById('book-title').value = '';
        document.getElementById('book-author').value = '';
        document.getElementById('book-price').value = '';
        document.getElementById('book-image').value = '';
    };

    window.hideBookForm = function() { bookForm.style.display = 'none'; };

    // Edit Book
    window.editBook = function(id) {
        const row = booksTableBody.querySelector(`tr[data-id="${id}"]`);
        if (!row) return;
        document.getElementById('book-id').value = id;
        document.getElementById('book-title').value = row.children[1].textContent;
        document.getElementById('book-author').value = row.children[2].textContent;
        document.getElementById('book-price').value = row.children[3].textContent.replace('$','');
        document.getElementById('book-image').value = row.children[4].textContent;
        bookForm.style.display = 'block';
    };

    // Delete Book
    window.deleteBook = function(id) {
        if (!confirm('Are you sure you want to delete this book?')) return;
        fetch(`/admin/books/${id}`, { method: 'DELETE' })
        .then(res => res.json())
        .then(data => {
            if (data.status === 'success') {
                const row = booksTableBody.querySelector(`tr[data-id="${id}"]`);
                row.remove();
            } else alert('Failed to delete book.');
        })
        .catch(() => alert('Server error.'));
    };

    // Add/Edit Book Form Submission
    bookForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const id = document.getElementById('book-id').value;
        const title = document.getElementById('book-title').value.trim();
        const author = document.getElementById('book-author').value.trim();
        const price = parseFloat(document.getElementById('book-price').value);
        const image = document.getElementById('book-image').value.trim();

        if (!title || !author || !price || !image) return alert('All fields are required!');

        const payload = { title, author, price, image };

        if (id) {
            // Edit existing book
            fetch(`/admin/books/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
            .then(res => res.json())
            .then(data => {
                if (data.status === 'success') {
                    const row = booksTableBody.querySelector(`tr[data-id="${id}"]`);
                    row.children[1].textContent = title;
                    row.children[2].textContent = author;
                    row.children[3].textContent = `$${price.toFixed(2)}`;
                    row.children[4].textContent = image;
                    hideBookForm();
                } else alert('Failed to update book.');
            })
            .catch(() => alert('Server error.'));
        } else {
            // Add new book
            fetch('/admin/books', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
            .then(res => res.json())
            .then(data => {
                if (data.status === 'success') {
                    const newRow = document.createElement('tr');
                    newRow.setAttribute('data-id', data.book.id);
                    newRow.innerHTML = `
                        <td>${data.book.id}</td>
                        <td>${data.book.title}</td>
                        <td>${data.book.author}</td>
                        <td>$${data.book.price.toFixed(2)}</td>
                        <td>${data.book.image}</td>
                        <td>
                            <button onclick="editBook('${data.book.id}')">Edit</button>
                            <button class="delete" onclick="deleteBook('${data.book.id}')">Delete</button>
                        </td>
                    `;
                    booksTableBody.appendChild(newRow);
                    hideBookForm();
                } else alert('Failed to add book.');
            })
            .catch(() => alert('Server error.'));
        }
    });
});
