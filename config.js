/*
 * Configuração do aplicativo DSST 10.2-001
 * Edite este arquivo antes de publicar no GitHub Pages.
 *
 * modo "token": cada computador do SESMT informa um token do GitHub
 *               (aba Configurações). Indicado para uso interno.
 * modo "proxy": o token fica guardado num Cloudflare Worker (pasta worker/).
 *               Permite "link aberto" para preenchimento, sem token no navegador.
 */
window.DSST_CONFIG = {
  modo: "token",                 // "token" ou "proxy"

  // Repositório onde os relatórios serão gravados (recomendado: PRIVADO)
  owner: "lucianastremel",
  repo: "dsst-investigacoes-dados",
  branch: "main",
  pasta: "dados",                // dados/ocorrencias/*.json e dados/fotos/<nº>/*

  // Somente para modo "proxy": endereço do Worker publicado
  proxyUrl: "https://dsst-proxy.SEU-SUBDOMINIO.workers.dev",   // preencher após criar o Worker,

  // Cabeçalho do documento controlado
  documento: {
    sistema: "SISTEMA DE GESTÃO HÜBNER",
    tipo: "DOCUMENTO DE SST",
    codigo: "DSST 10.2-001",
    titulo: "RELATÓRIO DE REGISTRO E INVESTIGAÇÃO",
    revisao: "01",
    dataRevisao: "20/02/26",
    responsavel: "SESMT",
    alteracao: "Assistente do SQ/MA.",
    aprovacao: "Segurança do Trabalho",
    distribuicao: "Acesso on-line",
    controleRevisao: "Revisão da estrutura do arquivo e código do documento conforme ISO 45001:2018."
  },

  // Assinantes padrão (podem ser alterados no formulário)
  padrao: {
    engenheiro: "Carlos Rodrigo Licheski Tonin Pessoa",
    ciencia: [
      { funcao: "Gerente Administrativa/RH", nome: "Luciana do Prado Sampaio Stremel" },
      { funcao: "Diretor Industrial", nome: "Adilson Soares Dias" }
    ]
  }
};
