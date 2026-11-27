import type { ReactNode } from "react";
import { formatDateRange, hasText, toSafeUrl } from "@/lib/format";
import type { Resume, SectionKey } from "@/lib/schema";

/** CSS module of a template; it styles these class names. */
export type TemplateStyles = Readonly<Record<string, string>>;

const join = (parts: (string | undefined)[], separator: string) =>
  parts.filter(hasText).join(separator);

export function Link({ value, className }: { value: string; className?: string }) {
  const href = toSafeUrl(value);
  if (!href) return <span>{value}</span>;
  return (
    <a className={className} href={href}>
      {value}
    </a>
  );
}

type ItemProps = {
  styles: TemplateStyles;
  title: string;
  date?: string;
  subtitle?: string;
  children?: ReactNode;
};

function Item({ styles, title, date, subtitle, children }: ItemProps) {
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

type SectionContentProps = {
  section: SectionKey;
  /** Data that already went through compactResume. */
  data: Resume;
  styles: TemplateStyles;
};

/** The entries of one section. Each template supplies its own class names. */
export function SectionContent({ section, data, styles }: SectionContentProps): ReactNode {
  switch (section) {
    case "summary":
      return <p className={styles.text}>{data.basics.summary}</p>;
    case "experience":
      return data.experience.map((e) => (
        <Item
          key={e.id}
          styles={styles}
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
        <Item key={e.id} styles={styles} title={e.school} date={formatDateRange(e.start, e.end)} subtitle={e.degree}>
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
        <Item key={p.id} styles={styles} title={p.name}>
          {hasText(p.link) && (
            <p className={styles.muted}>
              <Link value={p.link} className={styles.link} />
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
