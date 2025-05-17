function generateTransactionId() {
    return 'TXN' + Date.now().toString().slice(-8);
}

document.addEventListener("DOMContentLoaded", function() {
    // Check session
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const session = JSON.parse(localStorage.getItem('currentSession')) || {};
    const employee = JSON.parse(localStorage.getItem('loggedInEmployee')) || null;
    
    if (!isLoggedIn || !session.loggedIn || !employee) {
        alert('Please login to continue');
        window.location.href = 'login.html';
        return;
    }

    // Generate transaction ID
    document.getElementById('transactionId').value = generateTransactionId();

    // Initialize transactions if not exists
    if (!localStorage.getItem('transactions')) {
        localStorage.setItem('transactions', JSON.stringify([]));
    }

    // Transaction History Section
    const transactionHistory = document.createElement('div');
    transactionHistory.id = 'transactionHistory';
    transactionHistory.className = 'hidden';
    transactionHistory.innerHTML = `
        <h3>Transaction History</h3>
        <div class="summary">
            <p><strong>Total Transactions:</strong> <span id="totalTransactions">0</span></p>
            <p><strong>Current Balance:</strong> $<span id="currentBalance">0.00</span></p>
        </div>
        <div class="transactions-list">
            <table>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>ID</th>
                        <th>Type</th>
                        <th>Amount</th>
                    </tr>
                </thead>
                <tbody id="transactionsTableBody">
                </tbody>
            </table>
        </div>
    `;
    document.querySelector('.container').appendChild(transactionHistory);

    // Auto-fill customer details and show transaction history when SSN is entered
    document.getElementById('customerSsnId').addEventListener('change', function() {
        const ssnId = this.value.trim();
        if (!ssnId) return;

        // Get customer details
        const customers = JSON.parse(localStorage.getItem('customers')) || [];
        const customer = customers.find(c => c.ssnId === ssnId);

        if (customer) {
            // Fill customer details
            document.getElementById('customerName').value = customer.name;
            document.getElementById('accountId').value = customer.accountNumber;
            document.getElementById('aadharNumber').value = customer.aadharNumber;
            document.getElementById('panNumber').value = customer.panNumber;
            document.getElementById('address').value = customer.address;
            document.getElementById('contactNumber').value = customer.contactNumber;

            // Show transaction history
            showTransactionHistory(ssnId, customer.balance);
        } else {
            showStatus('Customer not found with this SSN ID', 'error');
            document.getElementById('transactionHistory').classList.add('hidden');
        }
    });

    // Process transaction form
    const transactionForm = document.getElementById('transactionForm');
    transactionForm.addEventListener('submit', function(e) {
        e.preventDefault();

        // Get form values
        const transaction = {
            id: document.getElementById('transactionId').value,
            ssnId: document.getElementById('customerSsnId').value.trim(),
            customerName: document.getElementById('customerName').value,
            accountId: document.getElementById('accountId').value,
            date: document.getElementById('transactionDate').value,
            mode: document.getElementById('transactionMode').value,
            amount: parseFloat(document.getElementById('transactionAmount').value),
            type: document.getElementById('transactionType').value,
            processedBy: session.empId,
            processedAt: new Date().toISOString()
        };

        // Validation
        if (!validateTransaction(transaction)) {
            return;
        }

        // Update customer balance
        if (!updateCustomerBalance(transaction)) {
            return;
        }

        // Save transaction
        const transactions = JSON.parse(localStorage.getItem('transactions')) || [];
        transactions.push(transaction);
        localStorage.setItem('transactions', JSON.stringify(transactions));

        // Show success message
        showStatus('Transaction Processed Successfully!', 'success');
        
        // Refresh transaction history
        showTransactionHistory(transaction.ssnId);
        
        // Reset form and generate new transaction ID
        transactionForm.reset();
        document.getElementById('transactionDate').valueAsDate = new Date();
        document.getElementById('transactionId').value = generateTransactionId();
    });

    // Helper functions
    function showTransactionHistory(ssnId, currentBalance = null) {
        const transactions = JSON.parse(localStorage.getItem('transactions')) || [];
        const customerTransactions = transactions.filter(t => t.ssnId === ssnId);
        const tbody = document.getElementById('transactionsTableBody');
        
        // Clear previous results
        tbody.innerHTML = '';
        
        // Add each transaction to the table
        customerTransactions.forEach(txn => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${new Date(txn.date).toLocaleDateString()}</td>
                <td>${txn.id}</td>
                <td class="${txn.type.toLowerCase()}">${txn.type}</td>
                <td class="${txn.type.toLowerCase()}">$${txn.amount.toFixed(2)}</td>
            `;
            tbody.appendChild(row);
        });

        // Update summary
        document.getElementById('totalTransactions').textContent = customerTransactions.length;
        
        // Calculate current balance if not provided
        if (currentBalance === null) {
            const customers = JSON.parse(localStorage.getItem('customers')) || [];
            const customer = customers.find(c => c.ssnId === ssnId);
            currentBalance = customer ? customer.balance : 0;
        }
        document.getElementById('currentBalance').textContent = currentBalance.toFixed(2);
        
        // Show the history section
        document.getElementById('transactionHistory').classList.remove('hidden');
    }

    function validateTransaction(transaction) {
        if (!transaction.ssnId || !transaction.date || !transaction.mode || 
            isNaN(transaction.amount) || !transaction.type) {
            showStatus('Please fill all required fields', 'error');
            return false;
        }

        if (transaction.amount <= 0) {
            showStatus('Amount must be greater than 0', 'error');
            return false;
        }

        return true;
    }

    function updateCustomerBalance(transaction) {
        const customers = JSON.parse(localStorage.getItem('customers')) || [];
        const customerIndex = customers.findIndex(c => c.ssnId === transaction.ssnId);
        
        if (customerIndex === -1) {
            showStatus('Customer account not found', 'error');
            return false;
        }

        if (transaction.type === 'Credit') {
            customers[customerIndex].balance += transaction.amount;
        } else {
            // Check for sufficient balance before debit
            if (customers[customerIndex].balance < transaction.amount) {
                showStatus('Insufficient account balance', 'error');
                return false;
            }
            customers[customerIndex].balance -= transaction.amount;
        }
        localStorage.setItem('customers', JSON.stringify(customers));
        return true;
    }

    function showStatus(message, type) {
        const statusElement = document.getElementById('statusMessage');
        statusElement.textContent = message;
        statusElement.className = 'status-message ' + type;
        statusElement.classList.remove('hidden');
        
        setTimeout(() => {
            statusElement.classList.add('hidden');
        }, 3000);
    }
});