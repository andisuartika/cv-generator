import type { Resume } from "@/lib/schema";
import { SingleColumn } from "@/templates/shared/SingleColumn";
import styles from "./styles.module.css";

/** Timeline: dated entries hang from a vertical line. */
export function TimelineTemplate({ data }: { data: Resume }) {
  return <SingleColumn data={data} styles={styles} showPhoto />;
}
