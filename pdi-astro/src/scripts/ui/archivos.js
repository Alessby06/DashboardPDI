// ===========================================================================
//  Cajas de archivo: foto y firma se abren tambien con el teclado
// ===========================================================================
//  Las cajas de foto son divs con onclick y la etiqueta de la firma es un
//  label. Con el raton funcionan, pero con el teclado no hay forma de
//  llegar a ellas ni de activarlas. Se les pone role="button" y tabindex
//  en el marcado; aqui solo se traduce Enter y Espacio a un clic real, que
//  aprovecha el onclick que ya tienen.
// ===========================================================================

const TECLAS_ACTIVADORAS = ["Enter", " ", "Spacebar"];

export function iniciarCajasArchivo() {
  const cajas = document.querySelectorAll("[data-caja-archivo]");

  cajas.forEach((caja) => {
    // Idempotente: con las transiciones de Astro el marcado se vuelve a
    // pintar y se puede llamar dos veces.
    if (caja.dataset.cajaArchivoLista === "1") return;
    caja.dataset.cajaArchivoLista = "1";

    caja.addEventListener("keydown", (evento) => {
      if (!TECLAS_ACTIVADORAS.includes(evento.key)) return;
      if (evento.altKey || evento.ctrlKey || evento.metaKey) return;
      evento.preventDefault();
      // .click() dispara el onclick nativo del label o del div, con lo que
      // el comportamiento es exactamente el mismo que con el raton.
      caja.click();
    });
  });
}
