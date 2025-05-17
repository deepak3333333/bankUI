document.addEventListener("DOMContentLoaded", function() {
    // Check session
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const session = JSON.parse(localStorage.getItem('currentSession') || {});
    const employee = JSON.parse(localStorage.getItem('loggedInEmployee') || null);
    
    if (!isLoggedIn || !session.loggedIn || !employee) {
        alert('Please login to continue');
        window.location.href = 'login.html';
        return;
    }

    // Set last activity time
    localStorage.setItem('lastActivity', Date.now());

    // Tab functionality
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            document.getElementById(tab.dataset.tab + 'LoanForm').classList.add('active');
        });
    });

    // Initialize loans array if not exists
    if (!localStorage.getItem('loans')) {
        localStorage.setItem('loans', JSON.stringify([]));
    }

    // Auto-fill customer details when SSN is entered - FIXED VERSION
    document.getElementById('loanSsnId').addEventListener('input', function() {
        const ssnId = this.value.trim();
        if (ssnId.length !== 9) return; // Wait until full SSN is entered

        const customers = JSON.parse(localStorage.getItem('customers') || '[]');
        const customer = customers.find(c => c.ssnId === ssnId);

        if (customer) {
            document.getElementById('loanCustomerName').value = customer.name;
            document.getElementById('loanEmail').value = customer.email;
            document.getElementById('loanContactNumber').value = customer.contactNumber;
            document.getElementById('loanAddress').value = customer.address;
            document.getElementById('maritalStatusLoan').value = customer.maritalStatus || '';
            
            // Clear any previous error status
            const statusElement = document.getElementById('statusMessage');
            statusElement.classList.add('hidden');
        } else {
            showStatus('Customer not found with this SSN ID', 'error');
            // Clear fields if customer not found
            document.getElementById('loanCustomerName').value = '';
            document.getElementById('loanEmail').value = '';
            document.getElementById('loanContactNumber').value = '';
            document.getElementById('loanAddress').value = '';
        }
    });

    // Initiate Loan Form
    const newLoanForm = document.getElementById('newLoanForm');
    newLoanForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get form values
        const loan = {
            id: 'LN' + Date.now().toString().slice(-8),
            ssnId: document.getElementById('loanSsnId').value.trim(),
            customerName: document.getElementById('loanCustomerName').value,
            occupation: document.getElementById('occupation').value.trim(),
            employerName: document.getElementById('employerName').value.trim(),
            employerAddress: document.getElementById('employerAddress').value.trim(),
            email: document.getElementById('loanEmail').value.trim(),
            contactNumber: document.getElementById('loanContactNumber').value.trim(),
            address: document.getElementById('loanAddress').value.trim(),
            maritalStatus: document.getElementById('maritalStatusLoan').value,
            amount: parseFloat(document.getElementById('loanAmount').value),
            duration: parseInt(document.getElementById('loanDuration').value),
            status: document.getElementById('loanStatus').value,
            initiatedBy: session.empId,
            initiatedAt: new Date().toISOString(),
            lastUpdatedAt: new Date().toISOString()
        };

        // Validation
        if (!validateLoan(loan)) {
            return;
        }

        // Save loan
        const loans = JSON.parse(localStorage.getItem('loans') || '[]');
        loans.push(loan);
        localStorage.setItem('loans', JSON.stringify(loans));

        // Show success message
        showStatus('Loan Initiated Successfully!', 'success');
        newLoanForm.reset();
        
        // Reset the SSN ID field but keep others cleared
        document.getElementById('loanSsnId').value = '';
    });

    // Search Loan Functionality
    const searchLoanBtn = document.getElementById('searchLoanBtn');
    searchLoanBtn.addEventListener('click', function() {
        const searchTerm = document.getElementById('searchLoan').value.trim();
        if (!searchTerm) {
            showStatus('Please enter SSN ID', 'error');
            return;
        }

        const loans = JSON.parse(localStorage.getItem('loans') || '[]');
        const loan = loans.find(l => l.ssnId === searchTerm);

        if (!loan) {
            showStatus('Loan not found for this SSN ID', 'error');
            return;
        }

        // Display loan details
        displayLoanDetails(loan);
    });

    // Update Loan Form
    const updateLoanForm = document.getElementById('updateLoanForm');
    updateLoanForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const searchTerm = document.getElementById('searchLoan').value.trim();
        const loans = JSON.parse(localStorage.getItem('loans') || '[]');
        const loanIndex = loans.findIndex(l => l.ssnId === searchTerm);

        if (loanIndex === -1) {
            showStatus('Loan not found', 'error');
            return;
        }

        // Update loan status
        loans[loanIndex].status = document.getElementById('updateLoanStatus').value;
        loans[loanIndex].lastUpdatedAt = new Date().toISOString();
        loans[loanIndex].updatedBy = session.empId;

        localStorage.setItem('loans', JSON.stringify(loans));
        showStatus('Loan Updated Successfully!', 'success');
        
        // Refresh displayed details
        displayLoanDetails(loans[loanIndex]);
    });

    // Delete Loan Button
    const deleteLoanBtn = document.getElementById('deleteLoanBtn');
    deleteLoanBtn.addEventListener('click', function() {
        const searchTerm = document.getElementById('searchLoan').value.trim();
        let loans = JSON.parse(localStorage.getItem('loans') || '[]');
        
        // Filter out the loan to be deleted
        loans = loans.filter(l => l.ssnId !== searchTerm);

        localStorage.setItem('loans', JSON.stringify(loans));
        showStatus('Loan Cancelled Successfully!', 'success');
        
        // Reset the form
        document.getElementById('searchLoan').value = '';
        document.getElementById('loanDetails').classList.add('hidden');
        document.getElementById('updateLoanForm').classList.add('hidden');
    });

    // Helper functions
    function validateLoan(loan) {
        if (!loan.ssnId || !loan.occupation || !loan.employerName || 
            !loan.employerAddress || !loan.email || !loan.contactNumber || 
            !loan.address || !loan.maritalStatus || isNaN(loan.amount) || 
            isNaN(loan.duration) || !loan.status) {
            showStatus('Please fill all required fields', 'error');
            return false;
        }

        if (loan.amount <= 0) {
            showStatus('Loan amount must be greater than 0', 'error');
            return false;
        }

        if (loan.duration <= 0) {
            showStatus('Loan duration must be greater than 0', 'error');
            return false;
        }

        // Verify customer exists
        const customers = JSON.parse(localStorage.getItem('customers') || '[]');
        const customer = customers.find(c => c.ssnId === loan.ssnId);
        if (!customer) {
            showStatus('Customer not found - please verify SSN ID', 'error');
            return false;
        }

        return true;
    }

    function displayLoanDetails(loan) {
        document.getElementById('viewLoanId').textContent = loan.id;
        document.getElementById('viewCustomerName').textContent = loan.customerName;
        document.getElementById('viewSsnId').textContent = loan.ssnId;
        document.getElementById('viewLoanAmount').textContent = `$${loan.amount.toFixed(2)}`;
        document.getElementById('viewLoanDuration').textContent = `${loan.duration} months`;
        document.getElementById('viewLoanStatus').textContent = loan.status;
        document.getElementById('viewLoanDate').textContent = new Date(loan.initiatedAt).toLocaleString();

        // Show update form
        document.getElementById('updateLoanStatus').value = loan.status;
        document.getElementById('updateLoanForm').classList.remove('hidden');
        
        // Show loan details
        document.getElementById('loanDetails').classList.remove('hidden');
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
    
    // Add activity tracking
    document.addEventListener('click', function() {
        localStorage.setItem('lastActivity', Date.now());
    });
});