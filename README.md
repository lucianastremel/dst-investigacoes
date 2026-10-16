# DSST 10.2-001 — Registro e Investigação de Ocorrências (aplicativo web)

Formulário online do **Relatório de Registro e Investigação (DSST 10.2-001, Rev. 01)** do Sistema de Gestão Hübner.
Roda no GitHub Pages e grava cada relatório como arquivo JSON (e as fotos como JPG) num repositório do GitHub.

## O que o aplicativo faz

- **Relatório** com todas as seções do modelo: Nº, característica, ocorrência, dados, descrição do fato, fotos, lesões,
  diagrama de causa e efeito (6M), análise de porquês, ações imediatas, plano de ação, responsáveis, parecer e ciência.
- **Descrição guiada** na sequência atividade normal → primeiro desvio → intervenção → evento → mecanismo → consequência,
  com botão para montar o texto do relatório.
- **Ishikawa** com classificação de cada fator: Evidenciado, Provável ou Necessita confirmação.
- **5 Porquês em cadeias paralelas** (A — origem da falha, B — método de intervenção, C — exposição, D — gestão),
  sem obrigar cinco níveis e com classificação de evidência em cada resposta.
- **Checagem metodológica automática** (painel lateral): lesão usada como ponto de partida, cadeia terminando em
  comportamento, hipótese tratada como causa fechada, plano só com DDS/treinamento, falta de ação de engenharia quando
  há falha de equipamento, falta de verificação de eficácia, prazos vencidos e o aviso obrigatório
  *"A descrição revisada alterou a sequência causal…"* quando a descrição muda depois da análise.
  A checagem é um apoio — não substitui a análise do Engenheiro de Segurança.
- **Fotos** reduzidas automaticamente no navegador antes do envio.
- **Assinatura** desenhada na tela (mouse, dedo ou caneta).
- **Gerar PDF** no layout do documento controlado (cabeçalho e rodapé de controle em todas as páginas) — use
  “Salvar como PDF” na janela de impressão.
- **Painel**: ocorrências, ações em aberto/vencidas/concluídas, resultado da checagem e status da verificação de eficácia.
- **Carregar exemplo**: o caso do carrinho da Cura Frio (anonimizado) como referência de **como relatar**.
  Ele não é modelo de causa para outras ocorrências.
- Rascunho guardado automaticamente no navegador até ser salvo.

## Indicadores (aba Painel)

- **Filtros:** ano, filial, característica e busca por texto.
- **Cartões:** ocorrências, com/sem afastamento, dias perdidos + debitados, ações abertas/vencidas/concluídas, eficácia pendente.
- **Taxas NBR 14280 por mês e acumulado do ano:** TF com afastamento, TF sem afastamento e TG.
  Dependem das **horas-homem trabalhadas (HHT)**, lançadas no botão **Lançar HHT** (por filial e mês; ficam gravadas em `dados/hht.json`).
  Mês sem HHT não tem taxa calculada.
- **Gráficos:** ocorrências por mês, característica, filial, local/setor, parte do corpo, natureza da lesão, fatores e categorias do Ishikawa, ações por status e por nível de controle.
- **Exportar para Excel:** abas Ocorrências, Ações, Ishikawa, Porquês, Taxas (com fórmulas), Resumo anual e Leia-me.
- **Filial:** sugerida automaticamente pela matrícula (começa com 03 = Filial 03; começa com 2 = Filial 02; demais = Filial 01). Pode ser alterada manualmente.

## Estrutura dos dados no repositório

```
dados/
  ocorrencias/2026-001.json
  fotos/2026-001/foto-<data>-1.jpg
  hht.json   (horas-homem trabalhadas por filial e mês)
```

Cada salvamento gera um commit — o histórico do Git funciona como trilha de auditoria (quem alterou e quando).

---

## Publicação — passo a passo

> **Importante (LGPD):** os relatórios têm nome, matrícula e dados de lesão (dado de saúde).
> Use **dois repositórios**: um para o aplicativo (pode ser público, para o GitHub Pages gratuito)
> e outro **privado** só para os dados. Nunca grave relatórios no repositório público.

### 1. Repositório de dados (privado)
1. GitHub → **New repository** → nome sugerido `dsst-investigacoes-dados` → **Private** → marque *Add a README* → Create.

### 2. Repositório do aplicativo
1. Crie outro repositório, ex.: `dsst-investigacoes` (público, se a conta for gratuita).
2. Envie todos os arquivos desta pasta (`index.html`, `app.js`, `styles.css`, `config.js`, `.nojekyll`, `worker/`, `README.md`):
   **Add file → Upload files** → arraste os arquivos → Commit.
3. Edite `config.js`: `owner` (seu usuário/organização), `repo` (`dsst-investigacoes-dados`), `branch`, `modo`.
4. **Settings → Pages** → Source: *Deploy from a branch* → Branch `main` / `(root)` → Save.
   Em 1–2 minutos o endereço aparece, ex.: `https://lucianastremel.github.io/dsst-investigacoes/`.

### 3. Escolha o modo de acesso

#### Modo A — `"token"` (mais simples, uso interno do SESMT)
1. GitHub → foto do perfil → **Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token**.
2. *Repository access*: **Only select repositories** → `dsst-investigacoes-dados`.
3. *Permissions → Repository permissions → Contents*: **Read and write**. Defina uma validade.
4. No aplicativo, aba **Configurações** → cole o token → **Testar conexão**.
   O token fica só naquele navegador; cada computador que for gravar precisa informar o seu.

#### Modo B — `"proxy"` (link aberto para líderes preencherem, sem token no navegador)
O token fica num Cloudflare Worker gratuito (`worker/worker.js`).
1. Crie o token do passo A (Contents: Read and write no repositório de dados).
2. Crie uma conta em cloudflare.com → **Workers & Pages → Create → Worker** → cole o conteúdo de `worker/worker.js` → Deploy.
3. No Worker, **Settings → Variables and Secrets**, cadastre:
   | Variável | Tipo | Exemplo |
   |---|---|---|
   | `GITHUB_TOKEN` | Secret | `github_pat_…` |
   | `CHAVE_LEITURA` | Secret | senha do SESMT |
   | `OWNER` | Text | `lucianastremel` |
   | `REPO` | Text | `dsst-investigacoes-dados` |
   | `BRANCH` | Text | `main` |
   | `PASTA` | Text | `dados` |
   | `ORIGEM` | Text | `https://lucianastremel.github.io` |
4. Em `config.js`: `modo: "proxy"` e `proxyUrl` com o endereço do Worker.
5. Resultado: quem tem o link **registra** ocorrências; **abrir relatórios gravados e usar o painel** exige a
   chave de leitura (aba Configurações), que fica só com o SESMT.

### 4. Uso
- **Novo** → preencher → **Gerar** (nº sequencial AAAA-NNN) → **Salvar no GitHub**.
- Para continuar depois: **Painel → Atualizar → Abrir**.
- **Gerar PDF** → destino “Salvar como PDF”, papel A4, marque “Gráficos de plano de fundo”.

## Limites conhecidos
- Fotos ficam com até ~1 MB cada após a redução automática (limite da API do GitHub para leitura).
- O painel lê todos os JSON da pasta; para muitas centenas de relatórios, ficará mais lento.
- Se duas pessoas editarem o mesmo relatório ao mesmo tempo, a segunda receberá aviso para recarregar antes de salvar.
- Token do modo A expira na validade escolhida — gere outro e atualize em Configurações.
