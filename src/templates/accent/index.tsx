import type { Resume } from "@/lib/schema";
import { SingleColumn } from "@/templates/shared/SingleColumn";
import styles from "./styles.module.css";

/** Accent: a colored bar runs down the left edge. */
export function AccentTemplate({ data }: { data: Resume }) {
  return <SingleColumn data={data} styles={styles} showPhoto />;
}
