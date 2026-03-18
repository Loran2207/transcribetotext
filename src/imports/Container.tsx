import svgPaths from "./svg-ckrcce85th";
import imgImage from "figma:asset/5488d6b376b8df81f6436fe1e33ddc9d1a7686c4.png";

function Paragraph() {
  return (
    <div className="absolute h-[20.792px] left-[20px] top-[169.21px] w-[134px]" data-name="Paragraph">
      <p className="-translate-x-1/2 absolute font-['Inter_Tight:Medium',sans-serif] leading-[20.8px] left-[67.22px] not-italic text-[16px] text-black text-center top-[-0.33px] whitespace-nowrap">Instant speach</p>
    </div>
  );
}

function Container4() {
  return (
    <div className="absolute border-2 border-solid border-white h-[64px] left-[-2px] rounded-[8px] top-[-2px] w-[74px]" data-name="Container">
      <div className="absolute bg-[#0061ff] h-[6px] left-[42px] rounded-[100px] top-[46px] w-[20px]" />
    </div>
  );
}

function Container3() {
  return (
    <div className="bg-[#e3f0fe] h-[60px] relative rounded-[6px] w-[70px]" data-name="Container">
      <Container4 />
      <div className="absolute bg-[rgba(0,97,255,0.16)] h-[5px] left-[8.01px] rounded-[100px] top-[8.96px] w-[45.877px]" />
      <div className="absolute bg-[rgba(0,97,255,0.16)] h-[5px] left-[8px] rounded-[100px] top-[20.24px] w-[26.633px]" />
      <div className="absolute bg-[rgba(0,97,255,0.16)] h-[5px] left-[8px] rounded-[100px] top-[31.42px] w-[37.467px]" />
    </div>
  );
}

function Icon() {
  return (
    <div className="h-[16.5px] overflow-clip relative shrink-0 w-full" data-name="Icon">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 16.5">
        <path clipRule="evenodd" d={svgPaths.p227a9f00} fill="var(--fill-0, white)" fillRule="evenodd" id="Vector" />
      </svg>
    </div>
  );
}

function Container5() {
  return (
    <div className="content-stretch flex flex-col h-[16.5px] items-start relative shrink-0 w-full" data-name="Container">
      <Icon />
    </div>
  );
}

function MicrophoneIcon() {
  return (
    <div className="content-stretch flex flex-col items-start overflow-clip pt-[0.75px] px-[3px] relative shrink-0 size-[18px]" data-name="MicrophoneIcon">
      <Container5 />
    </div>
  );
}

function Frame() {
  return (
    <div className="-translate-x-1/2 absolute bg-[#0061ff] left-[calc(50%+37.5px)] rounded-[833.333px] size-[32px] top-[-6px]">
      <div className="content-stretch flex items-center justify-center overflow-clip p-[3px] relative rounded-[inherit] size-full">
        <MicrophoneIcon />
      </div>
      <div aria-hidden="true" className="absolute border-2 border-solid border-white inset-[-2px] pointer-events-none rounded-[835.333px]" />
    </div>
  );
}

function Frame1() {
  return (
    <div className="absolute bg-[#0061ff] h-[20px] left-0 rounded-[100px] top-[66px] w-[52px]">
      <div className="overflow-clip relative rounded-[inherit] size-full">
        <div className="absolute bg-white h-[12px] left-[7px] rounded-[100px] top-[4px] w-[2px]" />
        <div className="absolute bg-white h-[12px] left-[11px] rounded-[100px] top-[4px] w-[2px]" />
        <div className="absolute bg-white h-[8px] left-[15px] rounded-[100px] top-[6px] w-[2px]" />
        <div className="absolute bg-white h-[10px] left-[19px] rounded-[100px] top-[5px] w-[2px]" />
        <div className="absolute bg-white h-[4.691px] left-[23px] rounded-[100px] top-[7.65px] w-[2px]" />
        <div className="absolute bg-white h-[4.691px] left-[27px] rounded-[100px] top-[7.65px] w-[2px]" />
        <div className="absolute bg-white h-[7.751px] left-[31px] rounded-[100px] top-[6.12px] w-[2px]" />
        <div className="absolute bg-white h-[9.971px] left-[35px] rounded-[100px] top-[5.01px] w-[2px]" />
        <div className="absolute bg-white h-[11.781px] left-[39px] rounded-[100px] top-[4.11px] w-[2px]" />
        <div className="absolute bg-white h-[12.466px] left-[43px] rounded-[100px] top-[3.77px] w-[2px]" />
      </div>
      <div aria-hidden="true" className="absolute border-2 border-solid border-white inset-[-2px] pointer-events-none rounded-[102px]" />
    </div>
  );
}

