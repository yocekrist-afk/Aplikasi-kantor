const fs = require('fs');
const file = 'src/components/ParticipantTable.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add dateFilter state
content = content.replace(
  "const [schoolFilter, setSchoolFilter] = useState<string>('ALL');",
  "const [schoolFilter, setSchoolFilter] = useState<string>('ALL');\n  const [dateFilter, setDateFilter] = useState<string>('ALL');"
);

// 2. Add distinctDates
content = content.replace(
  "const distinctSchools = useMemo(() => {",
  `const distinctDates = useMemo(() => {
    const set = new Set<string>();
    participants.forEach((p) => {
      if (p.tanggalTes && p.tanggalTes.trim() !== '-' && p.tanggalTes.trim() !== '') {
        set.add(p.tanggalTes.trim());
      }
    });
    return Array.from(set).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  }, [participants]);

  const distinctSchools = useMemo(() => {`
);

// 3. Update hasActiveFilters
content = content.replace(
  "schoolFilter !== 'ALL';",
  "schoolFilter !== 'ALL' ||\n    dateFilter !== 'ALL';"
);

// 4. Update resetFilters
content = content.replace(
  "setSchoolFilter('ALL');",
  "setSchoolFilter('ALL');\n    setDateFilter('ALL');"
);

// 5. Update matchesDate in filter
content = content.replace(
  "const matchesSchool = schoolFilter === 'ALL' || p.asalSekolahInstitusi === schoolFilter;",
  "const matchesSchool = schoolFilter === 'ALL' || p.asalSekolahInstitusi === schoolFilter;\n        const matchesDate = dateFilter === 'ALL' || p.tanggalTes === dateFilter;"
);

content = content.replace(
  "return matchesSearch && matchesStream && matchesGender && matchesSchool && matchesIq;",
  "return matchesSearch && matchesStream && matchesGender && matchesSchool && matchesIq && matchesDate;"
);

// 6. Add date filter UI
const dateFilterUI = `
            {/* Date filter */}
            {distinctDates.length > 0 && (
              <div className="flex items-center space-x-1.5 bg-slate-100 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 max-w-[200px]">
                <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="bg-transparent text-slate-700 focus:outline-none text-xs font-medium cursor-pointer truncate"
                >
                  <option value="ALL">Semua Tanggal Event</option>
                  {distinctDates.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            )}
`;

content = content.replace(
  "{/* Reset Filters button */}",
  dateFilterUI + "            {/* Reset Filters button */}"
);

fs.writeFileSync(file, content);
