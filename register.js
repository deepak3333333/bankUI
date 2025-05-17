document.addEventListener("DOMContentLoaded", function () {
    // Check if user is logged in
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const employee = JSON.parse(localStorage.getItem('loggedInEmployee') || '{}');

    if (!isLoggedIn || !employee.firstName) {
        alert('Please login to continue.');
        window.location.href = 'login.html';
        return;
    }

    // Set last activity time
    localStorage.setItem('lastActivity', Date.now());

    // Check for inactivity every minute
    setInterval(checkInactivityTimeout, 60000);

    // Update activity on user interaction
    document.addEventListener('click', updateLastActivity);
    document.addEventListener('keypress', updateLastActivity);
    document.addEventListener('scroll', updateLastActivity);

    // Display welcome message
    const name = employee?.firstName && employee?.lastName
        ? `${employee.firstName} ${employee.lastName}`
        : 'Employee';
    document.querySelector('.dashboard-header h2').textContent = `Welcome, ${name}`;

    // Logout button functionality
    document.getElementById('logoutBtn').addEventListener('click', function () {
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('loggedInEmployee');
        localStorage.removeItem('lastActivity');
        window.location.href = 'login.html';
    });

    // Protect all navigation links
    const navLinks = document.querySelectorAll('.dashboard-options a');
    navLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
            if (!isLoggedIn) {
                e.preventDefault();
                alert('Please login to continue.');
                window.location.href = 'login.html';
            }
        });
    });

    function checkInactivityTimeout() {
        const lastActivity = localStorage.getItem('lastActivity');
        const timeoutLimit = 30 * 60 * 1000; // 30 minutes

        if (lastActivity && Date.now() - lastActivity > timeoutLimit) {
            localStorage.clear();
            alert('Logged out due to inactivity.');
            window.location.href = 'login.html';
        }
    }

    function updateLastActivity() {
        localStorage.setItem('lastActivity', Date.now());
    }
});