function Frame2() {
  return (
    <div className="absolute h-[92px] left-[30px] top-[46.4px] w-[107px]">
      <div className="absolute flex h-[60.368px] items-center justify-center left-[19px] top-[14px] w-[70.315px]" style={{ "--transform-inner-width": "1185", "--transform-inner-height": "0" } as React.CSSProperties}>
        <div className="flex-none rotate-[0.3deg]">
          <Container3 />
        </div>
      </div>
      <Frame />
      <Frame1 />
    </div>
  );
}

function Container2() {
  return (
    <div className="absolute h-[169.208px] left-0 overflow-clip top-0 w-[174px]" data-name="Container">
      <Frame2 />
    </div>
  );
}

function InstantSpeachCard() {
  return (
    <div className="absolute bg-[#f5f5f5] h-[210px] left-0 overflow-clip rounded-[16px] top-0 w-[174px]" data-name="InstantSpeachCard">
      <Paragraph />
      <Container2 />
    </div>
  );
}

function Text() {
  return (
    <div className="h-[16.5px] relative shrink-0 w-[12.208px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Inter:Medium',sans-serif] font-medium leading-[16.5px] left-0 not-italic text-[#6a7383] text-[11px] top-[0.33px] tracking-[0.2px] whitespace-nowrap">⌘</p>
      </div>
    </div>
  );
}

function Text1() {
  return (
    <div className="h-[16.5px] relative shrink-0 w-[4.771px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Inter:Medium',sans-serif] font-medium leading-[16.5px] left-0 not-italic text-[#6a7383] text-[11px] top-[0.33px] tracking-[0.2px] whitespace-nowrap">1</p>
      </div>
    </div>
  );
}

function Container6() {
  return (
    <div className="absolute bg-[rgba(255,255,255,0.8)] content-stretch flex gap-[3px] h-[22px] items-center left-[132.02px] pl-[6px] rounded-[6px] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.08),0px_0px_0px_0px_rgba(0,0,0,0.06)] top-[10px] w-[31.979px]" data-name="Container">
      <Text />
      <Text1 />
    </div>
  );
}

function Container1() {
  return (
    <div className="absolute h-[210px] left-0 top-0 w-[174px]" data-name="Container">
      <InstantSpeachCard />
      <Container6 />
    </div>
  );
}

function Paragraph1() {
  return (
    <div className="absolute h-[20.792px] left-[20px] top-[169.21px] w-[134px]" data-name="Paragraph">
      <p className="-translate-x-1/2 absolute font-['Inter_Tight:Medium',sans-serif] leading-[20.8px] left-[67.24px] not-italic text-[16px] text-black text-center top-[-0.33px] whitespace-nowrap">Meeting Recorder</p>
    </div>
  );
}

function Image() {
  return (
    <div className="absolute h-[123.157px] left-0 rounded-[6px] top-0 w-[102.731px]" data-name="Image">
      <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none rounded-[6px] size-full" src={imgImage} />
    </div>
  );
}

function Container11() {
  return <div className="absolute border-2 border-solid border-white h-[127.675px] left-[-1.7px] rounded-[8px] top-[-2.26px] w-[107.249px]" data-name="Container" />;
}

function Container10() {
  return (
    <div className="h-[123.157px] relative rounded-[6px] shrink-0 w-full" data-name="Container">
      <Image />
      <Container11 />
    </div>
  );
}

function Container9() {
  return (
    <div className="absolute content-stretch flex flex-col h-[112px] items-start left-[44.28px] pl-[-7.365px] pr-[-7.366px] pt-[-5.579px] top-[29.68px] w-[88px]" data-name="Container">
      <Container10 />
    </div>
  );
}

