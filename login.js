document.addEventListener("DOMContentLoaded", function() {
    const loginForm = document.getElementById('loginForm');
    const loginStatus = document.getElementById('loginStatus');

    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const empId = document.getElementById('empId').value.trim();
        const password = document.getElementById('password').value;

        // Get registered employee data
        const registeredEmployee = JSON.parse(localStorage.getItem('currentEmployee'));

        // Validation
        if (!empId || !password) {
            showStatus('Please fill in all fields', 'error');
            return;
        }

        if (!registeredEmployee || registeredEmployee.empId !== empId) {
            showStatus('Employee ID not found', 'error');
            return;
        }

        if (registeredEmployee.password !== password) {
            showStatus('Incorrect password', 'error');
            return;
        }

        // Store login session
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('loggedInEmployee', JSON.stringify(registeredEmployee));
        
        // Create a session object
        const session = {
            loggedIn: true,
            empId: registeredEmployee.empId,
            firstName: registeredEmployee.firstName,
            lastName: registeredEmployee.lastName,
            email: registeredEmployee.email
        };
        localStorage.setItem('currentSession', JSON.stringify(session));

        // Show success message and redirect
        showStatus('Login successful! Redirecting to dashboard...', 'success');
        setTimeout(() => {
            window.location.href = 'home.html';
        }, 1500);
    });

    function showStatus(message, type) {
        loginStatus.textContent = message;
        loginStatus.className = 'status-message ' + type;
        
        // Hide after 3 seconds for error messages
        if (type === 'error') {
            setTimeout(() => {
                loginStatus.textContent = '';
                loginStatus.className = 'status-message hidden';
            }, 3000);
        }
    }
});