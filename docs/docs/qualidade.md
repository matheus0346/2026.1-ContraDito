# Testes e Qualidade

A garantia de qualidade técnica do **ContraDito** é um pilar fundamental para assegurar a confiabilidade do cruzamento de dados governamentais, do funcionamento dos endpoints da API e do motor de Inteligência Artificial do pipeline de ETL.

---

## Integração Contínua (CI/CD)

O ciclo de desenvolvimento do backend e da documentação do portal é automatizado utilizando **GitHub Actions**. Atualmente, existem os seguintes fluxos de automação configurados na pasta `.github/workflows/`:

1. **Linter e Formatação (`linter.yml`):**
   * **Gatilho:** Disparado em todo Pull Request direcionado para as ramificações `develop` e `main`.
   * **Ações:** Executa a verificação de formatação automática do código Python usando a ferramenta `black` e a conformidade com as diretrizes de estilo do PEP 8 usando `flake8`.

2. **Testes do Backend e API (`testes-backend.yml`):**
   * **Gatilho:** Disparado em Pull Requests para `develop` e `main`.
   * **Job de API (`rodar-testes`):** Configura o ambiente Python 3.12, instala dependências da API e testes (`requirements.api.txt` e `requirements.test.txt`) e roda os testes da API com pytest, exigindo cobertura mínima de **90%** (`--cov-fail-under=90`).
   * **Job de ETL (`testes-etl`):** Instala dependências do pipeline e de testes, e executa os testes do pipeline de extração e tratamento dos dados no pytest, também exigindo cobertura mínima de **90%** (`--cov-fail-under=90`).

3. **Deploy de Documentação e Métricas (`deploy-docs.yml`):**
   * Coleta dados do repositório diariamente para relatórios de evolução e produtividade da equipe, atualiza a base de dados local de métricas do projeto, e publica de forma autônoma o site estático gerado pelo MkDocs sempre que a documentação nas branches principais (`main` e `develop`) é atualizada ou por agendamento diário.

---

## Cobertura de Testes

Os testes automatizados são divididos entre testes do servidor da API (endpoints e rotas) e testes dos pipelines de ETL do worker. Atualmente, o projeto conta com **239 testes unitários e de integração**.

### Métricas de Cobertura Consolidadas

A execução das suítes de testes locais e no pipeline de CI/CD retornam as seguintes coberturas oficiais:

* **Módulo API (`app`):** **93% de Cobertura** (30 testes aprovados).
* **Módulo ETL e Utilidades (`etl` + `utils`):** **91% de Cobertura** (209 testes aprovados).

### Detalhamento da Cobertura por Arquivo

| Módulo / Pacote | Arquivo / Componente | Cobertura (%) | Status |
|---|---|---|---|
| **API (`app`)** | `app/rotas/dados.py` (Rotas Gerais) | 92% | Aprovado |
| **API (`app`)** | `app/main.py` (Inicializador) | 96% | Aprovado |
| **API (`app`)** | `app/modelos/schemas.py` (Modelos Pydantic) | 100% | Aprovado |
| **ETL (`etl`)** | `etl/resumidor_senado.py` (Summarizer) | 100% | Aprovado |
| **ETL (`etl`)** | `etl/transformadores_discursos_camara.py` | 100% | Aprovado |
| **ETL (`etl`)** | `etl/extrator_discursos_camara.py` | 96% | Aprovado |
| **ETL (`etl`)** | `etl/inferidor_postura.py` (NLP) | 95% | Aprovado |
| **ETL (`etl`)** | `etl/resumidor_proposicoes.py` | 95% | Aprovado |
| **ETL (`etl`)** | `etl/pipeline_resumo_proposicoes.py` | 94% | Aprovado |
| **ETL (`etl`)** | `etl/chunker_discursos_senado.py` | 93% | Aprovado |
| **ETL (`etl`)** | `etl/pipeline_resumo_senado.py` | 91% | Aprovado |
| **ETL (`etl`)** | `etl/vinculador_discursos_votos_camara.py` | 91% | Aprovado |
| **ETL (`etl`)** | `etl/vinculador_discursos_votos_senado.py` | 91% | Aprovado |
| **ETL (`etl`)** | `etl/extrator_politicos_camara.py` | 90% | Aprovado |
| **ETL (`etl`)** | `etl/extrator_proposicoes_senado.py` | 90% | Aprovado |
| **ETL (`etl`)** | `etl/chunker_discursos_camara.py` | 88% | Aprovado |
| **ETL (`etl`)** | `etl/extrator_politicos_senado.py` | 88% | Aprovado |
| **ETL (`etl`)** | `etl/extrator_proposicoes_camara.py` | 88% | Aprovado |
| **ETL (`etl`)** | `etl/pipeline_inferencia.py` | 86% | Aprovado |
| **ETL (`etl`)** | `etl/extrator_votos_senado.py` | 84% | Aprovado |
| **ETL (`etl`)** | `etl/extrator_discursos_senado.py` | 100% | Aprovado |
| **Utils (`utils`)** | `utils/cleaner.py` (Limpeza de Textos) | 100% | Aprovado |
| **Utils (`utils`)** | `utils/motor_nlp.py` (Sentence Embeddings) | 100% | Aprovado |

> [!TIP]
> **Execução Local**: Para reproduzir os resultados de cobertura e testes localmente, ative o ambiente virtual correspondente (`.venv-api` para testes de API ou `.venv` para testes de ETL) e execute:
> ```bash
> pytest --cov=app tests/api
> pytest --cov=etl --cov=utils tests/etl
> ```


