# Backlog e Requisitos do Sistema

Este documento centraliza os Requisitos Funcionais (RFs), Requisitos Não-Funcionais (RNFs) e Regras de Negócio (RNs) que guiam o escopo e o desenvolvimento do ContraDito. A arquitetura foi dividida em Épicos para facilitar o gerenciamento das Sprints e a rastreabilidade do produto.

---

## Épico 1: Pipeline de Dados e Ingestão (ETL)

### Requisitos Funcionais (RF)
* **RF01 - Atualização de Dados (ETL):** O sistema deve possuir rotinas automatizadas (ou acionadas manualmente) para extrair novos discursos e votações da API da Câmara, calcular os novos embeddings no Worker e atualizar a base do Supabase periodicamente.
* **RF02 - Coleta e Tipagem de Proposições:** O pipeline ETL deve somente extrair, tipar e armazenar Projetos de Lei (PLs) e Propostas de Emenda à Constituição (PECs).
* **RF03 - Mapeamento de Votos Nominais:** O sistema deve extrair de forma relacional o posicionamento exato de cada parlamentar (Sim, Não, Abstenção e Ausente) vinculado à respectiva proposição.
* **RF04 - Sanitização e Prevenção de Ruídos:** O pipeline deve aplicar filtros rigorosos (limpeza HTML, notas taquigráficas) no texto bruto antes da vetorização.
* **RF05 - Geração de Resumo Executivo:** Durante a etapa de extração das proposições, o sistema deve utilizar um modelo LLM (como o Llama 3) para processar o texto original da proposição e gerar um resumo executivo que contenha o núcleo temático do documento.
* **RF06 - Vetorização da Proposição:** O sistema deve submeter o resumo executivo (já validado quanto ao tamanho) ao modelo SBERT para gerar a representação vetorial (embedding) da proposição, armazenando o resultado no banco de dados.
* **RF07 - Estratégia de Execução e Resiliência do ETL:** O pipeline ETL deve ser executado exclusivamente por rotinas agendadas (Cron Jobs) de forma periódica (diária ou semanal) fora do horário de pico, nunca em tempo real. A cada execução, o sistema deve registrar a data/hora da última extração bem-sucedida (watermark) para buscar apenas os dados incrementais nas execuções seguintes. Caso a API externa falhe durante a extração, o pipeline deve realizar tentativas automáticas de reconexão utilizando Exponential Backoff antes de abortar a execução.
* **RF08 - Escopo de Coleta de Políticos (Cargos Abrangidos):** O pipeline ETL deve restringir a extração de dados, perfis, discursos e votações exclusivamente para os cargos de nível federal. O sistema deverá consumir a API da Câmara dos Deputados para Deputados Federais e a API do Senado Federal para Senadores da República. *(Nota: Para a versão atual do sistema, Deputados Estaduais, Distritais, Prefeitos e Vereadores estão fora do escopo e não devem ser processados).*

### Regras de Negócio (RN)
* **RN01 - Limite de Contexto do Resumo:** O resumo executivo gerado pelo LLM deve ser estritamente limitado ao limite máximo de tokens suportado pelo modelo de vetorização (SBERT), garantindo que todo o texto seja vetorizável em uma única requisição, eliminando a necessidade de chunking da proposição.
* **RN02 - Escopo Temporal da Legislatura:** A extração de dados (ETL) deve filtrar obrigatoriamente parlamentares, discursos e votações restringindo-os ao período exato da legislatura vigente (2023 a 2026).
* **RN03 - Exclusividade para Matérias Votadas:** A extração de matérias legislativas (Proposições) deve estar estritamente atrelada à existência de um registro de votação concluída no painel eletrônico. Projetos em tramitação que não foram submetidos a voto nominal devem ser ignorados.
* **RN04 - Restrição de Fontes Oficiais:** O arcabouço textual extraído para compor o contexto do político deve provir unicamente das Notas Taquigráficas e discursos proferidos em plenário ou comissões. Textos oriundos de redes sociais (ex: Twitter, Instagram) ou publicações externas estão vetados no pipeline.

---

## Épico 2: Motor de Inteligência e NLP

