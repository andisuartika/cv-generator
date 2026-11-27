import { hasText } from "@/lib/format";
import type { Resume, SectionKey } from "@/lib/schema";
import { SECTION_LABELS } from "@/lib/sections";
import { Link, SectionContent, type TemplateStyles } from "@/templates/shared/SectionContent";
import { getContacts } from "@/templates/shared/theme";

/** Contact lines and website as a list. Renders nothing when there are none. */
export function ContactList({ basics, styles }: { basics: Resume["basics"]; styles: TemplateStyles }) {
  const contacts = getContacts(basics);
  if (contacts.length === 0 && !hasText(basics.website)) return null;
  return (
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
  );
}

export function Photo({ basics, className }: { basics: Resume["basics"]; className?: string }) {
  if (!hasText(basics.photo)) return null;
  return (
    // A plain <img> keeps data URLs intact for image and PDF export.
    // eslint-disable-next-line @next/next/no-img-element
    <img className={className} src={basics.photo} alt={`Foto ${basics.name}`.trim()} />
  );
}

type SectionsProps = {
  keys: SectionKey[];
  /** Data that already went through compactResume. */
  data: Resume;
  styles: TemplateStyles;
};

/** Titled sections; the body wrapper lets a template lay out heading and entries. */
export function Sections({ keys, data, styles }: SectionsProps) {
  return keys.map((key) => (
    <section key={key} className={styles.section}>
      <h2 className={styles.heading}>{SECTION_LABELS[key]}</h2>
      <div className={styles.body}>
        <SectionContent section={key} data={data} styles={styles} />
      </div>
    </section>
  ));
}