function Icon1() {
  return (
    <div className="h-[14.021px] overflow-clip relative shrink-0 w-full" data-name="Icon">
      <div className="absolute inset-[26.97%_18.3%_26.28%_56.56%]" data-name="Vector">
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
      <div className="absolute inset-[11.1%_0_0_23.43%]" data-name="Vector">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12.2598 12.4634">
          <path d={svgPaths.p26c9100} fill="var(--fill-0, #00AC47)" id="Vector" />
        </svg>
      </div>
      <div className="absolute bottom-1/2 left-[23.43%] right-[20.58%] top-0" data-name="Vector">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 8.96479 7.00999">
          <path d={svgPaths.p38e2bc00} fill="var(--fill-0, #FFBA00)" id="Vector" />
        </svg>
      </div>
    </div>
  );
}

function Container13() {
  return (
    <div className="content-stretch flex flex-col h-[14.021px] items-start relative shrink-0 w-full" data-name="Container">
      <Icon1 />
    </div>
  );
}

function GoogleMeetIcon() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-[8px] overflow-clip pl-px pr-[0.99px] pt-[1.99px] size-[18px] top-[8px]" data-name="GoogleMeetIcon">
      <Container13 />
    </div>
  );
}

function Icon2() {
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

function Icon3() {
  return (
    <div className="h-[5.563px] overflow-clip relative shrink-0 w-full" data-name="Icon">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10.3333 5.5625">
        <path clipRule="evenodd" d={svgPaths.p39129220} fill="var(--fill-0, white)" fillRule="evenodd" id="Vector" />
      </svg>
    </div>
  );
}

function Container14() {
  return (
    <div className="absolute content-stretch flex flex-col h-[5.563px] items-start left-[4.08px] top-[6.01px] w-[10.333px]" data-name="Container">
      <Icon3 />
    </div>
  );
}

function ZoomIcon() {
  return (
    <div className="absolute left-[34px] overflow-clip size-[18px] top-[8px]" data-name="ZoomIcon">
      <Icon2 />
      <Container14 />
    </div>
  );
}

function Icon4() {
  return (
    <div className="h-[16px] overflow-clip relative shrink-0 w-full" data-name="Icon">
      <div className="absolute inset-[37.5%_0_15%_67.44%]" data-name="Vector">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 5.8604 7.59999">
          <path d={svgPaths.p5556770} fill="var(--fill-0, #5059C9)" id="Vector" />
        </svg>
      </div>
      <div className="absolute inset-[10%_2.33%_67.5%_76.74%]" data-name="Vector">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 3.7674 3.6">
          <path d={svgPaths.p2ed570} fill="var(--fill-0, #5059C9)" id="Vector" />
        </svg>
      </div>
      <div className="absolute inset-[0_30.23%_67.5%_39.53%]" data-name="Vector">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 5.44184 5.2">
          <path d={svgPaths.p38c8f00} fill="var(--fill-0, #7B83EB)" id="Vector" />
        </svg>
      </div>
      <div className="absolute inset-[37.5%_20.92%_0_27.9%]" data-name="Vector">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 9.21183 9.99999">
          <path d={svgPaths.p1925b500} fill="var(--fill-0, #7B83EB)" id="Vector" />
        </svg>
      </div>
      <div className="absolute inset-[37.5%_44.19%_17.5%_27.91%]" data-name="Vector">
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
      <div className="absolute inset-[37.5%_48.84%_20%_27.91%]" data-name="Vector">
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
      <div className="absolute inset-[22.5%_48.84%_67.95%_40.7%]" data-name="Vector">
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
      <div className="absolute inset-[35.1%_63.2%_35.11%_14.36%]" data-name="Vector">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 4.03867 4.7664">
          <path d={svgPaths.pc019200} fill="var(--fill-0, white)" id="Vector" />
        </svg>
      </div>
    </div>
  );
}

function Container15() {
  return (
    <div className="content-stretch flex flex-col h-[16px] items-start relative shrink-0 w-full" data-name="Container">
      <Icon4 />
    </div>
  );
}

function TeamsIcon() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-[60px] overflow-clip pt-px size-[18px] top-[8px]" data-name="TeamsIcon">
      <Container15 />
    </div>
  );
}

function Container12() {
  return (
    <div className="absolute bg-white h-[34px] left-[14px] rounded-[6px] top-[14px] w-[86px]" data-name="Container">
      <GoogleMeetIcon />
      <ZoomIcon />
      <TeamsIcon />
    </div>
  );
}

