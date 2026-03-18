import svgPaths from "./svg-drnqsgtbtn";
import imgImage from "figma:asset/5488d6b376b8df81f6436fe1e33ddc9d1a7686c4.png";

function Image() {
  return (
    <div className="absolute h-[112px] left-0 rounded-[6px] top-0 w-[88px]" data-name="Image">
      <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none rounded-[6px] size-full" src={imgImage} />
    </div>
  );
}

function Container1() {
  return <div className="absolute border-2 border-solid border-white h-[116px] left-[-2px] rounded-[8px] top-[-2px] w-[92px]" data-name="Container" />;
}

function Container() {
  return (
    <div className="absolute h-[112px] left-[30px] rounded-[6px] top-[15.21px] w-[88px]" data-name="Container">
      <Image />
      <Container1 />
    </div>
  );
}

function MeetingRecorderCard() {
  return <div className="absolute border-2 border-solid border-white h-[38px] left-[-2px] rounded-[8px] top-[-2px] w-[90px]" data-name="MeetingRecorderCard" />;
}

function Icon() {
  return (
    <div className="h-[14.021px] overflow-clip relative shrink-0 w-full" data-name="Icon">
      <div className="absolute inset-[26.97%_18.29%_26.28%_56.57%]" data-name="Vector">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 4.02499 6.55434">
          <path d={svgPaths.p190bd670} fill="var(--fill-0, #00832D)" id="Vector" />
        </svg>
      </div>
      <div className="absolute inset-[67.36%_73.15%_0_0]" data-name="Vector">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 4.29943 4.57603">
          <path d={svgPaths.p267639f8} fill="var(--fill-0, #0066DA)" id="Vector" />
        </svg>
      </div>
      <div className="absolute inset-[0_73.2%_67.36%_0]" data-name="Vector">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 4.29028 4.57597">
          <path d={svgPaths.p3a866000} fill="var(--fill-0, #E94235)" id="Vector" />
        </svg>
      </div>
      <div className="absolute inset-[28.47%_76.57%_28.48%_0]" data-name="Vector">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 3.75057 6.03635">
          <path d={svgPaths.p3d303f00} fill="var(--fill-0, #2684FC)" id="Vector" />
        </svg>
      </div>
      <div className="absolute inset-[11.1%_0_0_23.42%]" data-name="Vector">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12.2598 12.4634">
          <path d={svgPaths.p26c9100} fill="var(--fill-0, #00AC47)" id="Vector" />
        </svg>
      </div>
      <div className="absolute bottom-1/2 left-[23.42%] right-[20.58%] top-0" data-name="Vector">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 8.96479 7.00999">
          <path d={svgPaths.p38e2bc00} fill="var(--fill-0, #FFBA00)" id="Vector" />
        </svg>
      </div>
    </div>
  );
}

function Container3() {
  return (
    <div className="content-stretch flex flex-col h-[14.021px] items-start relative shrink-0 w-full" data-name="Container">
      <Icon />
    </div>
  );
}

function GoogleMeetIcon() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-[8px] overflow-clip pl-px pr-[0.99px] pt-[1.99px] size-[18px] top-[8px]" data-name="GoogleMeetIcon">
      <Container3 />
    </div>
  );
}

