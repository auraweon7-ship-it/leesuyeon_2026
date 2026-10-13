import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "../components/Icon";
import { useToast } from "../components/Toast";
import { formatDateTime } from "../lib/format";
import { MEMBER_SCOPE_NOTE, memberStore } from "../store";
import { useMembers } from "../store/hooks";
import type { Member } from "../store/models";
import { MemberForm } from "./MemberForm";

/** 회원현황 창 (관리자). 승인·수정·삭제를 한다. */
export const MembersModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const members = useMembers();
  const toast = useToast();
  const [editing, setEditing] = useState<Member | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const remove = (m: Member) => {
    if (!window.confirm(`${m.name} 회원을 삭제할까요? 삭제하면 되돌릴 수 없어요.`)) return;
    void memberStore.remove(m.id).then(() => toast.show(`${m.name} 회원을 삭제했어요.`, "info"));
  };

  const sorted = members ? [...members].sort((a, b) => b.joinedAt.localeCompare(a.joinedAt)) : [];
  const approvedCount = sorted.filter((m) => m.approved).length;

  // 상단바의 backdrop-filter가 fixed 기준을 바꾸므로 body에 그린다.
  return createPortal(
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div
        className="modal members-modal"
        role="dialog"
        aria-modal="true"
        aria-label="회원현황"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <button className="modal-close" onClick={onClose} aria-label="닫기">
          <Icon name="close" size={18} />
        </button>
        {editing ? (
          <>
            <h2>회원 정보 수정</h2>
            <MemberForm
              key={editing.id}
              initial={editing}
              submitLabel="수정 저장"
              onSubmit={async (fields) => {
                await memberStore.update(editing.id, fields);
                toast.show(`${fields.name} 회원 정보를 수정했어요.`, "success");
                setEditing(null);
              }}
              secondary={
                <button type="button" className="btn btn-soft" onClick={() => setEditing(null)}>
                  취소
                </button>
              }
            />
          </>
        ) : (
          <>
            <h2>회원현황</h2>
            <p className="muted small">
              전체 {sorted.length}명 · 승인 {approvedCount}명 · 승인 대기 {sorted.length - approvedCount}명
            </p>
            <p className="scope-note">ℹ️ {MEMBER_SCOPE_NOTE}</p>
            <div className="data-table">
              <table>
                <thead>
                  <tr>
                    <th>성명</th>
                    <th>대학</th>
                    <th>학과</th>
                    <th>학년</th>
                    <th>학번</th>
                    <th>이메일</th>
                    <th>휴대폰번호</th>
                    <th>가입일</th>
                    <th>최종 접속일</th>
                    <th>회원 승인</th>
                    <th>수정</th>
                    <th>삭제</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="muted">
                        {members ? "가입한 회원이 없어요." : "불러오는 중…"}
                      </td>
                    </tr>
                  ) : (
                    sorted.map((m) => (
                      <tr key={m.id}>
                        <td>
                          <b>{m.name}</b>
                        </td>
                        <td>{m.university}</td>
                        <td>{m.department}</td>
                        <td>{m.grade}</td>
                        <td className="tabular">{m.studentId}</td>
                        <td>{m.email}</td>
                        <td className="tabular">{m.phone}</td>
                        <td className="tabular">{formatDateTime(m.joinedAt)}</td>
                        <td className="tabular">{formatDateTime(m.lastAccessAt)}</td>
                        <td>
                          <button
                            className={`approve-btn ${m.approved ? "on" : ""}`}
                            onClick={() => void memberStore.setApproved(m.id, !m.approved)}
                            aria-pressed={m.approved}
                            title={m.approved ? "눌러서 승인 취소" : "눌러서 승인"}
                          >
                            {m.approved ? "승인" : "대기"}
                          </button>
                        </td>
                        <td>
                          <button className="link-btn" onClick={() => setEditing(m)}>
                            수정
                          </button>
                        </td>
                        <td>
                          <button className="link-btn danger" onClick={() => remove(m)}>
                            삭제
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
};
