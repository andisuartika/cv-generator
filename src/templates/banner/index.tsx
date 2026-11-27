import type { Resume } from "@/lib/schema";
import { SingleColumn } from "@/templates/shared/SingleColumn";
import styles from "./styles.module.css";

/** Banner: a full-width colored header above a single column. */
export function BannerTemplate({ data }: { data: Resume }) {
  return <SingleColumn data={data} styles={styles} showPhoto />;
}
