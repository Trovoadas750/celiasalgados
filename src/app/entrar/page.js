import { Suspense } from "react";
import Entrar from "./Entrar";

export const metadata = { title: "Entrar" };

export default function EntrarPage() {
  return (
    <Suspense>
      <Entrar />
    </Suspense>
  );
}