function Group2() {
  return (
    <div className="absolute contents left-[14px] top-[14px]">
      <Container9 />
      <Container12 />
    </div>
  );
}

function Container8() {
  return (
    <div className="absolute h-[169.208px] left-0 overflow-clip top-0 w-[174px]" data-name="Container">
      <Group2 />
    </div>
  );
}

function MeetingRecorderCard() {
  return (
    <div className="absolute bg-[#f5f5f5] h-[210px] left-0 overflow-clip rounded-[16px] top-0 w-[174px]" data-name="MeetingRecorderCard">
      <Paragraph1 />
      <Container8 />
    </div>
  );
}

function Text2() {
  return (
    <div className="h-[16.5px] relative shrink-0 w-[12.208px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Inter:Medium',sans-serif] font-medium leading-[16.5px] left-0 not-italic text-[#6a7383] text-[11px] top-[0.33px] tracking-[0.2px] whitespace-nowrap">⌘</p>
      </div>
    </div>
  );
}

function Text3() {
  return (
    <div className="h-[16.5px] relative shrink-0 w-[6.979px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Inter:Medium',sans-serif] font-medium leading-[16.5px] left-0 not-italic text-[#6a7383] text-[11px] top-[0.33px] tracking-[0.2px] whitespace-nowrap">2</p>
      </div>
    </div>
  );
}

function Container16() {
  return (
    <div className="absolute bg-[rgba(255,255,255,0.8)] content-stretch flex gap-[3px] h-[22px] items-center left-[129.81px] pl-[6px] rounded-[6px] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.08),0px_0px_0px_0px_rgba(0,0,0,0.06)] top-[10px] w-[34.188px]" data-name="Container">
      <Text2 />
      <Text3 />
    </div>
  );
}

function Container7() {
  return (
    <div className="absolute h-[210px] left-[186px] top-0 w-[174px]" data-name="Container">
      <MeetingRecorderCard />
      <Container16 />
    </div>
  );
}

function Paragraph2() {
  return (
    <div className="absolute h-[41.583px] left-[20px] top-[148.42px] w-[134px]" data-name="Paragraph">
      <p className="-translate-x-1/2 absolute font-['Inter_Tight:Medium',sans-serif] leading-[20.8px] left-[67px] not-italic text-[16px] text-black text-center top-[20.98px] w-[160px]">Transcribe from Link</p>
    </div>
  );
}

function TranscribeFromLinkCard() {
  return (
    <div className="absolute bg-[#f5f5f5] h-[210px] left-0 overflow-clip rounded-[16px] top-0 w-[174px]" data-name="TranscribeFromLinkCard">
      <Paragraph2 />
    </div>
  );
}

function Container21() {
  return <div className="absolute left-[3.5px] size-[10px] top-[3.5px]" data-name="Container" />;
}

function Icon5() {
  return (
    <div className="h-[11px] overflow-clip relative shrink-0 w-full" data-name="Icon">
      <div className="absolute inset-[12.5%_0_6.25%_0]" data-name="Vector">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 11 8.9375">
          <path d={svgPaths.pd852f80} fill="var(--fill-0, #0061FF)" id="Vector" />
        </svg>
      </div>
    </div>
  );
}

function Container22() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-[3px] size-[11px] top-[3px]" data-name="Container">
      <Icon5 />
    </div>
  );
}

function Container20() {
  return (
    <div className="absolute bg-white left-[6px] rounded-[22369600px] size-[17px] top-[6px]" data-name="Container">
      <Container21 />
      <Container22 />
    </div>
  );
}

function Paragraph3() {
  return (
    <div className="absolute h-[11.781px] left-[6px] top-[63.22px] w-[37.49px]" data-name="Paragraph">
      <p className="absolute font-['Inter_Tight:Medium',sans-serif] leading-[11.782px] left-0 not-italic text-[#0a3380] text-[9.818px] top-[0.33px] whitespace-nowrap">Dropbox</p>
    </div>
  );
}

function Container23() {
  return <div className="absolute border-[1.333px] border-solid border-white h-[84.271px] left-[-1.64px] rounded-[6.545px] top-[-1.64px] w-[60.542px]" data-name="Container" />;
}

