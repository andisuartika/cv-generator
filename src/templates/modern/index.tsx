import { hasText } from "@/lib/format";
import type { Resume, SectionKey } from "@/lib/schema";
import { compactResume, getVisibleSections, SECTION_LABELS } from "@/lib/sections";
import { Link, SectionContent } from "@/templates/shared/SectionContent";
import { getContacts, hasHeaderContent, themeStyle } from "@/templates/shared/theme";
import styles from "./styles.module.css";

/** Short sections go in the sidebar. Each column keeps the user's section order. */
const SIDEBAR_SECTIONS: SectionKey[] = ["skills", "certificates", "languages"];

export function ModernTemplate({ data }: { data: Resume }) {
  const resume = compactResume(data);
  const { basics, theme } = resume;
  const sections = getVisibleSections(resume);
  const sidebar = sections.filter((key) => SIDEBAR_SECTIONS.includes(key));
  const main = sections.filter((key) => !SIDEBAR_SECTIONS.includes(key));

  const contacts = getContacts(basics);
  const hasContacts = contacts.length > 0 || hasText(basics.website);
  const hasPhoto = hasText(basics.photo);
  const hasSidebar = hasPhoto || hasContacts || sidebar.length > 0;
  const isEmpty = !hasSidebar && !hasHeaderContent(basics) && main.length === 0;

  const renderSections = (keys: SectionKey[]) =>
    keys.map((key) => (
      <section key={key} className={styles.section}>
        <h2 className={styles.heading}>{SECTION_LABELS[key]}</h2>
        <SectionContent section={key} data={resume} styles={styles} />
      </section>
    ));

  if (isEmpty) return <article className={styles.plain} style={themeStyle(theme)} />;

  return (
    <article
      className={`${styles.page} ${hasSidebar ? styles.withSidebar : ""}`}
      style={themeStyle(theme)}
    >
      {/* The main column comes first in the document so the name is read first. */}
      <div className={styles.main}>
        {(hasText(basics.name) || hasText(basics.title)) && (
          <header>
            {hasText(basics.name) && <h1 className={styles.name}>{basics.name}</h1>}
            {hasText(basics.title) && <p className={styles.title}>{basics.title}</p>}
          </header>
        )}
        {renderSections(main)}
      </div>
      {hasSidebar && (
        <aside className={styles.sidebar}>
          {hasPhoto && (
            // A plain <img> keeps data URLs intact for image and PDF export.
            // eslint-disable-next-line @next/next/no-img-element
            <img className={styles.photo} src={basics.photo} alt={`Foto ${basics.name}`.trim()} />
          )}
          {hasContacts && (
            <section className={styles.section}>
              <h2 className={styles.heading}>Kontak</h2>
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
            </section>
          )}
          {renderSections(sidebar)}
        </aside>
      )}
    </article>
  );
}
