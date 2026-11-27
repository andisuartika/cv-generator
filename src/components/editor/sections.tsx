"use client";

import { useId, useState } from "react";
import { useController, useFormContext, useFormState, useWatch } from "react-hook-form";
import { ArraySection } from "@/components/editor/ArraySection";
import { Checkbox } from "@/components/ui/checkbox";
import { TextArea, TextField } from "@/components/ui/Field";
import { Label } from "@/components/ui/label";
import {
  newCertificate,
  newEducation,
  newExperience,
  newLanguage,
  newProject,
  newSkillGroup,
  parseList,
} from "@/lib/items";
import type { Resume } from "@/lib/schema";

const grid = "grid gap-3 sm:grid-cols-2";
const monthProps = { placeholder: "TTTT-BB", inputMode: "numeric" } as const;

function useResumeForm() {
  const { register, control } = useFormContext<Resume>();
  const { errors } = useFormState({ control });
  return { register, control, errors };
}

export function BasicsForm() {
  const { register, errors } = useResumeForm();
  return (
    <div className={grid}>
      <TextField label="Nama lengkap" autoComplete="name" {...register("basics.name")} />
      <TextField label="Jabatan atau profesi" {...register("basics.title")} />
      <TextField
        label="Email"
        inputMode="email"
        autoComplete="email"
        warning={errors.basics?.email?.message}
        {...register("basics.email")}
      />
      <TextField label="Nomor telepon" inputMode="tel" autoComplete="tel" {...register("basics.phone")} />
      <TextField label="Lokasi" {...register("basics.location")} />
      <TextField
        label="Situs web"
        inputMode="url"
        warning={errors.basics?.website?.message}
        {...register("basics.website")}
      />
    </div>
  );
}

export function SummaryForm() {
  const { register } = useResumeForm();
  return <TextArea label="Ringkasan profil" rows={6} {...register("basics.summary")} />;
}

/** One bullet per line. Blank lines are kept while typing; templates skip them. */
function BulletsField({ index }: { index: number }) {
  const { control } = useResumeForm();
  const {
    field: { name, ref, value, onBlur, onChange },
  } = useController({ control, name: `experience.${index}.bullets` });
  return (
    <TextArea
      label="Poin pencapaian"
      hint="Satu poin per baris."
      name={name}
      ref={ref}
      onBlur={onBlur}
      value={value.join("\n")}
      onChange={(e) => onChange(e.target.value === "" ? [] : e.target.value.split("\n"))}
    />
  );
}

function CurrentCheckbox({ index }: { index: number }) {
  const id = useId();
  const { control } = useResumeForm();
  const {
    field: { name, ref, value, onBlur, onChange },
  } = useController({ control, name: `experience.${index}.current` });
  return (
    <div className="flex items-center gap-2">
      <Checkbox
        id={id}
        name={name}
        ref={ref}
        onBlur={onBlur}
        checked={value}
        onCheckedChange={(checked) => onChange(checked === true)}
      />
      <Label htmlFor={id} className="font-normal">
        Masih bekerja di sini
      </Label>
    </div>
  );
}

function ExperienceFields({ index }: { index: number }) {
  const { register, control, errors } = useResumeForm();
  const current = useWatch({ control, name: `experience.${index}.current` });
  const error = errors.experience?.[index];
  return (
    <>
      <div className={grid}>
        <TextField label="Posisi" {...register(`experience.${index}.role`)} />
        <TextField label="Perusahaan" {...register(`experience.${index}.company`)} />
        <TextField label="Lokasi" {...register(`experience.${index}.location`)} />
      </div>
      <div className={grid}>
        <TextField
          label="Mulai"
          {...monthProps}
          warning={error?.start?.message}
          {...register(`experience.${index}.start`)}
        />
        {/* readOnly rather than disabled: a disabled input loses its value. */}
        <TextField
          label="Selesai"
          {...monthProps}
          readOnly={current}
          hint={current ? "Diabaikan karena masih bekerja di sini." : undefined}
          warning={error?.end?.message}
          {...register(`experience.${index}.end`)}
        />
      </div>
      <CurrentCheckbox index={index} />
      <BulletsField index={index} />
    </>
  );
}