function Container19() {
  return (
    <div className="absolute bg-[#e3f0fe] h-[81px] left-[22px] opacity-60 rounded-[4.909px] top-[46px] w-[57px]" data-name="Container">
      <Container20 />
      <Paragraph3 />
      <Container23 />
    </div>
  );
}

function Icon6() {
  return (
    <div className="h-[14px] overflow-clip relative shrink-0 w-full" data-name="Icon">
      <div className="absolute inset-[65.95%_68.5%_6.92%_0]" data-name="Vector">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 4.41008 3.79711">
          <path d={svgPaths.p36aae932} fill="var(--fill-0, #0066DA)" id="Vector" />
        </svg>
      </div>
      <div className="absolute bottom-[34.05%] left-0 right-1/2 top-[6.92%]" data-name="Vector">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 7 8.2644">
          <path d={svgPaths.p68d8080} fill="var(--fill-0, #00AC47)" id="Vector" />
        </svg>
      </div>
      <div className="absolute inset-[65.95%_-0.01%_6.92%_68.5%]" data-name="Vector">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 4.41039 3.79711">
          <path d={svgPaths.p80f7a80} fill="var(--fill-0, #EA4335)" id="Vector" />
        </svg>
      </div>
      <div className="absolute inset-[5.56%_34.25%_65.95%_34.24%]" data-name="Vector">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 4.41012 3.98861">
          <path d={svgPaths.p185b5480} fill="var(--fill-0, #00832D)" id="Vector" />
        </svg>
      </div>
      <div className="absolute inset-[65.95%_15.75%_5.56%_15.76%]" data-name="Vector">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 9.58988 3.9886">
          <path d={svgPaths.p230cab00} fill="var(--fill-0, #2684FC)" id="Vector" />
        </svg>
      </div>
      <div className="absolute bottom-[34.05%] left-1/2 right-[0.06%] top-[6.92%]" data-name="Vector">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 6.99199 8.2644">
          <path d={svgPaths.p1e6a9c80} fill="var(--fill-0, #FFBA00)" id="Vector" />
        </svg>
      </div>
    </div>
  );
}

function Container26() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-[6.36px] size-[14px] top-[5.6px]" data-name="Container">
      <Icon6 />
    </div>
  );
}

function Container25() {
  return (
    <div className="absolute bg-white left-[7px] rounded-[22369600px] size-[26px] top-[7px]" data-name="Container">
      <Container26 />
    </div>
  );
}

function Paragraph4() {
  return (
    <div className="absolute content-stretch flex items-start left-[7.36px] top-[78.6px] w-[72px]" data-name="Paragraph">
      <p className="font-['Inter_Tight:Medium',sans-serif] leading-[14.4px] not-italic relative shrink-0 text-[#602706] text-[12px] w-[82px]">Google Drive</p>
    </div>
  );
}

function Container27() {
  return <div className="absolute border-2 border-solid border-white h-[103px] left-[-2px] rounded-[8px] top-[-2px] w-[74px]" data-name="Container" />;
}

function Container24() {
  return (
    <div className="absolute bg-[#fff3d5] h-[99px] left-[40.64px] rounded-[6px] top-[37.4px] w-[70px]" data-name="Container">
      <Container25 />
      <Paragraph4 />
      <Container27 />
    </div>
  );
}

function Container30() {
  return <div className="absolute left-[6px] size-[18px] top-[6px]" data-name="Container" />;
}

function Icon7() {
  return (
    <div className="h-[18px] overflow-clip relative shrink-0 w-full" data-name="Icon">
      <div className="absolute inset-[14.84%_0_15.12%_0]" data-name="Vector">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 17.9997 12.606">
          <path d={svgPaths.p2d68c000} fill="var(--fill-0, #FF0000)" id="Vector" />
        </svg>
      </div>
      <div className="absolute inset-[34.85%_34.09%_35.13%_40%]" data-name="Vector">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 4.66369 5.40252">
          <path d={svgPaths.p29053100} fill="var(--fill-0, white)" id="Vector" />
        </svg>
      </div>
    </div>
  );
}

function Container31() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-[6.25px] size-[18px] top-[6.6px]" data-name="Container">
      <Icon7 />
    </div>
  );
}

