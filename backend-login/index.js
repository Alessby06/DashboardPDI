import express from "express";
import cors from "cors";
import { Surreal } from "surrealdb";

const app = express();
const PORT = 3001;

const db = new Surreal();

app.use(cors());
app.use(express.json());

async function conectarDB() {
  await db.connect("http://127.0.0.1:8001");

  await db.signin({
    username: "root",
    password: "root"
  });

  await db.use({
    namespace: "pdi",
    database: "pdi"
  });

  console.log("Conectado a SurrealDB");
}

app.get("/", (req, res) => {
  res.send("Backend Login funcionando");
});

// LOGIN
app.post("/api/login", async (req, res) => {
  const { correo, usuario, password } = req.body;

  const identificador = correo || usuario;

  try {
    const resultado = await db.query(`
      SELECT id, usuario, correo, password, rol
      FROM usuarios
      WHERE correo = $identificador OR usuario = $identificador
    `, {
      identificador
    });

    const usuarios = resultado[0];

    if (usuarios.length === 0) {
      return res.status(401).json({
        mensaje: "Usuario o contraseña incorrectos"
      });
    }

    const usuarioEncontrado = usuarios[0];

    const correcta = await db.query(`
      RETURN crypto::argon2::compare($hash, $password)
    `, {
      hash: usuarioEncontrado.password,
      password
    });

    const contraseñaCorrecta = correcta[0];

    if (!contraseñaCorrecta) {
      return res.status(401).json({
        mensaje: "Usuario o contraseña incorrectos"
      });
    }

    // Registrar inicio de sesión
    const nuevaSesion = await db.query(`
      CREATE sesiones SET
        usuario_id = $usuarioId,
        inicio = time::now()
    `, {
      usuarioId: usuarioEncontrado.id
    });

    const sesion = nuevaSesion[0][0];

    res.json({
      mensaje: "Inicio de sesión exitoso",
      usuario: usuarioEncontrado.usuario,
      correo: usuarioEncontrado.correo,
      rol: usuarioEncontrado.rol,
      sesionId: sesion.id
    });

  } catch (error) {
    console.error("Error en login:", error);

    res.status(500).json({
      mensaje: "Error interno del servidor"
    });
  }
});

// RECUPERAR CONTRASEÑA
app.post("/api/recuperar", async (req, res) => {
  const { correo, codigo, nuevaPassword } = req.body;

  try {
    const resultado = await db.query(`
      SELECT id
      FROM usuarios
      WHERE correo = $correo
    `, {
      correo
    });

    const usuarios = resultado[0];

    if (usuarios.length === 0) {
      return res.status(400).json({
        mensaje: "Correo o código incorrecto"
      });
    }

    const usuarioId = usuarios[0].id;

    const resultadoCodigo = await db.query(`
      SELECT id
      FROM codigos_respaldo
      WHERE usuario_id = $usuarioId
        AND codigo = $codigo
        AND usado = false
    `, {
      usuarioId,
      codigo
    });

    const codigos = resultadoCodigo[0];

    if (codigos.length === 0) {
      return res.status(400).json({
        mensaje: "Correo o código incorrecto"
      });
    }

    // Generar hash Argon2 para la nueva contraseña
    const hash = await db.query(`
      RETURN crypto::argon2::generate($password)
    `, {
      password: nuevaPassword
    });

    const nuevaPasswordHash = hash[0];

    // Actualizar contraseña
    await db.query(`
      UPDATE type::record($usuarioId)
      SET password = $password
    `, {
      usuarioId,
      password: nuevaPasswordHash
    });

    // Marcar código como utilizado
    await db.query(`
      UPDATE type::record($codigoId)
      SET usado = true
    `, {
      codigoId: codigos[0].id
    });

    res.json({
      mensaje: "Contraseña actualizada correctamente"
    });

  } catch (error) {
    console.error("Error en recuperación:", error);

    res.status(500).json({
      mensaje: "Error interno del servidor"
    });
  }
});

// CERRAR SESIÓN
app.post("/api/logout", async (req, res) => {
  const { sesionId } = req.body;

  try {
    await db.query(`
      UPDATE type::record($sesionId)
      SET cierre = time::now()
    `, {
      sesionId
    });

    res.json({
      mensaje: "Sesión cerrada correctamente"
    });

  } catch (error) {
    console.error("Error al cerrar sesión:", error);

    res.status(500).json({
      mensaje: "Error interno del servidor"
    });
  }
});

async function iniciarServidor() {
  try {
    await conectarDB();

    app.listen(PORT, () => {
      console.log(`Backend Login ejecutándose en http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("No se pudo iniciar el servidor:", error);
  }
}

iniciarServidor();