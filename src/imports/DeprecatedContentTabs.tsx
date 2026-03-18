function Frame() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0">
      <div className="flex flex-col font-['SF_Pro_Text:Medium',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#625afa] text-[14px] tracking-[-0.154px] whitespace-nowrap">
        <p className="leading-[20px]">All</p>
      </div>
    </div>
  );
}

function Frame1() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0">
      <div className="flex flex-col font-['SF_Pro_Text:Medium',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#697386] text-[14px] tracking-[-0.154px] whitespace-nowrap">
        <p className="leading-[20px]">Succeeded</p>
      </div>
    </div>
  );
}

function Frame2() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0">
      <div className="flex flex-col font-['SF_Pro_Text:Medium',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#697386] text-[14px] tracking-[-0.154px] whitespace-nowrap">
        <p className="leading-[20px]">Refunded</p>
      </div>
    </div>
  );
}

function Frame3() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0">
      <div className="flex flex-col font-['SF_Pro_Text:Medium',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#697386] text-[14px] tracking-[-0.154px] whitespace-nowrap">
        <p className="leading-[20px]">Uncaptured</p>
      </div>
    </div>
  );
}

function TabItems() {
  return (
    <div className="absolute content-stretch flex gap-[28px] items-start left-0 top-0" data-name="Tab Items">
      <div className="content-stretch flex flex-col items-center relative shrink-0" data-name="[Deprecated] elements/[Deprecated] tab (active)">
        <div className="content-stretch flex flex-col gap-[8px] items-center relative shrink-0" data-name="_[Deprecated] tab">
          <Frame />
          <div className="h-0 relative shrink-0 w-full">
            <div className="absolute inset-[-2px_0_0_0]">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 17 2">
                <line id="Line 1" stroke="var(--stroke-0, #625AFA)" strokeWidth="2" x2="17" y1="1" y2="1" />
              </svg>
            </div>
          </div>
        </div>
      </div>
      <div className="content-stretch flex flex-col items-center relative shrink-0" data-name="[Deprecated] elements/[Deprecated] tab (inactive)">
        <div className="content-stretch flex flex-col gap-[8px] items-center relative shrink-0" data-name="_[Deprecated] tab">
          <Frame1 />
          <div className="h-0 relative shrink-0 w-full">
            <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
              <g id="Line 1" />
            </svg>
          </div>
        </div>
      </div>
      <div className="content-stretch flex flex-col items-center relative shrink-0" data-name="[Deprecated] elements/[Deprecated] tab (inactive)">
        <div className="content-stretch flex flex-col gap-[8px] items-center relative shrink-0" data-name="_[Deprecated] tab">
          <Frame2 />
          <div className="h-0 relative shrink-0 w-full">
            <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
              <g id="Line 1" />
            </svg>
          </div>
        </div>
      </div>
      <div className="content-stretch flex flex-col items-center relative shrink-0" data-name="[Deprecated] elements/[Deprecated] tab (inactive)">
        <div className="content-stretch flex flex-col gap-[8px] items-center relative shrink-0" data-name="_[Deprecated] tab">
          <Frame3 />
          <div className="h-0 relative shrink-0 w-full">
            <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
              <g id="Line 1" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DeprecatedContentTabs() {
  return (
    <div className="relative size-full" data-name="[Deprecated] content tabs">
      <div className="absolute h-0 left-0 right-0 top-[28px]">
        <div className="absolute inset-[-1px_0_0_0]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 965 1">
            <line id="Line 2" stroke="var(--stroke-0, #EBEEF1)" x2="965" y1="0.5" y2="0.5" />
          </svg>
        </div>
      </div>
      <TabItems />
    </div>
  );
}