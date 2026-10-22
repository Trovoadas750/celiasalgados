-- Refrigerantes do cardápio (categoria 'refrigerante', vendidos por unidade, sem imagem).
-- Se o produto já existir (mesmo nome), atualiza preço e reativa; se não existir, cria.
-- Rode no SQL Editor do Supabase. Tudo numa transação: se algo falhar, nada muda.

begin;

with novos (nome, preco, ordem) as (
  values
    ('Coca-Cola 2L',            15.90, 1),
    ('Coca-Cola 600ml',          9.90, 2),
    ('Guaraná Conquista 2L',    11.90, 3),
    ('Guaraná Conquista 600ml',  6.90, 4)
),
atualizados as (
  update public.produtos p
     set preco = n.preco,
         ordem = n.ordem,
         ativo = true,
         imagem_url = null
    from novos n
   where p.nome = n.nome
     and p.categoria = 'refrigerante'
  returning p.nome
)
insert into public.produtos (categoria, nome, preco, ordem, ativo, imagem_url)
select 'refrigerante', n.nome, n.preco, n.ordem, true, null
  from novos n
 where n.nome not in (select nome from atualizados)
   and not exists (
     select 1 from public.produtos p where p.nome = n.nome and p.categoria = 'refrigerante'
   );

commit;

-- Conferência: devem aparecer os 4, ativos, com os preços acima.
select id, nome, preco, ordem, ativo, imagem_url
  from public.produtos
 where categoria = 'refrigerante'
 order by ordem, nome;
