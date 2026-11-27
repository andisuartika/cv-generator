import { hasText } from "@/lib/format";
import type { Resume } from "@/lib/schema";
import { compactResume, getVisibleSections } from "@/lib/sections";
import { ContactList, Photo, Sections } from "@/templates/shared/blocks";
import type { TemplateStyles } from "@/templates/shared/SectionContent";
import { hasHeaderContent, themeStyle } from "@/templates/shared/theme";

type SingleColumnProps = {
  data: Resume;
  styles: TemplateStyles;
  showPhoto?: boolean;
};

/**
 * Header followed by one column of sections. Templates built on this differ
 * only in their CSS module.
 */
export function SingleColumn({ data, styles, showPhoto = false }: SingleColumnProps) {
  const resume = compactResume(data);
  const { basics, theme } = resume;
  const sections = getVisibleSections(resume);
  const photo = showPhoto && hasText(basics.photo);
  const hasHeader = hasHeaderContent(basics) || photo;
  const isEmpty = !hasHeader && sections.length === 0;

  return (
    <article className={isEmpty ? styles.blank : styles.page} style={themeStyle(theme)}>
      {hasHeader && (
        <header className={styles.header}>
          <div className={styles.headerText}>
            <div className={styles.identity}>
              {hasText(basics.name) && <h1 className={styles.name}>{basics.name}</h1>}
              {hasText(basics.title) && <p className={styles.title}>{basics.title}</p>}
            </div>
            <ContactList basics={basics} styles={styles} />
          </div>
          {photo && <Photo basics={basics} className={styles.photo} />}
        </header>
      )}
      <Sections keys={sections} data={resume} styles={styles} />
    </article>
  );
}
