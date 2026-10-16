/* DSST 10.2-001 — Relatório de Registro e Investigação
 * Aplicativo estático (GitHub Pages) com gravação no GitHub (API Contents).
 */
(function () {
  "use strict";
  const CFG0 = window.DSST_CONFIG || {};
  const DOC = CFG0.documento || {};

  // ------------------------------------------------------------------ listas
  const CARACTERISTICAS = ["Incidente", "Ocorrência adversa", "Acidente com afastamento",
    "Acidente sem afastamento", "Acidente de trânsito", "Outros"];

  const ISHIKAWA = {
    "Mão de obra": ["Competência", "Conhecimento, habilidade e/ou atitude", "Sincronismo de atividade (pressa ou demora)",
      "Motivação", "Prudência", "Ato inseguro", "Machucou-se por não usar EPI's",
      "Profissional ficou ausente e não há substituto", "Desobedecer normas"],
    "Máquina": ["Manutenção", "Disponibilidade", "Performance", "Ferramental", "Proteção", "Condição",
      "Não foi planejado o uso de equipamento especial para a atividade", "Inadequado", "Defeito elétrico",
      "Defeito mecânico", "Dispositivo de segurança"],
    "Meio ambiente": ["Temperatura", "Layout", "Barulho", "Intempérie", "Inadequado", "Sinalização inadequada",
      "Ponto cego", "Mal ventilação", "Abafado", "Acesso restrito"],
    "Método": ["Procedimentos", "Instrução de trabalho", "Treinamentos", "Metodologia escolhida inadequada",
      "Sequência de atividade errada"],
    "Matéria-prima": ["Volume", "Mistura", "Toxidade", "Desperdício de material", "Falha ar comprimido",
      "Falta de água", "EPI inadequado", "Armazenamento de forma inadequada", "Peça pontiaguda (rebarbas)"],
    "Medições": ["Inspeção", "Equipamento", "Desenho"]
  };
  const COMPORTAMENTAIS = ["Mão de obra|Ato inseguro", "Mão de obra|Machucou-se por não usar EPI's",
    "Mão de obra|Desobedecer normas", "Mão de obra|Prudência", "Mão de obra|Sincronismo de atividade (pressa ou demora)"];

  const EVID = [["", "—"], ["evidenciado", "Evidenciado"], ["provavel", "Provável"], ["confirmar", "Necessita confirmação"]];
  const EVID_TXT = { evidenciado: "Evidenciado", provavel: "Provável", confirmar: "Necessita confirmação" };
  const EVID_SIG = { evidenciado: "E", provavel: "P", confirmar: "H" };

  const TIPOS_CADEIA = ["Origem da falha (equipamento/processo)", "Método de intervenção",
    "Exposição do trabalhador", "Gestão/organização", "Outra"];

  const STATUS = ["Sem Planejamento", "Planejado", "Ações Iniciais", "Ações em Andamento", "Concluído"];
  const HIERARQUIA = ["Eliminação", "Substituição", "Engenharia/proteção coletiva", "Administrativo", "EPI",
    "Verificação de eficácia"];

  const PARTES = ["Cabeça", "Olhos", "Face", "Pescoço", "Tórax/abdome", "Costas/coluna", "Ombro", "Braço",
    "Cotovelo", "Antebraço", "Punho", "Mão", "Dedos da mão", "Quadril", "Coxa", "Joelho", "Perna",
    "Tornozelo", "Pé", "Dedos do pé"];
  const NATUREZAS = ["Corte", "Contusão", "Escoriação", "Prensamento/esmagamento", "Fratura", "Entorse/distensão",
    "Queimadura", "Corpo estranho", "Amputação", "Sem lesão", "Outra"];

  // ------------------------------------------------------------------ util
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const esc = (v) => String(v == null ? "" : v).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const nl2br = (v) => esc(v).replace(/\n/g, "<br>");
  const hoje = () => new Date().toISOString().slice(0, 10);
  const dataBR = (iso) => { if (!iso) return ""; const [a, m, d] = iso.split("-"); return d ? `${d}/${m}/${a}` : iso; };
  const uid = () => Math.random().toString(36).slice(2, 9);
  const clone = (o) => JSON.parse(JSON.stringify(o));

  function getPath(obj, path) { return path.split(".").reduce((o, k) => (o == null ? undefined : o[k]), obj); }
  function setPath(obj, path, val) {
    const ks = path.split("."); let o = obj;
    ks.slice(0, -1).forEach((k) => { if (o[k] == null) o[k] = {}; o = o[k]; });
    o[ks[ks.length - 1]] = val;
  }
  function hash(str) { let h = 5381; for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0; return (h >>> 0).toString(36); }

  function toast(msg, tipo = "") {
    const t = $("#toast"); t.textContent = msg; t.className = "on " + tipo;
    clearTimeout(t._t); t._t = setTimeout(() => (t.className = ""), 4200);
  }

  // ------------------------------------------------------------------ modelo
  function novoRelatorio() {
    return {
      versao: 1,
      numero: "",
      caracteristica: "",
      caracteristicaOutros: "",
      ocorrencia: "",
      dados: { nome: "", matricula: "", funcao: "", local: "", lider: "", data: "", hora: "", reincidente: "" },
      relato: { atividade: "", primeiroDesvio: "", intervencoes: "", evento: "", mecanismo: "", consequencia: "" },
      descricao: "",
      fotos: [],
      lesoes: { partes: [], lado: "", natureza: "", obs: "" },
      ishikawa: { itens: {}, outros: {}, efeito: "" },
      cadeias: [
        { id: uid(), tipo: TIPOS_CADEIA[0], causa: "", porques: [{ resposta: "", status: "" }], causaRaiz: "" }
      ],
      classificacao: { condicaoNormal: "", perigo: "", causaImediata: "", contribuintes: "", falhaControle: "", causaRaiz: "", statusCausaRaiz: "" },
      acoesImediatas: [{ oque: "", quem: "", quando: "", status: "" }],
      plano: [{ oque: "", quem: "", quando: "", status: "Planejado", causa: "", hierarquia: "" }],
      responsaveis: [
        { data: "", funcao: "Acidentado / envolvido", nome: "", assinatura: "" },
        { data: "", funcao: "Técnico de Segurança do Trabalho", nome: "", assinatura: "" },
        { data: "", funcao: "Líder", nome: "", assinatura: "" },
        { data: "", funcao: "Engenheiro de Segurança do Trabalho", nome: (CFG0.padrao || {}).engenheiro || "", assinatura: "" }
      ],
      parecer: { texto: "", data: "", funcao: "Engenheiro de Segurança do Trabalho", nome: (CFG0.padrao || {}).engenheiro || "", assinatura: "", eficaz: "" },
      ciencia: ((CFG0.padrao || {}).ciencia || []).map((c) => ({ data: "", funcao: c.funcao, nome: c.nome, assinatura: "" })),
      meta: { criadoEm: new Date().toISOString(), atualizadoEm: "", hashAnalise: "", sha: "" }
    };
  }

  let inv = novoRelatorio();
  let sujo = false;

  const hashDescricao = () => hash(JSON.stringify([inv.relato, inv.descricao]));

  // ------------------------------------------------------------------ campos
  const campo = (rot, path, extra = "") =>
    `<label>${rot}<input data-bind="${path}" value="${esc(getPath(inv, path))}" ${extra}></label>`;
  const area = (rot, path, ph = "", rows = 3) =>
    `<label>${rot}<textarea data-bind="${path}" rows="${rows}" placeholder="${esc(ph)}">${esc(getPath(inv, path))}</textarea></label>`;
  const select = (rot, path, opcoes, extra = "") => {
    const v = getPath(inv, path) || "";
    const ops = opcoes.map((o) => Array.isArray(o) ? o : [o, o])
      .map(([val, txt]) => `<option value="${esc(val)}" ${val === v ? "selected" : ""}>${esc(txt)}</option>`).join("");
    return `<label>${rot}<select data-bind="${path}" ${extra}>${ops}</select></label>`;
  };
  const selectSemRotulo = (path, opcoes, cls = "") => {
    const v = getPath(inv, path) || "";
    return `<select class="${cls}" data-bind="${path}">` + opcoes.map((o) => Array.isArray(o) ? o : [o, o])
      .map(([val, txt]) => `<option value="${esc(val)}" ${val === v ? "selected" : ""}>${esc(txt)}</option>`).join("") + `</select>`;
  };
  const cel = (path, tipo = "text", ph = "") =>
    `<input type="${tipo}" data-bind="${path}" value="${esc(getPath(inv, path))}" placeholder="${esc(ph)}">`;
  const celArea = (path, ph = "", rows = 2) =>
    `<textarea data-bind="${path}" rows="${rows}" placeholder="${esc(ph)}">${esc(getPath(inv, path))}</textarea>`;

  function secao(id, num, titulo, corpo, ajuda = "") {
    return `<section class="cartao" id="${id}"><h2><span class="num">${num}</span>${titulo}</h2>
      ${ajuda ? `<p class="ajuda">${ajuda}</p>` : ""}${corpo}</section>`;
  }

  // ------------------------------------------------------------------ render
  function render() {
    const s = [];
    s.push(secao("s-identificacao", "1", "Identificação da ocorrência", `
      <div class="grade g3">
        <label>Nº ocorrência
          <span class="com-botao"><input data-bind="numero" value="${esc(inv.numero)}" placeholder="ex.: 2026-001">
          <button class="btn mini" data-acao="gerar-numero" type="button">Gerar</button></span></label>
        ${campo("Ocorrência (título curto)", "ocorrencia", 'placeholder="ex.: Prensamento do dedo mínimo da mão direita"')}
      </div>
      <fieldset class="radios"><legend>Característica da situação adversa</legend>
        ${CARACTERISTICAS.map((c) => `<label class="chip"><input type="radio" name="carac" data-bind="caracteristica" value="${esc(c)}" ${inv.caracteristica === c ? "checked" : ""}>${esc(c)}</label>`).join("")}
        ${inv.caracteristica === "Outros" ? `<input class="inline" data-bind="caracteristicaOutros" value="${esc(inv.caracteristicaOutros)}" placeholder="Especifique">` : ""}
      </fieldset>`));

    s.push(secao("s-dados", "2", "Dados da ocorrência", `
      <div class="grade g3">
        ${campo("Nome", "dados.nome")}
        ${campo("Matrícula", "dados.matricula")}
        ${campo("Função", "dados.funcao")}
        ${campo("Local", "dados.local")}
        ${campo("Líder", "dados.lider")}
        <div class="grade g2 sem-margem">
          ${campo("Data", "dados.data", 'type="date"')}
          ${campo("Hora", "dados.hora", 'type="time"')}
        </div>
      </div>
      <fieldset class="radios"><legend>Reincidente</legend>
        ${["Sim", "Não"].map((c) => `<label class="chip"><input type="radio" name="reinc" data-bind="dados.reincidente" value="${c}" ${inv.dados.reincidente === c ? "checked" : ""}>${c}</label>`).join("")}
      </fieldset>`));

    s.push(secao("s-descricao", "3", "Descrição do fato", `
      <div class="sequencia">
        ${area("① Atividade / condição normal", "relato.atividade", "O que estava sendo feito e como a atividade normalmente acontece.", 2)}
        ${area("② Primeiro desvio", "relato.primeiroDesvio", "Primeira condição anormal que mudou a operação (travamento, enrosco, falha, retirada de proteção…).", 2)}
        ${area("③ Intervenções realizadas", "relato.intervencoes", "O que foi feito para corrigir o desvio, por quem, com quais recursos, se houve atuação simultânea ou improviso.", 3)}
        ${area("④ Evento", "relato.evento", "Ocorrência física que desencadeou o acidente (ex.: carrinho liberou e deslocou-se de forma repentina).", 2)}
        ${area("⑤ Mecanismo de contato", "relato.mecanismo", "Como ocorreu o contato/prensamento/impacto/exposição.", 2)}
        ${area("⑥ Consequência", "relato.consequencia", "Lesão, dano ou resultado.", 2)}
      </div>
      <div class="linha-botoes"><button class="btn" type="button" data-acao="montar-descricao">Montar descrição a partir da sequência</button></div>
      ${area("Descrição do fato (texto que vai para o relatório)", "descricao", "Relato objetivo, cronológico e técnico.", 7)}
      <div id="aviso-revalidacao"></div>`,
      "Siga a lógica: atividade normal → primeiro desvio → intervenção → evento → mecanismo → consequência. Escreva fatos; marque como hipótese o que não foi confirmado."));

    s.push(secao("s-fotos", "4", "Fotos", `
      <div class="fotos">
        ${inv.fotos.map((f, i) => `
          <figure class="foto">
            <div class="img">${f.dataUrl ? `<img src="${f.dataUrl}" alt="">` : `<span class="carregando" data-foto="${i}">carregando…</span>`}</div>
            <input data-bind="fotos.${i}.legenda" value="${esc(f.legenda)}" placeholder="Legenda (ex.: *Simulação do ocorrido)">
            <button class="btn mini perigo" type="button" data-acao="rem-foto" data-i="${i}">Remover</button>
          </figure>`).join("")}
        <label class="foto adicionar"><input type="file" accept="image/*" multiple id="inp-fotos" hidden>
          <span>+ Adicionar fotos</span><small>reduzidas automaticamente</small></label>
      </div>`));

    s.push(secao("s-lesoes", "5", "Lesões no corpo humano", `
      <fieldset class="radios partes"><legend>Parte(s) atingida(s)</legend>
        ${PARTES.map((p) => `<label class="chip"><input type="checkbox" data-parte="${esc(p)}" ${inv.lesoes.partes.includes(p) ? "checked" : ""}>${esc(p)}</label>`).join("")}
      </fieldset>
      <div class="grade g3">
        ${select("Lado", "lesoes.lado", ["", "Direito", "Esquerdo", "Ambos", "Não se aplica"])}
        ${select("Natureza da lesão", "lesoes.natureza", [""].concat(NATUREZAS))}
        ${campo("Observação", "lesoes.obs", 'placeholder="ex.: dedo mínimo da mão direita"')}
      </div>`));

    s.push(secao("s-ishikawa", "6", "Diagrama de causa e efeito", `
      <div class="ishikawa">
        ${Object.entries(ISHIKAWA).map(([cat, itens]) => `
          <div class="cat"><h4>${esc(cat)}</h4>
            ${itens.map((it) => {
              const k = `${cat}|${it}`; const v = inv.ishikawa.itens[k] || "";
              return `<div class="item ${v ? "marcado " + v : ""}"><span>${esc(it)}</span>
                <select data-ishi="${esc(k)}">${EVID.map(([val, t]) => `<option value="${val}" ${val === v ? "selected" : ""}>${t}</option>`).join("")}</select></div>`;
            }).join("")}
            <input class="outro" data-bind="ishikawa.outros.${cat}" value="${esc(inv.ishikawa.outros[cat] || "")}" placeholder="Outro fator (descreva e indique a evidência)">
          </div>`).join("")}
      </div>
      ${area("Efeito", "ishikawa.efeito", "ex.: Prensamento com corte no dedo mínimo da mão direita durante o destravamento do carrinho", 2)}`,
      "Para cada fator marcado, classifique: Evidenciado, Provável ou Necessita confirmação. Não use “Mão de obra” para atribuir culpa — aprofunde por que a condição foi possível."));

    s.push(secao("s-porques", "7", "Análise de porquê das possíveis causas", `
      ${inv.cadeias.map((c, ci) => `
        <div class="cadeia">
          <div class="cadeia-topo">
            <span class="letra">${String.fromCharCode(65 + ci)}</span>
            ${selectSemRotulo(`cadeias.${ci}.tipo`, TIPOS_CADEIA, "tipo")}
            <button class="btn mini perigo" type="button" data-acao="rem-cadeia" data-i="${ci}">Remover cadeia</button>
          </div>
          <label>Ponto de partida (primeiro desvio ou falha de controle — nunca a lesão)
            ${celArea(`cadeias.${ci}.causa`, "ex.: Máquina: carrinho travou/enroscou na estrutura do rolouver durante o deslocamento", 2)}</label>
          <ol class="porques">
            ${c.porques.map((p, pi) => `
              <li><span class="pq">${pi + 1}º Por quê</span>
                ${celArea(`cadeias.${ci}.porques.${pi}.resposta`, pi === 0 ? "Por que o ponto de partida aconteceu?" : "Por que a resposta anterior aconteceu / foi possível?", 2)}
                ${selectSemRotulo(`cadeias.${ci}.porques.${pi}.status`, EVID, "status")}
                <button class="btn mini" type="button" data-acao="rem-porque" data-ci="${ci}" data-pi="${pi}" title="Remover">✕</button>
              </li>`).join("")}
          </ol>
          <div class="linha-botoes"><button class="btn mini" type="button" data-acao="add-porque" data-ci="${ci}">+ Por quê</button></div>
          <label>Causa encontrada nesta cadeia ${celArea(`cadeias.${ci}.causaRaiz`, "Falha de processo/projeto/procedimento/gestão sustentada por evidência. Se faltar evidência, escreva o que precisa ser confirmado.", 2)}</label>
        </div>`).join("")}
      <div class="linha-botoes"><button class="btn" type="button" data-acao="add-cadeia">+ Nova cadeia</button></div>`,
      "Use cadeias separadas para causas independentes (A — origem da falha, B — método de intervenção, C — exposição, D — gestão). Não é obrigatório chegar a cinco: pare quando faltar evidência."));

    s.push(secao("s-classificacao", "8", "Classificação das causas", `
      <div class="grade g2">
        ${area("Condição normal", "classificacao.condicaoNormal", "", 2)}
        ${area("Perigo / condição", "classificacao.perigo", "", 2)}
        ${area("Causa imediata", "classificacao.causaImediata", "Fator diretamente relacionado ao evento.", 2)}
        ${area("Causas contribuintes", "classificacao.contribuintes", "Fatores que aumentaram a probabilidade ou a gravidade.", 2)}
        ${area("Falha de controle", "classificacao.falhaControle", "Barreira ausente, inadequada ou ineficaz.", 2)}
        ${area("Causa raiz", "classificacao.causaRaiz", "Falha fundamental de processo, projeto, procedimento, supervisão ou gestão.", 2)}
      </div>
      ${select("Situação da causa raiz", "classificacao.statusCausaRaiz", [["", "—"], ["fechada", "Fechada com evidência"], ["confirmar", "Necessita confirmação"]])}`));

    s.push(secao("s-imediatas", "9", "Ações imediatas", tabelaAcoes("acoesImediatas", false)));
    s.push(secao("s-plano", "10", "Plano de ação", tabelaAcoes("plano", true) +
      `<div class="legenda">${STATUS.map((st) => `<span class="st st-${slug(st)}">${st}</span>`).join("")}</div>`,
      "Indique qual causa cada ação trata e o nível na hierarquia de controle. DDS e treinamento são complementares — não substituem ações sobre equipamento, método ou procedimento."));

    s.push(secao("s-responsaveis", "11", "Responsáveis pela investigação", tabelaPessoas("responsaveis", true)));

    s.push(secao("s-parecer", "12", "Parecer, aprovação e ciência", `
      <h4 class="sub">Parecer e aprovação (verificação da eficácia das ações)</h4>
      ${select("Resultado da verificação", "parecer.eficaz", [["", "—"], ["eficaz", "Ações eficazes"], ["parcial", "Parcialmente eficazes"], ["ineficaz", "Não eficazes — reabrir"]])}
      ${area("Parecer", "parecer.texto", "", 3)}
      <table class="tabela"><thead><tr><th>Data</th><th>Função</th><th>Nome</th><th>Assinatura</th></tr></thead>
        <tbody><tr><td>${cel("parecer.data", "date")}</td><td>${cel("parecer.funcao")}</td><td>${cel("parecer.nome")}</td>
        <td>${assinaturaCel("parecer")}</td></tr></tbody></table>
      <h4 class="sub">Ciência do ocorrido</h4>
      ${tabelaPessoas("ciencia", true)}`));

    $("#form-secoes").innerHTML = s.join("");
    atualizarCabecalho();
    checar();
    carregarFotosPendentes();
  }

  function slug(t) { return t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-"); }

  function tabelaAcoes(chave, completo) {
    const linhas = inv[chave];
    const opcCausa = [["", "—"]].concat(inv.cadeias.map((c, i) => [`Cadeia ${String.fromCharCode(65 + i)}`, `Cadeia ${String.fromCharCode(65 + i)} — ${c.tipo}`]),
      [["Primeiro desvio", "Primeiro desvio"], ["Causa imediata", "Causa imediata"], ["Causa contribuinte", "Causa contribuinte"],
        ["Falha de controle", "Falha de controle"], ["Causa raiz", "Causa raiz"], ["Verificação", "Verificação de eficácia"]]);
    return `<div class="rolagem"><table class="tabela acoes"><thead><tr><th class="c-n">Item</th><th>O quê?</th><th>Quem?</th><th>Quando?</th><th>Status</th>
      ${completo ? "<th>Causa tratada</th><th>Hierarquia</th>" : ""}<th></th></tr></thead><tbody>
      ${linhas.map((a, i) => `<tr>
        <td class="c-n">${i + 1}</td>
        <td>${celArea(`${chave}.${i}.oque`, "", 2)}</td>
        <td>${cel(`${chave}.${i}.quem`)}</td>
        <td>${cel(`${chave}.${i}.quando`, "date")}</td>
        <td>${selectSemRotulo(`${chave}.${i}.status`, [""].concat(STATUS), "st-sel st-" + slug(a.status || "x"))}</td>
        ${completo ? `<td>${selectSemRotulo(`${chave}.${i}.causa`, opcCausa)}</td><td>${selectSemRotulo(`${chave}.${i}.hierarquia`, [""].concat(HIERARQUIA))}</td>` : ""}
        <td><button class="btn mini" type="button" data-acao="rem-linha" data-chave="${chave}" data-i="${i}" title="Remover">✕</button></td>
      </tr>`).join("")}
      </tbody></table></div>
      <div class="linha-botoes"><button class="btn mini" type="button" data-acao="add-linha" data-chave="${chave}">+ Ação</button></div>`;
  }

  function tabelaPessoas(chave) {
    return `<div class="rolagem"><table class="tabela"><thead><tr><th>Data</th><th>Função</th><th>Nome</th><th>Assinatura</th><th></th></tr></thead><tbody>
      ${inv[chave].map((p, i) => `<tr>
        <td>${cel(`${chave}.${i}.data`, "date")}</td><td>${cel(`${chave}.${i}.funcao`)}</td><td>${cel(`${chave}.${i}.nome`)}</td>
        <td>${assinaturaCel(`${chave}.${i}`)}</td>
        <td><button class="btn mini" type="button" data-acao="rem-linha" data-chave="${chave}" data-i="${i}" title="Remover">✕</button></td></tr>`).join("")}
      </tbody></table></div>
      <div class="linha-botoes"><button class="btn mini" type="button" data-acao="add-pessoa" data-chave="${chave}">+ Pessoa</button></div>`;
  }

  function assinaturaCel(path) {
    const a = getPath(inv, path + ".assinatura");
    return a ? `<div class="assinatura"><img src="${a}" alt="assinatura"><button class="btn mini" type="button" data-acao="limpar-ass" data-path="${path}">✕</button></div>`
      : `<button class="btn mini" type="button" data-acao="assinar" data-path="${path}">Assinar</button>`;
  }

  function atualizarCabecalho() {
    $("#lbl-numero").textContent = inv.numero ? `Nº ${inv.numero}` : "Novo relatório";
    $("#lbl-estado").textContent = inv.meta.sha ? (sujo ? "alterações não salvas" : "salvo no GitHub") : (sujo ? "rascunho local" : "");
    $("#lbl-estado").className = "estado " + (sujo ? "sujo" : "ok");
  }

  // ------------------------------------------------------------------ eventos do formulário
  function marcarSujo() { sujo = true; inv.meta.atualizadoEm = new Date().toISOString(); atualizarCabecalho(); salvarRascunho(); agendarChecagem(); }

  let tChk;
  function agendarChecagem() { clearTimeout(tChk); tChk = setTimeout(checar, 350); }

  function ligarFormulario() {
    const raiz = $("#form-secoes");
    raiz.addEventListener("input", (e) => {
      const el = e.target;
      if (el.dataset.bind) {
        if (el.type === "radio" && !el.checked) return;
        setPath(inv, el.dataset.bind, el.value);
        marcarSujo();
      }
    });
    raiz.addEventListener("change", (e) => {
      const el = e.target;
      if (el.dataset.ishi !== undefined) {
        if (el.value) inv.ishikawa.itens[el.dataset.ishi] = el.value; else delete inv.ishikawa.itens[el.dataset.ishi];
        el.closest(".item").className = "item " + (el.value ? "marcado " + el.value : "");
        marcarSujo();
      } else if (el.dataset.parte) {
        const p = el.dataset.parte; const set = new Set(inv.lesoes.partes);
        el.checked ? set.add(p) : set.delete(p);
        inv.lesoes.partes = PARTES.filter((x) => set.has(x)); marcarSujo();
      } else if (el.id === "inp-fotos") {
        adicionarFotos(el.files);
      } else if (el.dataset.bind === "caracteristica" || /\.tipo$/.test(el.dataset.bind || "")) {
        render();
      } else if (/\.status$/.test(el.dataset.bind || "") && el.classList.contains("st-sel")) {
        el.className = "st-sel st-" + slug(el.value || "x");
      }
    });
    raiz.addEventListener("click", (e) => {
      const b = e.target.closest("[data-acao]"); if (!b) return;
      const a = b.dataset.acao; const d = b.dataset;
      if (a === "add-cadeia") inv.cadeias.push({ id: uid(), tipo: TIPOS_CADEIA[Math.min(inv.cadeias.length, 3)], causa: "", porques: [{ resposta: "", status: "" }], causaRaiz: "" });
      else if (a === "rem-cadeia") { if (!confirm("Remover esta cadeia?")) return; inv.cadeias.splice(+d.i, 1); }
      else if (a === "add-porque") inv.cadeias[+d.ci].porques.push({ resposta: "", status: "" });
      else if (a === "rem-porque") inv.cadeias[+d.ci].porques.splice(+d.pi, 1);
      else if (a === "add-linha") inv[d.chave].push(d.chave === "plano" ? { oque: "", quem: "", quando: "", status: "Planejado", causa: "", hierarquia: "" } : { oque: "", quem: "", quando: "", status: "" });
      else if (a === "rem-linha") inv[d.chave].splice(+d.i, 1);
      else if (a === "add-pessoa") inv[d.chave].push({ data: "", funcao: "", nome: "", assinatura: "" });
      else if (a === "rem-foto") inv.fotos.splice(+d.i, 1);
      else if (a === "assinar") return abrirAssinatura(d.path);
      else if (a === "limpar-ass") setPath(inv, d.path + ".assinatura", "");
      else if (a === "montar-descricao") { montarDescricao(); }
      else if (a === "gerar-numero") return gerarNumero();
      else if (a === "revalidar") { inv.meta.hashAnalise = hashDescricao(); }
      else return;
      marcarSujo(); render();
    });
  }

  function montarDescricao() {
    const r = inv.relato;
    const partes = [r.atividade, r.primeiroDesvio, r.intervencoes, r.evento, r.mecanismo, r.consequencia]
      .map((t) => (t || "").trim()).filter(Boolean).map((t) => /[.!?]$/.test(t) ? t : t + ".");
    if (!partes.length) return toast("Preencha a sequência ①–⑥ primeiro.", "erro");
    if (inv.descricao.trim() && !confirm("Substituir a descrição atual pelo texto montado a partir da sequência?")) return;
    inv.descricao = partes.join(" ");
  }

  // ------------------------------------------------------------------ fotos
  function adicionarFotos(files) {
    const lista = Array.from(files || []);
    Promise.all(lista.map(reduzirImagem)).then((urls) => {
      urls.forEach((u) => inv.fotos.push({ path: "", legenda: "", dataUrl: u }));
      marcarSujo(); render();
    }).catch(() => toast("Não foi possível ler a imagem.", "erro"));
  }
  function reduzirImagem(file) {
    return new Promise((ok, falha) => {
      const fr = new FileReader();
      fr.onerror = falha;
      fr.onload = () => {
        const img = new Image();
        img.onerror = falha;
        img.onload = () => {
          const max = 1400; let { width: w, height: h } = img;
          if (w > max || h > max) { const k = max / Math.max(w, h); w = Math.round(w * k); h = Math.round(h * k); }
          const c = document.createElement("canvas"); c.width = w; c.height = h;
          c.getContext("2d").drawImage(img, 0, 0, w, h);
          ok(c.toDataURL("image/jpeg", 0.78));
        };
        img.src = fr.result;
      };
      fr.readAsDataURL(file);
    });
  }
  function carregarFotosPendentes() {
    inv.fotos.forEach((f, i) => {
      if (f.dataUrl || !f.path || f._carregando) return;
      f._carregando = true;
      Store.lerBinario(f.path).then((b64) => {
        f.dataUrl = "data:image/jpeg;base64," + b64; delete f._carregando;
        const span = $(`[data-foto="${i}"]`); if (span) span.outerHTML = `<img src="${f.dataUrl}" alt="">`;
      }).catch(() => { const span = $(`[data-foto="${i}"]`); if (span) span.textContent = "foto indisponível (sem acesso de leitura)"; delete f._carregando; });
    });
  }

  // ------------------------------------------------------------------ assinatura
  let assPath = null;
  function abrirAssinatura(path) {
    assPath = path;
    const p = getPath(inv, path) || {};
    $("#assinatura-quem").textContent = [p.nome, p.funcao].filter(Boolean).join(" — ") || "Assine no quadro abaixo";
    const cv = $("#canvas-assinatura"); const ctx = cv.getContext("2d"); ctx.clearRect(0, 0, cv.width, cv.height);
    $("#dlg-assinatura").showModal();
  }
  function ligarAssinatura() {
    const cv = $("#canvas-assinatura"); const ctx = cv.getContext("2d");
    let desenhando = false;
    const pos = (e) => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * cv.width / r.width, (e.clientY - r.top) * cv.height / r.height]; };
    cv.addEventListener("pointerdown", (e) => { desenhando = true; cv.setPointerCapture(e.pointerId); ctx.beginPath(); ctx.moveTo(...pos(e)); });
    cv.addEventListener("pointermove", (e) => { if (!desenhando) return; ctx.lineWidth = 2.4; ctx.lineCap = "round"; ctx.strokeStyle = "#0b2340"; ctx.lineTo(...pos(e)); ctx.stroke(); });
    cv.addEventListener("pointerup", () => (desenhando = false));
    $("#btn-ass-limpar").onclick = () => ctx.clearRect(0, 0, cv.width, cv.height);
    $("#btn-ass-cancelar").onclick = () => $("#dlg-assinatura").close();
    $("#btn-ass-ok").onclick = () => {
      setPath(inv, assPath + ".assinatura", cv.toDataURL("image/png"));
      $("#dlg-assinatura").close(); marcarSujo(); render();
    };
  }

  // ------------------------------------------------------------------ checagem metodológica
  const RX_CONSEQ = /\b(dedo|dedos|m[aã]o|bra[cç]o|p[eé]|olho|corte|cortou|les[aã]o|lesionou|ferimento|feriu|machuc|fratur|contus|sangr|prensou|prensado|prensamento|esmag|amput|queimad)/i;
  const RX_COMPORT = /\b(falta de aten[cç][aã]o|desaten|descuido|imprud|ato inseguro|falha humana|pressa|n[aã]o (prestou|observou|olhou|tomou cuidado|seguiu|utilizou|usou)|colocou a m[aã]o|distra[ií]|neglig|sem cuidado|descumpri)/i;
  const RX_ADMIN = /\b(dds|treinamento|treinar|orienta|conscientiza|reciclagem|refor[cç]ar|aten[cç][aã]o|cuidado|advert|cobran|divulga[cç])/i;
  const RX_VERIF = /\b(efic[aá]cia|verificar|verifica[cç][aã]o|acompanha|auditoria)/i;

  function regras() {
    const out = []; const add = (nivel, secao, msg) => out.push({ nivel, secao, msg });
    const r = inv.relato; const desc = (inv.descricao || "").trim();

    // Descrição
    if (!desc) add("erro", "s-descricao", "Descrição do fato vazia.");
    else if (desc.length < 250) add("alerta", "s-descricao", "Descrição curta: verifique se ela mostra a sequência atividade → desvio → intervenção → evento → mecanismo → consequência.");
    const faltam = [["atividade", "atividade normal"], ["primeiroDesvio", "primeiro desvio"], ["evento", "evento"], ["mecanismo", "mecanismo"], ["consequencia", "consequência"]]
      .filter(([k]) => !(r[k] || "").trim()).map(([, t]) => t);
    if (faltam.length) add(faltam.includes("primeiro desvio") ? "erro" : "alerta", "s-descricao", "Sequência incompleta: falta " + faltam.join(", ") + ".");
    if (r.primeiroDesvio && RX_CONSEQ.test(r.primeiroDesvio) && !/trav|enrosc|falh|quebr|deslig|desvi/i.test(r.primeiroDesvio))
      add("alerta", "s-descricao", "O primeiro desvio parece descrever a lesão. Ele deve ser a anormalidade que mudou a operação (ex.: travamento).");
    if (RX_COMPORT.test(desc)) add("alerta", "s-descricao", "A descrição contém julgamento de comportamento (ex.: falta de atenção, pressa). Descreva fatos; o porquê vai na análise.");

    // Revalidação
    const temAnalise = inv.cadeias.some((c) => c.porques.some((p) => (p.resposta || "").trim())) || Object.keys(inv.ishikawa.itens).length;
    if (temAnalise && inv.meta.hashAnalise && inv.meta.hashAnalise !== hashDescricao())
      add("erro", "s-descricao", "A descrição revisada alterou a sequência causal e, portanto, a análise de causas anterior precisa ser revisada.");

    // Ishikawa
    const marc = Object.keys(inv.ishikawa.itens);
    if (!marc.length) add("alerta", "s-ishikawa", "Nenhum fator marcado no diagrama de causa e efeito.");
    const comp = marc.filter((k) => COMPORTAMENTAIS.includes(k));
    if (comp.length) add("alerta", "s-ishikawa", `Fator comportamental marcado (${comp.map((k) => k.split("|")[1]).join("; ")}). Pergunte: por que o sistema permitiu essa condição?`);
    if (comp.length && comp.length === marc.length) add("erro", "s-ishikawa", "Todos os fatores marcados são comportamentais — investigação limitada ao trabalhador.");
    const hip = marc.filter((k) => inv.ishikawa.itens[k] === "confirmar").length;
    if (hip) add("info", "s-ishikawa", `${hip} fator(es) como hipótese — precisam de confirmação antes de fechar a causa raiz.`);
    if (!(inv.ishikawa.efeito || "").trim()) add("alerta", "s-ishikawa", "Campo “Efeito” vazio.");
    const temMaquina = marc.some((k) => k.startsWith("Máquina|"));
    const temMetodo = marc.some((k) => k.startsWith("Método|"));

    // 5 porquês
    const cads = inv.cadeias.filter((c) => (c.causa || "").trim() || c.porques.some((p) => (p.resposta || "").trim()));
    if (!cads.length) add("erro", "s-porques", "Nenhuma cadeia de porquês preenchida.");
    cads.forEach((c) => {
      const L = "Cadeia " + String.fromCharCode(65 + inv.cadeias.indexOf(c));
      const resp = c.porques.map((p) => (p.resposta || "").trim()).filter(Boolean);
      if (RX_CONSEQ.test(c.causa || "") && !/trav|enrosc|falh|m[aá]quina|m[eé]todo|procediment/i.test(c.causa))
        add("erro", "s-porques", `${L}: o ponto de partida parece ser a lesão/consequência. Comece pelo primeiro desvio ou pela falha de controle.`);
      if (resp[0] && RX_CONSEQ.test(resp[0])) add("alerta", "s-porques", `${L}: o 1º porquê volta ao mecanismo ou à lesão — ele precisa explicar por que o ponto de partida aconteceu.`);
      const ult = resp[resp.length - 1] || "";
      if (ult && RX_COMPORT.test(ult)) add("erro", "s-porques", `${L}: a cadeia termina em comportamento. Continue: por que o sistema permitiu essa condição?`);
      const semStatus = c.porques.filter((p) => (p.resposta || "").trim() && !p.status).length;
      if (semStatus) add("alerta", "s-porques", `${L}: ${semStatus} resposta(s) sem classificação de evidência.`);
      const conf = c.porques.filter((p) => p.status === "confirmar").length;
      if (conf && !/confirm/i.test(c.causaRaiz || "")) add("alerta", "s-porques", `${L}: há porquês que necessitam confirmação — a causa da cadeia não deve ser apresentada como fechada.`);
      if (!(c.causaRaiz || "").trim()) add("alerta", "s-porques", `${L}: causa encontrada não informada.`);
      if (c.porques.length > resp.length) add("info", "s-porques", `${L}: há porquês em branco — remova-os se não houver evidência para continuar.`);
    });
    if (temMaquina && !cads.some((c) => /origem/i.test(c.tipo))) add("alerta", "s-porques", "Há fatores de máquina marcados, mas nenhuma cadeia investiga a origem da falha do equipamento.");
    if (temMetodo && !cads.some((c) => /m[eé]todo/i.test(c.tipo))) add("alerta", "s-porques", "Há fatores de método marcados, mas nenhuma cadeia investiga o método de intervenção.");
    if (/interven|destrav|improvis|barra|for[cç]ar/i.test(r.intervencoes + " " + desc) && !cads.some((c) => /m[eé]todo/i.test(c.tipo)))
      add("alerta", "s-porques", "Houve intervenção excepcional (destravamento/improviso) — crie uma cadeia específica para o método de intervenção.");

    // Classificação
    const cl = inv.classificacao;
    if (!(cl.causaRaiz || "").trim()) add("alerta", "s-classificacao", "Causa raiz não registrada na classificação.");
    else if (RX_COMPORT.test(cl.causaRaiz)) add("erro", "s-classificacao", "A causa raiz está descrita como comportamento — aprofunde até uma falha de processo, projeto, procedimento ou gestão.");
    if (cl.statusCausaRaiz === "fechada" && (hip || inv.cadeias.some((c) => c.porques.some((p) => p.status === "confirmar"))))
      add("erro", "s-classificacao", "Causa raiz marcada como fechada, mas ainda há hipóteses a confirmar no Ishikawa ou nos porquês.");
    if (!(cl.falhaControle || "").trim()) add("info", "s-classificacao", "Falha de controle não registrada.");

    // Plano
    const plano = inv.plano.filter((a) => (a.oque || "").trim());
    if (!plano.length) add("erro", "s-plano", "Plano de ação vazio.");
    plano.forEach((a, i) => {
      const L = `Ação ${inv.plano.indexOf(a) + 1}`;
      if (!a.quem || !a.quando) add("alerta", "s-plano", `${L}: sem responsável ou prazo.`);
      if (!a.causa) add("info", "s-plano", `${L}: não indica qual causa trata.`);
      if (!a.hierarquia) add("info", "s-plano", `${L}: nível de controle não informado.`);
      if (a.quando && a.quando < hoje() && a.status !== "Concluído") add("alerta", "s-plano", `${L}: prazo vencido (${dataBR(a.quando)}).`);
    });
    const tecnicas = plano.filter((a) => /Elimina|Substitu|Engenharia/.test(a.hierarquia || ""));
    const soComport = plano.length && plano.every((a) => /Administrativo|EPI/.test(a.hierarquia || "") || (!a.hierarquia && RX_ADMIN.test(a.oque)));
    if (soComport) add("erro", "s-plano", "Plano baseado apenas em medidas administrativas/comportamentais (DDS, treinamento, orientação). Inclua ações sobre equipamento, método ou procedimento.");
    if ((temMaquina || /trav|enrosc|falha|defeit/i.test(r.primeiroDesvio)) && plano.length && !tecnicas.length)
      add("alerta", "s-plano", "Há falha de equipamento no primeiro desvio, mas nenhuma ação de eliminação, substituição ou engenharia.");
    if (plano.length && !plano.some((a) => a.hierarquia === "Verificação de eficácia" || a.causa === "Verificação" || RX_VERIF.test(a.oque)))
      add("alerta", "s-plano", "Inclua uma ação de verificação da eficácia das medidas.");
    const cadeiasSemAcao = cads.filter((c) => !plano.some((a) => a.causa === "Cadeia " + String.fromCharCode(65 + inv.cadeias.indexOf(c))));
    if (plano.some((a) => /^Cadeia/.test(a.causa)) && cadeiasSemAcao.length)
      add("info", "s-plano", "Cadeia(s) sem ação vinculada: " + cadeiasSemAcao.map((c) => String.fromCharCode(65 + inv.cadeias.indexOf(c))).join(", ") + ".");

    // Identificação
    if (!inv.numero) add("info", "s-identificacao", "Nº da ocorrência não informado.");
    if (!inv.caracteristica) add("alerta", "s-identificacao", "Característica da situação adversa não marcada.");
    if (!inv.dados.data) add("alerta", "s-dados", "Data da ocorrência não informada.");
    return out;
  }

  const NOMES_SECAO = { "s-identificacao": "Identificação", "s-dados": "Dados", "s-descricao": "Descrição", "s-ishikawa": "Causa e efeito",
    "s-porques": "5 Porquês", "s-classificacao": "Classificação", "s-plano": "Plano de ação" };

  function checar() {
    const lista = regras();
    const n = { erro: 0, alerta: 0, info: 0 }; lista.forEach((x) => n[x.nivel]++);
    const ordem = { erro: 0, alerta: 1, info: 2 };
    lista.sort((a, b) => ordem[a.nivel] - ordem[b.nivel]);
    $("#checagem-lista").innerHTML = lista.length ? lista.map((x) =>
      `<a class="chk ${x.nivel}" href="#${x.secao}"><b>${NOMES_SECAO[x.secao] || ""}</b>${esc(x.msg)}</a>`).join("")
      : `<p class="chk ok">Nenhuma inconsistência detectada pelas regras automáticas. A checagem não substitui a análise do Engenheiro de Segurança.</p>`;
    $("#checagem-resumo").innerHTML = `<span class="b erro">${n.erro}</span><span class="b alerta">${n.alerta}</span><span class="b info">${n.info}</span>`;

    const box = $("#aviso-revalidacao");
    if (box) {
      const temAnalise = inv.cadeias.some((c) => c.porques.some((p) => (p.resposta || "").trim()));
      const mudou = inv.meta.hashAnalise && inv.meta.hashAnalise !== hashDescricao();
      box.innerHTML = !temAnalise ? "" : mudou
        ? `<div class="aviso erro">A descrição revisada alterou a sequência causal e, portanto, a análise de causas anterior precisa ser revisada (Ishikawa, porquês, classificação e plano). <button class="btn mini" type="button" data-acao="revalidar">Análise revisada — confirmar</button></div>`
        : !inv.meta.hashAnalise ? `<div class="aviso">Quando a análise de causas estiver concluída, registre que ela corresponde a esta versão da descrição. <button class="btn mini" type="button" data-acao="revalidar">Registrar versão da descrição</button></div>`
          : `<div class="aviso ok">A análise de causas foi validada com esta versão da descrição.</div>`;
    }
    return lista;
  }

  // ------------------------------------------------------------------ armazenamento (GitHub)
  const LS = {
    get: (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* sem storage */ } },
    del: (k) => { try { localStorage.removeItem(k); } catch (e) { /* */ } }
  };
  function cfg() {
    let local = {}; try { local = JSON.parse(LS.get("dsst_cfg") || "{}"); } catch (e) { /* */ }
    return Object.assign({}, CFG0, local);
  }

  function b64DeTexto(txt) { const bytes = new TextEncoder().encode(txt); let s = ""; bytes.forEach((b) => (s += String.fromCharCode(b))); return btoa(s); }
  function textoDeB64(b64) { const bin = atob(b64.replace(/\s/g, "")); const u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return new TextDecoder().decode(u); }

  const Store = {
    url(path) {
      const c = cfg();
      if (c.modo === "proxy") return `${c.proxyUrl.replace(/\/$/, "")}/contents/${path.split("/").map(encodeURIComponent).join("/")}`;
      return `https://api.github.com/repos/${c.owner}/${c.repo}/contents/${path.split("/").map(encodeURIComponent).join("/")}?ref=${encodeURIComponent(c.branch)}`;
    },
    headers() {
      const c = cfg(); const h = { "Accept": "application/vnd.github+json" };
      if (c.modo === "proxy") { const k = LS.get("dsst_chave"); if (k) h["X-Chave"] = k; }
      else { const t = LS.get("dsst_token"); if (t) h["Authorization"] = "Bearer " + t; h["X-GitHub-Api-Version"] = "2022-11-28"; }
      return h;
    },
    async req(method, path, body) {
      const c = cfg();
      if (c.modo !== "proxy" && !LS.get("dsst_token")) throw new Error("Informe o token do GitHub na aba Configurações.");
      const r = await fetch(this.url(path), { method, headers: Object.assign({ "Content-Type": "application/json" }, this.headers()), body: body ? JSON.stringify(body) : undefined });
      if (r.status === 404) { const e = new Error("não encontrado"); e.status = 404; throw e; }
      if (!r.ok) {
        let msg = r.status + ""; try { msg = (await r.json()).message || msg; } catch (e) { /* */ }
        const e = new Error(r.status === 401 ? "Acesso negado (token ou chave inválidos)." : r.status === 409 || r.status === 422 && /sha/i.test(msg) ? "O arquivo foi alterado por outra pessoa. Recarregue o relatório antes de salvar." : "GitHub: " + msg);
        e.status = r.status; throw e;
      }
      return r.json();
    },
    async listar(dir) { try { const r = await this.req("GET", dir); return Array.isArray(r) ? r : []; } catch (e) { if (e.status === 404) return []; throw e; } },
    async lerJson(path) { const r = await this.req("GET", path); return { dados: JSON.parse(textoDeB64(r.content)), sha: r.sha }; },
    async lerBinario(path) {
      const r = await this.req("GET", path);
      if (r.content) return r.content.replace(/\s/g, "");
      throw new Error("arquivo grande");
    },
    async gravar(path, b64, sha, msg) {
      const c = cfg(); const body = { message: msg, content: b64, branch: c.branch };
      if (sha) body.sha = sha;
      const r = await this.req("PUT", path, body); return r.content && r.content.sha;
    }
  };

  const dirOcorr = () => `${cfg().pasta}/ocorrencias`;
  const dirFotos = (n) => `${cfg().pasta}/fotos/${n}`;
  const nomeArquivo = (n) => String(n).trim().replace(/[^\w.-]+/g, "_");

  async function gerarNumero() {
    const ano = new Date().getFullYear();
    try {
      const itens = await Store.listar(dirOcorr());
      const nums = itens.map((i) => i.name.match(new RegExp(`^${ano}-(\\d+)\\.json$`))).filter(Boolean).map((m) => +m[1]);
      inv.numero = `${ano}-${String((nums.length ? Math.max(...nums) : 0) + 1).padStart(3, "0")}`;
    } catch (e) {
      const d = new Date(); const p = (x) => String(x).padStart(2, "0");
      inv.numero = `${ano}-${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`;
      toast("Sem acesso de leitura ao repositório: número gerado pela data/hora.", "");
    }
    marcarSujo(); render();
  }

  async function salvar() {
    if (!inv.numero) await gerarNumero();
    if (!inv.dados.data) return toast("Informe a data da ocorrência antes de salvar.", "erro"), location.hash = "#s-dados";
    const btn = $("#btn-salvar"); btn.disabled = true; btn.textContent = "Salvando…";
    try {
      const nome = nomeArquivo(inv.numero);
      for (let i = 0; i < inv.fotos.length; i++) {
        const f = inv.fotos[i];
        if (f.path || !f.dataUrl) continue;
        const caminho = `${dirFotos(nome)}/foto-${Date.now()}-${i + 1}.jpg`;
        await Store.gravar(caminho, f.dataUrl.split(",")[1], null, `Foto da ocorrência ${inv.numero}`);
        f.path = caminho;
      }
      const copia = clone(inv);
      copia.fotos = copia.fotos.map((f) => ({ path: f.path, legenda: f.legenda }));
      const sha = copia.meta.sha; delete copia.meta.sha;
      copia.meta.atualizadoEm = new Date().toISOString();
      const novoSha = await Store.gravar(`${dirOcorr()}/${nome}.json`, b64DeTexto(JSON.stringify(copia, null, 2)), sha || null,
        `${sha ? "Atualiza" : "Registra"} ocorrência ${inv.numero}`);
      inv.meta.sha = novoSha || ""; sujo = false; LS.del("dsst_rascunho");
      toast("Relatório salvo no GitHub.", "ok");
    } catch (e) {
      toast(e.status === 422 && !inv.meta.sha ? "Já existe um relatório com este número. Abra-o pelo Painel ou gere outro número." : e.message, "erro");
    } finally { btn.disabled = false; btn.textContent = "Salvar no GitHub"; atualizarCabecalho(); }
  }

  async function abrir(path) {
    if (sujo && !confirm("Há alterações não salvas. Abrir outro relatório mesmo assim?")) return;
    try {
      const { dados, sha } = await Store.lerJson(path);
      inv = Object.assign(novoRelatorio(), dados);
      inv.meta = Object.assign({}, inv.meta, { sha });
      sujo = false; trocarAba("form"); render(); window.scrollTo(0, 0);
    } catch (e) { toast(e.message, "erro"); }
  }

  function salvarRascunho() { const c = clone(inv); LS.set("dsst_rascunho", JSON.stringify(c)); }

  // ------------------------------------------------------------------ painel
  let cacheOcorr = [];
  async function carregarPainel() {
    const box = $("#painel-conteudo"); box.innerHTML = `<p class="vazio">Carregando…</p>`;
    try {
      const itens = (await Store.listar(dirOcorr())).filter((i) => i.name.endsWith(".json"));
      const res = []; const lote = 6;
      for (let i = 0; i < itens.length; i += lote) {
        const parte = await Promise.all(itens.slice(i, i + lote).map((it) => Store.lerJson(it.path).then((r) => ({ path: it.path, d: r.dados })).catch(() => null)));
        res.push(...parte.filter(Boolean));
      }
      cacheOcorr = res;
      const anos = [...new Set(res.map((r) => (r.d.dados && r.d.dados.data || "").slice(0, 4)).filter(Boolean))].sort().reverse();
      $("#filtro-ano").innerHTML = `<option value="">Todos os anos</option>` + anos.map((a) => `<option>${a}</option>`).join("");
      $("#filtro-tipo").innerHTML = `<option value="">Todas as características</option>` + CARACTERISTICAS.map((a) => `<option>${a}</option>`).join("");
      desenharPainel();
    } catch (e) { box.innerHTML = `<p class="vazio erro">${esc(e.message)}</p>`; }
  }

  function desenharPainel() {
    const txt = ($("#filtro-texto").value || "").toLowerCase(); const ano = $("#filtro-ano").value; const tipo = $("#filtro-tipo").value;
    const lista = cacheOcorr.filter(({ d }) => {
      const dd = d.dados || {};
      if (ano && !(dd.data || "").startsWith(ano)) return false;
      if (tipo && d.caracteristica !== tipo) return false;
      if (txt && ![d.numero, dd.nome, dd.local, dd.lider, d.ocorrencia].join(" ").toLowerCase().includes(txt)) return false;
      return true;
    }).sort((a, b) => ((b.d.dados || {}).data || "").localeCompare((a.d.dados || {}).data || ""));

    const h = hoje(); let abertas = 0, vencidas = 0, concluidas = 0; const vencLista = [];
    const porTipo = {};
    const linhas = lista.map(({ path, d }) => {
      const plano = (d.plano || []).filter((a) => (a.oque || "").trim());
      const ab = plano.filter((a) => a.status !== "Concluído"); const venc = ab.filter((a) => a.quando && a.quando < h);
      abertas += ab.length; vencidas += venc.length; concluidas += plano.length - ab.length;
      venc.forEach((a) => vencLista.push({ n: d.numero, path, a }));
      porTipo[d.caracteristica || "Não informada"] = (porTipo[d.caracteristica || "Não informada"] || 0) + 1;
      const salvoInv = inv; inv = Object.assign(novoRelatorio(), d); const chk = regras(); inv = salvoInv;
      const erros = chk.filter((x) => x.nivel === "erro").length; const alertas = chk.filter((x) => x.nivel === "alerta").length;
      const pend = !d.parecer || !d.parecer.eficaz;
      return `<tr>
        <td class="mono">${esc(d.numero)}</td><td>${dataBR((d.dados || {}).data)}</td>
        <td>${esc((d.dados || {}).nome)}</td><td>${esc((d.dados || {}).local)}</td>
        <td>${esc(d.caracteristica)}</td><td>${esc(d.ocorrencia)}</td>
        <td class="num">${plano.length - ab.length}/${plano.length}${venc.length ? ` <span class="tag erro">${venc.length} vencida(s)</span>` : ""}</td>
        <td>${erros ? `<span class="tag erro">${erros} erro(s)</span>` : ""}${alertas ? ` <span class="tag alerta">${alertas}</span>` : ""}${!erros && !alertas ? `<span class="tag ok">ok</span>` : ""}</td>
        <td>${pend ? `<span class="tag">pendente</span>` : `<span class="tag ok">${esc(d.parecer.eficaz)}</span>`}</td>
        <td><button class="btn mini" data-abrir="${esc(path)}">Abrir</button></td></tr>`;
    }).join("");

    $("#painel-conteudo").innerHTML = `
      <div class="kpis">
        <div class="kpi"><span>Ocorrências</span><b>${lista.length}</b></div>
        <div class="kpi"><span>Ações em aberto</span><b>${abertas}</b></div>
        <div class="kpi ${vencidas ? "ruim" : ""}"><span>Ações vencidas</span><b>${vencidas}</b></div>
        <div class="kpi"><span>Ações concluídas</span><b>${concluidas}</b></div>
      </div>
      <div class="por-tipo">${Object.entries(porTipo).map(([k, v]) => `<span class="tag">${esc(k)}: <b>${v}</b></span>`).join("")}</div>
      ${vencLista.length ? `<section class="cartao"><h2>Ações vencidas</h2><table class="tabela"><thead><tr><th>Nº</th><th>Ação</th><th>Quem</th><th>Prazo</th><th>Status</th></tr></thead><tbody>
        ${vencLista.sort((a, b) => a.a.quando.localeCompare(b.a.quando)).map((v) => `<tr><td class="mono"><a href="#" data-abrir="${esc(v.path)}">${esc(v.n)}</a></td><td>${esc(v.a.oque)}</td><td>${esc(v.a.quem)}</td><td>${dataBR(v.a.quando)}</td><td>${esc(v.a.status)}</td></tr>`).join("")}
        </tbody></table></section>` : ""}
      <section class="cartao"><h2>Ocorrências</h2>
      ${lista.length ? `<div class="rolagem"><table class="tabela painel"><thead><tr><th>Nº</th><th>Data</th><th>Nome</th><th>Local</th><th>Característica</th><th>Ocorrência</th><th>Ações concl.</th><th>Checagem</th><th>Eficácia</th><th></th></tr></thead><tbody>${linhas}</tbody></table></div>`
        : `<p class="vazio">Nenhuma ocorrência encontrada.</p>`}</section>`;
  }

  // ------------------------------------------------------------------ impressão (layout DSST)
  function imprimir() {
    const d = inv; const dd = d.dados; const x = (b) => (b ? "X" : "");
    const cab = `<table class="p-cab">
      <tr><td rowspan="2" class="p-logo">HÜBNER</td><td class="p-sis">${esc(DOC.sistema)}</td><td class="p-cod" rowspan="2">${esc(DOC.codigo)}</td></tr>
      <tr><td class="p-tipo">${esc(DOC.tipo)}</td></tr>
      <tr><td colspan="3" class="p-rev"><i>Revisão</i> ${esc(DOC.revisao)} &nbsp;&nbsp; <i>Data</i> ${esc(DOC.dataRevisao)} &nbsp;&nbsp; <i>Responsável</i> ${esc(DOC.responsavel)}</td></tr>
      <tr><td colspan="3" class="p-tit">${esc(DOC.titulo)}</td></tr></table>`;
    const rod = `<table class="p-rod"><tr><td><b>Alteração</b> ${esc(DOC.alteracao)}</td><td><b>Aprovação</b> ${esc(DOC.aprovacao)}</td><td><b>Distribuição</b> ${esc(DOC.distribuicao)}</td></tr>
      <tr><td><b><i>Rev.</i></b> ${esc(DOC.revisao)} &nbsp; <b><i>Data</i></b> ${esc(DOC.dataRevisao)}</td><td colspan="2"><b>Controle da Última Revisão:</b> ${esc(DOC.controleRevisao)}</td></tr></table>`;
    const titulo = (t) => `<h3 class="p-h">${t}</h3>`;
    const carac = [["Incidente", "Acidente com afastamento", "Acidente de trânsito"], ["Ocorrência adversa", "Acidente sem afastamento", "Outros"]];
    const ishi = (cat) => ISHIKAWA[cat].map((it) => { const v = d.ishikawa.itens[`${cat}|${it}`]; return `(${v ? "X" : "&nbsp;"}) ${esc(it)}${v ? ` <small>[${EVID_SIG[v]}]</small>` : ""}`; }).join("<br>") + (d.ishikawa.outros[cat] ? `<br>(X) ${esc(d.ishikawa.outros[cat])}` : "");
    const ass = (a) => a ? `<img src="${a}" class="p-ass">` : "";
    const pessoas = (lista) => lista.map((p) => `<tr><td>${dataBR(p.data)}</td><td>${esc(p.funcao)}</td><td>${esc(p.nome)}</td><td>${ass(p.assinatura)}</td></tr>`).join("");
    const acoes = (lista, compl) => lista.filter((a) => a.oque).map((a, i) => `<tr><td class="c">${i + 1}</td><td>${nl2br(a.oque)}${compl && (a.causa || a.hierarquia) ? `<br><small>${esc([a.causa, a.hierarquia].filter(Boolean).join(" · "))}</small>` : ""}</td><td>${esc(a.quem)}</td><td>${dataBR(a.quando)}</td><td>${esc(a.status)}</td></tr>`).join("");
    const lesoes = [d.lesoes.natureza, d.lesoes.partes.join(", "), d.lesoes.lado && d.lesoes.lado !== "Não se aplica" ? "lado " + d.lesoes.lado.toLowerCase() : "", d.lesoes.obs].filter(Boolean).join(" — ");
    const maxPq = Math.max(3, ...d.cadeias.map((c) => c.porques.length));

    const corpo = `
      <table class="p-t"><tr><td class="r" style="width:30%"><b>Nº OCORRÊNCIA:</b></td><td>${esc(d.numero)}</td></tr></table>
      ${titulo("Característica da Situação Adversa:")}
      <table class="p-t">${carac.map((l) => `<tr>${l.map((c) => `<td class="c x">${x(d.caracteristica === c)}</td><td>${c === "Outros" ? "Outros: " + esc(d.caracteristica === "Outros" ? d.caracteristicaOutros : "") : c}</td>`).join("")}</tr>`).join("")}</table>
      ${titulo("Ocorrência:")}<table class="p-t"><tr><td>${esc(d.ocorrencia)}</td></tr></table>
      ${titulo("Dados da Ocorrência:")}
      <table class="p-t"><tr><td colspan="2">Nome: ${esc(dd.nome)}</td></tr><tr><td colspan="2">Matrícula: ${esc(dd.matricula)}</td></tr>
        <tr><td colspan="2">Função: ${esc(dd.funcao)}</td></tr><tr><td>Local: ${esc(dd.local)}</td><td>Líder: ${esc(dd.lider)}</td></tr>
        <tr><td>Data: ${dataBR(dd.data)}</td><td>Hora: ${esc(dd.hora)}</td></tr>
        <tr><td colspan="2">Reincidente: &nbsp; (${x(dd.reincidente === "Sim")}) Sim &nbsp; (${x(dd.reincidente === "Não")}) Não</td></tr></table>
      ${titulo("Descrição do Fato:")}<table class="p-t"><tr><td class="just">${nl2br(d.descricao)}</td></tr></table>
      ${d.fotos.length ? titulo("Fotos:") + `<div class="p-fotos">${d.fotos.filter((f) => f.dataUrl).map((f) => `<figure><img src="${f.dataUrl}"><figcaption>${esc(f.legenda)}</figcaption></figure>`).join("")}</div>` : ""}
      ${titulo("Lesões no Corpo Humano:")}<table class="p-t"><tr><td>${esc(lesoes) || "&nbsp;"}</td></tr></table>
      ${titulo("Diagrama de causa e efeito:")}
      <table class="p-t p-ishi"><tr><th>Mão de obra</th><th>Máquina</th><th>Meio ambiente</th><th>Efeito</th></tr>
        <tr><td>${ishi("Mão de obra")}</td><td>${ishi("Máquina")}</td><td>${ishi("Meio ambiente")}</td><td rowspan="3" class="c"><b>${nl2br(d.ishikawa.efeito)}</b></td></tr>
        <tr><th>Método</th><th>Matéria Prima</th><th>Medições</th></tr>
        <tr><td>${ishi("Método")}</td><td>${ishi("Matéria-prima")}</td><td>${ishi("Medições")}</td></tr></table>
      <p class="p-leg">[E] evidenciado · [P] provável · [H] hipótese — necessita confirmação</p>
      ${titulo("Análise de Porquê das possíveis causas identificadas:")}
      <table class="p-t p-pq"><tr><th>Nº</th><th>Possíveis causas</th>${Array.from({ length: maxPq }, (_, i) => `<th>${i + 1}º Por quê</th>`).join("")}</tr>
        ${d.cadeias.map((c, ci) => `<tr><td class="c"><b>${ci + 1}</b></td><td><b>${esc(c.causa)}</b><br><small>${esc(c.tipo)}</small></td>
          ${Array.from({ length: maxPq }, (_, i) => { const p = c.porques[i]; return `<td>${p ? nl2br(p.resposta) + (p.status && p.resposta ? ` <small>[${EVID_SIG[p.status]}]</small>` : "") : ""}</td>`; }).join("")}</tr>
          ${c.causaRaiz ? `<tr><td></td><td colspan="${maxPq + 1}"><b>Causa encontrada:</b> ${nl2br(c.causaRaiz)}</td></tr>` : ""}`).join("")}</table>
      ${[d.classificacao.causaImediata, d.classificacao.contribuintes, d.classificacao.falhaControle, d.classificacao.causaRaiz].some(Boolean) ? `
      ${titulo("Classificação das causas:")}
      <table class="p-t">${[["Condição normal", "condicaoNormal"], ["Perigo/condição", "perigo"], ["Causa imediata", "causaImediata"], ["Causas contribuintes", "contribuintes"], ["Falha de controle", "falhaControle"], ["Causa raiz", "causaRaiz"]]
        .filter(([, k]) => d.classificacao[k]).map(([t, k]) => `<tr><td class="r" style="width:24%"><b>${t}</b></td><td>${nl2br(d.classificacao[k])}${k === "causaRaiz" && d.classificacao.statusCausaRaiz === "confirmar" ? " <small>(necessita confirmação)</small>" : ""}</td></tr>`).join("")}</table>` : ""}
      ${titulo("Ações Imediatas:")}
      <table class="p-t"><tr><th>Item</th><th>O que?</th><th>Quem?</th><th>Quando?</th><th>Status</th></tr>${acoes(d.acoesImediatas)}</table>
      ${titulo("Plano de Ação:")}
      <table class="p-t"><tr><th>Item</th><th>O que?</th><th>Quem?</th><th>Quando?</th><th>Status</th></tr>${acoes(d.plano, true)}</table>
      <table class="p-t p-legst"><tr><td><b>Legenda Status:</b></td>${STATUS.map((s) => `<td class="st-${slug(s)}">${s}</td>`).join("")}</tr></table>
      ${titulo("Responsáveis pela Investigação:")}
      <table class="p-t"><tr><th>Data</th><th>Função</th><th>Nome</th><th>Assinatura</th></tr>${pessoas(d.responsaveis)}</table>
      ${titulo("Parecer e Aprovação (Verificação da Eficácia das Ações):")}
      <table class="p-t"><tr><th colspan="4">Parecer</th></tr><tr><td colspan="4" class="just">${d.parecer.eficaz ? `<b>${{ eficaz: "Ações eficazes", parcial: "Parcialmente eficazes", ineficaz: "Não eficazes — reabrir" }[d.parecer.eficaz]}.</b> ` : ""}${nl2br(d.parecer.texto)}&nbsp;</td></tr>
        <tr><th>Data</th><th>Função</th><th>Nome</th><th>Assinatura</th></tr>${pessoas([d.parecer])}</table>
      ${titulo("Ciência do Ocorrido:")}
      <table class="p-t"><tr><th>Data</th><th>Função</th><th>Nome</th><th>Assinatura</th></tr>${pessoas(d.ciencia)}</table>`;

    $("#impressao").innerHTML = `<table class="p-pagina"><thead><tr><td>${cab}</td></tr></thead><tfoot><tr><td>${rod}</td></tr></tfoot><tbody><tr><td>${corpo}</td></tr></tbody></table>`;
    const tituloAnt = document.title; document.title = `DSST 10.2-001 - ${inv.numero || "ocorrencia"}`;
    setTimeout(() => { window.print(); document.title = tituloAnt; }, 150);
  }

  // ------------------------------------------------------------------ exemplo (referência de relato)
  function exemplo() {
    const e = novoRelatorio();
    Object.assign(e, {
      numero: "EXEMPLO",
      caracteristica: "Acidente sem afastamento",
      ocorrencia: "Prensamento com corte no dedo mínimo da mão direita",
      dados: { nome: "Colaborador (exemplo)", matricula: "00000", funcao: "Auxiliar de produção", local: "Cura Frio", lider: "Líder do setor", data: "2026-09-22", hora: "16:10", reincidente: "Não" },
      relato: {
        atividade: "Movimentação manual de carrinho contendo o modelo na linha de pintura (Cura Frio), com deslocamento do carrinho até o rolouver",
        primeiroDesvio: "O carrinho com o modelo travou durante o deslocamento",
        intervencoes: "Para liberar o carrinho, foi empurrado contra ele um segundo carrinho vazio, que ficou preso sob o carrinho travado. Em seguida, um funcionário utilizou uma barra de ferro para forçar o carrinho para trás enquanto, simultaneamente, o colaborador puxava o carrinho manualmente",
        evento: "No destravamento, o carrinho liberou-se de forma repentina e deslocou-se em direção ao rolouver",
        mecanismo: "O dedo do colaborador estava posicionado entre o carrinho e a estrutura do equipamento e foi prensado",
        consequencia: "Prensamento com corte no dedo mínimo da mão direita"
      },
      descricao: "Durante a movimentação de um carrinho contendo o modelo na linha de pintura, o equipamento apresentou travamento durante o deslocamento. Na tentativa de liberar o carrinho, foi utilizado um segundo carrinho vazio, que foi empurrado contra o carrinho travado. Durante essa manobra, o carrinho vazio acabou ficando preso sob o carrinho que transportava o modelo. Para realizar o destravamento, um dos funcionários utilizou uma barra de ferro para forçar o deslocamento do carrinho para trás. Simultaneamente, o colaborador realizou o puxamento manual do carrinho. No momento em que ocorreu o destravamento, o carrinho movimentou-se de forma repentina em direção ao rolouver. Durante esse deslocamento inesperado, o dedo do colaborador ficou posicionado entre o carrinho e a estrutura do equipamento, ocasionando o prensamento.",
      lesoes: { partes: ["Dedos da mão"], lado: "Direito", natureza: "Corte", obs: "Dedo mínimo" },
      ishikawa: {
        itens: { "Mão de obra|Sincronismo de atividade (pressa ou demora)": "provavel", "Máquina|Proteção": "evidenciado", "Máquina|Condição": "confirmar",
          "Máquina|Defeito mecânico": "confirmar", "Método|Procedimentos": "evidenciado", "Método|Metodologia escolhida inadequada": "evidenciado" },
        outros: {}, efeito: "Prensamento com corte no dedo mínimo da mão direita durante o destravamento do carrinho"
      },
      cadeias: [
        { id: uid(), tipo: "Origem da falha (equipamento/processo)", causa: "Máquina: carrinho travou/enroscou na estrutura do rolouver durante o deslocamento",
          porques: [
            { resposta: "O carrinho enroscou na estrutura do rolouver durante a movimentação.", status: "evidenciado" },
            { resposta: "Há folga, desgaste ou dimensionamento incompatível entre carrinho e rolouver — necessita confirmação por inspeção da manutenção.", status: "confirmar" },
            { resposta: "Os travamentos são resolvidos pela própria operação, sem abertura de chamado para a manutenção — confirmar recorrência e registros.", status: "confirmar" }
          ],
          causaRaiz: "Necessita confirmação: inspeção dos carrinhos/trilho do rolouver e levantamento de travamentos anteriores." },
        { id: uid(), tipo: "Método de intervenção", causa: "Método: destravamento improvisado com segundo carrinho, barra de ferro e puxão manual simultâneo",
          porques: [
            { resposta: "A equipe improvisou o método de destravamento no momento da ocorrência.", status: "evidenciado" },
            { resposta: "Não existe procedimento/IT de destravamento nem ferramenta adequada definida para a tarefa.", status: "evidenciado" },
            { resposta: "A condição de travamento não estava prevista na análise de risco da atividade — confirmar no inventário de riscos (PGR).", status: "confirmar" }
          ],
          causaRaiz: "Ausência de método seguro padronizado para tratar travamentos (procedimento, ferramenta, bloqueio de energia e posição das mãos). Lacuna na análise de risco: necessita confirmação no PGR." }
      ],
      classificacao: {
        condicaoNormal: "Deslocamento manual do carrinho até o rolouver sem interferências.",
        perigo: "Energia acumulada no carrinho travado e zona de prensamento entre carrinho e estrutura do rolouver.",
        causaImediata: "Liberação repentina do carrinho com a mão do colaborador na zona de prensamento.",
        contribuintes: "Duas forças aplicadas simultaneamente sem coordenação; uso de segundo carrinho e barra de ferro.",
        falhaControle: "Ausência de procedimento de destravamento, de ferramenta adequada e de pontos de pega afastados da zona de prensamento.",
        causaRaiz: "Ausência de método seguro padronizado para tratar travamentos; origem do travamento a confirmar.",
        statusCausaRaiz: "confirmar"
      },
      acoesImediatas: [{ oque: "Retirar de operação e isolar o carrinho que travou até avaliação da manutenção.", quem: "Coordenador", quando: "2026-09-22", status: "Concluído" }],
      plano: [
        { oque: "Corrigir a causa do travamento: inspecionar carrinhos e trilho/estrutura do rolouver; ajustar ou substituir os carrinhos com folga, desgaste ou dimensionamento incompatível.", quem: "Manutenção", quando: "2026-10-16", status: "Planejado", causa: "Cadeia A", hierarquia: "Eliminação" },
        { oque: "Elaborar IO de destravamento: parada da linha, bloqueio de energia do rolouver (NR-12), ferramenta adequada, posição segura das mãos e responsáveis.", quem: "SESMT / Engenharia", quando: "2026-10-30", status: "Planejado", causa: "Cadeia B", hierarquia: "Administrativo" },
        { oque: "Instalar batentes, limitadores ou espaçadores que impeçam o contato entre carrinhos e mantenham distância segura para as mãos.", quem: "Engenharia / SESMT", quando: "2026-11-30", status: "Planejado", causa: "Falha de controle", hierarquia: "Engenharia/proteção coletiva" },
        { oque: "Instalar pontos de pega/alças nos carrinhos, afastados das extremidades e da zona de prensagem.", quem: "Engenharia / SESMT", quando: "2026-11-30", status: "Planejado", causa: "Falha de controle", hierarquia: "Engenharia/proteção coletiva" },
        { oque: "Divulgar a ocorrência em DDS e treinar a equipe na IO de destravamento.", quem: "Líder / SESMT", quando: "2026-11-13", status: "Planejado", causa: "Cadeia B", hierarquia: "Administrativo" },
        { oque: "Verificar a eficácia das ações (ausência de travamentos e de improvisos; inspeção em campo).", quem: "SESMT", quando: "2027-01-15", status: "Planejado", causa: "Verificação", hierarquia: "Verificação de eficácia" }
      ]
    });
    e.meta.hashAnalise = hash(JSON.stringify([e.relato, e.descricao]));
    return e;
  }

  // ------------------------------------------------------------------ abas / config
  function trocarAba(nome) {
    $$(".aba").forEach((b) => b.classList.toggle("ativa", b.dataset.aba === nome));
    $$(".painel-aba").forEach((m) => m.classList.toggle("oculto", m.id !== "aba-" + nome));
    if (nome === "config") preencherConfig();
  }
  function preencherConfig() {
    const c = cfg();
    $("#cfg-owner").value = c.owner || ""; $("#cfg-repo").value = c.repo || ""; $("#cfg-branch").value = c.branch || "main"; $("#cfg-pasta").value = c.pasta || "dados";
    $("#cfg-token").value = LS.get("dsst_token") || ""; $("#cfg-chave").value = LS.get("dsst_chave") || "";
    const proxy = c.modo === "proxy";
    $("#cfg-token-box").style.display = proxy ? "none" : "";
    $("#cfg-chave-box").style.display = proxy ? "" : "none";
    $("#cfg-modo-txt").textContent = proxy
      ? "Modo link aberto: qualquer pessoa com o link pode registrar ocorrências. Para abrir relatórios gravados e usar o painel, informe a chave de leitura do SESMT."
      : "Modo token: os relatórios são gravados diretamente no repositório com o token do GitHub informado neste navegador.";
  }

  function iniciar() {
    $$(".aba").forEach((b) => (b.onclick = () => trocarAba(b.dataset.aba)));
    $("#btn-novo").onclick = () => { if (sujo && !confirm("Descartar o relatório atual e começar um novo?")) return; inv = novoRelatorio(); sujo = false; LS.del("dsst_rascunho"); render(); window.scrollTo(0, 0); };
    $("#btn-exemplo").onclick = () => { if (sujo && !confirm("Substituir o relatório atual pelo exemplo de referência?")) return; inv = exemplo(); sujo = false; render(); toast("Exemplo de referência carregado (dados anonimizados). Não salve com o número EXEMPLO."); };
    $("#btn-pdf").onclick = imprimir;
    $("#btn-salvar").onclick = salvar;
    $("#btn-atualizar").onclick = carregarPainel;
    ["filtro-texto", "filtro-ano", "filtro-tipo"].forEach((id) => $("#" + id).addEventListener("input", desenharPainel));
    $("#painel-conteudo").addEventListener("click", (e) => { const b = e.target.closest("[data-abrir]"); if (b) { e.preventDefault(); abrir(b.dataset.abrir); } });
    $("#btn-cfg-salvar").onclick = () => {
      LS.set("dsst_cfg", JSON.stringify({ owner: $("#cfg-owner").value.trim(), repo: $("#cfg-repo").value.trim(), branch: $("#cfg-branch").value.trim() || "main", pasta: $("#cfg-pasta").value.trim() || "dados" }));
      const t = $("#cfg-token").value.trim(); t ? LS.set("dsst_token", t) : LS.del("dsst_token");
      const k = $("#cfg-chave").value.trim(); k ? LS.set("dsst_chave", k) : LS.del("dsst_chave");
      $("#cfg-resultado").textContent = "Configurações salvas neste navegador."; $("#cfg-resultado").className = "resultado ok";
    };
    $("#btn-cfg-testar").onclick = async () => {
      $("#btn-cfg-salvar").click();
      const out = $("#cfg-resultado"); out.textContent = "Testando…"; out.className = "resultado";
      try { const l = await Store.listar(dirOcorr()); out.textContent = `Conexão OK — ${l.filter((i) => i.name.endsWith(".json")).length} relatório(s) encontrados.`; out.className = "resultado ok"; }
      catch (e) { out.textContent = e.message; out.className = "resultado erro"; }
    };
    window.addEventListener("beforeunload", (e) => { if (sujo) { e.preventDefault(); e.returnValue = ""; } });
    ligarFormulario(); ligarAssinatura();

    const r = LS.get("dsst_rascunho");
    if (r) { try { inv = Object.assign(novoRelatorio(), JSON.parse(r)); sujo = true; } catch (e) { /* */ } }
    render();
    if (r) toast("Rascunho recuperado deste navegador.");
  }

  window.DSST = { regras, exemplo, get inv() { return inv; } };
  document.addEventListener("DOMContentLoaded", iniciar);
})();
