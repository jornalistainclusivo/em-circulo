import { MedicationPanel } from "@/components/MedicationPanel";
import type { MedicationProtocol, ISODateString } from "@/types";
import styles from "./page.module.css";
import { logMedicationAction } from "../actions";

const DEMO_PROTOCOLS: MedicationProtocol[] = [
  {
    id: "p1a2b3c4-d5e6-7890-abcd-ef1234567890",
    care_recipient_id: "b2c3d4e5-f6a7-8901-bcde-f12345678901",
    medication_name: "Losartana Potássica",
    dosage: "50mg",
    frequency_interval_hours: 12,
    stock_count: 60,
    safety_threshold: 10,
    created_at: "2026-06-01T10:00:00Z" as ISODateString,
    updated_at: "2026-06-01T10:00:00Z" as ISODateString,
  },
  {
    id: "p2b3c4d5-e6f7-8901-bcde-f12345678901",
    care_recipient_id: "b2c3d4e5-f6a7-8901-bcde-f12345678901",
    medication_name: "Dipirona Monoidratada",
    dosage: "500mg",
    frequency_interval_hours: 8,
    stock_count: 8,
    safety_threshold: 10,
    created_at: "2026-06-02T10:00:00Z" as ISODateString,
    updated_at: "2026-06-02T10:00:00Z" as ISODateString,
  },
];

async function fetchProtocols(): Promise<MedicationProtocol[]> {
  try {
    const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:8000";
    const recipient_id = "b2c3d4e5-f6a7-8901-bcde-f12345678901"; // Mock recipient ID
    const res = await fetch(`${API_BASE_URL}/api/v1/care-recipients/${recipient_id}/protocols`, { cache: "no-store" });
    if (res.ok) {
      return (await res.json()) as MedicationProtocol[];
    }
  } catch (error) {
    console.warn("FastAPI indisponível ou rota de medicamentos não encontrada. Usando DEMO_PROTOCOLS fallback:", error);
  }
  return DEMO_PROTOCOLS;
}

export default async function MedicamentosPage() {
  const protocols = await fetchProtocols();

  return (
    <article className={styles.container}>
      <header className={styles.pageHeader}>
        <h1>Farmácia</h1>
        <p>
          Controle os medicamentos, registre doses administradas e monitore o estoque da sua família.
        </p>
      </header>
      
      <MedicationPanel protocols={protocols} onLogMedication={logMedicationAction} />
    </article>
  );
}
