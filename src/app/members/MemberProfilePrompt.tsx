import React from "react";
import { useAuth } from "../auth/AuthContext";
import { useToast } from "../components/Toast";
import { navigate } from "../router";
import { memberStore } from "../store";
import { useMembers } from "../store/hooks";
import { MemberForm } from "./MemberForm";

/** Google 로그인 후 가입정보가 없으면 띄우는 입력 창. 저장해야 닫힌다. (로그아웃은 가능) */
export const MemberProfilePrompt: React.FC = () => {
  const { user, signOut } = useAuth();
  const members = useMembers();
  const toast = useToast();

  if (!user || user.provider !== "google" || !members) return null;
  if (members.some((m) => m.id === user.id)) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal member-join" role="dialog" aria-modal="true" aria-label="회원 정보 입력">
        <h2>회원 정보 입력</h2>
        <p className="muted small">처음 로그인하셨어요. 수업 이용을 위해 아래 정보를 입력해 주세요.</p>
        <MemberForm
          key={user.id}
          initial={{
            name: user.name,
            university: "",
            department: "",
            grade: "",
            studentId: "",
            email: user.email,
            phone: "",
          }}
          submitLabel="저장"
          onSubmit={async (fields) => {
            await memberStore.register(user.id, fields);
            toast.show("회원 정보를 저장했어요.", "success");
          }}
          secondary={
            <button type="button" className="btn btn-soft" onClick={() => void signOut().then(() => navigate("home"))}>
              로그아웃
            </button>
          }
        />
      </div>
    </div>
  );
};
