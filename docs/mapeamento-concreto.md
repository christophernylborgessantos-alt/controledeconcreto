# Mapeamento de concreto

Escolha a obra e abra Mapeamento no menu. Novo mapa permite informar a peça, selecionar um local e definir o período inclusivo pela aplicação. As notas desse local aparecem automaticamente, com volumes e acumulado. Insira a imagem de rastreabilidade (JPG, PNG ou WebP, até 2 MB), betoneira e horários por nota; a duração é automática. Clique em Salvar mapa.

O seletor Mapas desta obra reabre mapas salvos. Alterações nas notas atualizam dados/volumes do mapa após recarregar o app; não são fotografias congeladas das notas. Mudar o local/período e salvar remove do mapa os horários de notas que saíram dessa seleção, preservando as notas originais.

Imprimir / salvar como PDF fica disponível quando as alterações estão salvas. Excluir mapa abre confirmação, removendo mapa/imagem/horários e preservando notas/ensaios. Excluir obra remove também seus mapas. Cliente consulta e imprime; Engenheiro e Analista podem criar, editar e excluir.

As imagens são armazenadas no banco junto ao mapa, sob RLS; a lista carrega só metadados. Isso mantém salvamento/exclusão atômicos, sem arquivos órfãos. O limite de 2 MB deve ser mantido; para volumes de imagens maiores, migrar imagens para armazenamento de arquivos com gestão de ciclo de vida.

Ao abrir um mapa, a versão é conferida antes e depois da leitura dos itens. Se alguém salvar durante esse carregamento, a abertura é interrompida e pede recarga; evita sobrescrever horários novos com uma leitura antiga.
