import svgPaths from "./svg-cyvl94xpka";

function Paragraph() {
  return (
    <div className="absolute h-[20.792px] left-[20px] top-[169.21px] w-[134px]" data-name="Paragraph">
      <p className="-translate-x-1/2 absolute font-['Inter_Tight:Medium',sans-serif] leading-[20.8px] left-[67.22px] not-italic text-[16px] text-black text-center top-[-0.33px] whitespace-nowrap">Instant speach</p>
    </div>
  );
}

function Container3() {
  return (
    <div className="absolute border-2 border-solid border-white h-[64px] left-[-2px] rounded-[8px] top-[-2px] w-[74px]" data-name="Container">
      <div className="absolute bg-[#0061ff] h-[6px] left-[42px] rounded-[100px] top-[46px] w-[20px]" />
    </div>
  );
}

function Container2() {
  return (
    <div className="bg-[#e3f0fe] h-[60px] relative rounded-[6px] w-[70px]" data-name="Container">
      <Container3 />
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

function Container4() {
  return (
    <div className="content-stretch flex flex-col h-[16.5px] items-start relative shrink-0 w-full" data-name="Container">
      <Icon />
    </div>
  );
}

function MicrophoneIcon() {
  return (
    <div className="content-stretch flex flex-col items-start overflow-clip pt-[0.75px] px-[3px] relative shrink-0 size-[18px]" data-name="MicrophoneIcon">
      <Container4 />
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
      <div className="absolute flex h-[60.368px] items-center justify-center left-[19px] top-[14px] w-[70.315px]" style={{ "--transform-inner-width": "1200", "--transform-inner-height": "0" } as React.CSSProperties}>
        <div className="flex-none rotate-[0.3deg]">
          <Container2 />
        </div>
      </div>
      <Frame />
      <Frame1 />
    </div>
  );
}

function Container1() {
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
      <Container1 />
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

function Container5() {
  return (
    <div className="absolute bg-[rgba(255,255,255,0.8)] content-stretch flex gap-[3px] h-[22px] items-center left-[132.02px] pl-[6px] rounded-[6px] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.08),0px_0px_0px_0px_rgba(0,0,0,0.06)] top-[10px] w-[31.979px]" data-name="Container">
      <Text />
      <Text1 />
    </div>
  );
}

export default function Container() {
  return (
    <div className="relative size-full" data-name="Container">
      <InstantSpeachCard />
      <Container5 />
    </div>
  );
}