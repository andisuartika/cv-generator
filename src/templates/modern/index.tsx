import type { Resume } from "@/lib/schema";
import { SidebarLayout } from "@/templates/shared/SidebarLayout";
import styles from "./styles.module.css";

export function ModernTemplate({ data }: { data: Resume }) {
  return <SidebarLayout data={data} styles={styles} />;
}
