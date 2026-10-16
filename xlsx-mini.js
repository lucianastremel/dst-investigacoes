/* Gerador mínimo de planilhas .xlsx (sem dependências externas).
 * Uso: MiniXLSX.download("arquivo.xlsx", [{ name, rows, cols, header: true }])
 * Células: número | texto | { d: "AAAA-MM-DD" } (data) | { f: "FÓRMULA" } | { n: 1.23, fmt: "dec" }
 */
(function () {
  "use strict";
  const enc = new TextEncoder();
  const xml = (s) => String(s).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const colName = (i) => { let s = ""; i++; while (i > 0) { const m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26); } return s; };
  const serial = (iso) => { const [y, m, d] = iso.split("-").map(Number); return (Date.UTC(y, m - 1, d) - Date.UTC(1899, 11, 30)) / 86400000; };

  function sheetXml(sh) {
    const rows = sh.rows || [];
    const maxC = Math.max(1, ...rows.map((r) => r.length));
    const out = [];
    rows.forEach((r, ri) => {
      const cells = [];
      r.forEach((v, ci) => {
        if (v === null || v === undefined || v === "") return;
        const ref = colName(ci) + (ri + 1);
        const head = sh.header !== false && ri === 0;
        if (typeof v === "number" && isFinite(v)) cells.push(`<c r="${ref}"${head ? ' s="2"' : ""}><v>${v}</v></c>`);
        else if (typeof v === "object" && v.d) cells.push(`<c r="${ref}" s="1"><v>${serial(v.d)}</v></c>`);
        else if (typeof v === "object" && v.f) cells.push(`<c r="${ref}" s="3"><f>${xml(v.f)}</f></c>`);
        else if (typeof v === "object" && "n" in v) cells.push(`<c r="${ref}" s="3"><v>${v.n}</v></c>`);
        else cells.push(`<c r="${ref}" t="inlineStr"${head ? ' s="2"' : ' s="4"'}><is><t xml:space="preserve">${xml(v)}</t></is></c>`);
      });
      out.push(`<row r="${ri + 1}">${cells.join("")}</row>`);
    });
    const ref = `A1:${colName(maxC - 1)}${Math.max(1, rows.length)}`;
    const cols = (sh.cols || []).length ? `<cols>${sh.cols.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join("")}</cols>` : "";
    const freeze = sh.header !== false ? `<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>` : "";
    const filtro = sh.header !== false && rows.length > 1 ? `<autoFilter ref="${ref}"/>` : "";
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><dimension ref="${ref}"/>${freeze}${cols}<sheetData>${out.join("")}</sheetData>${filtro}</worksheet>`;
  }

  const STYLES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<numFmts count="2"><numFmt numFmtId="164" formatCode="dd/mm/yyyy"/><numFmt numFmtId="165" formatCode="#,##0.00"/></numFmts>
<fonts count="2"><font><sz val="10"/><name val="Arial"/></font><font><b/><sz val="10"/><color rgb="FFFFFFFF"/><name val="Arial"/></font></fonts>
<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF12355B"/><bgColor indexed="64"/></patternFill></fill></fills>
<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="5"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
<xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>
<xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>
<xf numFmtId="165" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>
<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="top"/></xf></cellXfs>
<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`;

  function arquivos(sheets) {
    const nomes = sheets.map((s, i) => xml(String(s.name || "Planilha" + (i + 1)).replace(/[\\/?*[\]:]/g, " ").slice(0, 31)));
    const f = {};
    f["[Content_Types].xml"] = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${sheets.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join("")}</Types>`;
    f["_rels/.rels"] = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`;
    f["xl/workbook.xml"] = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${nomes.map((n, i) => `<sheet name="${n}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join("")}</sheets>
<definedNames>${sheets.map((s, i) => s.header !== false && (s.rows || []).length > 1 ? `<definedName name="_xlnm._FilterDatabase" localSheetId="${i}" hidden="1">'${nomes[i]}'!$A$1:$${colName(Math.max(1, ...s.rows.map((r) => r.length)) - 1)}$${s.rows.length}</definedName>` : "").join("")}</definedNames>
<calcPr calcId="191029" fullCalcOnLoad="1"/></workbook>`;
    f["xl/_rels/workbook.xml.rels"] = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheets.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join("")}<Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`;
    f["xl/styles.xml"] = STYLES;
    sheets.forEach((s, i) => (f[`xl/worksheets/sheet${i + 1}.xml`] = sheetXml(s)));
    return f;
  }

  // ZIP sem compressão (método "store")
  const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  const crc32 = (b) => { let c = 0xFFFFFFFF; for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
  function zip(files) {
    const partes = []; const central = []; let off = 0;
    const u16 = (v) => [v & 255, (v >>> 8) & 255]; const u32 = (v) => [v & 255, (v >>> 8) & 255, (v >>> 16) & 255, (v >>> 24) & 255];
    Object.entries(files).forEach(([nome, conteudo]) => {
      const n = enc.encode(nome); const d = enc.encode(conteudo); const c = crc32(d);
      const loc = new Uint8Array([...u32(0x04034b50), ...u16(20), ...u16(0x0800), ...u16(0), ...u16(0), ...u16(0x21), ...u32(c), ...u32(d.length), ...u32(d.length), ...u16(n.length), ...u16(0)]);
      partes.push(loc, n, d);
      central.push(new Uint8Array([...u32(0x02014b50), ...u16(20), ...u16(20), ...u16(0x0800), ...u16(0), ...u16(0), ...u16(0x21), ...u32(c), ...u32(d.length), ...u32(d.length), ...u16(n.length), ...u16(0), ...u16(0), ...u16(0), ...u16(0), ...u32(0), ...u32(off)]), n);
      off += loc.length + n.length + d.length;
    });
    const tamCentral = central.reduce((s, p) => s + p.length, 0); const qtd = Object.keys(files).length;
    const fim = new Uint8Array([...u32(0x06054b50), ...u16(0), ...u16(0), ...u16(qtd), ...u16(qtd), ...u32(tamCentral), ...u32(off), ...u16(0)]);
    return new Blob([...partes, ...central, fim], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  }

  window.MiniXLSX = {
    blob: (sheets) => zip(arquivos(sheets)),
    download(nome, sheets) {
      const url = URL.createObjectURL(this.blob(sheets));
      const a = document.createElement("a"); a.href = url; a.download = nome; document.body.appendChild(a); a.click();
      setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1500);
    }
  };
})();
