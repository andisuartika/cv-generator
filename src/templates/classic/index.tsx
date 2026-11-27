import type { CSSProperties, ReactNode } from "react";
import { formatDateRange, hasText, toSafeUrl } from "@/lib/format";
import type { Resume, SectionKey } from "@/lib/schema";
import { compactResume, getVisibleSections, SECTION_LABELS } from "@/lib/sections";
import styles from "./styles.module.css";

const join = (parts: (string | undefined)[], separator: string) =>
  parts.filter(hasText).join(separator);

function Link({ value }: { value: string }) {
  const href = toSafeUrl(value);
  if (!href) return <span>{value}</span>;
  return (
    <a className={styles.link} href={href}>
      {value}
    </a>
  );
}

type ItemProps = {
  title: string;
  date?: string;
  subtitle?: string;
  children?: ReactNode;
};

function Item({ title, date, subtitle, children }: ItemProps) {
  return (
    <div className={`${styles.item} avoid-break`}>
      {(title || date) && (
        <div className={styles.itemHeader}>
          {title && <h3 className={styles.itemTitle}>{title}</h3>}
          {date && <span className={styles.date}>{date}</span>}
        </div>
      )}
      {subtitle && <p className={styles.muted}>{subtitle}</p>}
      {children}
    </div>
  );
}

function renderSection(key: SectionKey, data: Resume): ReactNode {
  switch (key) {
    case "summary":
      return <p className={styles.text}>{data.basics.summary}</p>;
    case "experience":
      return data.experience.map((e) => (
        <Item
          key={e.id}
          title={e.role}
          date={formatDateRange(e.start, e.end, e.current)}
          subtitle={join([e.company, e.location], " · ")}
        >
          {e.bullets.length > 0 && (
            <ul className={styles.bullets}>
              {e.bullets.map((bullet, index) => (
                <li key={index}>{bullet}</li>
              ))}
            </ul>
          )}
        </Item>
      ));
    case "education":
      return data.education.map((e) => (
        <Item key={e.id} title={e.school} date={formatDateRange(e.start, e.end)} subtitle={e.degree}>
          {hasText(e.description) && <p className={styles.text}>{e.description}</p>}
        </Item>
      ));
    case "skills":
      return data.skills.map((s) => (
        <p key={s.id} className="avoid-break">
          {hasText(s.group) && <span className={styles.itemTitle}>{s.group}: </span>}
          {s.items.join(", ")}
        </p>
      ));
    case "projects":
      return data.projects.map((p) => (
        <Item key={p.id} title={p.name}>
          {hasText(p.link) && (
            <p className={styles.muted}>
              <Link value={p.link} />
            </p>
          )}
          {hasText(p.description) && <p className={styles.text}>{p.description}</p>}
        </Item>
      ));
    case "certificates":
      return data.certificates.map((c) => (
        <p key={c.id} className="avoid-break">
          {hasText(c.name) && <span className={styles.itemTitle}>{c.name}</span>}
          {hasText(c.name) && (hasText(c.issuer) || hasText(c.year)) && " · "}
          {join([c.issuer, c.year], ", ")}
        </p>
      ));
    case "languages":
      return data.languages.map((l) => (
        <p key={l.id} className="avoid-break">
          {join([l.name, l.level], " — ")}
        </p>
      ));
  }
}

export function ClassicTemplate({ data }: { data: Resume }) {
  const resume = compactResume(data);
  const { basics, theme } = resume;
  const sections = getVisibleSections(resume);

  const contacts = [basics.email, basics.phone, basics.location].filter(hasText);
  const hasHeader =
    hasText(basics.name) ||
    hasText(basics.title) ||
    hasText(basics.photo) ||
    hasText(basics.website) ||
    contacts.length > 0;

  const style = {
    "--accent": theme.accent,
    fontFamily: `"${theme.font}", Arial, sans-serif`,
    fontSize: `${theme.fontSize}pt`,
  } as CSSProperties;

  return (
    <article className={styles.page} style={style}>
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
                    <Link value={basics.website} />
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
          {renderSection(key, resume)}
        </section>
      ))}
    </article>
  );
}
