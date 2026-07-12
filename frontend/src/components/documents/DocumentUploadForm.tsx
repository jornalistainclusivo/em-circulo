"use client";

import { useRef, useEffect, useActionState } from "react";
import { uploadDocumentAction } from "@/app/actions/documents";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import styles from "./DocumentUploadForm.module.css";

interface DocumentUploadFormProps {
  groupId: string;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png"];

export function DocumentUploadForm({ groupId }: DocumentUploadFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  const uploadWithId = uploadDocumentAction.bind(null, groupId);
  const [state, formAction, isPending] = useActionState(uploadWithId, null);

  useEffect(() => {
    if (state) {
      if (state.success) {
        toast.success(state.message || "Documento enviado com sucesso!");
        formRef.current?.reset();
        router.refresh();
      } else {
        toast.error(state.error || "Erro ao enviar o documento.");
      }
    }
  }, [state, router]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    // Validação client-side antes de despachar a action
    const formData = new FormData(e.currentTarget);
    const file = formData.get("file") as File;

    if (!file || file.size === 0) {
      e.preventDefault();
      toast.error("Por favor, selecione um arquivo.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      e.preventDefault();
      toast.error("O arquivo excede o limite de 10MB.");
      return;
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      e.preventDefault();
      toast.error("Formato não permitido. Use PDF, JPG ou PNG.");
      return;
    }
  };

  return (
    <div className={styles.card}>
      <h2 className={styles.title}>Enviar Novo Documento</h2>
      <form ref={formRef} action={formAction} onSubmit={handleSubmit} className={styles.form} aria-label="Formulário de upload de documento">
        <div className={styles.formGroup}>
          <label htmlFor="title" className={styles.label}>Título do Documento</label>
          <input 
            type="text" 
            id="title" 
            name="title" 
            required 
            className={styles.input} 
            placeholder="Ex: Receita de Insulina" 
            aria-required="true"
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="document_type" className={styles.label}>Tipo de Documento</label>
          <select id="document_type" name="document_type" required className={styles.select} aria-required="true">
            <option value="RECEITA">Receita Médica</option>
            <option value="LAUDO">Laudo</option>
            <option value="EXAME">Exame</option>
            <option value="OUTROS">Outros</option>
          </select>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="file" className={styles.label}>Arquivo</label>
          <input 
            type="file" 
            id="file" 
            name="file" 
            required 
            accept=".pdf,.jpg,.jpeg,.png"
            className={styles.input} 
            aria-required="true"
            aria-describedby="file-helper"
          />
          <span id="file-helper" className={styles.fileHelper}>Tamanho máximo: 10MB. Formatos: PDF, JPG, PNG.</span>
        </div>

        <button type="submit" disabled={isPending} className={styles.button}>
          {isPending ? "Enviando..." : "Enviar Documento"}
        </button>
      </form>
    </div>
  );
}