function Icon1() {
  return (
    <div className="absolute left-0 size-[18px] top-0" data-name="Icon">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 18">
        <g clipPath="url(#clip0_23_1461)" id="Icon">
          <path d={svgPaths.p1dc0b8c0} fill="var(--fill-0, #2196F3)" id="Vector" />
        </g>
        <defs>
          <clipPath id="clip0_23_1461">
            <rect fill="white" height="18" width="18" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Icon2() {
  return (
    <div className="h-[5.563px] overflow-clip relative shrink-0 w-full" data-name="Icon">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10.3333 5.5625">
        <path clipRule="evenodd" d={svgPaths.p39129220} fill="var(--fill-0, white)" fillRule="evenodd" id="Vector" />
      </svg>
    </div>
  );
}

function Container4() {
  return (
    <div className="absolute content-stretch flex flex-col h-[5.563px] items-start left-[4.08px] top-[6.01px] w-[10.333px]" data-name="Container">
      <Icon2 />
    </div>
  );
}

function ZoomIcon() {
  return (
    <div className="absolute left-[34px] overflow-clip size-[18px] top-[8px]" data-name="ZoomIcon">
      <Icon1 />
      <Container4 />
    </div>
  );
}

function Icon3() {
  return (
    <div className="h-[16px] overflow-clip relative shrink-0 w-full" data-name="Icon">
      <div className="absolute inset-[37.5%_0.01%_15%_67.44%]" data-name="Vector">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 5.8604 7.59999">
          <path d={svgPaths.p5556770} fill="var(--fill-0, #5059C9)" id="Vector" />
        </svg>
      </div>
      <div className="absolute inset-[9.99%_2.32%_67.51%_76.75%]" data-name="Vector">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 3.7674 3.6">
          <path d={svgPaths.p2ed570} fill="var(--fill-0, #5059C9)" id="Vector" />
        </svg>
      </div>
      <div className="absolute inset-[0_30.23%_67.5%_39.54%]" data-name="Vector">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 5.44184 5.2">
          <path d={svgPaths.p38c8f00} fill="var(--fill-0, #7B83EB)" id="Vector" />
        </svg>
      </div>
      <div className="absolute inset-[37.5%_20.93%_0_27.9%]" data-name="Vector">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 9.21183 9.99999">
          <path d={svgPaths.p1925b500} fill="var(--fill-0, #7B83EB)" id="Vector" />
        </svg>
      </div>
      <div className="absolute inset-[37.5%_44.18%_17.5%_27.91%]" data-name="Vector">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 5.02356 7.20009">
          <path d={svgPaths.p3ce00380} fill="var(--fill-0, black)" id="Vector" opacity="0.1" />
        </svg>
      </div>
      <div className="absolute inset-[37.5%_46.51%_15%_27.91%]" data-name="Vector">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 4.60488 7.59999">
          <path d={svgPaths.p32b5d800} fill="var(--fill-0, black)" id="Vector" opacity="0.2" />
        </svg>
      </div>
      <div className="absolute inset-[37.5%_46.51%_20%_27.91%]" data-name="Vector">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 4.60488 6.79999">
          <path d={svgPaths.p3c88f080} fill="var(--fill-0, black)" id="Vector" opacity="0.2" />
        </svg>
      </div>
      <div className="absolute inset-[37.5%_48.83%_20%_27.91%]" data-name="Vector">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 4.18632 6.79999">
          <path d={svgPaths.p29951380} fill="var(--fill-0, black)" id="Vector" opacity="0.2" />
        </svg>
      </div>
      <div className="absolute inset-[20%_44.19%_67.5%_39.95%]" data-name="Vector">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 2.85491 1.99999">
          <path d={svgPaths.p8ba7640} fill="var(--fill-0, black)" id="Vector" opacity="0.1" />
        </svg>
      </div>
      <div className="absolute inset-[22.5%_46.51%_67.55%_40.7%]" data-name="Vector">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 2.30234 1.592">
          <path d={svgPaths.p34f2c200} fill="var(--fill-0, black)" id="Vector" opacity="0.2" />
        </svg>
      </div>
      <div className="absolute inset-[22.5%_46.51%_67.55%_40.7%]" data-name="Vector">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 2.30234 1.592">
          <path d={svgPaths.p34f2c200} fill="var(--fill-0, black)" id="Vector" opacity="0.2" />
        </svg>
      </div>
      <div className="absolute inset-[22.5%_48.83%_67.95%_40.7%]" data-name="Vector">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1.88366 1.528">
          <path d={svgPaths.pe6dba80} fill="var(--fill-0, black)" id="Vector" opacity="0.2" />
        </svg>
      </div>
      <div className="absolute inset-[22.5%_48.84%_22.5%_0]" data-name="Vector">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 9.20925 8.79999">
          <path d={svgPaths.p33a16c0} fill="url(#paint0_linear_23_1449)" id="Vector" />
          <defs>
            <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_23_1449" x1="1.59984" x2="7.20899" y1="-0.57291" y2="9.59389">
              <stop stopColor="#5A62C3" />
              <stop offset="0.5" stopColor="#4D55BD" />
              <stop offset="1" stopColor="#3940AB" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      <div className="absolute inset-[35.1%_63.2%_35.11%_14.37%]" data-name="Vector">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 4.03867 4.7664">
          <path d={svgPaths.pc019200} fill="var(--fill-0, white)" id="Vector" />
        </svg>
      </div>
    </div>
  );
}

function Container5() {
  return (
    <div className="content-stretch flex flex-col h-[16px] items-start relative shrink-0 w-full" data-name="Container">
      <Icon3 />
    </div>
  );
}

function TeamsIcon() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-[60px] overflow-clip pt-px size-[18px] top-[8px]" data-name="TeamsIcon">
      <Container5 />
    </div>
  );
}

function Container2() {
  return (
    <div className="absolute bg-white h-[34px] left-0 rounded-[6px] top-[0.21px] w-[86px]" data-name="Container">
      <MeetingRecorderCard />
      <GoogleMeetIcon />
      <ZoomIcon />
      <TeamsIcon />
    </div>
  );
}

export default function Frame() {
  return (
    <div className="relative size-full">
      <Container />
      <Container2 />
    </div>
  );
}