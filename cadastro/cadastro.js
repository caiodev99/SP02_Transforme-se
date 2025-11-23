document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('formCadastro');
  const msg = document.getElementById('msg');
  const inputs = form.querySelectorAll('input');

  let dbService = JSON.parse(localStorage.getItem('dbService') || '[]');
  
  if (!dbService.some(u => u.email === 'teste@finup.com')) {
    dbService.push({ email: 'teste@finup.com', senha: '12345678', nome: 'Usuário Teste' });
    localStorage.setItem('dbService', JSON.stringify(dbService));
  }

  initializeGoogleAuth();

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('name');
    const email = document.getElementById('email');
    const password = document.getElementById('password');
    const confirmPassword = document.getElementById('confirm-password');

    clearError();

    if (!name.value || !email.value || !password.value || !confirmPassword.value) {
      showError('Por favor, preencha todos os campos.');
      highlightInvalid([name, email, password, confirmPassword]);
      return;
    }

    if (password.value.length < 8) {
      showError('A senha deve conter pelo menos 8 caracteres.');
      highlightInvalid([password]);
      return;
    }

    if (password.value !== confirmPassword.value) {
      showError('As senhas não coincidem.');
      highlightInvalid([password, confirmPassword]);
      return;
    }

    const dbServiceAtual = JSON.parse(localStorage.getItem('dbService') || '[]');
    if (dbServiceAtual.some(u => u.email === email.value)) {
      showError('Este e-mail já está cadastrado!');
      highlightInvalid([email]);
      return;
    }

    const novoUsuario = {
      nome: name.value,
      email: email.value,
      senha: password.value
    };

    dbServiceAtual.push(novoUsuario);
    localStorage.setItem('dbService', JSON.stringify(dbServiceAtual));

    showSuccess('Cadastro realizado com sucesso!');
    localStorage.setItem('usuarioLogado', JSON.stringify({ 
      nome: name.value, 
      email: email.value 
    }));

    setTimeout(() => window.location.href = "../dashboard/dashboard.html", 1200);
  });

  function showError(text) {
    msg.textContent = text;
    msg.className = 'msg error';
  }

  function showSuccess(text) {
    msg.textContent = text;
    msg.className = 'msg success';
  }

  function clearError() {
    msg.textContent = '';
    msg.className = 'msg';
    inputs.forEach(i => i.classList.remove('is-danger'));
  }

  function highlightInvalid(fields) {
    fields.forEach(f => f.classList.add('is-danger'));
  }
});

function initializeGoogleAuth() {
  if (typeof google === 'undefined') {
    console.log('Aguardando biblioteca do Google...');
    setTimeout(initializeGoogleAuth, 500);
    return;
  }

  try {
    console.log('Inicializando Google Auth no cadastro...');
    
    google.accounts.id.initialize({
      client_id: "32096085213-j21nv2218r61u3ic4421lpgh8sbbgdco.apps.googleusercontent.com",
      callback: handleGoogleCredentialResponse
    });

    google.accounts.id.renderButton(
      document.getElementById("googleButton"),
      { 
        theme: "outline", 
        size: "large",
        text: "continue_with"
      }
    );
    
    console.log('Google Auth inicializado com sucesso no cadastro!');
  } catch (error) {
    console.error('Erro ao inicializar Google Auth no cadastro:', error);
  }
}

function handleGoogleCredentialResponse(response) {
  console.log("Google Credential Response:", response);
  
  if (!response || !response.credential) {
    console.error('Resposta inválida do Google:', response);
    showMessage('Erro: Não foi possível processar o login com Google', 'error');
    return;
  }
  
  try {
    const user = parseJwt(response.credential);
    console.log("User Info from Google:", user);
    
    if (!user.email || !user.email.includes('@')) {
      showMessage('Email inválido recebido do Google', 'error');
      return;
    }
    
    const dbService = JSON.parse(localStorage.getItem('dbService') || '[]');
    const usuarioExistente = dbService.find(u => u.email === user.email);
    
    if (usuarioExistente) {
      showMessage('Este e-mail já está cadastrado! Faça login em vez de cadastrar.', 'error');
      
      setTimeout(() => {
        window.location.href = "../home/home.html";
      }, 2000);
      return;
    }

    // Cadastrar novo usuário do Google
    const novoUsuario = {
      nome: user.name || user.email.split('@')[0],
      email: user.email,
      senha: 'google_oauth',
      picture: user.picture
    };
    
    dbService.push(novoUsuario);
    localStorage.setItem('dbService', JSON.stringify(dbService));
    

    localStorage.setItem('usuarioLogado', JSON.stringify({ 
      nome: user.name || user.email.split('@')[0],
      email: user.email,
      picture: user.picture 
    }));
    
    showMessage('Cadastro com Google realizado com sucesso!', 'success');
    
    setTimeout(() => {
      window.location.href = "../home/home.html";
    }, 1500);
    
  } catch (error) {
    console.error('Erro ao processar cadastro com Google:', error);
    showMessage('Erro ao fazer cadastro com Google. Tente novamente.', 'error');
  }
}

function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Erro ao decodificar JWT:', error);
    throw error;
  }
}

function showMessage(text, type) {
  const msg = document.getElementById('msg');
  if (msg) {
    msg.textContent = text;
    msg.className = `msg ${type}`;
    msg.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}
