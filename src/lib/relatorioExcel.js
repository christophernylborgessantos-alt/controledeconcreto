import {opcional63} from './regras.js';

export async function gerarExcelRelatorio(relatorio){
  if(!relatorio.notas.length)throw Error('Selecione pelo menos uma nota para exportar.');
  const {default:ExcelJS}=await import('exceljs');
  const livro=new ExcelJS.Workbook();
  livro.creator='Controle de concreto';
  const folha=livro.addWorksheet('Notas e ensaios');
  folha.columns=[
    ['Data',13],['NF',18],['Resistência (MPa)',22],['Local',32],['Volume (m³)',18],['Volume teórico (m³)',25],
    ['7 dias R1',18],['7 dias R2',18],['28 dias R1',18],['28 dias R2',18],['63 dias R1',18],['63 dias R2',18]
  ].map(([header,width])=>({header,width}));
  folha.views=[{state:'frozen',ySplit:1}];
  for(const nota of relatorio.notas){
    const resultados=[7,28,63].flatMap(idade=>nota.ensaios[idade].resultados.map(v=>nota.nao_estrutural?'Não necessário':v===null&&idade===63&&opcional63(nota)?'Opcional':v));
    const linha=folha.addRow([new Date(nota.data+'T00:00:00Z'),String(nota.numero),nota.fck,nota.local,nota.volume,null,...resultados]);
    linha.getCell(1).numFmt='dd/mm/yyyy';
    linha.getCell(2).numFmt='@';
    for(const coluna of [3,5,6,7,8,9,10,11,12])linha.getCell(coluna).numFmt='0.00####';
    linha.height=28;
    linha.eachCell({includeEmpty:true},celula=>{
      celula.font={name:'Arial',size:11,color:{argb:'FF173C3F'}};
      celula.alignment={vertical:'middle',wrapText:true};
      celula.border={bottom:{style:'thin',color:{argb:'FFD7E3E4'}}};
      if(linha.number%2===0)celula.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FFF0F6F6'}};
    });
    if(!nota.nao_estrutural)for(const [indice,idade] of [7,28,63].entries()){
      const e=nota.ensaios[idade];
      e.resultados.forEach((v,i)=>{if(v!==null&&e.esperado!==null&&v<e.esperado)linha.getCell(7+indice*2+i).font={name:'Arial',size:11,bold:true,color:{argb:'FFB42318'}}});
    }
  }
  const ultima=folha.rowCount;
  folha.autoFilter={from:'A1',to:`L${ultima}`};
  const total=folha.addRow(['Total',null,null,null,{formula:`SUBTOTAL(109,E2:E${ultima})`,result:relatorio.volume},relatorio.teorico??'Não informado']);
  total.getCell(5).numFmt='0.00####';
  total.getCell(6).numFmt='0.00####';
  total.font={name:'Arial',size:11,bold:true,color:{argb:'FF173C3F'}};
  total.height=26;
  const cabecalho=folha.getRow(1);
  cabecalho.height=26;
  cabecalho.font={name:'Arial',size:11,bold:true,color:{argb:'FFFFFFFF'}};
  cabecalho.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF006A70'}};
  cabecalho.alignment={vertical:'middle',horizontal:'left',wrapText:false};
  folha.pageSetup={paperSize:9,orientation:'landscape',fitToPage:true,fitToWidth:1,fitToHeight:0,printTitlesRow:'1:1',printArea:`A1:L${folha.rowCount}`};
  folha.headerFooter={oddHeader:`&LControle de concreto&C${relatorio.obra.nome.replaceAll('&','&&')}`,oddFooter:'&LResistências em MPa · Volumes em m³&R Página &P de &N'};
  return livro.xlsx.writeBuffer();
}