function Container29() {
  return (
    <div className="absolute bg-white left-[8px] rounded-[22369600px] size-[30px] top-[8px]" data-name="Container">
      <Container30 />
      <Container31 />
    </div>
  );
}

function Paragraph5() {
  return (
    <div className="absolute h-[28.792px] left-[8px] top-[73.21px] w-[43.917px]" data-name="Paragraph">
      <p className="absolute font-['Inter_Tight:Medium',sans-serif] leading-[14.4px] left-[0.25px] not-italic text-[#602706] text-[12px] top-[14.4px] w-[54px]">YouTube</p>
    </div>
  );
}

function Container32() {
  return <div className="absolute border-2 border-solid border-white h-[114px] left-[-2px] rounded-[8px] top-[-2px] w-[86px]" data-name="Container" />;
}

function Container28() {
  return (
    <div className="absolute bg-[#feeceb] h-[110px] left-[70.64px] rounded-[6px] top-[30.4px] w-[82px]" data-name="Container">
      <Container29 />
      <Paragraph5 />
      <Container32 />
    </div>
  );
}

function Group() {
  return (
    <div className="absolute contents left-[22px] top-[30.4px]">
      <Container19 />
      <Container24 />
      <Container28 />
    </div>
  );
}

function Container18() {
  return (
    <div className="absolute h-[148.417px] left-0 overflow-clip top-[0.4px] w-[174px]" data-name="Container">
      <Group />
    </div>
  );
}

function Text4() {
  return (
    <div className="h-[16.5px] relative shrink-0 w-[12.208px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Inter:Medium',sans-serif] font-medium leading-[16.5px] left-0 not-italic text-[#6a7383] text-[11px] top-[0.33px] tracking-[0.2px] whitespace-nowrap">⌘</p>
      </div>
    </div>
  );
}

function Text5() {
  return (
    <div className="h-[16.5px] relative shrink-0 w-[7.104px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Inter:Medium',sans-serif] font-medium leading-[16.5px] left-0 not-italic text-[#6a7383] text-[11px] top-[0.33px] tracking-[0.2px] whitespace-nowrap">3</p>
      </div>
    </div>
  );
}

function Container33() {
  return (
    <div className="absolute bg-[rgba(255,255,255,0.8)] content-stretch flex gap-[3px] h-[22px] items-center left-[129.69px] pl-[6px] rounded-[6px] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.08),0px_0px_0px_0px_rgba(0,0,0,0.06)] top-[10px] w-[34.313px]" data-name="Container">
      <Text4 />
      <Text5 />
    </div>
  );
}

function Container17() {
  return (
    <div className="absolute h-[210px] left-[372px] top-0 w-[174px]" data-name="Container">
      <TranscribeFromLinkCard />
      <Container18 />
      <Container33 />
    </div>
  );
}

function Paragraph6() {
  return (
    <div className="absolute h-[20.792px] left-[20px] top-[169.21px] w-[134px]" data-name="Paragraph">
      <p className="-translate-x-1/2 absolute font-['Inter_Tight:Medium',sans-serif] leading-[20.8px] left-[67.09px] not-italic text-[16px] text-black text-center top-[-0.33px] whitespace-nowrap">{`Audio & Video Files`}</p>
    </div>
  );
}

function Page() {
  return (
    <div className="absolute inset-[0_10%]" data-name="Page">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 47.1634 58.9541">
        <g id="Page">
          <path d={svgPaths.p28f449c0} fill="var(--fill-0, #E6E1FE)" id="Page background" stroke="var(--stroke-0, white)" strokeWidth="1.47385" />
          <path d={svgPaths.p15607c00} fill="var(--fill-0, white)" id="Earmark" />
        </g>
      </svg>
    </div>
  );
}

function FileTypeIcon() {
  return (
    <div className="relative size-full" data-name="File type icon">
      <Page />
      <p className="absolute font-['Inter:Semi_Bold',sans-serif] font-semibold inset-[57.5%_10%_15.36%_10%] leading-[normal] not-italic text-[#15105b] text-[13.265px] text-center">MP4</p>
    </div>
  );
}

