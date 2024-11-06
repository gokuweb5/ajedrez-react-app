export const apiLogin = async (username, password) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/signin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error en el inicio de sesión');
    }

    const data = await response.json();
    
    if (!data.token) {
      throw new Error('No se recibió el token de autenticación');
    }

    return data;
  } catch (error) {
    console.error('Error en apiLogin:', error);
    throw error;
  }
};
