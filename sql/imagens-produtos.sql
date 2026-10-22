-- Imagens dos produtos (coluna produtos.imagem_url).
-- Arquivos em public/produtos/ (servidos pelo Next em /produtos/...).
-- Regra: uma foto por tipo de produto, compartilhada entre os sabores daquele tipo.
-- Quem não tem foto fica com imagem_url = null (o site mostra o placeholder).
--
-- Rode no SQL Editor do Supabase. Tudo numa transação: se algo falhar, nada muda.

begin;

-- Fritos
update public.produtos set imagem_url = '/produtos/coxinha.webp'          where nome = 'Coxinha de frango';
update public.produtos set imagem_url = '/produtos/kibes.webp'            where nome = 'Kibe de carne';
update public.produtos set imagem_url = '/produtos/bolinhadequeijo.webp'  where nome = 'Bolinha de queijo';
update public.produtos set imagem_url = '/produtos/enroladosalsisha.webp' where nome = 'Enrolado de salsicha';
update public.produtos set imagem_url = '/produtos/risoles.webp'          where nome = 'Risole de queijo';
update public.produtos set imagem_url = '/produtos/risoles.webp'          where nome = 'Risole de frango com catupiry';
update public.produtos set imagem_url = '/produtos/risoles.webp'          where nome = 'Risole de palmito';
update public.produtos set imagem_url = '/produtos/risoles.webp'          where nome = 'Risole de carne';
update public.produtos set imagem_url = '/produtos/croquetemilho.webp'    where nome = 'Croquete de milho';

-- Assados
update public.produtos set imagem_url = '/produtos/esfihas.webp'          where nome = 'Esfiha de frango com catupiry';
update public.produtos set imagem_url = '/produtos/esfihas.webp'          where nome = 'Esfiha de carne';
update public.produtos set imagem_url = '/produtos/minihamburguer.webp'   where nome = 'Mini hambúrguer';
update public.produtos set imagem_url = '/produtos/minipizzas.webp'       where nome = 'Mini pizza de presunto e queijo';
update public.produtos set imagem_url = '/produtos/minipizzas.webp'       where nome = 'Mini pizza de queijo';

-- Variados
update public.produtos set imagem_url = '/produtos/pastelzinho.webp'      where nome = 'Mini pastel de carne';
update public.produtos set imagem_url = '/produtos/pastelzinho.webp'      where nome = 'Mini pastel de pizza';
update public.produtos set imagem_url = '/produtos/pastelzinho.webp'      where nome = 'Mini pastel de queijo';
update public.produtos set imagem_url = '/produtos/palitosdequeijo.webp'  where nome = 'Palito de queijo';

-- Sem foto: ficam sem imagem (placeholder no site)
update public.produtos set imagem_url = null where nome = 'Medalhão de presunto e queijo';
update public.produtos set imagem_url = null where nome = 'Mini churros de doce de leite';
update public.produtos set imagem_url = null where categoria = 'kit';           -- pacotes 30 / 50 / Cento
update public.produtos set imagem_url = null where categoria = 'refrigerante';  -- refrigerantes nunca têm imagem

commit;

-- Conferência: os 18 sabores com foto devem aparecer com imagem_url preenchido.
select categoria, tipo_salgado, nome, imagem_url
from public.produtos
order by categoria, tipo_salgado nulls first, imagem_url nulls last, nome;
