export type Rol = "colaborador" | "delegado" | "admin";
export type Pago = "none" | "requested" | "paid";
export type Profile = { id: string; rol: Rol; nombre: string | null; email: string; estado: "invitado" | "activo"; created_at: string };
export type ClienteColab = {
  id: string; colaborador_id: string; nombre: string; fase: number; mwh: number | null; pct: number;
  comision: number | null; pago: Pago; solicitado_at: string | null; pagado_at: string | null; archivado_at: string | null; created_at: string;
};
export type ClienteStaff = Omit<ClienteColab, "comision">;
export type Mensaje = {
  id: number; colaborador_id: string; cliente_id: string | null; remitente: "colaborador" | "delegado" | "sistema";
  texto: string; leido: boolean; es_sistema: boolean; fecha: string;
};
