# Roteiro da demonstração (cerca de 5 minutos)

Antes de começar: abra o app no Expo Go **com internet**, para carregar o clima real, e deixe o território **Itaquera** selecionado (é o padrão).

## 1. Contexto (30 s)
"O Radar Territorial é a central de decisões de um gestor público. Ele junta clima real (Open-Meteo) com dados de consumo e de demanda por serviços para **antecipar problemas**. Ele **não decide sozinho**: explica cada alerta e registra a decisão humana."

## 2. Painel (1 min)
- Mostre o território, o resumo de alertas por severidade e as prioridades do dia.
- Mostre os indicadores do dia (variação contra a semana anterior).
- Mostre o clima dos próximos 7 dias, avisando que **vem da API real**, e puxe a tela para baixo para atualizar.
- No gráfico, alterne **Água / Energia / Resíduos**: histórico, projeção tracejada e linha de capacidade.
- Mostre a demanda por serviços e o aviso de que os dados de consumo são sintéticos.

## 3. Alerta explicável (1 min 30 s)
- Toque no **alerta de água** (ícone de gota, crítico).
- Leia a **justificativa** (números calculados), a **confiança** (com a fórmula) e as **limitações**.
- Destaque o banner: *"Apoio à decisão, não decisão automática"*.

## 4. Decisão do gestor e validação (1 min)
- Toque em **Salvar** sem preencher nada para mostrar os erros por campo.
- Escreva um telefone ou CPF na justificativa para mostrar o **bloqueio de dados pessoais** (privacidade).
- Preencha corretamente: Encaminhar ação → escolher a ação → justificativa → cargo → marcar a confirmação → **Salvar**.
- Abra a aba **Registros** e mostre a decisão no histórico (trilha de auditoria).

## 5. Registro de campo (30 s)
- Em Registros → Registros de campo → **Novo registro**. Crie um registro de categoria **Água** em Itaquera.
- Volte ao alerta de água: a confiança subiu, e a justificativa cita o registro de campo.

## 6. Território, acessibilidade e privacidade (30 s)
- Troque para **Santana** (sem alertas críticos) ou para **Parelheiros** (zona rural) e mostre os alertas recalculados.
- Em **Ajustes**, ative **Alto contraste** e **Texto ampliado**.
- Mostre a seção de privacidade (LGPD) e o botão **Apagar dados locais**.
- Feche e reabra o app para mostrar que decisões e preferências **ficaram salvas** (persistência).
