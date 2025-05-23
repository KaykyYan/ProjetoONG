document.addEventListener('DOMContentLoaded', () => {
    const OPENWEATHERMAP_API_KEY = '639f302be83b9b35d9e5568d6833f6df'; // SUA CHAVE DA API AQUI!

    // --- LÓGICA DA PÁGINA DE CADASTRO DE USUÁRIO ---
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
            cepInput.addEventListener('input', (e) => { // Mudar para 'input' para formatar enquanto digita
                let cepVal = e.target.value.replace(/\D/g, '');
                if (cepVal.length > 8) cepVal = cepVal.substring(0, 8);
                
                let cepFormatado = cepVal;
                if (cepVal.length > 5) {
                    cepFormatado = cepVal.substring(0, 5) + '-' + cepVal.substring(5);
                }
                e.target.value = cepFormatado; // Atualiza o valor do campo com a formatação
            });

            cepInput.addEventListener('blur', async () => { // 'blur' para buscar após sair do campo
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

                        // Após buscar o CEP e preencher o endereço, buscar o clima
                        if (dataViaCEP.localidade) {
                            fetchWeatherData(dataViaCEP.localidade, dataViaCEP.uf); // Passa cidade e UF
                        }

                    } catch (error) {
                        console.error('Erro ao buscar CEP:', error);
                        enderecoInput.value = '';
                        displayMessage(cadastroMessage, error.message || 'Erro ao buscar CEP. Verifique e tente novamente.', 'error');
                    }
                } else if (cep.length > 0) { // Se o CEP não tem 8 dígitos mas tem algo
                    enderecoInput.value = '';
                    displayMessage(cadastroMessage, 'CEP deve conter 8 números.', 'error');
                }
            });
        }

        async function fetchWeatherData(cidade, uf) {
            if (!weatherWidget) return;
            const weatherIconEl = document.getElementById('weatherIcon');
            const weatherTempEl = document.getElementById('weatherTemp');
            const weatherCityEl = document.getElementById('weatherCity');
            const weatherDescriptionEl = document.getElementById('weatherDescription');

            // Tenta buscar pela cidade e UF para maior precisão, depois só pela cidade
            const queryParams = [`${cidade},${uf},BR`, `${cidade},BR`, cidade]; 
            let weatherData = null;

            for (const param of queryParams) {
                try {
                    const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(param)}&appid=${OPENWEATHERMAP_API_KEY}&units=metric&lang=pt_br`);
                    if (response.ok) {
                        weatherData = await response.json();
                        if (weatherData && weatherData.main && weatherData.weather) {
                            break; // Dados válidos encontrados, sair do loop
                        } else {
                            weatherData = null; // Resposta OK mas dados inválidos
                        }
                    }
                } catch (error) {
                    console.warn(`Falha ao buscar clima para ${param}:`, error);
                }
            }
            
            if (weatherData) {
                weatherTempEl.textContent = `${Math.round(weatherData.main.temp)}°C`;
                weatherCityEl.textContent = weatherData.name; // Usa o nome retornado pela API para consistência
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
            // ... (resto da sua lógica de submit do cadastroForm, sem alterações aqui) ...
            if (!nomeInput.value.trim()) {
                displayMessage(cadastroMessage, 'Por favor, informe seu nome.', 'error'); return;
            }
            // ... (manter todas as validações e lógica de salvar usuário)
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

    // --- LÓGICA DA PÁGINA DE LOGIN ---
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        // ... (sua lógica de login existente, sem alterações aqui) ...
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

    // --- LÓGICA PARA PÁGINA ADMIN (MENU E FOOTER) ---
    const menuToggle = document.getElementById('menuToggle');
    const adminNav = document.getElementById('adminNav');

    if (menuToggle && adminNav) {
        // ... (sua lógica de menu existente, sem alterações aqui) ...
        menuToggle.addEventListener('click', () => {
            adminNav.classList.toggle('active');
        });
    }

    const currentYearSpan = document.getElementById('currentYear');
    if (currentYearSpan) {
        // ... (sua lógica de ano existente, sem alterações aqui) ...
        currentYearSpan.textContent = new Date().getFullYear();
    }

    if (adminNav) {
        // ... (sua lógica de link ativo existente, sem alterações aqui) ...
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

    // --- LÓGICA PARA CADASTRO DE VOLUNTÁRIO (cadastro_voluntario.html) ---
    const formCadastroVoluntario = document.getElementById('formCadastroVoluntario');
    if (formCadastroVoluntario) {
        // ... (sua lógica de cadastro de voluntário existente, sem alterações aqui) ...
        // ... (a função buscarEnderecoViaCEPVoluntario também permanece como está) ...
        const voluntarioNomeInput = document.getElementById('voluntarioNome');
        const voluntarioEmailInput = document.getElementById('voluntarioEmail');
        const voluntarioCEPInput = document.getElementById('voluntarioCEP');
        const voluntarioEnderecoInput = document.getElementById('voluntarioEndereco');
        const voluntarioComplementoInput = document.getElementById('voluntarioComplemento');
        const cadastroVoluntarioMessage = document.getElementById('cadastroVoluntarioMessage');

        if (voluntarioCEPInput) {
            voluntarioCEPInput.addEventListener('input', (e) => {
                let cep = e.target.value.replace(/\D/g, '');
                if (cep.length > 8) cep = cep.substring(0, 8);
                
                let cepFormatado = cep;
                if (cep.length > 5) {
                    cepFormatado = cep.substring(0, 5) + '-' + cep.substring(5);
                }
                e.target.value = cepFormatado;

                if (cep.length === 8) {
                    // Note: Esta é buscarEnderecoViaCEPVoluntario, não a nova fetchWeatherData
                    // Se quiser clima aqui também, teria que adaptar ou chamar a fetchWeatherData.
                    // Por ora, mantendo como estava no seu script original.
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

    async function buscarEnderecoViaCEPVoluntario(cep, messageElement, enderecoElement) {
        // ... (sua função buscarEnderecoViaCEPVoluntario existente, sem alterações) ...
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


    // --- LÓGICA PARA LISTA DE VOLUNTÁRIOS (lista_voluntarios.html) ---
    // ESTA É A VERSÃO QUE TENTA USAR A UNSPLASH E INCLUI OS LOGS PARA DEPURAR A UNSPLASH
    const voluntariosContainer = document.getElementById('voluntariosContainer');
    const filtroNomeVoluntarioInput = document.getElementById('filtroNomeVoluntario');
    const btnLimparTodosVoluntarios = document.getElementById('btnLimparTodosVoluntarios');
    const listaVoluntariosMsgEl = document.getElementById('listaVoluntariosMessage'); // Renomeado para evitar conflito com a função displayMessage

    if (voluntariosContainer) {
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
                const primaryKeywords = "person,user,profile"; // Palavras-chave que você quer usar
                const fotoUrl = `https://source.unsplash.com/160x160/?${primaryKeywords}&sig=${sigId}`;
                const fallbackKeywords = "abstract,gradient,pattern";
                const fallbackFotoUrl = `https://source.unsplash.com/160x160/?${fallbackKeywords}&sig=fallback_${sigId}`;

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
    } // Fim do if (voluntariosContainer)

    // --- LÓGICA DE INATIVIDADE PARA ÁREA ADMIN ---
    const adminWrapperElement = document.querySelector('.admin-wrapper'); 

    if (adminWrapperElement && (window.location.pathname.includes('admin.html') || 
        window.location.pathname.includes('cadastro_voluntario.html') ||
        window.location.pathname.includes('lista_voluntarios.html'))) {

        let inactivityTimer;
        const INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000; 

        const logoutUserPorInatividade = () => {
            localStorage.removeItem('usuarioLogado'); 
            alert("Você foi desconectado por inatividade. Por favor, faça o login novamente.");
            window.location.href = 'index.html'; // 
        };

        const resetInactivityTimer = () => {
            clearTimeout(inactivityTimer);
            inactivityTimer = setTimeout(logoutUserPorInatividade, INACTIVITY_TIMEOUT_MS);
        };

        const activityEvents = ['mousemove', 'mousedown', 'keypress', 'scroll', 'touchstart', 'click'];
        activityEvents.forEach(event => {
            document.addEventListener(event, resetInactivityTimer, true); 
        });

        resetInactivityTimer(); 
        console.log("Monitor de inatividade iniciado para páginas admin.");
    }

}); // Fim do DOMContentLoaded


function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function displayMessage(element, message, type = 'error') {
    if (!element) {
        console.warn("Elemento de mensagem não encontrado para a mensagem:", message, "(Elemento era:", element, ")");
        return;
    }
    element.textContent = message;
    element.className = `message ${type}`; // Garante que sempre comece com 'message'
    if (message) {
        element.style.display = 'block';
        if (type === 'success' || type === 'info') {
            setTimeout(() => {
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
