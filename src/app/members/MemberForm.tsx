import React, { useState } from "react";
import { isValidEmail } from "../auth/roles";
import type { MemberFields } from "../store/models";

export const GRADES = ["1학년", "2학년", "3학년", "4학년", "기타"];

const PHONE_RE = /^0\d{1,2}-?\d{3,4}-?\d{4}$/;

const LABELS: Record<keyof MemberFields, string> = {
  name: "성명",
  university: "대학",
  department: "학과",
  grade: "학년",
  studentId: "학번",
  email: "이메일",
  phone: "휴대폰번호",
};

const validate = (v: MemberFields): string | null => {
  const empty = (Object.keys(LABELS) as (keyof MemberFields)[]).find((k) => !v[k].trim());
  if (empty) return `${LABELS[empty]}을(를) 입력해 주세요.`;
  if (!isValidEmail(v.email)) return "올바른 이메일 주소를 입력해 주세요.";
  if (!PHONE_RE.test(v.phone.trim())) return "휴대폰번호를 010-1234-5678 형식으로 입력해 주세요.";
  return null;
};

/** 회원 가입정보 입력 폼. 가입(본인)과 회원현황의 수정(관리자)에서 함께 쓴다. */
export const MemberForm: React.FC<{
  initial: MemberFields;
  submitLabel: string;
  onSubmit: (fields: MemberFields) => Promise<void>;
  /** 저장 버튼 옆에 둘 보조 버튼 (취소·로그아웃 등) */
  secondary?: React.ReactNode;
}> = ({ initial, submitLabel, onSubmit, secondary }) => {
  // initial에 다른 항목(Member 전체)이 섞여 와도 입력 항목만 다룬다.
  const [values, setValues] = useState<MemberFields>(() => ({
    name: initial.name,
    university: initial.university,
    department: initial.department,
    grade: initial.grade,
    studentId: initial.studentId,
    email: initial.email,
    phone: initial.phone,
  }));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const bind = (key: keyof MemberFields) => ({
    value: values[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setValues((v) => ({ ...v, [key]: e.target.value }));
      setError(null);
    },
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = Object.fromEntries(Object.entries(values).map(([k, v]) => [k, v.trim()])) as MemberFields;
    const problem = validate(trimmed);
    if (problem) {
      setError(problem);
      return;
    }
    setSaving(true);
    try {
      await onSubmit(trimmed);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="member-form" onSubmit={(e) => void submit(e)} noValidate>
      <div className="form-grid">
        <label className="field">
          <span>{LABELS.name}</span>
          <input {...bind("name")} autoComplete="name" autoFocus />
        </label>
        <label className="field">
          <span>{LABELS.university}</span>
          <input {...bind("university")} placeholder="예: 한국외국어대학교" autoComplete="organization" />
        </label>
        <label className="field">
          <span>{LABELS.department}</span>
          <input {...bind("department")} placeholder="예: 중국어통번역학과" />
        </label>
        <label className="field">
          <span>{LABELS.grade}</span>
          <select {...bind("grade")}>
            <option value="">선택</option>
            {GRADES.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>{LABELS.studentId}</span>
          <input {...bind("studentId")} inputMode="numeric" autoComplete="off" />
        </label>
        <label className="field">
          <span>{LABELS.phone}</span>
          <input {...bind("phone")} type="tel" placeholder="010-1234-5678" autoComplete="tel" />
        </label>
        <label className="field span-2">
          <span>{LABELS.email}</span>
          <input {...bind("email")} type="email" autoComplete="email" />
        </label>
      </div>
      {error ? <p className="field-error small">{error}</p> : null}
      <div className="member-form-actions">
        {secondary}
        <button className="btn btn-primary" type="submit" disabled={saving}>
          {saving ? "저장 중…" : submitLabel}
        </button>
      </div>
    </form>
  );
};
