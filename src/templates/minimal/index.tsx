import { hasText } from "@/lib/format";
import type { Resume } from "@/lib/schema";
import { compactResume, getVisibleSections, SECTION_LABELS } from "@/lib/sections";
import { Link, SectionContent } from "@/templates/shared/SectionContent";
import { getContacts, hasHeaderContent, themeStyle } from "@/templates/shared/theme";
import styles from "./styles.module.css";

/** Single column without a photo; spacing and thin rules carry the layout. */
export function MinimalTemplate({ data }: { data: Resume }) {
  const resume = compactResume(data);
  const { basics, theme } = resume;
  const contacts = getContacts(basics);

  return (
    <article className={styles.page} style={themeStyle(theme)}>
      {hasHeaderContent(basics) && (
        <header className={styles.header}>
          {hasText(basics.name) && <h1 className={styles.name}>{basics.name}</h1>}
          {hasText(basics.title) && <p className={styles.title}>{basics.title}</p>}
          {(contacts.length > 0 || hasText(basics.website)) && (
            <ul className={styles.contacts}>
              {contacts.map((contact, index) => (
                <li key={index}>{contact}</li>
              ))}
              {hasText(basics.website) && (
                <li>
                  <Link value={basics.website} className={styles.link} />
                </li>
              )}
            </ul>
          )}
        </header>
      )}
      {getVisibleSections(resume).map((key) => (
        <section key={key} className={styles.section}>
          <h2 className={styles.heading}>{SECTION_LABELS[key]}</h2>
          <SectionContent section={key} data={resume} styles={styles} />
        </section>
      ))}
    </article>
  );
}