function Page1() {
  return (
    <div className="absolute inset-[0_10%]" data-name="Page">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 47.1642 58.9543">
        <g id="Page">
          <path d={svgPaths.p30371700} fill="var(--fill-0, #E3F0FE)" id="Page background" stroke="var(--stroke-0, white)" strokeWidth="1.47385" />
          <path d={svgPaths.p2d2d7200} fill="var(--fill-0, white)" id="Earmark" />
        </g>
      </svg>
    </div>
  );
}

function FileTypeIcon1() {
  return (
    <div className="absolute inset-[35.08%_33.19%_30.08%_32.93%]" data-name="File type icon">
      <Page1 />
      <p className="absolute font-['Inter:Semi_Bold',sans-serif] font-semibold inset-[57.5%_10%_15.36%_10%] leading-[normal] not-italic text-[#0a3380] text-[13.265px] text-center">MOV</p>
    </div>
  );
}

function Page2() {
  return (
    <div className="absolute inset-[0_10%]" data-name="Page">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 47.1642 58.9543">
        <g id="Page">
          <path d={svgPaths.p30371700} fill="var(--fill-0, #E5E5E5)" id="Page background" stroke="var(--stroke-0, white)" strokeWidth="1.47385" />
          <path d={svgPaths.p2d2d7200} fill="var(--fill-0, white)" id="Earmark" />
        </g>
      </svg>
    </div>
  );
}

function FileTypeIcon2() {
  return (
    <div className="relative size-full" data-name="File type icon">
      <Page2 />
      <p className="absolute font-['Inter:Semi_Bold',sans-serif] font-semibold inset-[57.5%_10%_15.36%_10%] leading-[normal] not-italic text-[#504e4e] text-[13.265px] text-center">+10</p>
    </div>
  );
}

function Group1() {
  return (
    <div className="absolute contents inset-[33.69%_5.43%_25.87%_5.17%]">
      <div className="absolute flex inset-[33.69%_55.58%_25.95%_5.17%] items-center justify-center">
        <div className="-rotate-10 flex-none size-[58.954px]">
          <FileTypeIcon />
        </div>
      </div>
      <FileTypeIcon1 />
      <div className="absolute flex inset-[33.77%_5.43%_25.87%_55.32%] items-center justify-center">
        <div className="flex-none rotate-10 size-[58.954px]">
          <FileTypeIcon2 />
        </div>
      </div>
    </div>
  );
}

function Container35() {
  return (
    <div className="absolute h-[169.208px] left-0 overflow-clip top-[-0.6px] w-[174px]" data-name="Container">
      <Group1 />
    </div>
  );
}

function AudioVideoFilesCard() {
  return (
    <div className="absolute bg-[#f5f5f5] h-[210px] left-0 overflow-clip rounded-[16px] top-0 w-[174px]" data-name="AudioVideoFilesCard">
      <Paragraph6 />
      <Container35 />
    </div>
  );
}

function Text6() {
  return (
    <div className="h-[16.5px] relative shrink-0 w-[12.208px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Inter:Medium',sans-serif] font-medium leading-[16.5px] left-0 not-italic text-[#6a7383] text-[11px] top-[0.33px] tracking-[0.2px] whitespace-nowrap">⌘</p>
      </div>
    </div>
  );
}

function Text7() {
  return (
    <div className="h-[16.5px] relative shrink-0 w-[7.427px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Inter:Medium',sans-serif] font-medium leading-[16.5px] left-0 not-italic text-[#6a7383] text-[11px] top-[0.33px] tracking-[0.2px] whitespace-nowrap">4</p>
      </div>
    </div>
  );
}

function Container36() {
  return (
    <div className="absolute bg-[rgba(255,255,255,0.8)] content-stretch flex gap-[3px] h-[22px] items-center left-[129.36px] pl-[6px] rounded-[6px] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.08),0px_0px_0px_0px_rgba(0,0,0,0.06)] top-[10px] w-[34.635px]" data-name="Container">
      <Text6 />
      <Text7 />
    </div>
  );
}

function Container34() {
  return (
    <div className="absolute h-[210px] left-[558px] top-0 w-[174px]" data-name="Container">
      <AudioVideoFilesCard />
      <Container36 />
    </div>
  );
}

export default function Container() {
  return (
    <div className="relative size-full" data-name="Container">
      <Container1 />
      <Container7 />
      <Container17 />
      <Container34 />
    </div>
  );
}