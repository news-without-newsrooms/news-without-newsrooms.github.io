/** Original, schematic city artwork. Geography evokes Pittsburgh; the room is imagined. */
export default function PittsburghScene() {
  return <div className="pittsburgh-setting" aria-hidden="true">
    <svg viewBox="0 0 1400 760" preserveAspectRatio="xMidYMid slice" focusable="false">
      <defs>
        <pattern id="city-streets" width="90" height="72" patternUnits="userSpaceOnUse" patternTransform="rotate(-16)">
          <rect width="90" height="72" fill="#dfe1d6"/>
          <rect x="8" y="8" width="68" height="47" rx="2" fill="#d3d8cc"/>
          <path d="M0 65H90M83 0V72" stroke="#f6f4e8" strokeWidth="6"/>
        </pattern>
        <pattern id="river-lines" width="98" height="31" patternUnits="userSpaceOnUse">
          <path d="M7 9h28m17 12h33" stroke="#e1e7df" strokeWidth="1.4" opacity=".7"/>
        </pattern>
      </defs>
      <rect width="1400" height="760" fill="#d4ddce"/>
      <path d="M0 0H1400V760H0Z" fill="url(#city-streets)"/>
      {/* Three rivers meet at the Point; the pale city is a setting, not a navigation map. */}
      <path d="M-80 218C150 176 310 200 490 144S1010 76 1480 112L1480 196C1030 161 757 158 548 220S210 273-80 300Z" fill="#afc9c7"/>
      <path d="M-60 777C123 634 231 436 510 193L563 245C332 460 239 661 61 800Z" fill="#afc9c7"/>
      <path d="M-80 216C140 176 293 195 469 151L526 229C273 282 135 280-80 300Z" fill="url(#river-lines)"/>
      <path d="M571 141C865 73 1153 99 1400 113V190C1075 164 807 155 568 218Z" fill="url(#river-lines)"/>
      <path d="M17 754C214 573 226 428 530 218" stroke="#e7ebde" strokeWidth="5" fill="none"/>
      <path d="M531 230C680 197 976 168 1400 202" stroke="#f2eddb" strokeWidth="8" fill="none"/>
      <path d="M493 259L647 257 606 347Z" fill="#aabd9b"/>
      <ellipse cx="527" cy="272" rx="17" ry="11" fill="#dfe8e0" stroke="#8faeaa" strokeWidth="4"/>
      <ellipse cx="527" cy="272" rx="7" ry="5" fill="#a9c8c5"/>
      {/* A restrained echo of the city's yellow suspension bridges. */}
      {[715, 871, 1027].map((x,i) => <g key={x} transform={`translate(${x} ${108-i*5}) rotate(-7)`}>
        <path d="M-12-21V126H12V-21" fill="#c3b96e" stroke="#a89f61" strokeWidth="2"/>
        <path d="M-8-18V124M8-18V124" stroke="#eee3a4" strokeWidth="2"/>
        <path d="M-18 7Q-2 54-18 102M18 7Q2 54 18 102" fill="none" stroke="#7f825e" strokeWidth="2"/>
        <path d="M-19 7H19M-19 102H19" stroke="#ada262" strokeWidth="6"/>
        <path d="M0-20V126" stroke="#e7deb0" strokeDasharray="5 8"/>
      </g>)}
      {/* A riverside roof form nods to the conference's announced convention center. */}
      <g transform="translate(1125 218) rotate(-7)">
        <path d="M0 29H165V98H0Z" fill="#bbc4bc"/>
        <path d="M-8 22Q78-13 173 22L173 73Q78 43-8 73Z" fill="#f4f2e6" stroke="#b5c1b6" strokeWidth="2"/>
        {[5,29,53,77,101,125,149].map(x => <path key={x} d={`M${x} 20V75`} stroke="#c8d0c4"/>) }
        <path d="M4 88H158" stroke="#a3b5b1" strokeWidth="10"/>
        <path d="M22 0V92M139 0V92M22 0L78 68 139 0" fill="none" stroke="#8d9e93" strokeWidth="2"/>
      </g>
      {/* Quiet blocks, terraces, and riverfront trees frame the open workshop room. */}
      <g fill="#b4c1ac" stroke="#9cac98" strokeWidth="1">
        {[[67,99,68,42],[205,70,105,59],[362,38,55,63],[1155,407,54,112],[1260,471,96,56],[1220,586,67,74],[279,645,68,52],[445,687,120,36]].map(([x,y,w,h]) => <g key={x}><rect x={x+6} y={y+7} width={w} height={h} fill="#c3cabe" stroke="none"/><rect x={x} y={y} width={w} height={h}/><path d={`M${x+8} ${y+8}h${w-16}v${h-16}h-${w-16}Z`} fill="#cbd2c2"/></g>)}
      </g>
      <g fill="#a7bba0" stroke="#e0e6d6" strokeWidth="3">
        {[[52,370],[72,403],[88,439],[110,477],[1199,355],[1228,351],[1258,347],[1287,343],[1320,339],[1094,682],[1131,671],[1170,660],[617,706],[649,701]].map(([x,y]) => <circle key={`${x}:${y}`} cx={x} cy={y} r="13"/>)}
      </g>
      <g fill="#526b67" fontFamily="monospace" fontSize="11" letterSpacing="3">
        <text x="76" y="235" transform="rotate(-4 76 235)">OHIO</text>
        <text x="1160" y="151">ALLEGHENY</text>
        <text x="115" y="611" transform="rotate(-52 115 611)">MONONGAHELA</text>
      </g>
      <path d="M1138 304L1103 330H1049" fill="none" stroke="#718875" strokeWidth="1" strokeDasharray="3 4"/>
    </svg>
    <span className="city-signature">PITTSBURGH <small>AT THE MEETING OF THREE RIVERS</small></span>
  </div>;
}
