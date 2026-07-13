import { OnboardingWizard } from "./OnboardingWizard";
import styles from "./onboarding.module.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Onboarding — Em Círculo",
  description: "Configure seu círculo de cuidado e cadastre a pessoa assistida para iniciar.",
};

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function OnboardingPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const step = params.step === "2" ? 2 : 1;
  const careGroupId = (params.care_group_id as string) || "";

  return (
    <div className={styles.container}>
      <OnboardingWizard initialStep={step} initialCareGroupId={careGroupId} />
    </div>
  );
}
