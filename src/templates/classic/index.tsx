import { hasText } from "@/lib/format";
import type { Resume } from "@/lib/schema";
import { compactResume, getVisibleSections, SECTION_LABELS } from "@/lib/sections";
import { Link, SectionContent } from "@/templates/shared/SectionContent";
import { getContacts, hasHeaderContent, themeStyle } from "@/templates/shared/theme";
import styles from "./styles.module.css";

export function ClassicTemplate({ data }: { data: Resume }) {
  const resume = compactResume(data);
  const { basics, theme } = resume;
  const sections = getVisibleSections(resume);

  const contacts = getContacts(basics);
  const hasHeader = hasHeaderContent(basics) || hasText(basics.photo);

  return (
    <article className={styles.page} style={themeStyle(theme)}>
      {hasHeader && (
        <header className={styles.header}>
          <div className={styles.headerText}>
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
          </div>
          {hasText(basics.photo) && (
            // A plain <img> keeps data URLs intact for image and PDF export.
            // eslint-disable-next-line @next/next/no-img-element
            <img className={styles.photo} src={basics.photo} alt={`Foto ${basics.name}`.trim()} />
          )}
        </header>
      )}
      {sections.map((key) => (
        <section key={key} className={styles.section}>
          <h2 className={styles.heading}>{SECTION_LABELS[key]}</h2>
          <SectionContent section={key} data={resume} styles={styles} />
        </section>
      ))}
    </article>
  );
}
