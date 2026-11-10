import PaginaLegal from "@/components/PaginaLegal";

export const metadata = { title: "Termos de uso" };

export default function TermosPage() {
  return (
    <PaginaLegal titulo="Termos de uso" atualizadoEm="21 de outubro de 2026">
      <section>
        <h2>1. Sobre o site</h2>
        <p>
          Este site é o cardápio online da Edna &amp; Célia Salgados. Por ele você consulta nossos produtos, monta sua
          sacola e faz pedidos de salgados, kits para festa e refrigerantes. Ao usar o site, você concorda com estes
          termos.
        </p>
      </section>

      <section>
        <h2>2. Conta do cliente</h2>
        <p>
          Para fazer pedidos, você cria uma conta com nome, telefone e senha. Mantenha sua senha em segredo: os pedidos
          feitos com a sua conta são de sua responsabilidade. Informe dados verdadeiros, para que a gente consiga
          confirmar e entregar o pedido.
        </p>
      </section>

      <section>
        <h2>3. Pedidos e preços</h2>
        <ul>
          <li>Os preços e produtos podem mudar sem aviso. Vale o preço mostrado no momento do pedido.</li>
          <li>O pedido só é confirmado depois que a loja recebe e aceita.</li>
          <li>Alguns itens podem acabar. Se isso acontecer, entraremos em contato para combinar uma troca ou ajuste.</li>
        </ul>
      </section>

      <section>
        <h2>4. Pagamento</h2>
        <p>
          Aceitamos Pix, dinheiro e cartão de crédito ou débito. O pagamento é combinado na entrega. Se precisar de troco,
          informe no pedido.
        </p>
      </section>

      <section>
        <h2>5. Cancelamentos</h2>
        <p>
          Para cancelar ou alterar um pedido, fale com a gente pelo WhatsApp o quanto antes. Pedidos que já estão em
          preparo podem não ser cancelados, principalmente encomendas para festas.
        </p>
      </section>

      <section>
        <h2>6. Contato</h2>
        <p>Dúvidas sobre estes termos? Fale com a gente pelo WhatsApp ou pelas redes sociais, no rodapé do site.</p>
      </section>
    </PaginaLegal>
  );
}