### Requisitos Funcionais (RF)
* **RF09 – Fragmentação e Vetorização Contínua:** Complementando as rotinas do ETL, o Motor NLP deve dividir os discursos em fragmentos menores (chunking) com sobreposição de conteúdo (overlap). Em seguida, transformará esses fragmentos em embeddings vetoriais, persistindo-os no banco de dados via extensão pgvector.
* **RF10 – Recuperação de Contexto Vetorial:** Para cada parlamentar que registrou voto em uma matéria, o sistema deve executar uma busca vetorial no banco de dados recuperando os chunks de discursos do próprio parlamentar com maior proximidade semântica ao texto da proposição. Apenas chunks com distância de cosseno igual ou inferior a 0.20 em relação ao resumo da proposição serão considerados válidos; fragmentos que ultrapassarem esse limiar devem ser descartados antes da montagem do prompt.
* **RF11 – Orquestração de Prompt (Filter):** O sistema deve concatenar o texto da matéria legislativa com os *top-k* chunks recuperados no RF10, montando dinamicamente o prompt de contexto que será enviado ao modelo de linguagem.
* **RF12 – Inferência de Postura:** O sistema deve enviar o prompt orquestrado ao LLM (LLama 3) para que a IA analise os textos e infira a postura teórica do deputado em relação à matéria (ex: A Favor ou Contra) estritamente com base nos discursos fornecidos.
* **RF13 – Avaliação Lógica de Coerência:** O pipeline deve cruzar a postura inferida pela IA (RF12) com o voto nominal real do parlamentar no painel da Câmara/Senado. O sistema classificará o voto final como "Coerente" ou "Incoerente".
* **RF14 – Persistência do Veredito:** O sistema deve salvar o resultado final da classificação (RF13) e a justificativa textual gerada pela IA no banco de dados, para posterior exibição na interface de "Provas da Contradição".

### Regras de Negócio (RN)
* **RN05 – Restrição de Viés Temporal:** A recuperação de contexto (RF10) deve considerar apenas discursos proferidos em datas anteriores ou iguais à data da votação da matéria. O sistema é estritamente proibido de utilizar discursos futuros para julgar um voto passado.
* **RN06 – Aborto por Dados Insuficientes:** Se a busca vetorial para um deputado não retornar nenhum discurso que respeite o limite rigoroso estipulado (ex: 0.2 de distância de cosseno estabelecido), o acionamento do LLM deve ser abortado para aquele parlamentar. O voto não entrará no denominador de cálculo do Score de Coerência.
* **RN07 - Prevenção de Reprocessamento:** A IA (LLM) e a vetorização só devem ser acionadas para parlamentares que tiverem dados novos (discursos ou votos). Perfis inalterados não serão reprocessados, poupando recursos.

### Requisitos Não Funcionais (RNF)
* **RNF01 - Separação de Arquitetura:** A aplicação backend deve ser obrigatoriamente dividida. O roteamento (FastAPI Principal) e o Motor de Processamento NLP (PyTorch/SBERT) devem executar em contêineres Docker distintos comunicando-se via HTTP interno. Na infraestrutura via Docker Compose, o Worker opera em rede privada, impedindo acesso externo direto à IA e protegendo a API Principal.
* **RNF02 - Resiliência e Timeout no Microsserviço NLP:** A API Principal (FastAPI) não deve ficar travada caso o contêiner do Worker caia por falta de memória ou engasgue. A requisição HTTP interna do FastAPI para o Worker deve ter um Timeout curto e estrito (ex: 5 a 10 segundos máximos). Caso o tempo estoure, a API principal deve abortar a conexão imediatamente, proteger o servidor e retornar um HTTP Status 503 (Service Unavailable).
* **RNF03 – Padronização do Modelo de Embedding:** O sistema deve utilizar obrigatoriamente o modelo `paraphrase-multilingual-mpnet-base-v2` (via SBERT) para a geração de todos os embeddings, garantindo um espaço vetorial consistente e otimizado para o idioma português.
* **RNF04 – Estruturação Obrigatória da Saída do LLM (JSON):** A comunicação de inferência entre o backend e o modelo LLM deve exigir e aceitar exclusivamente um objeto JSON perfeitamente formatado, contendo as chaves exatas esperadas pelo sistema. O modelo é expressamente proibido de retornar texto livre, saudações ou qualquer conteúdo fora desse esquema. Qualquer resposta que não esteja em conformidade com o formato estruturado deve ser tratada como falha de inferência e lançar uma exceção, sem demandar interpretação humana.
* **RNF05 – Framework de Orquestração LLM:** O módulo de Inteligência deve utilizar o framework LangChain que integrará a recuperação vetorial, a formatação do prompt e a chamada de inferência.
* **RNF06– Limite de Contexto e Estratégia de Fragmentação:** A divisão de textos (RF09) deve utilizar algoritmos de quebra de texto (ex: `RecursiveCharacterTextSplitter` do LangChain) configurados para respeitar rigorosamente o limite máximo de tokens do modelo SBERT (geralmente 512 tokens), garantindo que nenhuma parte do discurso original sofra truncamento silencioso durante a geração dos embeddings.
* **RNF07 - Motor de Inferência Self-Hosted:** A avaliação semântica das posturas parlamentares deve ser executada obrigatoriamente por uma instância local do modelo de linguagem Llama 3 8B, garantindo que a arquitetura não dependa de cobranças por token de APIs comerciais externas.

