# Metodologia e Processo de Desenvolvimento

Este documento descreve as práticas ágeis, os ritos e as políticas de engenharia de software adotadas pela **Squad 09** para o desenvolvimento do ContraDito. Nosso processo foi desenhado para garantir entregas contínuas, alta qualidade de código e alinhamento constante com os objetivos da disciplina de MDS.

## 1. Framework Ágil
A equipe adota uma abordagem híbrida baseada em **Scrum** e **Extreme Programming (XP)**. Utilizamos o Scrum para cadência, ritos e planejamento das Sprints, enquanto os valores do XP guiam nossas práticas de engenharia de software e nosso foco na qualidade técnica do código.

## 2. Papéis da Equipe
Para garantir o desenvolvimento de habilidades em todas as áreas e uma boa divisão de carga, a equipe adotou a seguinte distribuição de papéis:

* **Scrum Master / Agile Master:** @henriquemendeselias - Responsável por remover impedimentos e garantir a execução e qualidade dos ritos ágeis.
* **Product Owner (PO):** @jot4-ge - Responsável por refinar e priorizar o Backlog, definir o escopo e validar as entregas junto às expectativas do projeto.
* **Desenvolvedores Backend e DevOps:** @luizhtmoreira @lucasaraujoszz @matheus0346 - Responsáveis pelo pipeline ETL, motor NLP, modelagem do banco de dados vetorial, infraestrutura e documentação.
* **Desenvolvedores Frontend:** @G2SBiell - Responsáveis pela construção da interface do usuário (Next.js/React), integração com a API e fidelidade ao escopo de UX.

## 3. Ritos e Cadência
Trabalhamos com **Sprints com duração de 1 semana**. Nossos ritos oficiais ocorrem da seguinte forma:

* **Planning:** Realizada às terças-feiras, onde priorizamos as *Issues* do Épico atual e estimamos o esforço.
* **Dailies:** Realizadas de forma assíncrona via Discord/WhatsApp, para alinhamento rápido do time.
* **Review e Retrospectiva:** Realizadas ao final da Sprint, para consolidar o que foi entregue e debater pontos de melhoria no processo da equipe.

## 4. Práticas de Engenharia (Extreme Programming - XP)
Para manter a sustentabilidade do código a longo prazo, adotamos as seguintes práticas de XP. *(Nota: O fluxo de automação será progressivamente consolidado em direção à Release 2).*

* **Code Review:** Nenhum código entra na branch `develop` sem passar por revisão. Pull Requests (PRs) exigem a aprovação de pelo menos um outro membro da equipe, garantindo propriedade coletiva do código.
* **Integração Contínua (CI) [Foco R2]:** Planejamento e configuração de pipelines no GitHub Actions para rodar linters (ex: `black`) e testes automatizados a cada novo commit, garantindo a integridade da build.
* **Programação em Par (Pair Programming):** Prática utilizada em tarefas de alta complexidade ou decisões arquiteturais sensíveis (como configuração inicial de infraestrutura) para mitigar gargalos e principalmente compartilhar conhecimento técnico.

## 5. Política de Repositório e Versionamento
O fluxo de versionamento segue o padrão GitFlow simplificado, focado em revisões rápidas:

* `main`: Código em produção (versões estáveis, prontas para release).
* `develop`: Código em integração (ambiente de homologação da equipe).
* `feature/[nome-da-tarefa]`: Branches efêmeras criadas a partir da `develop` para desenvolver novas funcionalidades.
* `fix/[nome-do-bug]`: Branches específicas para correção de erros.
