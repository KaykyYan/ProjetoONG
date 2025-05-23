document.addEventListener('DOMContentLoaded', () => {
    const OPENWEATHERMAP_API_KEY = '639f302be83b9b35d9e5568d6833f6df'; // Chave da API OpenWeatherMap

    // --- CADASTRO DE USUÁRIO ---
    const cadastroForm = document.getElementById('cadastroForm');
    if (cadastroForm) {
        const nomeInput = document.getElementById('txtNome');
        const emailCadastroInput = document.getElementById('txtEmailCadastro');
        const cepInput = document.getElementById('txtCEP');
        const enderecoInput = document.getElementById('txtEndereco');
        const senhaCadastroInput = document.getElementById('txtSenhaCadastro');
        const confirmarSenhaInput = document.getElementById('txtConfirmarSenha');
        const cadastroMessage = document.getElementById('cadastroMessage');
        const weatherWidget = document.getElementById('weatherWidget');

        if (cepInput) {
            // Formata CEP (00000-000) enquanto o usuário digita
            cepInput.addEventListener('input', (e) => {
                let cepVal = e.target.value.replace(/\D/g, '');
                if (cepVal.length > 8) cepVal = cepVal.substring(0, 8);
                
                let cepFormatado = cepVal;
                if (cepVal.length > 5) {
                    cepFormatado = cepVal.substring(0, 5) + '-' + cepVal.substring(5);
                }
                e.target.value = cepFormatado;
            });

            // Busca dados do ViaCEP e clima ao sair do campo CEP
            cepInput.addEventListener('blur', async () => {
                const cep = cepInput.value.replace(/\D/g, '');
                if (weatherWidget) weatherWidget.style.display = 'none'; // Esconde widget ao buscar novo CEP

                if (cep.length === 8) {
                    try {
                        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
                        if (!response.ok) throw new Error('CEP não encontrado (ViaCEP)');
                        const dataViaCEP = await response.json();
                        if (dataViaCEP.erro) {
                            throw new Error('CEP inválido ou não encontrado (ViaCEP).');
                        }
                        enderecoInput.value = `${dataViaCEP.logradouro}, ${dataViaCEP.bairro}, ${dataViaCEP.localidade} - ${dataViaCEP.uf}`;
                        displayMessage(cadastroMessage, '');

                        // Após buscar CEP, busca dados do clima
                        if (dataViaCEP.localidade) {
                            fetchWeatherData(dataViaCEP.localidade, dataViaCEP.uf); 
                        }

                    } catch (error) {
                        console.error('Erro ao buscar CEP:', error);
                        enderecoInput.value = '';
                        displayMessage(cadastroMessage, error.message || 'Erro ao buscar CEP. Verifique e tente novamente.', 'error');
                    }
                } else if (cep.length > 0) { // CEP não tem 8 dígitos mas não está vazio
                    enderecoInput.value = '';
                    displayMessage(cadastroMessage, 'CEP deve conter 8 números.', 'error');
                }
            });
        }

        // Busca dados do clima na OpenWeatherMap
        async function fetchWeatherData(cidade, uf) {
            if (!weatherWidget) return;
            const weatherIconEl = document.getElementById('weatherIcon');
            const weatherTempEl = document.getElementById('weatherTemp');
            const weatherCityEl = document.getElementById('weatherCity');
            const weatherDescriptionEl = document.getElementById('weatherDescription');

            // Tenta buscar em diferentes formatos para maior precisão (Cidade,UF | Cidade | Nome completo)
            const queryParams = [`${cidade},${uf},BR`, `${cidade},BR`, cidade]; 
            let weatherData = null;

            for (const param of queryParams) {
                try {
                    const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(param)}&appid=${OPENWEATHERMAP_API_KEY}&units=metric&lang=pt_br`);
                    if (response.ok) {
                        weatherData = await response.json();
                        if (weatherData && weatherData.main && weatherData.weather) {
                            break; 
                        } else {
                            weatherData = null; 
                        }
                    }
                } catch (error) {
                    console.warn(`Falha ao buscar clima para ${param}:`, error);
                }
            }
            
            if (weatherData) {
                weatherTempEl.textContent = `${Math.round(weatherData.main.temp)}°C`;
                weatherCityEl.textContent = weatherData.name; // Usa nome retornado pela API
                weatherDescriptionEl.textContent = weatherData.weather[0].description;
                weatherIconEl.src = `https://openweathermap.org/img/wn/${weatherData.weather[0].icon}@2x.png`;
                weatherIconEl.alt = weatherData.weather[0].description;
                weatherWidget.style.display = 'flex';
            } else {
                console.error('Não foi possível obter dados do clima para', cidade);
                weatherWidget.style.display = 'none';
            }
        }

        cadastroForm.addEventListener('submit', (event) => {
            event.preventDefault();
            if (!nomeInput.value.trim()) {
                displayMessage(cadastroMessage, 'Por favor, informe seu nome.', 'error'); return;
            }
            if (!isValidEmail(emailCadastroInput.value)) {
                displayMessage(cadastroMessage, 'Por favor, informe um e-mail válido.', 'error'); return;
            }
            if (cepInput && cepInput.value.replace(/\D/g, '').length !== 8) {
                displayMessage(cadastroMessage, 'Por favor, informe um CEP válido com 8 números.', 'error'); return;
            }
            if (enderecoInput && !enderecoInput.value.trim()) {
                displayMessage(cadastroMessage, 'Endereço não encontrado. Verifique o CEP.', 'error'); return;
            }
            if (senhaCadastroInput.value.length < 6) {
                displayMessage(cadastroMessage, 'A senha deve ter pelo menos 6 caracteres.', 'error'); return;
            }
            if (senhaCadastroInput.value !== confirmarSenhaInput.value) {
                displayMessage(cadastroMessage, 'As senhas não coincidem.', 'error'); return;
            }

            const usuarios = JSON.parse(localStorage.getItem('usuarios')) || [];
            const emailExistente = usuarios.find(user => user.email === emailCadastroInput.value);

            if (emailExistente) {
                displayMessage(cadastroMessage, 'Este e-mail já está cadastrado.', 'error'); return;
            }

            const novoUsuario = {
                nome: nomeInput.value.trim(),
                email: emailCadastroInput.value.trim(),
                cep: cepInput ? cepInput.value.replace(/\D/g, '') : '',
                endereco: enderecoInput ? enderecoInput.value.trim() : '',
                senha: senhaCadastroInput.value
            };

            usuarios.push(novoUsuario);
            localStorage.setItem('usuarios', JSON.stringify(usuarios));
            displayMessage(cadastroMessage, 'Cadastro realizado com sucesso! Você já pode fazer o login.', 'success');
            cadastroForm.reset();
            if(enderecoInput) enderecoInput.value = '';
            if(weatherWidget) weatherWidget.style.display = 'none'; // Esconde widget após submit
        });
    }

    // --- LOGIN DE USUÁRIO ---
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        const emailLoginInput = document.getElementById('txtEmail');
        const senhaLoginInput = document.getElementById('txtSenha');
        const loginMessage = document.getElementById('loginMessage');

        loginForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const email = emailLoginInput.value.trim();
            const senha = senhaLoginInput.value;

            if (!isValidEmail(email)) {
                displayMessage(loginMessage, 'Por favor, informe um e-mail válido.', 'error'); return;
            }
            if (!senha) {
                displayMessage(loginMessage, 'Por favor, informe sua senha.', 'error'); return;
            }

            const usuarios = JSON.parse(localStorage.getItem('usuarios')) || [];
            const usuarioEncontrado = usuarios.find(user => user.email === email && user.senha === senha);

            if (usuarioEncontrado) {
                localStorage.setItem('usuarioLogado', JSON.stringify(usuarioEncontrado));
                window.location.href = 'admin.html';
            } else {
                displayMessage(loginMessage, 'E-mail ou senha incorretos.', 'error');
            }
        });
    }

    // --- FUNCIONALIDADES DA ÁREA ADMIN (MENU, FOOTER, LINK ATIVO) ---
    const menuToggle = document.getElementById('menuToggle');
    const adminNav = document.getElementById('adminNav');

    if (menuToggle && adminNav) {
        menuToggle.addEventListener('click', () => {
            adminNav.classList.toggle('active');
        });
    }

    const currentYearSpan = document.getElementById('currentYear');
    if (currentYearSpan) {
        currentYearSpan.textContent = new Date().getFullYear();
    }

    if (adminNav) {
        const currentPage = window.location.pathname.split("/").pop();
        if (currentPage) {
            const navLinks = adminNav.querySelectorAll('ul li a');
            navLinks.forEach(link => {
                link.classList.remove('active-link');
                if (link.getAttribute('href') === currentPage) {
                    link.classList.add('active-link');
                }
            });
        }
    }

    // --- CADASTRO DE VOLUNTÁRIO ---
    const formCadastroVoluntario = document.getElementById('formCadastroVoluntario');
    if (formCadastroVoluntario) {
        const voluntarioNomeInput = document.getElementById('voluntarioNome');
        const voluntarioEmailInput = document.getElementById('voluntarioEmail');
        const voluntarioCEPInput = document.getElementById('voluntarioCEP');
        const voluntarioEnderecoInput = document.getElementById('voluntarioEndereco');
        const voluntarioComplementoInput = document.getElementById('voluntarioComplemento');
        const cadastroVoluntarioMessage = document.getElementById('cadastroVoluntarioMessage');

        if (voluntarioCEPInput) {
             // Formata CEP e busca endereço (sem clima para voluntários)
            voluntarioCEPInput.addEventListener('input', (e) => {
                let cep = e.target.value.replace(/\D/g, '');
                if (cep.length > 8) cep = cep.substring(0, 8);
                
                let cepFormatado = cep;
                if (cep.length > 5) {
                    cepFormatado = cep.substring(0, 5) + '-' + cep.substring(5);
                }
                e.target.value = cepFormatado;

                if (cep.length === 8) {
                    // A busca de clima não é chamada aqui, apenas endereço.
                    buscarEnderecoViaCEPVoluntario(cep, cadastroVoluntarioMessage, voluntarioEnderecoInput);
                }
            });
        }
        
        formCadastroVoluntario.addEventListener('submit', (event) => {
            event.preventDefault();

            const nome = voluntarioNomeInput.value.trim();
            const email = voluntarioEmailInput.value.trim();
            const cep = voluntarioCEPInput ? voluntarioCEPInput.value.replace(/\D/g, '') : "";
            let endereco = voluntarioEnderecoInput.value.trim();
            const complemento = voluntarioComplementoInput.value.trim();

            if (!nome || !email || !endereco) {
                displayMessage(cadastroVoluntarioMessage, 'Nome, Email e Endereço são obrigatórios.', 'error');
                return;
            }
            if (!isValidEmail(email)) {
                 displayMessage(cadastroVoluntarioMessage, 'Formato de e-mail inválido.', 'error');
                return;
            }
            if (voluntarioCEPInput && voluntarioCEPInput.value && cep.length !== 8) {
                displayMessage(cadastroVoluntarioMessage, 'CEP inválido. Se preenchido, deve conter 8 números.', 'error');
                return;
            }

            if (complemento) {
                endereco += `, ${complemento}`;
            }
            
            const novoVoluntario = {
                id: Date.now().toString(), 
                nome: nome,
                email: email,
                endereco: endereco,
            };

            let voluntariosDB = JSON.parse(localStorage.getItem('voluntariosDB')) || [];
            const emailExistente = voluntariosDB.find(v => v.email === email);
            if(emailExistente) {
                displayMessage(cadastroVoluntarioMessage, 'Este e-mail de voluntário já está cadastrado.', 'error');
                return;
            }

            voluntariosDB.push(novoVoluntario);
            localStorage.setItem('voluntariosDB', JSON.stringify(voluntariosDB));

            displayMessage(cadastroVoluntarioMessage, 'Voluntário cadastrado com sucesso!', 'success');
            formCadastroVoluntario.reset();
            voluntarioEnderecoInput.value = '';
        });
    }

    // Busca endereço via ViaCEP para o formulário de voluntários
    async function buscarEnderecoViaCEPVoluntario(cep, messageElement, enderecoElement) {
        displayMessage(messageElement, 'Buscando CEP...', 'info');
        try {
            const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
            if (!response.ok) throw new Error('Falha ao buscar CEP.');
            const data = await response.json();

            if (data.erro) {
                displayMessage(messageElement, 'CEP não encontrado. Preencha o endereço manualmente.', 'error');
                if(enderecoElement) enderecoElement.value = '';
            } else {
                if(enderecoElement) enderecoElement.value = `${data.logradouro || ''}, ${data.bairro || ''}, ${data.localidade || ''} - ${data.uf || ''}`.replace(/^,|,$/g, '').replace(/,\s*,/g, ',');
                displayMessage(messageElement, 'Endereço parcialmente preenchido. Verifique e complete.', 'success');
            }
        } catch (error) {
            console.error('Erro ao buscar CEP:', error);
            displayMessage(messageElement, error.message || 'Erro ao conectar à API de CEP.', 'error');
        }
    }

    // --- LISTA DE VOLUNTÁRIOS ---
    const voluntariosContainer = document.getElementById('voluntariosContainer');
    const filtroNomeVoluntarioInput = document.getElementById('filtroNomeVoluntario');
    const btnLimparTodosVoluntarios = document.getElementById('btnLimparTodosVoluntarios');
    const listaVoluntariosMsgEl = document.getElementById('listaVoluntariosMessage'); 

    if (voluntariosContainer) {
        // Renderiza os cards de voluntários na tela
        function renderVoluntarios(voluntariosArray) {
            voluntariosContainer.innerHTML = ''; 

            if (!voluntariosArray || voluntariosArray.length === 0) {
                const emptyMessageEl = document.createElement('p');
                emptyMessageEl.className = 'empty-message';
                emptyMessageEl.textContent = 'Nenhum voluntário encontrado ou correspondente ao filtro.';
                voluntariosContainer.appendChild(emptyMessageEl);
                return;
            }

            voluntariosArray.forEach(voluntario => {
                const card = document.createElement('div');
                card.className = 'voluntario-card';
                const sigId = String(voluntario.id || Date.now());
                // Palavras-chave para Unsplash
                const primaryKeywords = "people,face,portrait"; 
                const fotoUrl = `https://source.unsplash.com/160x160/?${primaryKeywords}&sig=${sigId}`;
                const fallbackKeywords = "nature,abstract";
                const fallbackFotoUrl = `https://source.unsplash.com/160x160/?${fallbackKeywords}&sig=fallback_${sigId}`;

                // Logs para imagem Unsplash
                console.log(`Renderizando card para: ${voluntario.nome} (ID: ${voluntario.id})`);
                console.log(`Tentando URL principal da Unsplash: ${fotoUrl}`);

                card.innerHTML = `
                    <img src="${fotoUrl}" 
                         alt="Foto de ${voluntario.nome}" 
                         class="profile-pic" 
                         onerror="this.onerror=null; console.error('Erro ao carregar imagem principal: ${fotoUrl}. Tentando fallback: ${fallbackFotoUrl}'); this.src='${fallbackFotoUrl}'; this.alt='Imagem alternativa';"
                    >
                    <h3>${voluntario.nome}</h3>
                    <p><strong>Email:</strong> ${voluntario.email}</p>
                    <p><strong>Endereço:</strong> ${voluntario.endereco}</p>
                    <button class="btn-excluir" data-id="${voluntario.id}">
                        <i class="fas fa-trash"></i> Excluir
                    </button>
                `;
                voluntariosContainer.appendChild(card);
            });
        }

        // Carrega voluntários do localStorage e aplica filtro
        function loadAndRenderVoluntarios() {
            const voluntariosDB = JSON.parse(localStorage.getItem('voluntariosDB')) || [];
            const filtroTexto = filtroNomeVoluntarioInput ? filtroNomeVoluntarioInput.value.toLowerCase() : "";
            const voluntariosFiltrados = voluntariosDB.filter(voluntario => 
                voluntario.nome.toLowerCase().includes(filtroTexto)
            );
            renderVoluntarios(voluntariosFiltrados);
        }

        loadAndRenderVoluntarios(); 

        if (filtroNomeVoluntarioInput) {
            filtroNomeVoluntarioInput.addEventListener('input', loadAndRenderVoluntarios);
        }

        // Deleção de voluntário individual
        voluntariosContainer.addEventListener('click', (event) => {
            const targetButton = event.target.closest('.btn-excluir');
            if (targetButton) {
                const voluntarioId = targetButton.dataset.id;
                if (confirm('Tem certeza que deseja excluir este voluntário?')) {
                    let voluntariosDB = JSON.parse(localStorage.getItem('voluntariosDB')) || [];
                    voluntariosDB = voluntariosDB.filter(v => v.id !== voluntarioId);
                    localStorage.setItem('voluntariosDB', JSON.stringify(voluntariosDB));
                    if(typeof displayMessage === 'function' && listaVoluntariosMsgEl) {
                        displayMessage(listaVoluntariosMsgEl, 'Voluntário excluído com sucesso.', 'success');
                    }
                    loadAndRenderVoluntarios();
                }
            }
        });

        // Limpar todos os voluntários
        if (btnLimparTodosVoluntarios) {
            btnLimparTodosVoluntarios.addEventListener('click', () => {
                const voluntariosDB = JSON.parse(localStorage.getItem('voluntariosDB')) || [];
                if (voluntariosDB.length === 0) {
                     if(typeof displayMessage === 'function' && listaVoluntariosMsgEl) {
                        displayMessage(listaVoluntariosMsgEl, 'Não há voluntários para limpar.', 'info');
                     }
                    return;
                }
                if (confirm('ATENÇÃO: Isso apagará TODOS os voluntários cadastrados. Deseja continuar?')) {
                    localStorage.removeItem('voluntariosDB');
                     if(typeof displayMessage === 'function' && listaVoluntariosMsgEl) {
                        displayMessage(listaVoluntariosMsgEl, 'Todos os voluntários foram removidos.', 'success');
                     }
                    loadAndRenderVoluntarios();
                }
            });
        }
    }

    // --- MONITOR DE INATIVIDADE PARA PÁGINAS ADMIN ---
    const adminWrapperElement = document.querySelector('.admin-wrapper'); 
    // Verifica se está em uma página admin relevante
    if (adminWrapperElement && (window.location.pathname.includes('admin.html') || 
        window.location.pathname.includes('cadastro_voluntario.html') ||
        window.location.pathname.includes('lista_voluntarios.html'))) {

        let inactivityTimer;
        const INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000; 

        const logoutUserPorInatividade = () => {
            localStorage.removeItem('usuarioLogado'); 
            alert("Você foi desconectado por inatividade. Por favor, faça o login novamente.");
            window.location.href = 'index.html'; 
        };

        const resetInactivityTimer = () => {
            clearTimeout(inactivityTimer);
            inactivityTimer = setTimeout(logoutUserPorInatividade, INACTIVITY_TIMEOUT_MS);
        };

        // Eventos que resetam o timer de inatividade
        const activityEvents = ['mousemove', 'mousedown', 'keypress', 'scroll', 'touchstart', 'click'];
        activityEvents.forEach(event => {
            document.addEventListener(event, resetInactivityTimer, true); 
        });

        resetInactivityTimer(); 
        console.log("Monitor de inatividade iniciado para páginas admin."); 
    }
});

// --- FUNÇÕES UTILITÁRIAS ---

// Valida formato de e-mail
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Exibe mensagens de feedback para o usuário
function displayMessage(element, message, type = 'error') {
    if (!element) {
        // Aviso se o elemento de mensagem não for encontrado
        console.warn("Elemento de mensagem não encontrado para a mensagem:", message, "(Elemento era:", element, ")");
        return;
    }
    element.textContent = message;
    element.className = `message ${type}`; 
    if (message) {
        element.style.display = 'block';
        // Esconde mensagens de sucesso/info após 3 segundos
        if (type === 'success' || type === 'info') {
            setTimeout(() => {
                // Garante que está escondendo a mensagem correta, caso mude rapidamente
                if (element.textContent === message) { 
                    element.style.display = 'none';
                    element.textContent = '';
                }
            }, 3000);
        }
    } else {
        element.style.display = 'none';
    }
}
