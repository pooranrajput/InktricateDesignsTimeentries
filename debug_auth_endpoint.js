// Test auth endpoint directly
console.log('Testing auth endpoint...');

const testAuth = async () => {
  try {
    const response = await fetch('http://localhost:5000/api/quickbooks/auth', {
      method: 'GET',
      headers: {
        'Cookie': 'connect.sid=s%3A7txdzFjABOH5KWV6H2kZSx1ewdwNmsZC.CCcD2QV3YtODp0BghQ446WdjJKMjXa3KJUbFItWHxoc',
        'Content-Type': 'application/json'
      },
      timeout: 5000
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const data = await response.json();
      console.log('Response data:', data);
    } else {
      const text = await response.text();
      console.log('Error response:', text);
    }
  } catch (error) {
    console.error('Fetch error:', error.message);
  }
};

testAuth();