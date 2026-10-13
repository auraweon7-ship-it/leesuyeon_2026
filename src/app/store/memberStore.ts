import { createLocalCollection } from "./localCollection";
import { nowIso } from "./localJson";
import type { Member, MemberFields } from "./models";

/** 회원 가입정보 저장소. 로컬 구현에서는 이 브라우저에서 가입한 회원만 기록된다. */
export interface MemberStore {
  list(): Promise<Member[]>;
  /** 가입정보 등록. 이미 있으면 입력 항목만 바꾼다. */
  register(id: string, fields: MemberFields): Promise<void>;
  /** 입력 항목 수정 (가입일·접속일·승인 상태는 유지) */
  update(id: string, fields: MemberFields): Promise<void>;
  setApproved(id: string, approved: boolean): Promise<void>;
  /** 로그인 시 호출: 가입한 회원이면 최종 접속일 갱신 */
  touch(id: string): Promise<void>;
  remove(id: string): Promise<void>;
  subscribe(listener: () => void): () => void;
}

export const createLocalMemberStore = (): MemberStore => {
  const col = createLocalCollection<Member>("zhuiju.members.v1", (m) => m.id);
  const patch = (id: string, change: Partial<Member>) => {
    const prev = col.find(id);
    if (prev) col.put({ ...prev, ...change });
  };
  return {
    list: async () => col.all(),
    register: async (id, fields) => {
      const prev = col.find(id);
      const now = nowIso();
      col.put({
        ...fields,
        id,
        joinedAt: prev?.joinedAt ?? now,
        lastAccessAt: now,
        approved: prev?.approved ?? false,
      });
    },
    update: async (id, fields) => patch(id, fields),
    setApproved: async (id, approved) => patch(id, { approved }),
    touch: async (id) => patch(id, { lastAccessAt: nowIso() }),
    remove: async (id) => col.remove(id),
    subscribe: col.subscribe,
  };
};
