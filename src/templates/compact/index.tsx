import type { Resume } from "@/lib/schema";
import { SingleColumn } from "@/templates/shared/SingleColumn";
import styles from "./styles.module.css";

/** Compact: tight spacing for resumes with a lot of content. */
export function CompactTemplate({ data }: { data: Resume }) {
  return <SingleColumn data={data} styles={styles} />;
}
