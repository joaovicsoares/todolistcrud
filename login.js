const emailInput = document.querySelector('#email')
const senhaInput = document.querySelector('#senha')
const botao = document.querySelector('.btnLogin')

botao.addEventListener('click', async () => {
    const email = emailInput.value;
    const senha = senhaInput.value;

    try {
        const response = await fetch('http://localhost:3000/login', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({email, senha})
        });

        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('token', data.token);

            window.location.href = 'index.html';
        } else {
            errorMessage.textContent = 'Email ou senha inválidos.';
        }
    } catch (error) {
        errorMessage.textContent = 'Erro ao conectar com o servidor.';
    }
});