const projectSelection = document.getElementById("projectSelection");
if (localStorage.getItem("pdi_sesion") !== "activa") {
  projectSelection.style.display = "flex";
}
const loginScreen = document.getElementById("loginScreen");
const recoveryScreen = document.getElementById("recoveryScreen");
const btnRecuperar = document.getElementById("btnRecuperar");
const btnVolverLogin = document.getElementById("btnVolverLogin");

const btnInfanciaSaludable = document.getElementById("btnInfanciaSaludable");
const btnMamitas = document.getElementById("btnMamitas");

let proyectoSeleccionado = "";

const loginForm = document.getElementById("loginForm");
const loginMensaje = document.getElementById("loginMensaje");

btnRecuperar.addEventListener("click", () => {
  loginScreen.style.display = "none";
  recoveryScreen.style.display = "flex";
});

btnVolverLogin.addEventListener("click", () => {
  recoveryScreen.style.display = "none";
  loginScreen.style.display = "flex";
});

const recoveryForm = document.getElementById("recoveryForm");
const recoveryMensaje = document.getElementById("recoveryMensaje");

recoveryForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const correo = document.getElementById("recoveryCorreo").value;
  const codigo = document.getElementById("recoveryCodigo").value;
  const nuevaPassword = document.getElementById("recoveryPassword").value;

  try {
    const respuesta = await fetch("http://localhost:3001/api/recuperar", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        correo: correo,
        codigo: codigo,
        nuevaPassword: nuevaPassword
      })
    });

    const datos = await respuesta.json();

    recoveryMensaje.textContent = datos.mensaje;

    if (!respuesta.ok) {
      return;
    }

    recoveryForm.reset();

  } catch (error) {
    console.error("Error al recuperar contraseña:", error);
    recoveryMensaje.textContent = "No se pudo conectar con el servidor";
  }
});

function showLogin(proyecto) {
  proyectoSeleccionado = proyecto;

  console.log("Proyecto seleccionado:", proyectoSeleccionado);

  projectSelection.style.display = "none";
  loginScreen.style.display = "flex";
}

btnInfanciaSaludable.addEventListener("click", () => {
  showLogin("Infancia Saludable");
});

btnMamitas.addEventListener("click", () => {
  showLogin("Mamitas");
});

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const usuario = document.getElementById("loginUsuario").value;
  const password = document.getElementById("loginPassword").value;

  try {
    const respuesta = await fetch("http://localhost:3001/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        usuario: usuario,
        password: password
      })
    });

    const datos = await respuesta.json();

    if (!respuesta.ok) {
      loginMensaje.textContent = datos.mensaje;
      return;
    }

    console.log("Login correcto:", datos);

    localStorage.setItem("pdi_sesion", "activa");
    localStorage.setItem("pdi_proyecto", proyectoSeleccionado);
    localStorage.setItem("pdi_sesion_id", datos.sesionId);

    window.location.href = "./dashboard.html";
  } catch (error) {
    console.error("Error al conectar con el backend:", error);
    loginMensaje.textContent = "No se pudo conectar con el servidor";
  }

});

