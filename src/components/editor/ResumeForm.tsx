"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlignLeft,
  Award,
  Briefcase,
  FolderKanban,
  GraduationCap,
  Languages,
  Sparkles,
  User,
  type LucideIcon,
} from "lucide-react";
import { useEffect, type ComponentType } from "react";
import { FormProvider, useForm, type Resolver } from "react-hook-form";
import {
  BasicsForm,
  CertificatesForm,
  EducationForm,
  ExperienceForm,
  LanguagesForm,
  ProjectsForm,
  SkillsForm,
  SummaryForm,
} from "@/components/editor/sections";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { ResumeFormSchema } from "@/lib/form-schema";
import type { Resume, SectionKey } from "@/lib/schema";
import { SECTION_LABELS } from "@/lib/sections";
import { resumeStore, type ResumeContent } from "@/store/resume-store";

export type PanelKey = "basics" | SectionKey;

type Panel = { key: PanelKey; title: string; icon: LucideIcon; Form: ComponentType };

const DESCRIPTIONS: Record<PanelKey, string> = {
  basics: "Nama dan kontak agar perekrut mudah menghubungi Anda.",
  summary: "Dua sampai empat kalimat tentang pengalaman dan keunggulan Anda.",
  experience: "Mulai dari pekerjaan terbaru. Tulis pencapaian, bukan hanya tugas.",
  education: "Riwayat pendidikan formal Anda.",
  skills: "Kelompokkan keahlian yang relevan dengan posisi yang dituju.",
  projects: "Karya yang menunjukkan kemampuan Anda.",
  certificates: "Sertifikasi dan pelatihan yang pernah diikuti.",
  languages: "Bahasa yang Anda kuasai beserta tingkatnya.",
};

const PANELS: Panel[] = [
  { key: "basics", title: "Data diri", icon: User, Form: BasicsForm },
  { key: "summary", title: SECTION_LABELS.summary, icon: AlignLeft, Form: SummaryForm },
  { key: "experience", title: SECTION_LABELS.experience, icon: Briefcase, Form: ExperienceForm },
  { key: "education", title: SECTION_LABELS.education, icon: GraduationCap, Form: EducationForm },
  { key: "skills", title: SECTION_LABELS.skills, icon: Sparkles, Form: SkillsForm },
  { key: "projects", title: SECTION_LABELS.projects, icon: FolderKanban, Form: ProjectsForm },
  { key: "certificates", title: SECTION_LABELS.certificates, icon: Award, Form: CertificatesForm },
  { key: "languages", title: SECTION_LABELS.languages, icon: Languages, Form: LanguagesForm },
];

/** Number of entries in a list section. */
function ItemCount({ panel }: { panel: PanelKey }) {
  const count = resumeStore.useResume((s) =>
    panel === "basics" || panel === "summary" ? 0 : s.resume[panel].length,
  );
  if (count === 0) return null;
  return (
    <Badge variant="secondary" aria-label={`${count} item`}>
      {count}
    </Badge>
  );
}

// Deep copy: react-hook-form mutates its values in place.
function toContent(values: Resume): ResumeContent {
  const { basics, experience, education, skills, projects, certificates, languages } = values;
  return structuredClone({
    basics, experience, education, skills, projects, certificates, languages,
  });
}

/**
 * The form owns input state and mirrors every change into the store.
 * `initial` is read once; remount (change the key) to load other data.
 */
type ResumeFormProps = {
  initial: Resume;
  /** The open panel; an empty string means every panel is closed. */
  openPanel: string;
  onOpenPanelChange: (panel: string) => void;
};

export function ResumeForm({ initial, openPanel, onOpenPanelChange }: ResumeFormProps) {
  const form = useForm<Resume>({
    defaultValues: structuredClone(initial),
    // The schema's input type makes defaulted fields optional. Form values are
    // always a full Resume, and `raw` keeps them untransformed.
    resolver: zodResolver(ResumeFormSchema, undefined, { raw: true }) as Resolver<Resume>,
    mode: "onTouched",
  });
  const { subscribe, trigger } = form;

  useEffect(
    () =>
      subscribe({
        formState: { values: true },
        callback: ({ values }) => {
          resumeStore.useResume.getState().updateContent(toContent(values));
        },
      }),
    [subscribe],
  );

  // Show warnings for data that was already stored.
  useEffect(() => {
    void trigger();
  }, [trigger]);

  return (
    <FormProvider {...form}>
      <form noValidate onSubmit={(e) => e.preventDefault()}>
        <Accordion
          type="single"
          collapsible
          value={openPanel}
          onValueChange={onOpenPanelChange}
          className="gap-3"
        >
          {PANELS.map(({ key, title, icon: Icon, Form }) => (
            <AccordionItem
              key={key}
              value={key}
              data-panel={key}
              className="scroll-mt-36 rounded-2xl border bg-card transition-shadow lg:scroll-mt-20 not-last:border-b data-[state=open]:shadow-md"
            >
              <AccordionTrigger className="items-center gap-3 px-4 py-4 hover:no-underline sm:px-5">
                <span className="flex min-w-0 items-center gap-3.5">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Icon aria-hidden="true" className="size-4.5" />
                  </span>
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="flex items-center gap-2 text-base font-semibold">
                      {title}
                      <ItemCount panel={key} />
                    </span>
                    <span className="text-[0.8rem] font-normal text-muted-foreground">
                      {DESCRIPTIONS[key]}
                    </span>
                  </span>
                </span>
              </AccordionTrigger>
              <AccordionContent className="px-4 pt-1 pb-5 sm:px-5">
                <Form />
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </form>
    </FormProvider>
  );
}
