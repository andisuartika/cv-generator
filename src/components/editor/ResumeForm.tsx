"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useId, useState, type ComponentType } from "react";
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
import { ResumeFormSchema } from "@/lib/form-schema";
import type { Resume, SectionKey } from "@/lib/schema";
import { SECTION_LABELS } from "@/lib/sections";
import { resumeStore, type ResumeContent } from "@/store/resume-store";

type PanelKey = "basics" | SectionKey;

const PANELS: { key: PanelKey; title: string; Form: ComponentType }[] = [
  { key: "basics", title: "Data diri", Form: BasicsForm },
  { key: "summary", title: SECTION_LABELS.summary, Form: SummaryForm },
  { key: "experience", title: SECTION_LABELS.experience, Form: ExperienceForm },
  { key: "education", title: SECTION_LABELS.education, Form: EducationForm },
  { key: "skills", title: SECTION_LABELS.skills, Form: SkillsForm },
  { key: "projects", title: SECTION_LABELS.projects, Form: ProjectsForm },
  { key: "certificates", title: SECTION_LABELS.certificates, Form: CertificatesForm },
  { key: "languages", title: SECTION_LABELS.languages, Form: LanguagesForm },
];

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
export function ResumeForm({ initial }: { initial: Resume }) {
  const form = useForm<Resume>({
    defaultValues: structuredClone(initial),
    // The schema's input type makes defaulted fields optional. Form values are
    // always a full Resume, and `raw` keeps them untransformed.
    resolver: zodResolver(ResumeFormSchema, undefined, { raw: true }) as Resolver<Resume>,
    mode: "onTouched",
  });
  const [openPanel, setOpenPanel] = useState<PanelKey | null>("basics");
  const baseId = useId();
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
      <form noValidate onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-2">
        {PANELS.map(({ key, title, Form }) => {
          const open = openPanel === key;
          const buttonId = `${baseId}-${key}-button`;
          const panelId = `${baseId}-${key}-panel`;
          return (
            <div key={key} className="rounded-lg border border-neutral-300">
              <h2>
                <button
                  type="button"
                  id={buttonId}
                  aria-expanded={open}
                  aria-controls={open ? panelId : undefined}
                  onClick={() => setOpenPanel(open ? null : key)}
                  className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left font-semibold"
                >
                  {title}
                  <span aria-hidden="true">{open ? "−" : "+"}</span>
                </button>
              </h2>
              {open && (
                <div id={panelId} role="region" aria-labelledby={buttonId} className="px-4 pb-4">
                  <Form />
                </div>
              )}
            </div>
          );
        })}
      </form>
    </FormProvider>
  );
}
