export const languageColors = {
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  Python: '#3572A5',
  Java: '#b07219',
  C: '#555555',
  'C++': '#f34b7d',
  'C#': '#178600',
  Go: '#00ADD8',
  Rust: '#dea584',
  Ruby: '#701516',
  PHP: '#4F5D95',
  Swift: '#F05138',
  Kotlin: '#A97BFF',
  Dart: '#00B4AB',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Shell: '#89e051',
  Lua: '#000080',
  Scala: '#c22d40',
  R: '#198CE7',
  Vue: '#41b883',
  Svelte: '#ff3e00',
  SCSS: '#c6538c',
  Dockerfile: '#384d54',
  Perl: '#0298c3',
  Haskell: '#5e5086',
  Elixir: '#6e4a7e',
  Clojure: '#db5855',
  Erlang: '#B83998',
  OCaml: '#3be133',
  Zig: '#ec915c',
  Nim: '#ffc200',
  Julia: '#a270ba',
  PowerShell: '#012456',
  Makefile: '#427819',
  Objective_C: '#438eff',
  Assembly: '#6E4C13',
  Groovy: '#4298b8',
};

export function getLanguageColor(language) {
  if (languageColors[language]) {
    return languageColors[language];
  }
  // Generate a consistent color from the language name
  let hash = 0;
  for (let i = 0; i < language.length; i++) {
    hash = language.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 65%, 55%)`;
}

export const heatmapColors = [
  '#161b22',
  '#0e4429',
  '#006d32',
  '#26a641',
  '#39d353',
];

export function getChartColors(count) {
  const vibrantColors = [
    '#00d4ff', '#7c3aed', '#ec4899', '#10b981', '#f59e0b',
    '#ef4444', '#06b6d4', '#8b5cf6', '#f472b6', '#34d399',
    '#fbbf24', '#f87171', '#22d3ee', '#a78bfa', '#fb7185',
    '#6ee7b7', '#fcd34d', '#fca5a5', '#67e8f9', '#c4b5fd',
    '#f9a8d4', '#a7f3d0', '#fde68a', '#fecaca', '#a5f3fc',
  ];
  return vibrantColors.slice(0, count);
}
