import { Building2 } from "lucide-react";

export function Logo() {
  return (
    <div className="flex items-center gap-2">
      <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-2 rounded-lg">
        <Building2 className="w-6 h-6 text-white" />
      </div>
      <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
        JV Connect
      </span>
    </div>
  );
}