---

## Épico 3: Busca e Filtros

### Requisitos Funcionais (RF)
* **RF15 - Barra de Busca:** O sistema deve possuir uma barra de busca global que permita pesquisar políticos por nome, sobrenome ou "nome de urna".
* **RF16 - Filtro por Partido:** O sistema deve permitir a filtragem da listagem de políticos por Partido (ex: PL, PT, PSDB).
* **RF17 - Filtro por Cargo:** O sistema deve permitir a filtragem por Cargo Político (ex: Deputado Federal, Senador).
* **RF18 - Filtro por UF:** O sistema deve permitir a filtragem cruzada por Estado/UF (ex: Deputados do MDB por São Paulo).
* **RF19 - Destaques da Home:** A página inicial deve exibir um ranking ou carrossel de destaque (ex: "Top 5 mais coerentes").
* **RF20 - Ordenação Padrão:** A listagem geral de políticos na página inicial deve ser ordenada por padrão (default) exibindo primeiro os parlamentares com o maior "Score de Coerência".
* **RF21 - Padronização de Filtros Restritos:** Para evitar sobrecarga no banco de dados com buscas inválidas, a API validará filtragens exatas. O Front-end deve obrigatoriamente implementar componentes de seleção fechada (Dropdowns), garantindo que o usuário só consiga pesquisar por Partidos, Cargos e UFs que de fato existam no sistema.

### Requisitos Não Funcionais (RNF)
* **RNF08 - Performance e Lazy Loading:** A listagem e o filtro de políticos devem ter paginação (lazy loading) pela sua API FastAPI, para não travar o navegador carregando todos políticos de uma vez só.

---

## Épico 4: Raio-X Parlamentar e Transparência

### Requisitos Funcionais (RF)
* **RF22 - Cabeçalho do Perfil:** O sistema deve exibir um cabeçalho com a foto oficial, nome, partido, UF e situação do mandato atual.
* **RF23 - Exibição do Score:** O sistema deve exibir o Score de Coerência em formato visual.
* **RF24 - Provas da Contradição:** O sistema deve listar as "Provas da Contradição" — uma tabela lado a lado mostrando o trecho do discurso extraído (o que ele disse) vs. o voto oficial na Câmara (o que ele fez).
* **RF25 - Estado de Ausência de Dados:** O sistema deve prever o "Estado de Ausência de Dados". Políticos que não possuam volume suficiente de discursos (10% da média do banco) ou votações devem ter o `score_coerencia` retornado como "Nulo" pela API, e a interface visual deve exibir um indicador neutro.
* **RF26 – Processamento e Disponibilização do Score (Backend):** O backend (FastAPI) deve aplicar as lógicas descritas na RN09 e RN10 para calcular o Score de Coerência. A API deve retornar o valor numérico truncado ou arredondado com, no máximo, uma casa decimal (ex: 85.4).
* **RF27 – Renderização do Score (Front-end):** A interface de usuário deve exibir o Score de Coerência processado pelo backend, garantindo que a representação visual (gráficos, barras ou tipografia) obedeça a uma escala fixa de 0 a 100.

### Regras de Negócio (RN)
* **RN09 – Fórmula do Score de Coerência:** O índice de coerência de um parlamentar deve ser calculado percentualmente, utilizando a fórmula: `(Quantidade de Votos Coerentes / Total de Votações Válidas Analisadas) * 100`.
* **RN10 – Critério de Votação Válida (Filtro do Denominador):** Para fins do cálculo do Score de Coerência, apenas votações em que o parlamentar expressou um posicionamento ativo (ex: "Sim" ou "Não") são consideradas válidas. Registros de "Ausente" ou "Abstenção" devem ser estritamente ignorados e não podem compor o denominador da fórmula.

### Requisitos Não Funcionais (RNF)
* **RNF08 - Transparência de Atualização:** O sistema deve deixar explícito na interface a data da "Última Atualização dos Dados", para o usuário saber quão fresco é aquele Score.

---

## Épico 5: O Ringue de Comparação

### Requisitos Funcionais (RF)
* **RF28 - Seleção para Comparação:** O sistema deve permitir que o usuário selecione 2 políticos para uma visualização "Lado a Lado".
* **RF29 - O Ringue de Comparação Profunda:** A tela de comparação e o respectivo endpoint da API (Lado a Lado) devem contrastar 2 políticos de forma completa e contextualizada. O payload e a interface devem exibir: O Score de Coerência geral de ambos e a data do último cálculo.

