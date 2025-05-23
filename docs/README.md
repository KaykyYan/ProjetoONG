# Sistema de Gerenciamento de Voluntários para ONG (Frontend)

Este é um projeto frontend simples para um sistema de gerenciamento de voluntários, desenvolvido com HTML, CSS e JavaScript puro. Ele permite o cadastro de usuários, login, cadastro de voluntários e a listagem/gerenciamento desses voluntários, com todos os dados armazenados localmente no navegador através do `localStorage`.

## Funcionalidades Principais

1.  **Cadastro de Usuário:**
    * Acesse através do link "Cadastre-se" na tela de Login (`index.html`) ou abrindo `cadastro.html` diretamente.
    * Campos: Nome, Email, CEP (com busca automática de endereço usando ViaCEP), Senha e Confirmação de Senha.
    * As informações dos usuários são salvas no `localStorage`.

2.  **Login de Usuário:**
    * Acesse através da página `login.html`.
    * Requer Email e Senha cadastrados.
    * Valida as credenciais com os dados armazenados no `localStorage`.
    * Em caso de sucesso, redireciona para a Área Administrativa (`admin.html`).

3.  **Área Administrativa:**
    * Acesso restrito a usuários previamente logados.
    * **Página Inicial (`admin.html`):** Tela de boas-vindas da área administrativa.
    * **Menu de Navegação:**
        * Cadastro de Voluntário
        * Lista de Voluntários
        * Sair (retorna para `index.html`)
    * **Redirecionamento por Inatividade:** Se o usuário permanecer inativo por 5 minutos em qualquer tela da área administrativa, ele será automaticamente desconectado e redirecionado para a tela de login.

4.  **Cadastro de Voluntário (`cadastro_voluntario.html`):**
    * Acessível pelo menu da área administrativa.
    * Campos: Nome Completo, Email, CEP (com formatação e busca de endereço opcional), Endereço Completo e Complemento.
    * Os dados dos voluntários são armazenados em uma lista separada no `localStorage`.

5.  **Lista de Voluntários (`lista_voluntarios.html`):**
    * Acessível pelo menu da área administrativa.
    * Exibe os voluntários cadastrados em formato de cards.
    * Cada card mostra:
        * Foto de perfil aleatória (via `source.unsplash.com` com base nos termos "person", "user", "profile" e um identificador único).
        * Nome do Voluntário.
        * Email.
        * Endereço Completo.
    * **Filtro por Nome:** Permite buscar voluntários pelo nome em tempo real.
    * **Excluir Voluntário:** Cada card possui um botão para remover o voluntário específico.
    * **Limpar Tudo:** Um botão para apagar todos os registros de voluntários do `localStorage` e da tela.
    * **Persistência:** Os dados dos voluntários permanecem salvos no `localStorage` mesmo após atualizar a página.

## Como Executar o Projeto

1.  Clone este repositório ou baixe todos os arquivos (`.html`, `style.css`, `script.js`) para uma mesma pasta no seu computador.
2.  Abra o arquivo `index.html` (ou `cadastro.html` se for o primeiro acesso) no seu navegador web preferido (Google Chrome, Firefox, Edge, etc.).

Não é necessário nenhum servidor web ou dependências complexas para executar este projeto, pois ele é puramente frontend.

## Estrutura dos Arquivos Principais

* `index.html`: Tela de login do usuário.
* `cadastro.html`: Tela de cadastro de novo usuário.
* `admin.html`: Página principal da área administrativa (após login).
* `cadastro_voluntario.html`: Formulário para cadastrar novos voluntários.
* `lista_voluntarios.html`: Tela para listar e gerenciar os voluntários.
* `style.css`: Arquivo CSS contendo todos os estilos para as páginas.
* `script.js`: Arquivo JavaScript contendo toda a lógica funcional do sistema.

## Tecnologias Utilizadas

* HTML5
* CSS3 (com Flexbox e Grid para layout)
* JavaScript (ES6+)
* `localStorage` do navegador para persistência de dados.
* API ViaCEP (consulta de CEP para preenchimento de endereço).
* API de Clima (para exibição de informações meteorológicas relacionadas ao endereço ou CEP do voluntário).
* `source.unsplash.com` (para exibição de fotos de perfil aleatórias).

## Observações Importantes

* **Armazenamento de Dados:** Todos os dados (usuários e voluntários) são armazenados localmente no navegador do usuário (`localStorage`). Isso significa que os dados não são compartilhados entre diferentes navegadores ou computadores e podem ser limpos pelo usuário.
* **Segurança da Senha:** As senhas dos usuários são armazenadas em texto plano no `localStorage`. **Isso é feito apenas para fins didáticos e não é seguro para aplicações reais.** Em um ambiente de produção, as senhas devem ser tratadas com hashing e armazenadas em um backend seguro.
* **Imagens da Unsplash:** A exibição de imagens da Unsplash depende da disponibilidade do serviço e pode estar sujeita a limites de taxa (rate limiting), o que pode fazer com que as imagens não carreguem ou sejam substituídas por alternativas.
