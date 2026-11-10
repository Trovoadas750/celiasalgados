import PaginaLegal from "@/components/PaginaLegal";

export const metadata = { title: "Política de privacidade" };

export default function PrivacidadePage() {
  return (
    <PaginaLegal titulo="Política de privacidade" atualizadoEm="21 de outubro de 2026">
      <section>
        <p>
          A Edna &amp; Célia Salgados respeita a sua privacidade e segue a Lei Geral de Proteção de Dados (LGPD, Lei nº
          13.709/2018). Aqui explicamos quais dados coletamos e para que eles servem.
        </p>
      </section>

      <section>
        <h2>1. Dados que coletamos</h2>
        <ul>
          <li>Nome, sobrenome e telefone, informados no cadastro.</li>
          <li>Endereço de entrega, quando você escolhe receber em casa.</li>
          <li>Histórico de pedidos e forma de pagamento escolhida.</li>
        </ul>
        <p>Não guardamos dados de cartão. O pagamento é feito na entrega.</p>
      </section>

      <section>
        <h2>2. Para que usamos</h2>
        <ul>
          <li>Preparar, entregar e acompanhar os seus pedidos.</li>
          <li>Entrar em contato sobre um pedido, se necessário.</li>
          <li>Mostrar o seu histórico na página Pedidos.</li>
        </ul>
        <p>Não vendemos nem compartilhamos seus dados para fins de propaganda.</p>
      </section>

      <section>
        <h2>3. Onde os dados ficam</h2>
        <p>
          Os dados ficam guardados em um serviço de banco de dados seguro (Supabase). O seu navegador também guarda a
          sacola e a sessão da sua conta, para você não precisar entrar de novo a cada visita.
        </p>
      </section>

      <section>
        <h2>4. Seus direitos</h2>
        <p>
          Você pode pedir a qualquer momento para ver, corrigir ou apagar os seus dados. Para isso, fale com a gente pelo
          WhatsApp, no rodapé do site.
        </p>
      </section>

      <section>
        <h2>5. Mudanças nesta política</h2>
        <p>Se esta política mudar, a data de atualização no topo da página também muda.</p>
      </section>
    </PaginaLegal>
  );
}
