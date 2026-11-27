import type { Resume } from "@/lib/schema";
import { SingleColumn } from "@/templates/shared/SingleColumn";
import styles from "./styles.module.css";

/** Editorial: section titles sit in a left column beside their entries. */
export function EditorialTemplate({ data }: { data: Resume }) {
  return <SingleColumn data={data} styles={styles} />;
}
