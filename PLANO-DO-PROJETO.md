# Plano do Projeto — Controle de Concreto das Obras

> Rascunho vivo. Última atualização: 11/10/2026. Planejamento em andamento.

## Em uma frase
Sistema para Christopher Nyl controlar notas de concreto das suas 10 obras, substituir a alimentação de planilhas e acompanhar volumes e comparações.

# 1. Visão Estratégica

## Os problemas
- Hoje: notas controladas em planilhas, preenchidas manualmente.
- Obras: estrutura convencional de concreto armado e alvenaria estrutural.
- Custo em horas e último caso concreto: [AINDA NÃO RESPONDIDO].

## A solução
Registrar obra, data de aplicação, número da nota fiscal, especificações, local de aplicação e volume da nota em m³. Calcular totais diários e acumulados e apresentar dashboards.

## Funcionalidades
- Notas: tela inicial com lista e filtros por obra, período e local.
- Obras e locais: cadastros separados por obra.
- Volume teórico: OPCIONAL. Não bloqueia o lançamento de notas nem os dashboards de volume aplicado.
- Quando houver teórico: comparação entre aplicado e previsto, diferença em m³ e percentual. Ausência de teórico não equivale a zero.
- Proposta ainda em revisão: teórico por obra e local de aplicação; acumulado diário da obra separado do subtotal filtrado.

## Unidade principal
Obra. Existem 10 simultâneas. Cada nota e local pertencem a uma obra; seus dados não se misturam.

## Perfis de usuário
- Christopher: vê todas as obras e lança valores.
- Analista: vê todas as obras e lança valores.
- Cliente: vê todas as 10 obras, usa filtros e dashboards, sem lançar ou alterar valores. Acesso às 10 confirmado pelo usuário.
- Propostas ainda em revisão: somente Christopher exclui notas e gerencia usuários; alterações ficam no histórico; login obrigatório.

## Fluxo de cadastro
[AINDA NÃO RESPONDIDO]

## Ferramentas e custo
[AINDA NÃO RESPONDIDO]

## Prazo
[AINDA NÃO RESPONDIDO]

# 2. Insights do Mercado
[AINDA NÃO RESPONDIDO]

# 3. Arquitetura
[AINDA NÃO RESPONDIDO]

# A conta que vai chegar depois
Nada formalizado nesta etapa.

# Decidir depois de usar
Nada formalizado nesta etapa.

## Atualização — Ensaios de compressão
- Cada nota possui dois resultados aos 7 dias, dois aos 28 dias e dois aos 63 dias, em MPa.
- Campo de observações associado aos ensaios da nota.
- Valores abaixo do esperado recebem destaque individual e texto explicativo.
- Proposta no preview: esperado informado por idade; sem esperado não há comparação e sem resultado aparece aguardando. Não presumir que fck seja o esperado em todas as idades.

## Atualização — Prazos e análise dos ensaios
- Proposta: data prevista = data de aplicação do concreto + 7, 28 ou 63 dias corridos. Confirmar se a referência deve ser a data de moldagem.
- Vence hoje fica em atenção; vencido é data anterior ao dia atual e menos de dois resultados preenchidos. Zero não é ausência.
- Notificações dentro do sistema para idades vencidas e resultados incompletos, consultáveis por todos os perfis. Preenchimento só por Christopher e analista.
- Dashboard: ensaios vencidos, idades abaixo do esperado, idades com dois resultados; pendências por idade e lista detalhada.
- Filtros: obra, idade, situação e resultados abaixo do esperado ou esperado ausente. Uma notificação representa nota + idade, não cada corpo de prova.
- No preview, referência fixa em 11/10/2026 e dados fictícios. Produção usa data atual no horário da obra. E-mail e push ainda não definidos.
