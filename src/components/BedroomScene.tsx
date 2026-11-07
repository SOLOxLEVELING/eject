import type { ReactNode } from 'react';

type BedroomSceneProps = {
  moment?: 'night' | 'terminated' | 'pull' | 'dawn';
  children: ReactNode;
};

// Original local diorama; the sage shirt motif carries through to OP-01's eyes.
export function BedroomScene({ moment = 'night', children }: BedroomSceneProps) {
  return (
    <div className="bedroom-scene" data-moment={moment}>
      <svg className="bedroom-art" viewBox="0 0 1280 720" preserveAspectRatio="none" aria-hidden="true" focusable="false">
        <path fill="var(--bedroom-back, #171b30)" d="M0 0h1280v720H0z" />
        <path fill="var(--bedroom-left, #20243a)" d="M0 0h530v518H0z" />
        <path fill="var(--bedroom-right, #101426)" d="M530 0h750v518H530z" />
        <path fill="var(--bedroom-floor, #302e3b)" d="M0 518h1280v202H0z" />
        <path fill="none" stroke="#45404a" strokeWidth="2" d="M0 564h1280M0 642h1280M530 518 280 720m490-202 170 202M100 518 0 590m1100-72 180 104" />
        <path fill="var(--bedroom-window, #0c1225)" stroke="#55546a" strokeWidth="10" d="M72 72h280v267H72z" />
        <path fill="var(--bedroom-city, #333c57)" d="M83 244h57v84H83zm61-57h50v141h-50zm56 35h75v106h-75zm82-71h59v177h-59z" />
        <path fill="#a1a38e" d="M159 210h7v9h-7zm57 33h7v9h-7zm83-62h7v9h-7z" />
        <g className="bedroom-rain" stroke="#8494aa" strokeWidth="2" opacity="0.45">
          <path d="m112 84-15 36m93 11-17 38m85-65-14 34m73 67-17 36m-95-8-14 34m-55-14-14 35m-5-93-13 31m185 62-13 31" />
        </g>
        <path fill="none" stroke="#55546a" strokeWidth="8" d="M212 74v265M73 205h279" />
        <path fill="#25283c" d="M49 53h24v316H49zm304 0h28v316h-28z" />
        <path fill="#0d1222" d="M43 438h310v148H43z" />
        <path fill="#545261" d="m44 420 205-24 129 70-23 69H44z" />
        <path fill="#77717b" d="m59 423 99-11 32 36-128 12z" />
        <path fill="#3d4c5a" d="m176 424 70-14 130 61-24 66H102l12-52 78-4z" />
        <path fill="none" stroke="#596676" strokeWidth="5" d="m144 492 173 10m-115-47 100 18m-61 49 103 6" />
        <path fill="#171b2b" d="M55 578h20v45H55zm275-28h20v50h-20z" />
        <path fill="#766759" d="M621 482h582v24H621z" />
        <path fill="#3d3840" d="M645 506h22v161h-22zm507 0h22v161h-22z" />
        <path fill="#49464c" d="M657 126h508v349H657z" />
        <path fill="#8d8270" d="M666 134h487v319H666z" />
        <path fill="#151e23" stroke="#3b4142" strokeWidth="10" d="M686 153h418v266H686z" />
        <path fill="#34363c" d="M1119 157h25v205h-25z" />
        <path stroke="#99917d" strokeWidth="4" d="M1124 177h15m-15 10h15m-15 10h15m-15 10h15" />
        <circle fill="#e4be7b" cx="1132" cy="398" r="7" />
        <path fill="#777368" d="M785 453h245v16H785z" />
        <path fill="#8ca99b" opacity="0.06" d="M686 419h418l133 252H373z" />
        <g className="bedroom-chair" fill="#272c39" stroke="#101523" strokeWidth="6">
          <path d="M424 398h138v155H424zM431 551h135v24H431z" />
          <path d="M445 570v88m104-88v88" />
        </g>
        <g className="bedroom-boy">
          <path fill="#18202d" d="M462 537h89v37h-53v56h-29z" />
          <path fill="#9eaa9a" d="m456 368 71-8 39 50-18 129h-97l-11-112z" />
          <path fill="#617d77" d="m456 368 20 12-13 147h-12l-11-100z" />
          <path fill="#b9a58a" d="M482 341h31v34h-31zM533 391l37 19 32-14 8 16-43 27-39-18z" />
          <path fill="#c0ad95" d="M467 293h63v53l-18 15h-43z" />
          <path fill="#242635" d="M459 284h67l15 15v25h-21v-18h-32v49h-25z" />
          <path fill="#8ca99b" d="M518 319h8v5h-8z" />
          <path fill="#151b2a" d="M461 626h43v17h-43zm46-59h47v17h-47z" />
        </g>
        <g className="bedroom-controller" fill="#303848" stroke="#b6b7aa" strokeWidth="3">
          <path d="m586 391 30-3 16 13-5 17-17-8-16 5-14-8z" />
          <path d="M590 400h10m-5-5v10m18-8h4m3 7h4" />
        </g>
        <g className="bedroom-fragments" fill="#8ca99b">
          <path d="M470 310h24v24h-24zM500 360h19v19h-19zM453 419h30v30h-30zM528 458h21v21h-21zM489 505h26v26h-26z" />
        </g>
        <path fill="#938272" d="m1031 590 75-6 13 35-78 9z" />
        <path fill="#d2c3a5" d="m1035 585 69-5 10 30-76 9z" />
        <path fill="none" stroke="#6b6864" strokeWidth="3" d="m1045 593 49-4m-45 12 48-4" />
        <path fill="none" stroke="#111827" strokeWidth="4" d="M1090 474v54l-93 39v86" />
      </svg>
      <div className="crt-screen">{children}</div>
    </div>
  );
}