export function ExperienceForm() {
  return (
    <ArraySection
      name="experience"
      itemLabel="Pengalaman"
      createItem={newExperience}
      renderItem={(index) => <ExperienceFields index={index} />}
    />
  );
}

export function EducationForm() {
  const { register, errors } = useResumeForm();
  return (
    <ArraySection
      name="education"
      itemLabel="Pendidikan"
      createItem={newEducation}
      renderItem={(index) => (
        <>
          <div className={grid}>
            <TextField label="Sekolah atau universitas" {...register(`education.${index}.school`)} />
            <TextField label="Gelar atau jurusan" {...register(`education.${index}.degree`)} />
            <TextField
              label="Mulai"
              {...monthProps}
              warning={errors.education?.[index]?.start?.message}
              {...register(`education.${index}.start`)}
            />
            <TextField
              label="Selesai"
              {...monthProps}
              warning={errors.education?.[index]?.end?.message}
              {...register(`education.${index}.end`)}
            />
          </div>
          <TextArea label="Keterangan" rows={3} {...register(`education.${index}.description`)} />
        </>
      )}
    />
  );
}

/** Comma-separated input. Keeps the raw text so commas and spaces can be typed. */
function SkillItemsField({ index }: { index: number }) {
  const { control } = useResumeForm();
  const {
    field: { name, ref, value, onBlur, onChange },
  } = useController({ control, name: `skills.${index}.items` });
  const [text, setText] = useState(() => value.join(", "));
  return (
    <TextField
      label="Daftar keahlian"
      hint="Pisahkan dengan koma."
      name={name}
      ref={ref}
      onBlur={onBlur}
      value={text}
      onChange={(e) => {
        setText(e.target.value);
        onChange(parseList(e.target.value));
      }}
    />
  );
}

export function SkillsForm() {
  const { register } = useResumeForm();
  return (
    <ArraySection
      name="skills"
      itemLabel="Kelompok keahlian"
      createItem={newSkillGroup}
      renderItem={(index) => (
        <>
          <TextField label="Nama kelompok" {...register(`skills.${index}.group`)} />
          <SkillItemsField index={index} />
        </>
      )}
    />
  );
}

export function ProjectsForm() {
  const { register, errors } = useResumeForm();
  return (
    <ArraySection
      name="projects"
      itemLabel="Proyek"
      createItem={newProject}
      renderItem={(index) => (
        <>
          <div className={grid}>
            <TextField label="Nama proyek" {...register(`projects.${index}.name`)} />
            <TextField
              label="Tautan"
              inputMode="url"
              warning={errors.projects?.[index]?.link?.message}
              {...register(`projects.${index}.link`)}
            />
          </div>
          <TextArea label="Deskripsi" rows={3} {...register(`projects.${index}.description`)} />
        </>
      )}
    />
  );
}

export function CertificatesForm() {
  const { register } = useResumeForm();
  return (
    <ArraySection
      name="certificates"
      itemLabel="Sertifikat"
      createItem={newCertificate}
      renderItem={(index) => (
        <div className={grid}>
          <TextField label="Nama sertifikat" {...register(`certificates.${index}.name`)} />
          <TextField label="Penerbit" {...register(`certificates.${index}.issuer`)} />
          <TextField label="Tahun" inputMode="numeric" {...register(`certificates.${index}.year`)} />
        </div>
      )}
    />
  );
}

export function LanguagesForm() {
  const { register } = useResumeForm();
  return (
    <ArraySection
      name="languages"
      itemLabel="Bahasa"
      createItem={newLanguage}
      renderItem={(index) => (
        <div className={grid}>
          <TextField label="Nama bahasa" {...register(`languages.${index}.name`)} />
          <TextField label="Tingkat kemampuan" {...register(`languages.${index}.level`)} />
        </div>
      )}
    />
  );
}
