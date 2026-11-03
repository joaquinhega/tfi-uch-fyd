import { ObjectId } from "mongodb";

// Patrón DAO (TP2 §4.1): la lógica de negocio no conoce MongoDB.
// Cambiar de motor implica reescribir solo esta clase.
export class UsuarioDao {
  constructor(db) {
    this.col = db.collection("usuarios");
  }

  buscarPorEmail(email) {
    return this.col.findOne({ email });
  }

  async crear(usuario) {
    const resultado = await this.col.insertOne(usuario);
    return { ...usuario, _id: resultado.insertedId };
  }

  async actualizarEstado(id, estado) {
    if (!ObjectId.isValid(id)) return null;
    return this.col.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { estado } },
      { returnDocument: "after" },
    );
  }

  listar(filtro = {}) {
    return this.col.find(filtro).sort({ creadoEn: -1 }).toArray();
  }
}