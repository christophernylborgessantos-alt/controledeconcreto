import {useEffect, useState} from 'react';
import {baixarRelatorioDrive, importarLaudo, listarRelatoriosDrive, obterUltimoUploadLaudo} from '../lib/dados.js';
import {previaLaudo} from '../lib/previaLaudo.js';
import '../importacao.css';

const campos = ['7 dias R1', '7 dias R2', '28 dias R1', '28 dias R2', '63 dias R1', '63 dias R2'];
const formatar = valor => valor == null ? '—' : valor.toLocaleString('pt-BR', {minimumFractionDigits:2, maximumFractionDigits:6});
const dataUpload = new Intl.DateTimeFormat('pt-BR', {dateStyle:'short', timeStyle:'short', timeZone:'America/Sao_Paulo'});

export default function UploadLaudos({data, obra, commit}) {
  const [origem, setOrigem] = useState('drive');
  const [lista, setLista] = useState(null);
  const [id, setId] = useState('');
  const [local, setLocal] = useState(null);
  const [leitura, setLeitura] = useState(null);
  const [conferida, setConferida] = useState(false);
  const [atividade, setAtividade] = useState('');
  const [erro, setErro] = useState('');
  const [ultimo, setUltimo] = useState(undefined);
  const [erroUltimo, setErroUltimo] = useState('');
  const previa = leitura?.previa;
  const temErros = previa?.errosGerais.length || previa?.linhas.some(l => l.status === 'Erro');

  useEffect(() => {
    let ativo = true;
    obterUltimoUploadLaudo(obra).then(registro => {
      if (ativo) setUltimo(atual => atual ?? registro);
    }).catch(() => {
      if (ativo) setErroUltimo('Não foi possível consultar o último upload.');
    });
    return () => { ativo = false; };
  }, [obra]);

  function limparPrevia() {
    setLeitura(null);
    setConferida(false);
    setErro('');
  }

  async function listar() {
    setOrigem('drive');
    limparPrevia();
    setId('');
    setLista(null);
    setAtividade('Consultando a pasta no Google Drive…');
    try {
      setLista(await listarRelatoriosDrive(obra));
    } catch (e) {
      setErro(e.message);
    } finally {
      setAtividade('');
    }
  }

  async function ler() {
    limparPrevia();
    setAtividade('Preparando leitura do PDF…');
    try {
      const escolhido = lista?.arquivos.find(a => a.id === id);
      const arquivo = origem === 'drive' ? await baixarRelatorioDrive(obra, escolhido.id) : local;
      const {lerLaudo} = await import('../lib/lerLaudo.js');
      const notas = await lerLaudo(arquivo, (pagina, total) => setAtividade(`Lendo página ${pagina} de ${total}…`));
      setLeitura({nome:origem === 'drive' ? escolhido.name : local.name, previa:previaLaudo(notas, data, obra)});
    } catch (e) {
      setErro(e.name === 'Error' ? e.message : 'Não foi possível ler o PDF. Confira se o laudo está legível e sem senha.');
    } finally {
      setAtividade('');
    }
  }

  async function gravar() {
    if (!conferida || temErros || !previa?.atualizacoes.length || atividade) return;
    setErro('');
    setAtividade('Atualizando os ensaios…');
    try {
      await commit(async () => {
        const registro = await importarLaudo(obra, previa.atualizacoes, leitura.nome, origem);
        setUltimo(registro);
      }, `Resultados atualizados em ${previa.atualizacoes.length} nota(s).`);
      limparPrevia();
    } catch (e) {
      setErro(e.message);
    } finally {
      setAtividade('');
    }
  }

  return <div className="importacao">
    <section className="card">
      <h2>Atualizar resultados por laudo PDF</h2>
      <p>Use o formulário FOR 017 02. Confira os valores em MPa e as notas fiscais antes de gravar na obra selecionada.</p>
      <div className="dashboard-view-switch" role="group" aria-label="Origem do laudo">
        {[['drive','Google Drive'], ['local','PDF do computador']].map(([chave, nome]) =>
          <button key={chave} type="button" className={origem === chave ? 'primary' : ''} aria-pressed={origem === chave}
            disabled={!!atividade} onClick={chave === 'drive' ? listar : () => {
              if (origem === 'local') return;
              setOrigem('local'); setLocal(null); limparPrevia();
            }}>{nome}</button>
        )}
      </div>
      {origem === 'drive' ? <>
        {!lista && !atividade && !erro && <p>Clique em Google Drive para consultar os laudos da obra.</p>}
        {lista && (lista.arquivos.length ? <label>Laudo PDF
          <select value={id} disabled={!!atividade} onChange={e => { setId(e.target.value); limparPrevia(); }}>
            <option value="">Selecione um laudo</option>
            {lista.arquivos.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </label> : <p>Nenhum PDF na pasta da obra.</p>)}
        {lista?.limitado && <p>São exibidos os 500 PDFs mais recentes.</p>}
      </> : <label>Laudo PDF
        <input type="file" accept=".pdf,application/pdf" disabled={!!atividade}
          onChange={e => { setLocal(e.target.files[0] ?? null); limparPrevia(); }}/>
      </label>}
      <button type="button" className="primary" disabled={!!atividade || !(origem === 'drive' ? id : local)} onClick={ler}>Ler PDF e conferir resultados</button>
      {atividade && <p role="status">{atividade}</p>}
      {erro && <p role="alert" className="import-error">{erro}</p>}
    </section>
    <section className="card" aria-labelledby="ultimo-upload-laudo">
      <h3 id="ultimo-upload-laudo">Último upload confirmado</h3>
      {ultimo ? <>
        <p className="laudo-arquivo"><strong>{ultimo.arquivo}</strong></p>
        <p>{ultimo.origem === 'drive' ? 'Google Drive' : 'PDF do computador'} · {dataUpload.format(new Date(ultimo.confirmado_em))} · {ultimo.notas_atualizadas} nota(s) atualizada(s)</p>
      </> : <p role="status">{erroUltimo || (ultimo === undefined ? 'Consultando o último upload…' : 'Ainda não há upload de laudo registrado nesta obra.')}</p>}
    </section>
    {previa && <section className="card">
      <h3>Conferência do laudo</h3>
      <p>{leitura.nome}</p>
      <p>{previa.linhas.length} NFs lidas · {previa.atualizacoes.length} notas com alterações</p>
      {previa.errosGerais.map(m => <p key={m} role="alert" className="import-error">{m}</p>)}
      {temErros ? <p role="alert">Confira as linhas com erro. A atualização fica bloqueada até que todas sejam resolvidas.</p> : null}
      <div className="import-table-wrap" tabIndex={0} role="region" aria-label="Resultados extraídos do PDF">
        <table className="import-table">
          <thead><tr><th>Página</th><th>NF</th>{campos.map(c => <th key={c}>{c}</th>)}<th>Situação</th></tr></thead>
          <tbody>{previa.linhas.map(linha => <tr key={linha.linha}>
            <td>{linha.pagina}</td><th scope="row">{linha.numero || '—'}</th>
            {linha.resultados.map((valor, i) => {
              const mudanca = linha.alteracoes.find(a => a.idade === [7,28,63][Math.floor(i / 2)] && a.resultado === i % 2 + 1);
              return <td key={campos[i]}>{mudanca ? <>{formatar(mudanca.antes)} → <strong>{formatar(valor)}</strong></> : formatar(valor)}</td>;
            })}
            <td><strong className={linha.status === 'Erro' ? 'import-error' : ''}>{linha.status === 'Ignorada' ? 'Sem alteração' : linha.status}</strong>
              {linha.status !== 'Atualizar' && <small>{linha.mensagem}</small>}</td>
          </tr>)}</tbody>
        </table>
      </div>
      {!!previa.atualizacoes.length && !temErros && <>
        <p>Os valores lidos substituem os anteriores. Campos vazios preservam o resultado cadastrado.</p>
        <label className="laudo-conferencia"><input type="checkbox" checked={conferida} disabled={!!atividade}
          onChange={e => setConferida(e.target.checked)}/> Conferi as notas fiscais e os valores com o PDF.</label>
        <button type="button" className="primary" disabled={!conferida || !!atividade} onClick={gravar}>Confirmar atualização dos ensaios</button>
      </>}
    </section>}
  </div>;
}
