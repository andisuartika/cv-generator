import type { Resume } from "@/lib/schema";
import { SidebarLayout } from "@/templates/shared/SidebarLayout";
import styles from "./styles.module.css";

/** Bold: solid dark sidebar with white text. */
export function BoldTemplate({ data }: { data: Resume }) {
  return <SidebarLayout data={data} styles={styles} />;
}
