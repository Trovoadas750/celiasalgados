-- Molhos do cardápio (categoria 'molho', vendidos por unidade, sem imagem).
-- Se o produto já existir (mesmo nome), atualiza preço e reativa; se não existir, cria.
-- Rode no SQL Editor do Supabase. Tudo numa transação: se algo falhar, nada muda.

begin;

with novos (nome, descricao, preco, ordem) as (
  values
    ('Molho de pimenta', 'Potinho de molho de pimenta', 1.50, 1)
),
atualizados as (
  update public.produtos p
     set descricao = n.descricao,
         preco = n.preco,
         ordem = n.ordem,
         ativo = true,
         imagem_url = null
    from novos n
   where p.nome = n.nome
     and p.categoria = 'molho'
  returning p.nome
)
insert into public.produtos (categoria, nome, descricao, preco, ordem, ativo, imagem_url)
select 'molho', n.nome, n.descricao, n.preco, n.ordem, true, null
  from novos n
 where n.nome not in (select nome from atualizados)
   and not exists (
     select 1 from public.produtos p where p.nome = n.nome and p.categoria = 'molho'
   );

commit;

-- Conferência: deve aparecer o molho, ativo, a R$ 1,50.
select id, categoria, nome, descricao, preco, ordem, ativo
  from public.produtos
 where categoria = 'molho'
 order by ordem, nome;
