import type { Resume } from "@/lib/schema";
import { SingleColumn } from "@/templates/shared/SingleColumn";
import styles from "./styles.module.css";

/** Executive: formal layout with centered, ruled section titles. */
export function ExecutiveTemplate({ data }: { data: Resume }) {
  return <SingleColumn data={data} styles={styles} />;
}
