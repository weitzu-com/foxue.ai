import { Check, CircleAlert, CircleHelp, GitCompareArrows } from "lucide-react";

const config = {
  有充分来源: { icon: Check, className: "status--verified" },
  来源存在分歧: { icon: GitCompareArrows, className: "status--divergent" },
  仅找到间接资料: { icon: CircleHelp, className: "status--indirect" },
  未找到可靠来源: { icon: CircleAlert, className: "status--missing" },
};

export function StatusPill({ status }: { status: keyof typeof config }) {
  const item = config[status];
  const Icon = item.icon;
  return (
    <span className={`status-pill ${item.className}`}>
      <Icon aria-hidden="true" size={14} />
      {status}
    </span>
  );
}
