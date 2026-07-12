"use client";

import { useState } from "react";
import type { DocumentResponse } from "@/types/api";
import { getPresignedUrl } from "@/app/actions/documents";
import { toast } from "sonner";
import styles from "./DocumentList.module.css";

interface DocumentListProps {
  groupId: string;
  documents: DocumentResponse[];
}

export function DocumentList({ groupId, documents }: DocumentListProps) {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleDownload = async (documentId: string) => {
    setDownloadingId(documentId);
    try {
      const response = await getPresignedUrl(groupId, documentId);
      if (response && response.url) {
        window.open(response.url, "_blank");
      } else {
        toast.error("URL de download inválida.");
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao gerar link de download.");
    } finally {
      setDownloadingId(null);
    }
  };

  if (documents.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p>Nenhum documento encontrado neste grupo.</p>
      </div>
    );
  }

  return (
    <div className={styles.list}>
      {documents.map((doc) => (
        <article key={doc.id} className={styles.card}>
          <div className={styles.info}>
            <h3 className={styles.title}>{doc.title}</h3>
            <p className={styles.detail}>
              <span className={styles.badge}>{doc.document_type}</span>
              Adicionado em: {new Date(doc.uploaded_at).toLocaleDateString("pt-BR")}
            </p>
          </div>
          <button
            onClick={() => handleDownload(doc.id)}
            disabled={downloadingId === doc.id}
            className={styles.button}
            aria-label={`Visualizar documento: ${doc.title}`}
          >
            {downloadingId === doc.id ? "Carregando..." : "Visualizar"}
          </button>
        </article>
      ))}
    </div>
  );
}
