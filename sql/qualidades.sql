-- Troca "sabores" por "qualidades" na descrição dos pacotes (ex.: "Escolha até 2 sabores").
-- Rodar no Supabase: SQL Editor > New query > colar > Run.
-- O site já faz essa troca na tela; isto corrige o texto na origem.

update produtos
set descricao = replace(replace(descricao, 'sabores', 'qualidades'), 'sabor', 'qualidade')
where categoria = 'kit'
  and descricao ilike '%sabor%';

-- Conferência: nenhuma linha deve aparecer.
select id, nome, descricao from produtos where descricao ilike '%sabor%';
