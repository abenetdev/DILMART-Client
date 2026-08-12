import { CheckCircle2, Clock, User, ShieldCheck, Store, Cpu } from "lucide-react";

const ROLE_ICON = {
  customer: User,
  vendor:   Store,
  admin:    ShieldCheck,
  system:   Cpu,
};
const ROLE_COLOR = {
  customer: "bg-blue-500",
  vendor:   "bg-green-500",
  admin:    "bg-purple-500",
  system:   "bg-gray-400",
};

export default function ReturnTimeline({ timeline = [] }) {
  if (!timeline.length) return <p className="text-sm text-muted-foreground">No activity yet.</p>;

  return (
    <ol className="relative border-l border-slate-200 space-y-4 ml-2">
      {[...timeline].reverse().map((entry, i) => {
        const Icon  = ROLE_ICON[entry.actorRole] || Clock;
        const color = ROLE_COLOR[entry.actorRole] || "bg-gray-400";
        return (
          <li key={i} className="ml-6">
            <span className={`absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full ${color} ring-2 ring-white`}>
              <Icon className="h-3 w-3 text-white" />
            </span>
            <div className="rounded-lg border bg-white px-4 py-3 shadow-sm">
              <p className="text-sm font-semibold text-slate-800">{entry.action}</p>
              {entry.description && (
                <p className="text-xs text-muted-foreground mt-0.5">{entry.description}</p>
              )}
              <div className="flex items-center gap-2 mt-1.5">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${color} text-white`}>
                  {entry.actorRole}
                </span>
                <time className="text-[11px] text-muted-foreground">
                  {new Date(entry.createdAt).toLocaleString()}
                </time>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
