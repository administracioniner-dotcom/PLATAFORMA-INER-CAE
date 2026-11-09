export type Rol = "colaborador" | "delegado" | "admin" | "cliente";
export type Pago = "none" | "requested" | "paid";
export type Profile = { id: string; rol: Rol; nombre: string | null; email: string; estado: "invitado" | "activo"; created_at: string };
export type ClienteColab = {
  id: string; colaborador_id: string; nombre: string; fase: number; mwh: number | null; pct: number;
  comision: number | null; pago: Pago; solicitado_at: string | null; pagado_at: string | null; archivado_at: string | null; created_at: string;
};
/** Lo que ve el equipo de un cliente: sin la comisión calculada, pero con el precio por MWh de ese cliente. */
export type ClienteStaff = Omit<ClienteColab, "comision"> & { precio_mwh: number };
export type Mensaje = {
  id: number; colaborador_id: string; cliente_id: string | null; remitente: "colaborador" | "delegado" | "sistema";
  texto: string; leido: boolean; es_sistema: boolean; fecha: string;
};
export type Cambio = { cliente_id: string; fase_anterior: number | null; fase_nueva: number; fecha: string };

/* Mis clientes: clientes que INER lleva directamente, con la ficha y los documentos que se piden. */
export type FichaTipo = { id: string; codigo: string; nombre: string };
export type FichaDoc = { id: string; ficha_id: string; grupo: string; nombre: string; ayuda: string | null; depende_de: string | null; aviso_anios: number | null; orden: number; aporta: "cliente" | "iner" };
export type ClienteDirecto = { id: string; nombre: string; ficha_id: string; mwh: number | null; precio_mwh: number; fase: number; cobrado_at: string | null; created_at: string; usuario_id: string | null; email: string | null };
export type ObsFase = { id: number; cliente_id: string; fase: number; texto: string; created_at: string };
export type MarcaDoc = { cliente_id: string; documento_id: string; listo: boolean; fecha: string | null };