---

## Épico 6: Performance, Escalabilidade e Governança

### Requisitos Funcionais (RF)
* **RF30 - Invalidação Global de Cache Pós-ETL:** O sistema deve possuir um mecanismo de Invalidação de Cache no FastAPI. Após a conclusão da rotina do ETL, o script deve disparar uma requisição administrativa que limpa o cachê, garantindo dados atualizados instantaneamente.

### Requisitos Não Funcionais (RNF)
* **RNF09– Escalabilidade e Paridade Local:** O Supabase deve suportar consultas complexas rápidas. Localmente, a infraestrutura emula essas capacidades usando a imagem `pgvector:pg15` no Docker, permitindo validação de performance sem custos de nuvem.
* **RNF10 - LGPD e Transparência:** O portal deve ter uma página estática explicando de forma clara e amigável que os dados são públicos e como a IA calcula o Score (mkdocs).
* **RNF11 - Performance e Cache:** Requisições estáticas ou de busca exata devem utilizar estratégia de Cache em Memória com tempo de expiração definido para aliviar o banco de dados.
* **RNF12 – Otimização de Build e Caching:** Uso obrigatório de Layer Caching (instalação de dependências isolada antes do código) e adoção de um arquivo `.dockerignore` rigoroso para evitar lentidão na transferência de contexto.

---

## Épico 7: Experiência do Usuário (UX) e Design System

### Requisitos Funcionais (RF)
* **RF31 - Feedback Visual de Carregamento (Skeleton Loaders):** Durante o tempo de espera da resposta da API (principalmente nas telas pesadas de Dossiê e Comparação), a interface gráfica deve exibir animações de carregamento do tipo Skeleton Screen (silhuetas cinzas piscantes) para informar ao usuário que o sistema está processando, evitando que a tela pareça "travada".
* **RF32 - Compartilhamento Social Dinâmico (Open Graph):** Aproveitando o Next.js, a página do Dossiê do Político (`/politico/[id]`) deve gerar metatags dinâmicas. Assim, quando um jornalista compartilhar o link no WhatsApp ou Twitter, o aplicativo deve gerar automaticamente um "card" de pré-visualização mostrando a foto do político, o nome e o seu Score de Coerência.
* **RF33 - Tratamento Visual de Erros (Error Boundaries):** O Front-end deve possuir telas ou componentes de erro amigáveis. Caso a API retorne uma falha crítica (como o erro 503 citado na RNF02), o sistema não deve exibir uma "tela branca" ou códigos técnicos, mas sim uma mensagem clara em interface, como: *"Nossos servidores estão processando muitos dados no momento. Tente novamente em alguns segundos."*
* **RF34 - Orientação em Estados Vazios (Empty States):** Complementando a regra de buscas vazias, o Front-end deve exibir ilustrações e textos de orientação amigáveis sempre que uma tabela não tiver dados ou um cruzamento de filtros (Ex: Partido X no Estado Y) não encontrar nenhum político, guiando o usuário a limpar os filtros.

### Requisitos Não Funcionais (RNF)
* **RNF13 - Responsividade:** O portal deve ser Mobile First. O layout precisa funcionar perfeitamente em telas de celular.
* **RNF14 - Acessibilidade Visual e Contraste (WCAG):** O Design System construído com Tailwind CSS deve respeitar as diretrizes internacionais de acessibilidade (WCAG nível AA). As cores utilizadas para o Score de Coerência (verde e vermelho) devem ter contraste suficiente com o fundo escuro (`bg-slate-900`) para garantir a legibilidade por pessoas com daltonismo ou baixa visão.
* **RNF15 - Navegação Acessível e ARIA:** Todos os elementos interativos do portal (filtros dropdown, barras de pesquisa, botões de comparação e paginação) devem ser totalmente navegáveis utilizando apenas o teclado (tecla Tab) e possuir atributos de leitura (ARIA labels) para compatibilidade com leitores de tela.
* **RNF16 - Otimização de Mídia (Next/Image):** Para garantir uma renderização ultrarrápida da página inicial (que possui dezenas de fotos de políticos), o Front-end deve obrigatoriamente utilizar o componente nativo `<Image/>` do Next.js. Ele fará o cache, a compressão (WebP) e o redimensionamento das fotos oficiais vindas da Câmara de forma automática (Lazy Loading de imagens).
* **RNF17 - Reusabilidade de Componentes (Design System):** A arquitetura do código no React deve ser estritamente modular. Elementos como o "Card do Político", a "Barra de Progresso do Score" e os "Botões Base" devem ser criados como componentes isolados, garantindo que qualquer alteração visual reflita automaticamente em todo o sistema, mantendo a consistência do Design System.
