const BASE_URL = 'http://10.28.64.205:5000/api' 
// Replace YOUR_IP_ADDRESS with ipconfig IPv4

export const loginUser = async (email, password) => {
  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  })

  return response.json()
}

export const getCurrentUser = async (token) => {
  const response = await fetch(`${BASE_URL}/auth/me`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  return response.json()
}
